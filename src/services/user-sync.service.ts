/**
 * User Sync Service
 *
 * Ensures Clerk users exist in the database before operations
 * Handles user creation with graceful degradation for external services
 *
 * IMPORTANT: User creation should NEVER fail due to Stripe/Organization issues
 * External service integration is done in background or deferred
 */

import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';

import { OrganizationService } from './organization.service';
import { StripeCustomerService } from './stripe/customer.service';
import { createUserScopedClient, runAsServiceAccount } from '@/db/client';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/users';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// CLERK CLIENT (lazy initialization)
// ========================================

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
	if (!clerkClient) {
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		if (!clerkSecretKey) {
			throw new Error('CLERK_SECRET_KEY environment variable is not set');
		}
		clerkClient = createClerkClient({ secretKey: clerkSecretKey });
	}
	return clerkClient;
}

// ========================================
// USER SYNC SERVICE
// ========================================

export class UserSyncService {
	/**
	 * Ensure a user exists in the database
	 * Creates the user if missing, otherwise returns existing user
	 *
	 * DESIGN PRINCIPLE: User creation should ALWAYS succeed if the Clerk user exists.
	 * External service failures (Stripe, Organization) should NOT block user creation.
	 *
	 * Uses runAsServiceAccount to bypass RLS for user creation operations.
	 *
	 * @param clerkUserId - Clerk user ID (format: "user_xxx")
	 * @returns User record from database
	 * @throws Error if user cannot be created or Clerk user doesn't exist
	 */
	static async ensureUserExists(clerkUserId: string): Promise<typeof users.$inferSelect> {
		// Validate Clerk user ID format
		if (!(clerkUserId && clerkUserId.startsWith('user_'))) {
			throw new Error(`Invalid Clerk user ID format: ${clerkUserId}`);
		}

		// Check if user already exists and create if not (bypasses RLS with service account)
		return runAsServiceAccount(async (tx) => {
			// First check if user exists
			const [existingUser] = await tx
				.select()
				.from(users)
				.where(eq(users.id, clerkUserId))
				.limit(1);

			if (existingUser) {
				secureLogger.debug('User already exists in database', {
					userId: clerkUserId,
					email: existingUser.email,
				});
				return existingUser;
			}

			// User doesn't exist - fetch from Clerk and create
			secureLogger.info('User not found in database, creating from Clerk', {
				userId: clerkUserId,
			});

			const clerk = getClerkClient();
			const clerkUser = await clerk.users.getUser(clerkUserId);

			if (!clerkUser) {
				throw new Error(`Clerk user not found: ${clerkUserId}`);
			}

			const email = clerkUser.emailAddresses[0]?.emailAddress;
			if (!email) {
				throw new Error(`Clerk user has no email address: ${clerkUserId}`);
			}

			// Validate email format
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				throw new Error(`Invalid email format: ${email}`);
			}

			const fullName =
				[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

			// ========================================
			// PHASE 1: Create user with default organization (CRITICAL)
			// This MUST succeed for the user to use the app
			// ========================================

			let createdUser: typeof users.$inferSelect;

			try {
				const [user] = await tx
					.insert(users)
					.values({
						id: clerkUserId,
						email,
						fullName,
						organizationId: 'default', // Start with default, upgrade later
					})
					.returning();

				if (!user) {
					throw new Error('Failed to create user record');
				}

				createdUser = user;

				secureLogger.info('User created in database', {
					userId: clerkUserId,
					email,
				});
			} catch (dbError) {
				// Check if it's a duplicate key error (user was created by another request)
				if (dbError instanceof Error && dbError.message.includes('duplicate key')) {
					const [concurrentUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, clerkUserId))
						.limit(1);
					if (concurrentUser) {
						secureLogger.info('User was created by concurrent request', {
							userId: clerkUserId,
						});
						return concurrentUser;
					}
				}
				throw dbError;
			}

			// ========================================
			// PHASE 2: Setup external services (NON-CRITICAL)
			// Failures here should NOT affect user experience
			// ========================================

			// 2a. Try to create organization (non-blocking)
			try {
				const organizationId = await OrganizationService.createUserOrganization(
					clerkUserId,
					email,
					fullName,
				);

				// Update user with real organization ID
				if (organizationId && organizationId !== 'default') {
					await tx.update(users).set({ organizationId }).where(eq(users.id, clerkUserId));

					createdUser = { ...createdUser, organizationId };

					secureLogger.info('User organization created', {
						userId: clerkUserId,
						organizationId,
					});
				}
			} catch (orgError) {
				// Log but don't fail - user can still use app with default org
				secureLogger.warn('Failed to create user organization (non-critical)', {
					userId: clerkUserId,
					error: orgError instanceof Error ? orgError.message : 'Unknown error',
				});
			}

			// 2b. Try to create Stripe customer (non-blocking)
			let stripeCustomerId: string | null = null;
			try {
				stripeCustomerId = await StripeCustomerService.getOrCreateCustomer(
					clerkUserId,
					email,
					fullName,
				);

				secureLogger.info('Stripe customer created', {
					userId: clerkUserId,
					stripeCustomerId,
				});
			} catch (stripeError) {
				// Log but don't fail - billing features will show upgrade prompts
				secureLogger.warn('Failed to create Stripe customer (non-critical)', {
					userId: clerkUserId,
					error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
				});
			}

			// 2c. Try to create free subscription (non-blocking)
			if (stripeCustomerId) {
				try {
					await tx.insert(subscriptions).values({
						userId: clerkUserId,
						stripeCustomerId,
						planId: 'free',
						status: 'free',
					});

					secureLogger.info('Free subscription created', {
						userId: clerkUserId,
					});
				} catch (subError) {
					// Log but don't fail - user defaults to free plan anyway
					secureLogger.warn('Failed to create subscription record (non-critical)', {
						userId: clerkUserId,
						error: subError instanceof Error ? subError.message : 'Unknown error',
					});
				}
			}

			// 2d. Try to update Clerk metadata (non-blocking)
			if (stripeCustomerId) {
				try {
					await clerk.users.updateUserMetadata(clerkUserId, {
						privateMetadata: {
							stripeCustomerId,
						},
					});
				} catch (metadataError) {
					// Log but don't fail - metadata update is not critical
					secureLogger.warn('Failed to update Clerk metadata (non-critical)', {
						userId: clerkUserId,
						error: metadataError instanceof Error ? metadataError.message : 'Unknown error',
					});
				}
			}

			return createdUser;
		});
	}

	/**
	 * Check if user exists in database
	 *
	 * @param clerkUserId - Clerk user ID
	 * @returns true if user exists, false otherwise
	 */
	static async userExists(clerkUserId: string): Promise<boolean> {
		// Use scoped client for RLS-compliant query
		const db = await createUserScopedClient(clerkUserId);
		const [user] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
		return !!user;
	}

	/**
	 * Complete user setup for external services
	 * Call this in background after user creation to setup Stripe/Organization
	 *
	 * @param clerkUserId - Clerk user ID
	 */
	static async completeUserSetup(clerkUserId: string): Promise<void> {
		// Use scoped client for RLS-compliant operations
		const db = await createUserScopedClient(clerkUserId);

		const [user] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
		if (!user) {
			secureLogger.warn('Cannot complete setup for non-existent user', { userId: clerkUserId });
			return;
		}

		// Check if organization needs setup
		if (user.organizationId === 'default') {
			try {
				const organizationId = await OrganizationService.createUserOrganization(
					clerkUserId,
					user.email,
					user.fullName || undefined,
				);

				if (organizationId && organizationId !== 'default') {
					await db.update(users).set({ organizationId }).where(eq(users.id, clerkUserId));

					secureLogger.info('User organization setup completed', {
						userId: clerkUserId,
						organizationId,
					});
				}
			} catch (error) {
				secureLogger.warn('Background organization setup failed', {
					userId: clerkUserId,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		// Check if subscription exists
		const [existingSub] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, clerkUserId))
			.limit(1);
		if (!existingSub) {
			try {
				const stripeCustomerId = await StripeCustomerService.getOrCreateCustomer(
					clerkUserId,
					user.email,
					user.fullName || undefined,
				);

				await db.insert(subscriptions).values({
					userId: clerkUserId,
					stripeCustomerId,
					planId: 'free',
					status: 'free',
				});

				secureLogger.info('User subscription setup completed', {
					userId: clerkUserId,
					stripeCustomerId,
				});
			} catch (error) {
				secureLogger.warn('Background subscription setup failed', {
					userId: clerkUserId,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	}
}

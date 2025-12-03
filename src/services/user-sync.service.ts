/**
 * User Sync Service
 *
 * Ensures Clerk users exist in the database before operations
 * Handles user creation, organization assignment, and idempotency
 */

import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { getPoolClient } from '@/db/client';
import { users } from '@/db/schema/users';
import { secureLogger } from '@/lib/logging/secure-logger';
import { OrganizationService } from './organization.service';
import { StripeCustomerService } from './stripe/customer.service';
import { subscriptions } from '@/db/schema/billing';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
	throw new Error('CLERK_SECRET_KEY environment variable is not set');
}

const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

export class UserSyncService {
	/**
	 * Ensure a user exists in the database
	 * Creates the user if missing, otherwise returns existing user
	 *
	 * @param clerkUserId - Clerk user ID (format: "user_xxx")
	 * @returns User record from database
	 * @throws Error if user cannot be created or Clerk user doesn't exist
	 */
	static async ensureUserExists(clerkUserId: string): Promise<typeof users.$inferSelect> {
		const db = getPoolClient();

		// Validate Clerk user ID format
		if (!clerkUserId || !clerkUserId.startsWith('user_')) {
			throw new Error(`Invalid Clerk user ID format: ${clerkUserId}`);
		}

		// Check if user already exists in database
		const [existingUser] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);

		if (existingUser) {
			secureLogger.debug('User already exists in database', {
				userId: clerkUserId,
				email: existingUser.email,
			});
			return existingUser;
		}

		// User doesn't exist, fetch from Clerk and create
		secureLogger.info('User not found in database, creating from Clerk', {
			userId: clerkUserId,
		});

		try {
			// Fetch user from Clerk
			const clerkUser = await clerkClient.users.getUser(clerkUserId);

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

			const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

			// Create Stripe customer (with idempotency)
			let stripeCustomerId: string;
			try {
				stripeCustomerId = await StripeCustomerService.getOrCreateCustomer(clerkUserId, email, fullName);
			} catch (stripeError) {
				secureLogger.error('Failed to create Stripe customer during user sync', {
					userId: clerkUserId,
					email,
					error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
				});
				throw new Error('Failed to create Stripe customer');
			}

			// Use transaction to ensure atomicity
			let createdUser: typeof users.$inferSelect | undefined;
			try {
				await db.transaction(async (tx) => {
					// 1. Create organization for user
					const organizationId = await OrganizationService.createUserOrganization(
						clerkUserId,
						email,
						fullName,
						tx,
					);

					// 2. Insert user record with organizationId
					const [user] = await tx
						.insert(users)
						.values({
							id: clerkUserId,
							email,
							fullName,
							organizationId,
						})
						.returning();

					if (!user) {
						throw new Error('Failed to create user record');
					}

					createdUser = user;

					// 3. Create free subscription in database
					await tx.insert(subscriptions).values({
						userId: clerkUserId,
						stripeCustomerId,
						planId: 'free',
						status: 'free',
					});

					secureLogger.info('User created and initialized', {
						userId: clerkUserId,
						email,
						organizationId,
						stripeCustomerId,
					});
				});

				if (!createdUser) {
					throw new Error('User was not created in transaction');
				}

				// Update Clerk user metadata with stripeCustomerId (outside transaction)
				try {
					await clerkClient.users.updateUserMetadata(clerkUserId, {
						privateMetadata: {
							stripeCustomerId,
						},
					});
				} catch (metadataError) {
					// Log but don't fail - metadata update is not critical
					secureLogger.warn('Failed to update Clerk metadata', {
						userId: clerkUserId,
						error: metadataError instanceof Error ? metadataError.message : 'Unknown error',
					});
				}

				return createdUser;
			} catch (dbError) {
				secureLogger.error('Database operation failed during user creation', {
					userId: clerkUserId,
					email,
					stripeCustomerId,
					error: dbError instanceof Error ? dbError.message : 'Unknown error',
					stack: dbError instanceof Error ? dbError.stack : undefined,
				});

				// Attempt to rollback Stripe customer creation
				try {
					await StripeCustomerService.deleteCustomer(stripeCustomerId);
				} catch (rollbackError) {
					secureLogger.error('Failed to rollback Stripe customer', {
						stripeCustomerId,
						error: rollbackError instanceof Error ? rollbackError.message : 'Unknown error',
					});
				}

				throw new Error(`Failed to create user record: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
			}
		} catch (error) {
			secureLogger.error('Failed to sync user from Clerk', {
				userId: clerkUserId,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	}

	/**
	 * Check if user exists in database
	 *
	 * @param clerkUserId - Clerk user ID
	 * @returns true if user exists, false otherwise
	 */
	static async userExists(clerkUserId: string): Promise<boolean> {
		const db = getPoolClient();
		const [user] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
		return !!user;
	}
}


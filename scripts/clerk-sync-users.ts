#!/usr/bin/env tsx
/**
 * Clerk User Sync Script
 *
 * Synchronizes existing Clerk users to the database
 * Creates organizations for users that don't have one
 */

import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { getPoolClient } from '../src/db/client';
import { users } from '../src/db/schema/users';
import { OrganizationService } from '../src/services/organization.service';
import { StripeCustomerService } from '../src/services/stripe/customer.service';
import { subscriptions } from '../src/db/schema/billing';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
	console.error('❌ CLERK_SECRET_KEY environment variable is not set');
	process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

/**
 * Sync a single user
 */
async function syncUser(clerkUser: any) {
	const db = getPoolClient();
	const userId = clerkUser.id;
	const email = clerkUser.emailAddresses[0]?.emailAddress;
	const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

	if (!email) {
		console.log(`   ⚠️  Skipping user ${userId} - no email address`);
		return { skipped: true, reason: 'no_email' };
	}

	try {
		// Check if user already exists in database
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (existingUser) {
			// Check if user has organization
			if (!existingUser.organizationId || existingUser.organizationId === 'default') {
				console.log(`   🔄 Creating organization for existing user...`);

				// Create organization
				const organizationId = await OrganizationService.createUserOrganization(
					userId,
					email,
					name,
				);

				// Update user with organizationId
				await db
					.update(users)
					.set({ organizationId })
					.where(eq(users.id, userId));

				console.log(`   ✅ Organization created: ${organizationId}`);
				return { synced: true, organizationCreated: true, organizationId };
			} else {
				console.log(`   ✅ Already synced (org: ${existingUser.organizationId})`);
				return { synced: false, alreadyExists: true };
			}
		}

		// User doesn't exist, create full setup
		console.log(`   📝 Creating user and organization...`);

		// 1. Create Stripe customer
		let stripeCustomerId: string;
		try {
			stripeCustomerId = await StripeCustomerService.getOrCreateCustomer(userId, email, name);
		} catch (stripeError) {
			console.log(`   ⚠️  Failed to create Stripe customer: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
			// Continue without Stripe for now
			stripeCustomerId = '';
		}

		// 2. Create organization
		const organizationId = await OrganizationService.createUserOrganization(userId, email, name);

		// 3. Create user record
		await db.insert(users).values({
			id: userId,
			email,
			fullName: name,
			organizationId,
		});

		// 4. Create subscription if Stripe customer was created
		if (stripeCustomerId) {
			try {
				await db.insert(subscriptions).values({
					userId,
					stripeCustomerId,
					planId: 'free',
					status: 'free',
				});
			} catch (subError) {
				console.log(`   ⚠️  Failed to create subscription: ${subError instanceof Error ? subError.message : 'Unknown error'}`);
			}
		}

		// 5. Update Clerk metadata if Stripe customer exists
		if (stripeCustomerId) {
			try {
				await clerkClient.users.updateUserMetadata(userId, {
					privateMetadata: {
						stripeCustomerId,
					},
				});
			} catch (metadataError) {
				console.log(`   ⚠️  Failed to update Clerk metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
			}
		}

		console.log(`   ✅ User synced successfully`);
		return { synced: true, organizationId, stripeCustomerId };
	} catch (error) {
		console.log(`   ❌ Failed to sync user: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return { synced: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

/**
 * Main sync function
 */
async function syncClerkUsers() {
	console.log('🔄 Syncing Clerk users to database...\n');
	console.log('='.repeat(60));

	const db = getPoolClient();

	try {
		// Get all users from Clerk (paginated)
		let allUsers: any[] = [];
		let page = 1;
		const limit = 100;

		console.log('📥 Fetching users from Clerk...');

		while (true) {
			const response = await clerkClient.users.getUserList({
				limit,
				offset: (page - 1) * limit,
			});

			allUsers = [...allUsers, ...response.data];

			if (response.data.length < limit) {
				break;
			}

			page++;
		}

		console.log(`✅ Found ${allUsers.length} users in Clerk\n`);

		// Get users from database
		const dbUsers = await db.select().from(users);
		const dbUserIds = new Set(dbUsers.map(u => u.id));

		console.log(`📊 Database has ${dbUsers.length} users\n`);

		// Statistics
		let syncedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;
		let orgCreatedCount = 0;

		// Sync each user
		for (const clerkUser of allUsers) {
			console.log(`\n👤 Processing: ${clerkUser.id}`);
			console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress || '(none)'}`);
			console.log(`   Name: ${[clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || '(none)'}`);

			const result = await syncUser(clerkUser);

			if (result.synced) {
				syncedCount++;
				if (result.organizationCreated) {
					orgCreatedCount++;
				}
			} else if (result.skipped) {
				skippedCount++;
			} else if (result.error) {
				errorCount++;
			}
		}

		// Summary
		console.log('\n' + '='.repeat(60));
		console.log('📋 SYNC SUMMARY');
		console.log('='.repeat(60));
		console.log(`✅ Synced: ${syncedCount}`);
		console.log(`🏢 Organizations created: ${orgCreatedCount}`);
		console.log(`⏭️  Skipped: ${skippedCount}`);
		console.log(`❌ Errors: ${errorCount}`);
		console.log(`📊 Total users in Clerk: ${allUsers.length}`);
		console.log(`📊 Total users in database: ${(await db.select().from(users)).length}`);

		// Check for orphaned users (in DB but not in Clerk)
		const orphanedUsers = dbUsers.filter(u => !allUsers.some(cu => cu.id === u.id));
		if (orphanedUsers.length > 0) {
			console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned users in database:`);
			orphanedUsers.forEach(u => {
				console.log(`   - ${u.id} (${u.email})`);
			});
		}

		console.log('\n✅ Sync complete!');
	} catch (error) {
		console.error('\n❌ Sync failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
	syncClerkUsers()
		.then(() => process.exit(0))
		.catch(error => {
			console.error('💥 Sync failed:', error);
			process.exit(1);
		});
}

export { syncClerkUsers, syncUser };


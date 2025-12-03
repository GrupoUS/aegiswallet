/**
 * Clerk Integration Check
 * Verifies Clerk configuration and user synchronization
 */

import { createClerkClient } from '@clerk/backend';
import { getPoolClient, closePool } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkClerkIntegration() {
	console.log('🔍 Checking Clerk Integration...\n');

	// Check environment variables
	console.log('📋 Environment Variables:');
	const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
	const secretKey = process.env.CLERK_SECRET_KEY;
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

	console.log(`   VITE_CLERK_PUBLISHABLE_KEY: ${publishableKey ? '✅ Set' : '❌ Missing'}`);
	console.log(`   CLERK_SECRET_KEY: ${secretKey ? '✅ Set' : '❌ Missing'}`);
	console.log(`   CLERK_WEBHOOK_SECRET: ${webhookSecret ? '✅ Set' : '⚠️  Optional (not set)'}`);

	if (!secretKey) {
		console.error('\n❌ CLERK_SECRET_KEY is required for backend operations');
		return;
	}

	// Test Clerk API connection
	console.log('\n📋 Testing Clerk API Connection:');
	try {
		const clerk = createClerkClient({ secretKey });

		// List first 5 users from Clerk
		const clerkUsers = await clerk.users.getUserList({ limit: 5 });
		console.log(`   ✅ Connected to Clerk API`);
		console.log(`   ✅ Found ${clerkUsers.totalCount} users in Clerk`);

		if (clerkUsers.data.length > 0) {
			console.log('\n📋 Sample Clerk Users:');
			for (const user of clerkUsers.data.slice(0, 3)) {
				const email = user.emailAddresses[0]?.emailAddress || 'no email';
				console.log(`   - ${user.id}: ${email}`);
			}
		}

		// Compare with database users
		console.log('\n📋 Database User Sync Status:');
		const db = getPoolClient();

		const dbUsers = await db.execute(sql`SELECT id, email FROM users ORDER BY created_at DESC LIMIT 10`);
		console.log(`   Database has ${dbUsers.rows.length} users`);

		// Check if Clerk users are synced to database
		let syncedCount = 0;
		let unsyncedCount = 0;

		for (const clerkUser of clerkUsers.data) {
			const dbUser = dbUsers.rows.find((row: any) => row.id === clerkUser.id);
			if (dbUser) {
				syncedCount++;
			} else {
				unsyncedCount++;
				console.log(`   ⚠️  User ${clerkUser.id} exists in Clerk but not in database`);
			}
		}

		console.log(`\n   Synced: ${syncedCount}/${clerkUsers.data.length}`);
		if (unsyncedCount > 0) {
			console.log(`   ⚠️  ${unsyncedCount} users need to be synced to database`);
		}

		await closePool();
	} catch (error) {
		console.error(`   ❌ Error connecting to Clerk: ${error instanceof Error ? error.message : error}`);
	}

	console.log('\n✅ Clerk Integration Check Complete!');
}

checkClerkIntegration();

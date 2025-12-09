/**
 * Clerk Configuration Script
 *
 * Configures webhook and syncs existing users to the database
 */

import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';

import { getPoolClient } from '../src/db/client';
import { users } from '../src/db/schema';

const CLERK_SECRET_KEY = 'sk_test_guHAi8sijzZnqnVSIU621Hp5xYXLss4nkwDAIUJDiM';

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function syncClerkUsers() {
	console.log('🔄 Syncing Clerk users to database...\n');

	const db = getPoolClient();

	try {
		// Get all users from Clerk
		const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });

		console.log(`📊 Found ${clerkUsers.data.length} users in Clerk\n`);

		for (const clerkUser of clerkUsers.data) {
			const email = clerkUser.emailAddresses[0]?.emailAddress;
			const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

			console.log(`\n👤 Processing user: ${clerkUser.id}`);
			console.log(`   Email: ${email}`);
			console.log(`   Name: ${fullName || '(not set)'}`);

			if (!email) {
				console.log(`   ⚠️ Skipping - no email address`);
				continue;
			}

			// Check if user already exists in database
			const [existingUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, clerkUser.id))
				.limit(1);

			if (existingUser) {
				console.log(`   ✅ Already exists in database`);
				continue;
			}

			// Insert user into database
			try {
				await db.insert(users).values({
					id: clerkUser.id,
					email: email,
					fullName: fullName,
				});
				console.log(`   ✅ Created in database`);
			} catch (error) {
				console.log(
					`   ❌ Failed to create: ${error instanceof Error ? error.message : 'Unknown error'}`,
				);
			}
		}

		// Summary
		console.log('\n' + '='.repeat(60));
		console.log('📋 SYNC COMPLETE');
		console.log('='.repeat(60));

		const dbUsers = await db.select().from(users);
		console.log(`\nTotal users in database: ${dbUsers.length}`);
		console.log('\nUsers:');
		dbUsers.forEach((u) => {
			console.log(`  - ${u.id}: ${u.email} (${u.fullName || 'no name'})`);
		});
	} catch (error) {
		console.error('❌ Error syncing users:', error);
		throw error;
	}
}

async function main() {
	console.log('🚀 Clerk Configuration Script\n');
	console.log('='.repeat(60));

	// Step 1: Sync users
	await syncClerkUsers();

	console.log('\n\n📌 NEXT STEPS:');
	console.log('='.repeat(60));
	console.log('\n1. Configure webhook in Clerk Dashboard:');
	console.log('   URL: https://clerk.com/docs/webhooks');
	console.log('   Endpoint: https://YOUR_DOMAIN/api/webhooks/clerk');
	console.log('   Events: user.created, user.updated, user.deleted');
	console.log('\n2. Add these to your .env file:');
	console.log('   CLERK_SECRET_KEY=sk_test_guHAi8sijzZnqnVSIU621Hp5xYXLss4nkwDAIUJDiM');
	console.log(
		'   VITE_CLERK_PUBLISHABLE_KEY=pk_test_b3B0aW1hbC1seW54LTUyLmNsZXJrLmFjY291bnRzLmRldiQ',
	);
	console.log(
		'   CLERK_WEBHOOK_SECRET=whsec_xxx (get from Clerk Dashboard after creating webhook)',
	);
	console.log('\n3. Test bank account creation!');
}

main()
	.then(() => {
		console.log('\n✅ Script completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Script failed:', error);
		process.exit(1);
	});

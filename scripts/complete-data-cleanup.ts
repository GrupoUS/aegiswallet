/**
 * Complete Data Cleanup Script
 * Deletes all users from Clerk and truncates all data from Neon PostgreSQL
 * 
 * CAUTION: This script permanently deletes ALL data!
 */

import { createClerkClient } from '@clerk/backend';
import { getPoolClient, closePool, runAsServiceAccount } from '../src/db/client';
import { sql } from 'drizzle-orm';

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

async function cleanupClerkUsers() {
	console.log('\n🧹 STEP 1: Cleaning Clerk Users...\n');

	try {
		// List all users
		const { data: users } = await clerkClient.users.getUserList({ limit: 100 });
		console.log(`   Found ${users.length} users in Clerk`);

		if (users.length === 0) {
			console.log('   ✅ Clerk is already empty');
			return;
		}

		// Delete each user
		for (const user of users) {
			const email = user.emailAddresses[0]?.emailAddress || 'no-email';
			try {
				await clerkClient.users.deleteUser(user.id);
				console.log(`   ✅ Deleted: ${user.id} (${email})`);
			} catch (error) {
				console.log(`   ❌ Failed to delete ${user.id}: ${error instanceof Error ? error.message : error}`);
			}
		}

		// Verify cleanup
		const { data: remaining } = await clerkClient.users.getUserList({ limit: 100 });
		console.log(`\n   📊 Remaining users in Clerk: ${remaining.length}`);

	} catch (error) {
		console.error('❌ Clerk cleanup error:', error instanceof Error ? error.message : error);
	}
}

async function cleanupNeonDatabase() {
	console.log('\n🧹 STEP 2: Cleaning Neon PostgreSQL Database...\n');

	try {
		await runAsServiceAccount(async (tx) => {
			// Tables in order of FK dependencies (children first, parents last)
			const tablesToTruncate = [
				// Child tables (no dependencies)
				'audit_logs',
				'error_logs',
				'lgpd_consent_logs',
				'lgpd_export_requests',
				'lgpd_consents',
				'voice_commands',
				'chat_sessions',
				'user_security',
				'user_preferences',
				'notifications',
				'ai_insights',
				'alert_rules',
				'event_reminders',
				'financial_events',
				'pix_qr_codes',
				'pix_transactions',
				'pix_keys',
				'boletos',
				'transaction_schedules',
				'transactions',
				'transaction_categories',
				'contacts',
				'bank_accounts',
				// Organization related
				'organization_members',
				'organizations',
				// Billing
				'subscriptions',
				// Parent tables (last)
				'users',
			];

			console.log('   Truncating tables in FK-safe order...\n');

			for (const table of tablesToTruncate) {
				try {
					// Check if table exists
					const exists = await tx.execute(sql`
						SELECT 1 FROM information_schema.tables 
						WHERE table_schema = 'public' AND table_name = ${table}
					`);

					if (exists.rows.length === 0) {
						console.log(`   ⏭️  ${table} - table does not exist`);
						continue;
					}

					// Get row count before
					const countBefore = await tx.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
					const rowCount = Number(countBefore.rows[0]?.count || 0);

					if (rowCount === 0) {
						console.log(`   ⏭️  ${table} - already empty`);
						continue;
					}

					// Truncate with CASCADE to handle any remaining FKs
					await tx.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
					console.log(`   ✅ ${table} - deleted ${rowCount} rows`);

				} catch (error) {
					console.log(`   ❌ ${table} - error: ${error instanceof Error ? error.message : error}`);
				}
			}

			console.log('\n   📊 Verifying cleanup...');

			// Verify key tables are empty
			const keyTables = ['users', 'bank_accounts', 'organizations', 'subscriptions'];
			for (const table of keyTables) {
				try {
					const count = await tx.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
					const remaining = Number(count.rows[0]?.count || 0);
					console.log(`   ${table}: ${remaining === 0 ? '✅ Empty' : `❌ ${remaining} rows remaining`}`);
				} catch {
					console.log(`   ${table}: ⏭️  Table does not exist`);
				}
			}
		});

		console.log('\n   ✅ Neon database cleanup complete!');

	} catch (error) {
		console.error('❌ Neon cleanup error:', error instanceof Error ? error.message : error);
	}
}

async function verifyCleanState() {
	console.log('\n🔍 STEP 3: Final Verification...\n');

	// Verify Clerk
	try {
		const { data: users } = await clerkClient.users.getUserList({ limit: 100 });
		console.log(`   Clerk users: ${users.length === 0 ? '✅ 0 (Clean)' : `❌ ${users.length} remaining`}`);
	} catch (error) {
		console.log(`   Clerk: ❌ Error - ${error instanceof Error ? error.message : error}`);
	}

	// Verify Neon
	const client = await getPoolClient();
	try {
		const usersCount = await client.execute(sql`SELECT COUNT(*) as count FROM users`);
		const bankCount = await client.execute(sql`SELECT COUNT(*) as count FROM bank_accounts`);
		const orgCount = await client.execute(sql`SELECT COUNT(*) as count FROM organizations`);

		console.log(`   Neon users: ${Number(usersCount.rows[0]?.count) === 0 ? '✅ 0 (Clean)' : `❌ ${usersCount.rows[0]?.count} remaining`}`);
		console.log(`   Neon bank_accounts: ${Number(bankCount.rows[0]?.count) === 0 ? '✅ 0 (Clean)' : `❌ ${bankCount.rows[0]?.count} remaining`}`);
		console.log(`   Neon organizations: ${Number(orgCount.rows[0]?.count) === 0 ? '✅ 0 (Clean)' : `❌ ${orgCount.rows[0]?.count} remaining`}`);

	} catch (error) {
		console.log(`   Neon: ❌ Error - ${error instanceof Error ? error.message : error}`);
	}
}

async function main() {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('   🚨 COMPLETE DATA CLEANUP - Clerk + Neon PostgreSQL');
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('   ⚠️  This will permanently delete ALL user data!');
	console.log('═══════════════════════════════════════════════════════════════');

	// Step 1: Clean Clerk
	await cleanupClerkUsers();

	// Step 2: Clean Neon
	await cleanupNeonDatabase();

	// Step 3: Verify
	await verifyCleanState();

	console.log('\n═══════════════════════════════════════════════════════════════');
	console.log('   ✅ CLEANUP COMPLETE - Ready for fresh registration!');
	console.log('═══════════════════════════════════════════════════════════════\n');

	await closePool();
}

main().catch(console.error);

/**
 * Final Cleanup Verification Script
 * Confirms both Clerk and Neon are clean and ready for fresh registration
 */

import { createClerkClient } from '@clerk/backend';
import { sql } from 'drizzle-orm';

import { closePool, getPoolClient } from '../src/db/client';

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

async function verifyCleanState() {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('   🔍 CLEANUP VERIFICATION - Clerk + Neon PostgreSQL');
	console.log('═══════════════════════════════════════════════════════════════\n');

	let allClean = true;

	// ============================================
	// CLERK VERIFICATION
	// ============================================
	console.log('📋 CLERK AUTHENTICATION:');
	try {
		const { data: users } = await clerkClient.users.getUserList({ limit: 100 });
		if (users.length === 0) {
			console.log('   ✅ Users: 0 (Clean)');
		} else {
			console.log(`   ❌ Users: ${users.length} remaining`);
			for (const user of users) {
				const email = user.emailAddresses[0]?.emailAddress || 'no-email';
				console.log(`      - ${user.id} (${email})`);
			}
			allClean = false;
		}

		// Check organizations in Clerk
		const { data: orgs } = await clerkClient.organizations.getOrganizationList({ limit: 100 });
		if (orgs.length === 0) {
			console.log('   ✅ Organizations: 0 (Clean)');
		} else {
			console.log(`   ❌ Organizations: ${orgs.length} remaining`);
			allClean = false;
		}
	} catch (error) {
		console.log(
			`   ❌ Error connecting to Clerk: ${error instanceof Error ? error.message : error}`,
		);
		allClean = false;
	}

	// ============================================
	// NEON DATABASE VERIFICATION
	// ============================================
	console.log('\n📋 NEON POSTGRESQL DATABASE:');

	const client = await getPoolClient();
	const tablesToCheck = [
		'users',
		'bank_accounts',
		'organizations',
		'organization_members',
		'subscriptions',
		'transactions',
		'pix_keys',
		'contacts',
		'lgpd_consents',
		'user_preferences',
		'audit_logs',
	];

	try {
		for (const table of tablesToCheck) {
			try {
				const result = await client.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
				const count = Number(result.rows[0]?.count || 0);
				if (count === 0) {
					console.log(`   ✅ ${table}: 0 rows (Clean)`);
				} else {
					console.log(`   ❌ ${table}: ${count} rows remaining`);
					allClean = false;
				}
			} catch (error) {
				// Table might not exist
				console.log(`   ⏭️  ${table}: Table does not exist`);
			}
		}

		// Check RLS policies are intact
		console.log('\n📋 RLS POLICIES STATUS:');
		const policies = await client.execute(sql`
			SELECT tablename, COUNT(*) as policy_count
			FROM pg_policies
			WHERE schemaname = 'public'
			GROUP BY tablename
			ORDER BY tablename
		`);

		const keyTables = ['users', 'bank_accounts', 'transactions'];
		for (const table of keyTables) {
			const policy = policies.rows.find((p: any) => p.tablename === table);
			if (policy) {
				console.log(`   ✅ ${table}: ${policy.policy_count} policies active`);
			} else {
				console.log(`   ⚠️  ${table}: No RLS policies found`);
			}
		}

		// Check helper functions
		console.log('\n📋 RLS HELPER FUNCTIONS:');
		const functions = await client.execute(sql`
			SELECT routine_name
			FROM information_schema.routines
			WHERE routine_schema = 'public'
			AND routine_name IN ('is_service_account', 'get_current_user_id')
		`);

		const fnNames = functions.rows.map((r: any) => r.routine_name);
		console.log(`   ${fnNames.includes('is_service_account') ? '✅' : '❌'} is_service_account()`);
		console.log(
			`   ${fnNames.includes('get_current_user_id') ? '✅' : '❌'} get_current_user_id()`,
		);
	} catch (error) {
		console.log(`   ❌ Error querying Neon: ${error instanceof Error ? error.message : error}`);
		allClean = false;
	}

	// ============================================
	// FINAL STATUS
	// ============================================
	console.log('\n═══════════════════════════════════════════════════════════════');
	if (allClean) {
		console.log('   ✅ ALL SYSTEMS CLEAN - Ready for fresh user registration!');
		console.log('');
		console.log('   Next Steps:');
		console.log('   1. Start the dev server: bun dev');
		console.log('   2. Navigate to the app and sign up with a new account');
		console.log('   3. Verify UserSyncService creates the user correctly');
		console.log('   4. Test POST /api/v1/bank-accounts endpoint');
	} else {
		console.log('   ⚠️  SOME DATA REMAINS - Review items marked with ❌ above');
	}
	console.log('═══════════════════════════════════════════════════════════════\n');

	await closePool();
}

verifyCleanState().catch(console.error);

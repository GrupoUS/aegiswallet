/**
 * Check RLS Policies and Helper Functions
 * Verifies that all required RLS configurations are in place
 */

import { sql } from 'drizzle-orm';

import { closePool, getPoolClient } from '../src/db/client';

async function checkRLSPolicies() {
	console.log('🔍 Checking RLS Policies and Helper Functions...\n');

	const db = getPoolClient();

	try {
		// Check RLS policies on key tables
		console.log('📋 RLS Policies on key tables:');
		const policies = await db.execute(sql`
			SELECT tablename, policyname, cmd, permissive
			FROM pg_policies
			WHERE tablename IN ('users', 'bank_accounts', 'subscriptions')
			ORDER BY tablename, policyname
		`);

		if (policies.rows.length === 0) {
			console.log('   ⚠️  No RLS policies found on users/bank_accounts/subscriptions tables');
		} else {
			for (const row of policies.rows) {
				const r = row as { tablename: string; policyname: string; cmd: string; permissive: string };
				console.log(`   ✅ ${r.tablename}: ${r.policyname} (${r.cmd}, ${r.permissive})`);
			}
		}

		// Check if helper functions exist
		console.log('\n📋 Helper Functions:');
		const functions = await db.execute(sql`
			SELECT routine_name
			FROM information_schema.routines
			WHERE routine_name IN ('is_service_account', 'get_current_user_id', 'get_current_organization_id')
			AND routine_schema = 'public'
		`);

		const foundFunctions = (functions.rows as Array<{ routine_name: string }>).map(
			(r) => r.routine_name,
		);

		const requiredFunctions = ['is_service_account', 'get_current_user_id'];
		for (const fn of requiredFunctions) {
			if (foundFunctions.includes(fn)) {
				console.log(`   ✅ Function ${fn}() exists`);
			} else {
				console.log(`   ❌ Function ${fn}() NOT FOUND - RLS may not work correctly!`);
			}
		}

		// Check RLS is enabled on tables
		console.log('\n📋 RLS Enabled Status:');
		const rlsStatus = await db.execute(sql`
			SELECT relname, relrowsecurity, relforcerowsecurity
			FROM pg_class
			WHERE relname IN ('users', 'bank_accounts', 'subscriptions', 'transactions')
			AND relkind = 'r'
		`);

		for (const row of rlsStatus.rows) {
			const r = row as { relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean };
			const status = r.relrowsecurity ? '✅ ENABLED' : '❌ DISABLED';
			console.log(`   ${r.relname}: ${status}`);
		}

		// Test service account function
		console.log('\n📋 Testing Service Account Function:');
		try {
			// Set service account context
			await db.execute(sql`SELECT set_config('app.is_service_account', 'true', false)`);
			const result = await db.execute(sql`SELECT is_service_account() as is_service`);
			const isService = (result.rows[0] as { is_service: boolean }).is_service;

			if (isService) {
				console.log('   ✅ is_service_account() returns TRUE when app.is_service_account is set');
			} else {
				console.log('   ❌ is_service_account() returns FALSE - check function definition');
			}

			// Reset
			await db.execute(sql`SELECT set_config('app.is_service_account', 'false', false)`);
		} catch (error) {
			console.log(
				`   ❌ Error testing is_service_account(): ${error instanceof Error ? error.message : error}`,
			);
		}

		// Count users in database
		console.log('\n📋 Database Statistics:');
		const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
		console.log(`   Users: ${(userCount.rows[0] as { count: string }).count}`);

		const bankAccountCount = await db.execute(sql`SELECT COUNT(*) as count FROM bank_accounts`);
		console.log(`   Bank Accounts: ${(bankAccountCount.rows[0] as { count: string }).count}`);

		console.log('\n✅ RLS Policy Check Complete!');
	} catch (error) {
		console.error('❌ Error checking RLS policies:', error);
	} finally {
		await closePool();
	}
}

checkRLSPolicies();

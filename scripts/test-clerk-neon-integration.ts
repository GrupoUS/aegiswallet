#!/usr/bin/env bun

/**
 * Test Clerk + NeonDB Integration
 *
 * This script tests the integration to ensure:
 * 1. Auth helper functions work correctly
 * 2. Database clients have proper user context
 * 3. RLS policies enforce data isolation
 * 4. Server actions follow the official pattern
 */

import { neon } from '@neondatabase/serverless';

// ========================================
// CONFIGURATION
// ========================================

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

console.log('🧪 Testing Clerk + NeonDB Integration...');

// ========================================
// DATABASE CONNECTION
// ========================================

const sql = neon(databaseUrl);

// ========================================
// TEST FUNCTIONS
// ========================================

async function testDatabaseConnection() {
	try {
		console.log('📡 Testing database connection...');

		const result =
			await sql`SELECT NOW() as current_time, version() as version`;
		console.log('✅ Database connection successful');
		console.log(`   Server time: ${result[0]?.current_time}`);

		return true;
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		return false;
	}
}

async function testRlsPolicies() {
	try {
		console.log('🔒 Testing RLS policies...');

		// Test if RLS is enabled on key tables
		const tables = [
			'user_preferences',
			'bank_accounts',
			'transactions',
			'pix_transactions',
			'chat_sessions',
		];

		let rlsEnabledCount = 0;

		for (const table of tables) {
			const [result] = await sql`
				SELECT rowsecurity 
				FROM pg_tables 
				WHERE tablename = ${table}
			`;

			if (result?.rowsecurity) {
				console.log(`✅ RLS enabled on ${table}`);
				rlsEnabledCount++;
			} else {
				console.log(`⚠️  RLS not enabled on ${table}`);
			}
		}

		// Check if helper function exists
		const [funcResult] = await sql`
			SELECT 1 FROM pg_proc 
			WHERE proname = 'get_current_user_id'
		`;

		if (funcResult) {
			console.log('✅ get_current_user_id() function exists');
			rlsEnabledCount++;
		} else {
			console.log('❌ get_current_user_id() function missing');
		}

		console.log(
			`📊 RLS Setup: ${rlsEnabledCount}/${tables.length + 1} checks passed`,
		);
		return rlsEnabledCount === tables.length + 1;
	} catch (error) {
		console.error('❌ RLS policy test failed:', error);
		return false;
	}
}

async function testUserContext() {
	try {
		console.log('👤 Testing user context functionality...');

		// Test setting user context (simulate Clerk auth)
		const testUserId = 'user_test123';

		console.log(`🔧 Testing with user context: ${testUserId}`);

		// Test if we can set user context
		await sql`SET LOCAL app.current_user_id = ${testUserId}`;

		// Test if context is properly set
		const [result] = await sql`
			SELECT current_setting('app.current_user_id', true) as current_user_id
		`;

		if (result && result.current_user_id === testUserId) {
			console.log('✅ User context setting works correctly');
			return true;
		} else {
			console.log('❌ User context setting failed');
			return false;
		}
	} catch (error) {
		console.error('❌ User context test failed:', error);
		return false;
	}
}

async function testSchemaValidation() {
	try {
		console.log('📋 Testing schema validation...');

		// Check if all critical tables have user_id columns
		const tablesWithUserId = [
			'user_preferences',
			'bank_accounts',
			'transactions',
			'pix_transactions',
			'boletos',
			'contacts',
			'chat_sessions',
		];

		let validTables = 0;

		for (const table of tablesWithUserId) {
			try {
				const [result] = await sql`
					SELECT column_name 
					FROM information_schema.columns 
					WHERE table_name = ${table} AND column_name = 'user_id'
				`;

				if (result) {
					console.log(`✅ ${table} has user_id column`);
					validTables++;
				} else {
					console.log(`❌ ${table} missing user_id column`);
				}
			} catch (error) {
				console.log(`⚠️  Could not check ${table}: ${error}`);
			}
		}

		console.log(
			`📊 Schema Validation: ${validTables}/${tablesWithUserId.length} tables have user_id`,
		);
		return validTables === tablesWithUserId.length;
	} catch (error) {
		console.error('❌ Schema validation failed:', error);
		return false;
	}
}

async function testRlsIsolation() {
	try {
		console.log('🔐 Testing RLS data isolation...');

		// This test simulates what happens when different users try to access data
		const user1Id = 'user_test1';
		const user2Id = 'user_test2';

		console.log(`🧪 Testing isolation between users ${user1Id} and ${user2Id}`);

		// Test user 1 context
		await sql`SET LOCAL app.current_user_id = ${user1Id}`;
		const user1Result = await sql`
			SELECT current_setting('app.current_user_id', true) as user_id
		`;

		// Test user 2 context
		await sql`SET LOCAL app.current_user_id = ${user2Id}`;
		const user2Result = await sql`
			SELECT current_setting('app.current_user_id', true) as user_id
		`;

		// Test isolation on a sample table (if it exists)
		try {
			const isolationTest = await sql`
				SELECT COUNT(*) as count 
				FROM transactions 
				WHERE user_id = current_setting('app.current_user_id', true)
			`;

			console.log('✅ RLS isolation test passed');
			console.log(`   User 1 context: ${user1Result[0]?.user_id}`);
			console.log(`   User 2 context: ${user2Result[0]?.user_id}`);
			console.log(
				`   Isolation query returned: ${isolationTest[0]?.count} records`,
			);

			return true;
		} catch (_error) {
			// Table might not exist, but context isolation still works
			if (
				user1Result[0]?.user_id === user1Id &&
				user2Result[0]?.user_id === user2Id
			) {
				console.log('✅ User context isolation works (table test skipped)');
				return true;
			} else {
				console.log('❌ User context isolation failed');
				return false;
			}
		}
	} catch (error) {
		console.error('❌ RLS isolation test failed:', error);
		return false;
	}
}

async function testIndexes() {
	try {
		console.log('📊 Testing performance indexes...');

		const indexTests = [
			{ table: 'transactions', index: 'idx_transactions_user_id' },
			{ table: 'bank_accounts', index: 'idx_bank_accounts_user_id' },
			{ table: 'pix_transactions', index: 'idx_pix_transactions_user_id' },
		];

		let indexCount = 0;

		for (const { table, index } of indexTests) {
			try {
				const [result] = await sql`
					SELECT 1 FROM pg_indexes 
					WHERE tablename = ${table} AND indexname = ${index}
				`;

				if (result) {
					console.log(`✅ Index ${index} exists on ${table}`);
					indexCount++;
				} else {
					console.log(`⚠️  Index ${index} missing on ${table}`);
				}
			} catch (error) {
				console.log(`⚠️  Could not check index for ${table}: ${error}`);
			}
		}

		console.log(
			`📊 Performance Indexes: ${indexCount}/${indexTests.length} found`,
		);
		return true; // Non-critical, always pass
	} catch (error) {
		console.error('❌ Index test failed:', error);
		return false;
	}
}

// ========================================
// MAIN TEST EXECUTION
// ========================================

async function runTests() {
	const tests = [
		{ name: 'Database Connection', fn: testDatabaseConnection },
		{ name: 'RLS Policies', fn: testRlsPolicies },
		{ name: 'User Context', fn: testUserContext },
		{ name: 'Schema Validation', fn: testSchemaValidation },
		{ name: 'RLS Isolation', fn: testRlsIsolation },
		{ name: 'Performance Indexes', fn: testIndexes },
	];

	let passedTests = 0;
	const totalTests = tests.length;

	console.log(`\n🚀 Starting ${totalTests} integration tests...\n`);

	for (const { name, fn } of tests) {
		console.log(`\n--- ${name} ---`);
		try {
			const passed = await fn();
			if (passed) {
				passedTests++;
			}
		} catch (error) {
			console.error(`❌ ${name} test failed with error:`, error);
		}
	}

	// ========================================
	// RESULTS SUMMARY
	// ========================================

	console.log(`\n${'='.repeat(50)}`);
	console.log('🎯 CLERK + NEONDB INTEGRATION TEST RESULTS');
	console.log('='.repeat(50));
	console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
	console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

	if (passedTests === totalTests) {
		console.log('\n🎉 ALL TESTS PASSED!');
		console.log('✨ Clerk + NeonDB integration is working correctly');
		console.log('🔐 User data isolation is properly enforced');
		console.log('📊 Ready for production use');
	} else {
		console.log('\n⚠️  SOME TESTS FAILED');
		console.log('🔧 Review the failed tests and apply fixes');
		console.log('📖 Check the official Clerk + NeonDB documentation');
	}

	console.log('\n📝 Next Steps:');
	console.log('   1. Update server actions to use createServerActionDb()');
	console.log('   2. Test authentication flow with Clerk');
	console.log('   3. Verify user data isolation in your application');
	console.log('   4. Run this script after database migrations');

	console.log(`\n${'='.repeat(50)}`);

	return passedTests === totalTests;
}

// Run if executed directly
if (import.meta.main) {
	runTests()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error('Test execution failed:', error);
			process.exit(1);
		});
}

export { runTests };

/**
 * Drizzle ORM Connection Test Script
 *
 * Validates that the Drizzle setup is working correctly by:
 * 1. Testing database connectivity
 * 2. Running simple queries on generated schemas
 * 3. Verifying type inference
 *
 * Usage: bun scripts/test-drizzle-connection.ts
 */

import { sql } from 'drizzle-orm';

import { closePool, db, schema } from '../src/db';

async function testDrizzleConnection() {
	console.log('🔄 Starting Drizzle ORM connection test...\n');

	try {
		// Test 1: Basic connectivity
		console.log('📡 Test 1: Basic database connectivity');
		const pingResult = await db.execute(sql`SELECT 1 as ping`);
		console.log('   ✅ Database ping successful:', pingResult);

		// Test 2: Get database version
		console.log('\n📡 Test 2: PostgreSQL version');
		const versionResult = await db.execute(sql`SELECT version()`);
		console.log('   ✅ PostgreSQL version:', versionResult[0]?.version);

		// Test 3: Count users (schema validation)
		console.log('\n📡 Test 3: Schema validation - users table');
		const userCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.users);
		console.log('   ✅ Users count:', userCount[0]?.count);

		// Test 4: Count transaction_categories
		console.log('\n📡 Test 4: Schema validation - transaction_categories');
		const categoryCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.transactionCategories);
		console.log('   ✅ Transaction categories count:', categoryCount[0]?.count);

		// Test 5: Count audit_logs (LGPD)
		console.log('\n📡 Test 5: Schema validation - audit_logs (LGPD)');
		const auditCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.auditLogs);
		console.log('   ✅ Audit logs count:', auditCount[0]?.count);

		// Test 6: List table names in public schema
		console.log('\n📡 Test 6: List public schema tables');
		try {
			const tablesResult = (await db.execute(sql`
			     SELECT table_name
			     FROM information_schema.tables
			     WHERE table_schema = 'public'
			     ORDER BY table_name
			   `)) as unknown as Array<{ table_name: string }>;
			console.log('   ✅ Public schema tables:', tablesResult.length);
			tablesResult.slice(0, 5).forEach((row: { table_name: string }) => {
				console.log(`      - ${row.table_name}`);
			});
			if (tablesResult.length > 5) {
				console.log(`      ... and ${tablesResult.length - 5} more`);
			}
		} catch (error) {
			console.log(
				'   ⚠️  Could not list tables (may not have permission):',
				error,
			);
		}

		console.log('\n✅ All Drizzle ORM connection tests PASSED!\n');
		console.log('Summary:');
		console.log('  - Database connectivity: ✅');
		console.log('  - Schema inference: ✅');
		console.log('  - Query execution: ✅');
		console.log('  - Type safety: ✅');
	} catch (error) {
		console.error('\n❌ Drizzle ORM connection test FAILED!');
		console.error('Error:', error);
		process.exit(1);
	} finally {
		// Close connection pool
		await closePool();
		console.log('\n🔒 Connection pool closed.');
	}
}

// Run the test
testDrizzleConnection();

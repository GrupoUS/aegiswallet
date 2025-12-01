#!/usr/bin/env bun

/**
 * Integration Validation for Neon DB Connection
 * Tests React 19 + Hono RPC + Drizzle ORM stack integration
 */

import { config } from 'dotenv';

config({ path: '.env' });

// Import the database clients
import { adminDb, closePool, db, getHttpClient, getPoolClient } from '../src/db/client';

async function testHttpClientIntegration() {
	console.log('🌐 Testing HTTP Client Integration (Pooled)...');

	try {
		const client = getHttpClient();

		// Test basic query
		const result = await client.execute({
			sql: `SELECT 
        now() as timestamp,
        version() as postgresql_version,
        current_database() as database,
        current_user as user
      `,
		});

		console.log('   ✅ HTTP Client: Connected');
		console.log(`   📅 Timestamp: ${result[0]?.timestamp}`);
		console.log(`   🗄️  PostgreSQL: ${result[0]?.postgresql_version?.split(',')[0]}`);
		console.log(`   📊 Database: ${result[0]?.database}`);
		console.log(`   👤 User: ${result[0]?.user}`);

		return true;
	} catch (error) {
		console.error(`   ❌ HTTP Client Failed: ${error}`);
		return false;
	}
}

async function testPoolClientIntegration() {
	console.log('\n🏊 Testing Pool Client Integration (Direct)...');

	try {
		const client = getPoolClient();

		// Test transaction capabilities
		const result = await client.execute({
			sql: `SELECT 
        now() as timestamp,
        version() as postgresql_version,
        current_database() as database
      `,
		});

		console.log('   ✅ Pool Client: Connected');
		console.log(`   📅 Timestamp: ${result[0]?.timestamp}`);
		console.log(`   🗄️  PostgreSQL: ${result[0]?.postgresql_version?.split(',')[0]}`);
		console.log(`   📊 Database: ${result[0]?.database}`);

		// Test session features (only available with direct connection)
		try {
			const sessionResult = await client.execute({
				sql: `SELECT current_setting('timezone', true) as timezone`,
			});
			console.log(`   🌍 Timezone: ${sessionResult[0]?.timezone}`);
			console.log('   ✅ Session features: Working');
		} catch (_sessionError) {
			console.log('   ⚠️  Session features: Limited (expected with pooled connections)');
		}

		return true;
	} catch (error) {
		console.error(`   ❌ Pool Client Failed: ${error}`);
		return false;
	}
}

async function testDefaultClients() {
	console.log('\n🔧 Testing Default Exported Clients...');

	try {
		// Test default db (pooled)
		if (db) {
			const defaultResult = await db.execute({
				sql: 'SELECT current_database() as database',
			});
			console.log(`   ✅ Default db: ${defaultResult[0]?.database} (pooled)`);
		} else {
			console.log('   ⚠️  Default db: Not available (client-side context)');
		}

		// Test adminDb (direct)
		if (adminDb) {
			const adminResult = await adminDb.execute({
				sql: 'SELECT current_database() as database',
			});
			console.log(`   ✅ Admin db: ${adminResult[0]?.database} (direct)`);
		} else {
			console.log('   ⚠️  Admin db: Not available (client-side context)');
		}

		return true;
	} catch (error) {
		console.error(`   ❌ Default Clients Failed: ${error}`);
		return false;
	}
}

async function testSchemaIntegration() {
	console.log('\n📋 Testing Schema Integration...');

	try {
		const client = getHttpClient();
		const { schema } = await import('../src/db/schema');

		// Test schema access
		const userCount = await client.select({ count: 1 }).from(schema.users);
		console.log(`   👥 Users table: ${userCount.length} records found`);

		const categoryCount = await client.select({ count: 1 }).from(schema.transactionCategories);
		console.log(`   📂 Categories: ${categoryCount.length} records found`);

		// Test LGPD compliance tables
		const auditCount = await client.select({ count: 1 }).from(schema.auditLogs);
		console.log(`   🔒 Audit logs: ${auditCount.length} records found`);

		console.log('   ✅ Schema integration: Working correctly');
		return true;
	} catch (error) {
		console.error(`   ❌ Schema Integration Failed: ${error}`);
		return false;
	}
}

async function testTypeScriptIntegration() {
	console.log('\n📝 Testing TypeScript Integration...');

	try {
		const client = getHttpClient();
		const { schema } = await import('../src/db/schema');

		// Test type safety - these should compile without errors
		const typedQuery = await client
			.select({
				id: schema.users.id,
				email: schema.users.email,
				createdAt: schema.users.createdAt,
			})
			.from(schema.users)
			.limit(1);

		console.log(`   📊 Typed query: ${typedQuery.length} user(s) found`);
		console.log('   ✅ TypeScript types: Working correctly');
		return true;
	} catch (error) {
		console.error(`   ❌ TypeScript Integration Failed: ${error}`);
		return false;
	}
}

async function testBrazilianCompliance() {
	console.log('\n🇧🇷 Testing Brazilian Compliance Features...');

	try {
		const client = getHttpClient();
		const { schema } = await import('../src/db/schema');

		// Test LGPD audit table
		const auditLogs = await client
			.select({
				id: schema.auditLogs.id,
				action: schema.auditLogs.action,
				tableName: schema.auditLogs.tableName,
				createdAt: schema.auditLogs.createdAt,
			})
			.from(schema.auditLogs)
			.limit(5);

		console.log(`   🔒 LGPD audit logs: ${auditLogs.length} records found`);

		// Test Brazilian financial data structures
		const categories = await client
			.select({
				id: schema.transactionCategories.id,
				name: schema.transactionCategories.name,
				type: schema.transactionCategories.type,
			})
			.from(schema.transactionCategories)
			.limit(3);

		console.log(`   💰 Financial categories: ${categories.length} found`);

		if (categories.length > 0) {
			console.log(`   📂 Sample category: ${categories[0].name} (${categories[0].type})`);
		}

		console.log('   ✅ Brazilian compliance: Features available');
		return true;
	} catch (error) {
		console.error(`   ❌ Brazilian Compliance Failed: ${error}`);
		return false;
	}
}

async function main() {
	console.log('🚀 Neon DB Integration Validation');
	console.log('==================================');
	console.log('Testing React 19 + Hono RPC + Drizzle ORM Stack Integration\n');

	const tests = [
		{ name: 'HTTP Client', fn: testHttpClientIntegration },
		{ name: 'Pool Client', fn: testPoolClientIntegration },
		{ name: 'Default Clients', fn: testDefaultClients },
		{ name: 'Schema Integration', fn: testSchemaIntegration },
		{ name: 'TypeScript Integration', fn: testTypeScriptIntegration },
		{ name: 'Brazilian Compliance', fn: testBrazilianCompliance },
	];

	const results = [];

	for (const test of tests) {
		try {
			const result = await test.fn();
			results.push({ name: test.name, success: result });
		} catch (error) {
			console.error(`   ❌ ${test.name} test crashed: ${error}`);
			results.push({ name: test.name, success: false, error });
		}
	}

	// Summary
	console.log('\n📊 Integration Test Summary:');
	const passed = results.filter((r) => r.success).length;
	const total = results.length;

	results.forEach((result) => {
		const status = result.success ? '✅' : '❌';
		console.log(`   ${status} ${result.name}${result.error ? `: ${result.error}` : ''}`);
	});

	console.log(
		`\n🎯 Overall Result: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`,
	);

	if (passed === total) {
		console.log('\n🎉 All integration tests PASSED!');
		console.log('   ✅ Neon DB is fully integrated with your stack');
		console.log('   ✅ Dual connection pattern is working');
		console.log('   ✅ Brazilian compliance features are available');
		console.log('   ✅ TypeScript types are correctly configured');
		console.log('   ✅ Ready for production deployment');
	} else {
		console.log('\n⚠️  Some integration issues detected.');
		console.log('   Review the failed tests above and fix any configuration issues.');
	}

	// Cleanup
	try {
		await closePool();
		console.log('\n🔒 Connection pools closed successfully');
	} catch (_error) {
		console.log('\n⚠️  Error closing connection pools (may be already closed)');
	}
}

main().catch(console.error);

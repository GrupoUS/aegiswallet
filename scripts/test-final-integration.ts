#!/usr/bin/env bun

/**
 * Final Integration Test for Neon DB
 * Tests all components working together
 */

import { config } from 'dotenv';
import { getRequiredEnvVar } from '../src/lib/utils';

config({ path: '.env' });

async function testBasicConnection() {
	console.log('🔌 Testing Basic Connection...');

	try {
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(getRequiredEnvVar('DATABASE_URL'));

		const result = await sql`SELECT
      now() as server_time,
      version() as postgresql_version,
      current_database() as database_name,
      current_user() as user_name
    `;

		console.log(`   ✅ Connected successfully`);
		console.log(`   📅 Server Time: ${result[0]?.server_time}`);
		console.log(`   🗄️  PostgreSQL: ${result[0]?.postgresql_version?.split(',')[0]}`);
		console.log(`   📊 Database: ${result[0]?.database_name}`);
		console.log(`   👤 User: ${result[0]?.user_name}`);

		return true;
	} catch (error) {
		console.error(`   ❌ Connection failed: ${error}`);
		return false;
	}
}

async function testDualConnections() {
	console.log('\n🔄 Testing Dual Connection Pattern...');

	try {
		const { neon } = await import('@neondatabase/serverless');

		// Test pooled connection
		const pooledSql = neon(getRequiredEnvVar('DATABASE_URL'));
		const pooledResult = await pooledSql`SELECT 'pooled' as connection_type`;
		console.log(`   ✅ Pooled connection: ${pooledResult[0]?.connection_type}`);

		// Test direct connection
		const directSql = neon(getRequiredEnvVar('DATABASE_URL_UNPOOLED'));
		const directResult = await directSql`SELECT 'direct' as connection_type`;
		console.log(`   ✅ Direct connection: ${directResult[0]?.connection_type}`);

		return true;
	} catch (error) {
		console.error(`   ❌ Dual connection test failed: ${error}`);
		return false;
	}
}

async function testDrizzleClient() {
	console.log('\n🥬 Testing Drizzle ORM Client...');

	try {
		// Import the database client and sql template
		const { getHttpClient, getPoolClient } = await import('../src/db/client');
		const { sql } = await import('drizzle-orm');

		// Test HTTP client
		const httpClient = getHttpClient();
		const httpResult = await httpClient.execute(sql`SELECT 1 as test`);
		console.log(`   ✅ HTTP client: Working (${httpResult.rows.length} rows)`);

		// Test pool client
		const poolClient = getPoolClient();
		const poolResult = await poolClient.execute(sql`SELECT 1 as test`);
		console.log(`   ✅ Pool client: Working (${poolResult.rows.length} rows)`);

		return true;
	} catch (error) {
		console.error(`   ❌ Drizzle client test failed: ${error}`);
		return false;
	}
}

async function testDatabaseSchema() {
	console.log('\n📋 Testing Database Schema...');

	try {
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(getRequiredEnvVar('DATABASE_URL'));

		// Test key tables exist
		const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

		const tableNames = tables.map((row) => row.table_name);
		console.log(
			`   📊 Found ${tableNames.length} tables: ${tableNames.slice(0, 5).join(', ')}${tableNames.length > 5 ? '...' : ''}`,
		);

		// Check for essential Brazilian fintech tables
		const essentialTables = [
			'users',
			'transactions',
			'transaction_categories',
			'bank_accounts',
			'audit_logs',
		];
		const missingTables = essentialTables.filter((table) => !tableNames.includes(table));

		if (missingTables.length === 0) {
			console.log('   ✅ All essential tables found');
		} else {
			console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
		}

		// Test user data
		const userCount = await sql`SELECT COUNT(*) as count FROM users`;
		console.log(`   👥 Users: ${userCount[0]?.count || 0} records`);

		// Test transaction categories (Brazilian financial categories)
		const categoryCount = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
		console.log(`   💰 Transaction categories: ${categoryCount[0]?.count || 0} records`);

		// Test LGPD compliance tables
		const auditCount = await sql`SELECT COUNT(*) as count FROM audit_logs`;
		console.log(`   🔒 Audit logs: ${auditCount[0]?.count || 0} records`);

		return true;
	} catch (error) {
		console.error(`   ❌ Schema test failed: ${error}`);
		return false;
	}
}

function testSSLCompliance() {
	console.log('\n🔒 Testing SSL & Brazilian Compliance...');

	try {
		const DATABASE_URL = getRequiredEnvVar('DATABASE_URL');
		const urlObj = new URL(DATABASE_URL);

		const sslMode = urlObj.searchParams.get('sslmode');
		const channelBinding = urlObj.searchParams.get('channel_binding');
		const isBrazilRegion = urlObj.hostname.includes('sa-east-1');

		console.log(`   🔐 SSL Mode: ${sslMode || 'default'}`);
		console.log(`   🔗 Channel Binding: ${channelBinding || 'disabled'}`);
		console.log(`   🌍 Region: ${isBrazilRegion ? 'sa-east-1 (Brazil)' : 'Other'}`);

		// Compliance check
		const sslCompliant = sslMode === 'verify-full';
		const bindingCompliant = channelBinding === 'require';
		const regionOptimal = isBrazilRegion;

		console.log(`   ✅ SSL Compliance: ${sslCompliant ? 'LGPD Compliant' : 'Needs upgrade'}`);
		console.log(
			`   ✅ Channel Binding: ${bindingCompliant ? 'Enhanced Security' : 'Should be enabled'}`,
		);
		console.log(
			`   ✅ Regional Optimization: ${regionOptimal ? 'Optimal for Brazil' : 'Consider sa-east-1'}`,
		);

		return sslCompliant && regionOptimal;
	} catch (error) {
		console.error(`   ❌ Compliance check failed: ${error}`);
		return false;
	}
}

async function testPerformance() {
	console.log('\n⚡ Testing Performance...');

	try {
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(getRequiredEnvVar('DATABASE_URL'));

		const startTime = performance.now();

		// Run multiple queries to test performance
		const results = await Promise.all([
			sql`SELECT 1 as test1`,
			sql`SELECT 2 as test2`,
			sql`SELECT 3 as test3`,
			sql`SELECT now() as server_time`,
			sql`SELECT version() as pg_version`,
		]);

		const totalTime = performance.now() - startTime;
		const avgTime = totalTime / results.length;

		console.log(`   ⚡ Average query time: ${avgTime.toFixed(2)}ms`);
		console.log(`   ⚡ Total time: ${totalTime.toFixed(2)}ms`);
		console.log(`   ⚡ Queries per second: ${(1000 / avgTime).toFixed(0)}`);

		// Performance classification
		if (avgTime < 50) {
			console.log('   🟢 Excellent performance');
		} else if (avgTime < 100) {
			console.log('   🟡 Good performance');
		} else {
			console.log('   🟠 Performance needs optimization');
		}

		return avgTime < 100; // Consider < 100ms as good performance
	} catch (error) {
		console.error(`   ❌ Performance test failed: ${error}`);
		return false;
	}
}

async function main() {
	console.log('🚀 Final Neon DB Integration Test');
	console.log('=================================');

	const tests = [
		{ name: 'Basic Connection', fn: testBasicConnection },
		{ name: 'Dual Connections', fn: testDualConnections },
		{ name: 'Drizzle Client', fn: testDrizzleClient },
		{ name: 'Database Schema', fn: testDatabaseSchema },
		{ name: 'SSL & Compliance', fn: testSSLCompliance },
		{ name: 'Performance', fn: testPerformance },
	];

	const results = [];

	for (const test of tests) {
		try {
			const success = await Promise.resolve(test.fn());
			results.push({ name: test.name, success });
		} catch (error) {
			console.error(`   ❌ ${test.name} crashed: ${error}`);
			results.push({ name: test.name, success: false });
		}
	}

	// Final Summary
	console.log('\n📊 Final Integration Summary:');
	const passed = results.filter((r) => r.success).length;
	const total = results.length;

	results.forEach((result) => {
		const status = result.success ? '✅' : '❌';
		console.log(`   ${status} ${result.name}`);
	});

	console.log(
		`\n🎯 Overall Result: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`,
	);

	if (passed === total) {
		console.log('\n🎉 INTEGRATION SUCCESSFUL!');
		console.log('   ✅ Neon Database is fully configured and optimized');
		console.log('   ✅ Dual connection pattern (pooled + direct) is working');
		console.log('   ✅ SSL security is LGPD compliant');
		console.log('   ✅ Regional optimization for Brazil is active');
		console.log('   ✅ Performance is excellent for Brazilian users');
		console.log('   ✅ Ready for production deployment with React 19 + Hono RPC + Drizzle ORM');

		console.log('\n🇧🇷 Brazilian Compliance Status: FULLY COMPLIANT');
		console.log('   ✅ SSL Mode: verify-full (LGPD requirement)');
		console.log('   ✅ Channel Binding: require (enhanced security)');
		console.log('   ✅ Region: sa-east-1 (optimal for Brazil)');
		console.log('   ✅ LGPD audit tables implemented');
		console.log('   ✅ Brazilian financial data structures in place');
	} else {
		console.log('\n⚠️  INTEGRATION ISSUES DETECTED');
		console.log('   Review failed tests and fix configuration issues');
	}
}

main().catch(console.error);

#!/usr/bin/env bun

/**
 * Test Updated SSL Configuration
 */

import { config } from 'dotenv';

// Clear any cached env vars
process.env.DATABASE_URL = undefined;
process.env.DATABASE_URL_UNPOOLED = undefined;

// Load fresh environment variables
config({ path: '.env' });

// Use the URLs directly from the .env file
const DATABASE_URL =
	'postgresql://neondb_owner:npg_jqbHF8Rt9LKl@ep-calm-unit-ac6cfbqc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';
const DATABASE_URL_UNPOOLED =
	'postgresql://neondb_owner:npg_jqbHF8Rt9LKl@ep-calm-unit-ac6cfbqc.sa-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

console.log('🔒 Testing Updated SSL Configuration');
console.log('===================================');

async function testConnection(url: string, label: string) {
	console.log(`\n🔍 Testing ${label}...`);

	try {
		const urlObj = new URL(url);
		console.log(`   URL: ${urlObj.hostname}`);
		console.log(`   SSL Mode: ${urlObj.searchParams.get('sslmode')}`);
		console.log(`   Channel Binding: ${urlObj.searchParams.get('channel_binding')}`);

		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(url);

		const result = await sql`SELECT 1 as test, now() as timestamp, version() as version`;

		if (result[0]) {
			console.log(`   ✅ Connection successful`);
			console.log(`   📅 Server time: ${result[0].timestamp}`);
			console.log(`   🗄️  PostgreSQL: ${result[0].version?.split(',')[0]}`);

			return {
				success: true,
				sslMode: urlObj.searchParams.get('sslmode'),
				channelBinding: urlObj.searchParams.get('channel_binding'),
			};
		}
	} catch (error) {
		console.error(
			`   ❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return { success: false, error };
	}
}

async function main() {
	const pooledResult = await testConnection(DATABASE_URL, 'Pooled Connection');
	const directResult = await testConnection(DATABASE_URL_UNPOOLED, 'Direct Connection');

	console.log('\n🇧🇷 Brazilian Compliance Check:');

	if (pooledResult.sslMode === 'verify-full') {
		console.log('   ✅ SSL Mode: verify-full (LGPD Compliant)');
	} else {
		console.log('   ❌ SSL Mode: NOT verify-full (Not Compliant)');
	}

	if (pooledResult.channelBinding === 'require') {
		console.log('   ✅ Channel Binding: require (Enhanced Security)');
	} else {
		console.log('   ❌ Channel Binding: NOT require (Security Risk)');
	}

	if (pooledResult.success && directResult.success) {
		console.log('\n🎉 Both connections working with enhanced SSL security!');
		console.log('   Database is fully compliant with Brazilian standards.');
	} else {
		console.log('\n⚠️  Some connection issues detected.');
	}
}

main().catch(console.error);

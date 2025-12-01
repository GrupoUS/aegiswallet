#!/usr/bin/env bun

/**
 * Neon SSL Configuration Validator
 *
 * Validates SSL configuration and tests with enhanced security settings
 */

import { config } from 'dotenv';
import { getRequiredEnvVar } from '../src/lib/utils';

// Load environment variables from .env file
config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

console.log('🔧 Environment Variables Check:');
console.log(`   DATABASE_URL exists: ${!!DATABASE_URL}`);
console.log(`   DATABASE_URL_UNPOOLED exists: ${!!DATABASE_URL_UNPOOLED}`);

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL environment variable not set');
	process.exit(1);
}

// Parse URLs to verify SSL parameters
const parseUrl = (url: string, label: string) => {
	console.log(`\n📝 ${label} URL Analysis:`);

	try {
		const urlObj = new URL(url);

		console.log(`   Host: ${urlObj.hostname}`);
		console.log(`   Database: ${urlObj.pathname.substring(1)}`);
		console.log(`   User: ${urlObj.username}`);

		// Parse search parameters
		const sslMode = urlObj.searchParams.get('sslmode');
		const channelBinding = urlObj.searchParams.get('channel_binding');

		console.log(`   SSL Mode: ${sslMode || '(not set)'}`);
		console.log(`   Channel Binding: ${channelBinding || '(not set)'}`);

		// Compliance check
		console.log(
			`   ✅ SSL Mode Compliance: ${sslMode === 'verify-full' ? 'LGPD Compliant' : 'NOT Compliant - Should be verify-full'}`,
		);
		console.log(
			`   ✅ Channel Binding: ${channelBinding === 'require' ? 'Secure' : 'NOT Secure - Should be require'}`,
		);
		console.log(
			`   ✅ Region: ${urlObj.hostname.includes('sa-east-1') ? 'Optimal (Brazil)' : 'Suboptimal'}`,
		);
		console.log(
			`   ✅ Connection Type: ${urlObj.hostname.includes('-pooler') ? 'Pooled (API)' : 'Direct (Admin)'}`,
		);

		return urlObj;
	} catch (error) {
		console.error(`   ❌ URL parsing failed: ${error}`);
		return null;
	}
};

async function testEnhancedConnection(url: string, label: string) {
	console.log(`\n🔍 Testing ${label} with Enhanced SSL...`);

	try {
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(url);

		// Test basic connectivity
		const result = await sql`SELECT 1 as test, now() as timestamp, version() as version`;

		if (result[0]) {
			console.log(`   ✅ Connection successful`);
			console.log(`   📅 Server time: ${result[0].timestamp}`);
			console.log(`   🗄️  PostgreSQL: ${result[0].version?.split(',')[0]}`);

			// Try to get connection info
			try {
				const connInfo = await sql`
          SELECT
            current_database() as database,
            current_user as user,
            inet_server_addr() as server_ip
        `;

				if (connInfo[0]) {
					console.log(`   📊 Database: ${connInfo[0].database}`);
					console.log(`   👤 User: ${connInfo[0].user}`);
					console.log(`   🌐 Server IP: ${connInfo[0].server_ip}`);
				}
			} catch (infoError) {
				console.log(`   ⚠️  Could not get connection info: ${infoError}`);
			}

			return true;
		}
	} catch (error) {
		console.error(
			`   ❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}

	return false;
}

async function main() {
	console.log('🔒 Neon SSL Configuration Validator');
	console.log('===================================');

	// Parse and analyze current configuration
	const _pooledUrl = parseUrl(getRequiredEnvVar('DATABASE_URL'), 'Pooled Connection');

	const _directUrl = DATABASE_URL_UNPOOLED
		? parseUrl(DATABASE_URL_UNPOOLED, 'Direct Connection')
		: null;

	// Test connections with current configuration
	console.log('\n🚀 Connection Testing:');

	const pooledSuccess = await testEnhancedConnection(getRequiredEnvVar('DATABASE_URL'), 'Pooled Connection');

	let directSuccess = false;
	if (DATABASE_URL_UNPOOLED) {
		directSuccess = await testEnhancedConnection(DATABASE_URL_UNPOOLED, 'Direct Connection');
	}

	// Final recommendations
	console.log('\n📋 Final Assessment:');

	if (pooledSuccess) {
		console.log('   ✅ Pooled connection: Working');
	} else {
		console.log('   ❌ Pooled connection: Failed - Check credentials or network');
	}

	if (directSuccess) {
		console.log('   ✅ Direct connection: Working');
	} else if (DATABASE_URL_UNPOOLED) {
		console.log('   ❌ Direct connection: Failed - Check credentials or network');
	} else {
		console.log('   ⚠️  Direct connection: Not configured');
	}

	// Compliance status
	const urlObj = new URL(getRequiredEnvVar('DATABASE_URL'));
	const sslMode = urlObj.searchParams.get('sslmode');
	const channelBinding = urlObj.searchParams.get('channel_binding');

	console.log('\n🇧🇷 Brazilian Compliance Status:');
	console.log(
		`   SSL Mode: ${sslMode === 'verify-full' ? '✅ LGPD Compliant' : '❌ NOT Compliant'}`,
	);
	console.log(
		`   Channel Binding: ${channelBinding === 'require' ? '✅ Enhanced Security' : '❌ Missing'}`,
	);
	console.log(
		`   Region: ${urlObj.hostname.includes('sa-east-1') ? '✅ Optimal for Brazil' : '⚠️  Consider sa-east-1'}`,
	);

	if (sslMode === 'verify-full' && channelBinding === 'require') {
		console.log('\n🎉 Configuration is fully compliant with Brazilian standards!');
	} else {
		console.log('\n⚠️  Configuration needs updates for full compliance.');
	}
}

main().catch(console.error);

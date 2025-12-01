#!/usr/bin/env bun
/**
 * Neon Database Connection Test Script
 *
 * Tests connection to Neon PostgreSQL with various SSL modes
 * Validates Brazilian compliance requirements
 */

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL environment variable not set');
	process.exit(1);
}

async function testConnection(url: string, label: string) {
	console.log(`\n🔍 Testing ${label} connection...`);

	try {
		// Parse connection URL to get components
		const urlObj = new URL(url);
		const isPooled = urlObj.hostname.includes('-pooler');

		console.log(`   Hostname: ${urlObj.hostname}`);
		console.log(`   Database: ${urlObj.pathname.substring(1)}`);
		console.log(`   SSL Mode: ${urlObj.searchParams.get('sslmode') || 'default'}`);
		console.log(`   Channel Binding: ${urlObj.searchParams.get('channel_binding') || 'disabled'}`);
		console.log(`   Connection Type: ${isPooled ? 'Pooled (PgBouncer)' : 'Direct'}`);

		// Create neon client for testing
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(url);

		// Test 1: Basic connectivity
		const ping = await sql`SELECT 1 as ping, now() as timestamp`;
		console.log(`   ✅ Ping successful: ${ping[0]?.ping}`);
		console.log(`   📅 Server timestamp: ${ping[0]?.timestamp}`);

		// Test 2: PostgreSQL version
		const version = await sql`SELECT version()`;
		console.log(
			`   🗄️  PostgreSQL: ${version[0]?.version?.split(' ')[0]} ${version[0]?.version?.split(' ')[1]}`,
		);

		// Test 3: Connection info
		const connectionInfo = await sql`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `;

		if (connectionInfo[0]) {
			console.log(`   📊 Database: ${connectionInfo[0].database}`);
			console.log(`   👤 User: ${connectionInfo[0].user}`);
			console.log(`   🌐 Server: ${connectionInfo[0].server_ip}:${connectionInfo[0].server_port}`);
		}

		// Test 4: SSL verification for compliance
		const sslInfo = await sql`
      SELECT 
        ssl_is_used() as ssl_active,
        ssl_version() as ssl_version,
        ssl_cipher() as ssl_cipher
    `;

		if (sslInfo[0]) {
			console.log(`   🔒 SSL Active: ${sslInfo[0].ssl_active}`);
			if (sslInfo[0].ssl_active) {
				console.log(`   🔐 SSL Version: ${sslInfo[0].ssl_version || 'Unknown'}`);
				console.log(`   🛡️  SSL Cipher: ${sslInfo[0].ssl_cipher || 'Unknown'}`);
			}
		}

		return { success: true, isPooled, sslActive: sslInfo[0]?.ssl_active };
	} catch (error) {
		console.error(
			`   ❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return { success: false, error };
	}
}

async function main() {
	console.log('🚀 Neon Database Connection Test Suite');
	console.log('=====================================');

	// Test 1: Current connection (pooled)
	const pooledResult = await testConnection(DATABASE_URL, 'Pooled Connection');

	// Test 2: Direct connection (if available)
	if (DATABASE_URL_UNPOOLED) {
		const directResult = await testConnection(DATABASE_URL_UNPOOLED, 'Direct Connection');

		// Compare results
		console.log('\n📊 Connection Comparison:');
		console.log(`   Pooled: ${pooledResult.success ? '✅' : '❌'}`);
		console.log(`   Direct: ${directResult.success ? '✅' : '❌'}`);
	}

	// Compliance check
	console.log('\n🇧🇷 Brazilian Compliance Check:');

	const urlObj = new URL(DATABASE_URL);
	const sslMode = urlObj.searchParams.get('sslmode');
	const channelBinding = urlObj.searchParams.get('channel_binding');

	console.log(
		`   SSL Mode: ${sslMode === 'verify-full' ? '✅ (LGPD Compliant)' : '⚠️  Should be verify-full for LGPD'}`,
	);
	console.log(
		`   Channel Binding: ${channelBinding === 'require' ? '✅ (Secure)' : '⚠️  Should be require for enhanced security'}`,
	);
	console.log(
		`   Region: ${urlObj.hostname.includes('sa-east-1') ? '✅ (Brazil - Optimal)' : '⚠️  Should use sa-east-1 for Brazil'}`,
	);

	// Recommendations
	console.log('\n💡 Recommendations:');

	if (sslMode !== 'verify-full') {
		console.log('   - Upgrade SSL mode to "verify-full" for LGPD compliance');
	}

	if (!channelBinding) {
		console.log('   - Add "channel_binding=require" for enhanced security');
	}

	if (pooledResult.success && !pooledResult.sslActive) {
		console.log('   - SSL encryption is not active - check configuration');
	}

	console.log('\n✅ Connection test completed!');
}

main().catch(console.error);

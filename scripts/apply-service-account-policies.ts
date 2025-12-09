/**
 * Apply Service Account Policies Migration
 *
 * Directly applies the missing service account bypass policies
 * for bank_accounts and other tables
 */

import { sql } from 'drizzle-orm';

import { closePool, getPoolClient } from '../src/db/client';

async function applyMigration() {
	console.log('🔧 Applying service account bypass policies...');

	const client = await getPoolClient();

	// Read the migration SQL
	const fs = await import('fs/promises');
	const path = await import('path');
	const migrationPath = path.join(
		process.cwd(),
		'drizzle/migrations/0006_add_missing_service_account_policies.sql',
	);
	const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

	// Split by semicolons to get individual statements
	const statements = migrationSQL
		.split(';')
		.map((stmt) => stmt.trim())
		.filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

	console.log(`   Found ${statements.length} SQL statements to execute`);

	for (let i = 0; i < statements.length; i++) {
		const statement = statements[i];
		try {
			await client.execute(sql.raw(statement));
			console.log(`   ✅ Statement ${i + 1}: ${statement.substring(0, 50)}...`);
		} catch (error) {
			console.log(
				`   ❌ Statement ${i + 1} failed: ${error instanceof Error ? error.message : error}`,
			);
			console.log(`      SQL: ${statement.substring(0, 100)}...`);
		}
	}

	console.log('   ✅ Migration applied successfully!');
}

async function verifyPolicies() {
	console.log('\n🔍 Verifying service account policies...');

	const client = await getPoolClient();

	// Check if policies exist
	const result = await client.execute(sql`
		SELECT tablename, policyname
		FROM pg_policies
		WHERE schemaname = 'public'
		AND policyname LIKE '%service_account%'
		ORDER BY tablename, policyname
	`);

	console.log('   Service account policies found:');
	for (const row of result.rows) {
		console.log(`      - ${row.tablename}: ${row.policyname}`);
	}

	const expectedTables = [
		'users',
		'bank_accounts',
		'transactions',
		'pix_keys',
		'pix_transactions',
		'boletos',
		'contacts',
		'notifications',
		'financial_events',
		'event_reminders',
		'chat_sessions',
		'voice_commands',
		'ai_insights',
		'organization_members',
		'organization_settings',
	];

	for (const table of expectedTables) {
		const hasPolicy = result.rows.some((row: any) => row.tablename === table);
		if (hasPolicy) {
			console.log(`   ✅ ${table}: Service account policy exists`);
		} else {
			console.log(`   ❌ ${table}: Service account policy missing`);
		}
	}
}

async function main() {
	console.log('═════════════════════════════════════════════════════════');
	console.log('   🔧 APPLY SERVICE ACCOUNT POLICIES');
	console.log('═════════════════════════════════════════════════════════');

	try {
		await applyMigration();
		await verifyPolicies();

		console.log('\n═══════════════════════════════════════════════════════');
		console.log('   ✅ SERVICE ACCOUNT POLICIES APPLIED');
		console.log('═══════════════════════════════════════════════════════');
	} catch (error) {
		console.error('\n═════════════════════════════════════════════════════');
		console.error('   ❌ MIGRATION FAILED');
		console.error('═════════════════════════════════════════════════════');
		console.error('Error:', error instanceof Error ? error.message : error);

		if (error instanceof Error && error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
	} finally {
		await closePool();
	}
}

main().catch(console.error);

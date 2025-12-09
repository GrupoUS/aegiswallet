/**
 * Add Service Account Policies to Tables
 * Ensures service account can access all tables for administrative operations
 */

import { sql } from 'drizzle-orm';

import { closePool, getPoolClient } from '../src/db/client';

async function addServiceAccountPolicies() {
	console.log('🔧 Adding Service Account RLS Policies...\n');

	const client = await getPoolClient();

	try {
		// List of tables that need service account policy
		const tables = [
			'bank_accounts',
			'transactions',
			'transaction_categories',
			'notifications',
			'user_preferences',
			'user_security',
			'chat_sessions',
			'voice_commands',
			'lgpd_consents',
			'audit_logs',
		];

		for (const table of tables) {
			const policyName = `${table}_service_account`;

			// Check if policy already exists
			const existingPolicy = await client.execute(sql`
				SELECT policyname FROM pg_policies
				WHERE tablename = ${table}
				AND policyname = ${policyName}
			`);

			if (existingPolicy.rows.length > 0) {
				console.log(`   ⏭️  ${policyName} already exists`);
				continue;
			}

			// Check if table exists
			const tableExists = await client.execute(sql`
				SELECT 1 FROM information_schema.tables
				WHERE table_schema = 'public'
				AND table_name = ${table}
			`);

			if (tableExists.rows.length === 0) {
				console.log(`   ⚠️  Table ${table} does not exist, skipping`);
				continue;
			}

			// Create service account policy
			try {
				await client.execute(
					sql.raw(`
					CREATE POLICY ${policyName} ON ${table}
					FOR ALL
					TO PUBLIC
					USING (is_service_account())
					WITH CHECK (is_service_account())
				`),
				);
				console.log(`   ✅ Created ${policyName}`);
			} catch (error) {
				console.log(
					`   ❌ Failed to create ${policyName}:`,
					error instanceof Error ? error.message : error,
				);
			}
		}

		console.log('\n✅ Service Account Policies Added!');

		// Verify policies
		console.log('\n📋 Verifying RLS Policies...');
		const allPolicies = await client.execute(sql`
			SELECT tablename, policyname, cmd, permissive
			FROM pg_policies
			WHERE schemaname = 'public'
			ORDER BY tablename, policyname
		`);

		for (const policy of allPolicies.rows) {
			console.log(
				`   ${policy.tablename}: ${policy.policyname} (${policy.cmd}, ${policy.permissive})`,
			);
		}
	} catch (error) {
		console.error('❌ Error:', error instanceof Error ? error.message : error);
	} finally {
		await closePool();
	}
}

addServiceAccountPolicies();

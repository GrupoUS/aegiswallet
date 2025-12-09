#!/usr/bin/env bun
/**
 * Enable Row Level Security (RLS) on Neon Database
 *
 * This script applies RLS policies from drizzle/0000_clerk_rls_policies.sql
 * to enable complete user data isolation at the database level.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { Pool } from '@neondatabase/serverless';

import { secureLogger } from '../src/lib/logging/secure-logger';

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set');
	process.exit(1);
}

/**
 * Read RLS policies SQL file
 */
function readRLSPoliciesSQL(): string {
	try {
		const rlsFilePath = join(process.cwd(), 'drizzle', '0000_clerk_rls_policies.sql');
		const sql = readFileSync(rlsFilePath, 'utf-8');
		return sql;
	} catch (error) {
		console.error('❌ Failed to read RLS policies file:', error);
		throw error;
	}
}

/**
 * Execute SQL statements
 * Handles PL/pgSQL functions and multi-line statements correctly
 */
async function executeSQL(pool: Pool, sql: string): Promise<void> {
	// Remove comments and normalize
	const cleanedSQL = sql
		.split('\n')
		.map((line) => {
			// Remove single-line comments
			const commentIndex = line.indexOf('--');
			if (commentIndex >= 0) {
				return line.substring(0, commentIndex);
			}
			return line;
		})
		.join('\n')
		.trim();

	// Split by semicolons, but preserve dollar-quoted strings (for PL/pgSQL functions)
	const statements: string[] = [];
	let currentStatement = '';
	let inDollarQuote = false;
	let dollarTag = '';
	let i = 0;

	while (i < cleanedSQL.length) {
		const char = cleanedSQL[i];
		const nextChar = cleanedSQL[i + 1];

		// Check for dollar-quoted strings ($$ ... $$)
		if (char === '$' && !inDollarQuote) {
			// Find the dollar tag
			let tagEnd = i + 1;
			while (tagEnd < cleanedSQL.length && cleanedSQL[tagEnd] !== '$') {
				tagEnd++;
			}
			if (tagEnd < cleanedSQL.length) {
				dollarTag = cleanedSQL.substring(i, tagEnd + 1);
				inDollarQuote = true;
				currentStatement += dollarTag;
				i = tagEnd + 1;
				continue;
			}
		}

		// Check for end of dollar-quoted string
		if (inDollarQuote && cleanedSQL.substring(i).startsWith(dollarTag)) {
			currentStatement += dollarTag;
			i += dollarTag.length;
			inDollarQuote = false;
			dollarTag = '';
			continue;
		}

		// If inside dollar quote, add character without checking for semicolon
		if (inDollarQuote) {
			currentStatement += char;
			i++;
			continue;
		}

		// Check for semicolon (statement separator)
		if (char === ';') {
			const trimmed = currentStatement.trim();
			if (trimmed.length > 0) {
				statements.push(trimmed);
			}
			currentStatement = '';
		} else {
			currentStatement += char;
		}

		i++;
	}

	// Add final statement if any
	const finalTrimmed = currentStatement.trim();
	if (finalTrimmed.length > 0) {
		statements.push(finalTrimmed);
	}

	console.log(`📋 Executing ${statements.length} SQL statements...\n`);

	let successCount = 0;
	let skippedCount = 0;
	let errorCount = 0;

	for (let i = 0; i < statements.length; i++) {
		const statement = statements[i];

		// Skip empty statements
		if (!statement || statement.trim().length === 0) {
			continue;
		}

		try {
			await pool.query(statement + ';');
			console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
			successCount++;
		} catch (error) {
			// Some statements might fail if they already exist (idempotent)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			if (
				errorMessage.includes('already exists') ||
				errorMessage.includes('duplicate') ||
				errorMessage.includes('already enabled') ||
				(errorMessage.includes('does not exist') && errorMessage.includes('DROP'))
			) {
				console.log(
					`⚠️  Statement ${i + 1}/${statements.length} skipped (${errorMessage.substring(0, 50)}...)`,
				);
				skippedCount++;
			} else {
				console.error(
					`❌ Statement ${i + 1}/${statements.length} failed:`,
					errorMessage.substring(0, 100),
				);
				errorCount++;
				// Don't throw - continue with other statements
			}
		}
	}

	console.log(
		`\n📊 Execution summary: ${successCount} succeeded, ${skippedCount} skipped, ${errorCount} errors`,
	);
}

/**
 * Verify RLS is enabled
 */
async function verifyRLS(pool: Pool): Promise<void> {
	console.log('\n🔍 Verifying RLS status...\n');

	const tables = [
		'users',
		'bank_accounts',
		'transactions',
		'user_preferences',
		'user_security',
		'pix_keys',
		'pix_transactions',
		'contacts',
		'notifications',
		'chat_sessions',
	];

	let enabledCount = 0;
	let disabledCount = 0;

	for (const table of tables) {
		try {
			const result = await pool.query(
				`
				SELECT rowsecurity
				FROM pg_tables
				WHERE schemaname = 'public' AND tablename = $1
			`,
				[table],
			);

			const row = result.rows[0] as { rowsecurity: boolean } | undefined;

			if (row?.rowsecurity) {
				console.log(`✅ RLS enabled on ${table}`);
				enabledCount++;
			} else {
				console.log(`⚠️  RLS disabled on ${table}`);
				disabledCount++;
			}
		} catch (error) {
			console.log(
				`❌ Failed to check ${table}:`,
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}

	console.log(
		`\n📊 Summary: ${enabledCount} tables with RLS enabled, ${disabledCount} tables with RLS disabled`,
	);

	// Check helper functions
	try {
		const funcResult = await pool.query(`
			SELECT proname
			FROM pg_proc
			WHERE proname IN ('get_current_user_id', 'get_current_organization_id')
		`);

		const functions = funcResult.rows.map((r: { proname: string }) => r.proname);
		console.log(`\n🔧 Helper functions: ${functions.join(', ') || 'none found'}`);
	} catch (error) {
		console.log(
			`\n⚠️  Failed to check helper functions:`,
			error instanceof Error ? error.message : 'Unknown error',
		);
	}
}

/**
 * Main function
 */
async function main() {
	console.log('🔒 Enabling Row Level Security (RLS) on Neon Database');
	console.log('='.repeat(60));
	console.log('');

	const pool = new Pool({ connectionString: DATABASE_URL });

	try {
		// Read RLS policies SQL
		console.log('📖 Reading RLS policies file...');
		const rlsSQL = readRLSPoliciesSQL();
		console.log(`✅ Loaded RLS policies (${rlsSQL.length} characters)\n`);

		// Execute RLS policies
		await executeSQL(pool, rlsSQL);

		// Verify RLS status
		await verifyRLS(pool);

		console.log('\n' + '='.repeat(60));
		console.log('✅ RLS activation complete!');
		console.log('');
		console.log('📝 Next steps:');
		console.log('   1. Restart your application server');
		console.log('   2. Test bank account creation');
		console.log('   3. Verify data isolation between users');
		console.log('   4. Monitor logs for RLS policy violations');
		console.log('');
		console.log('⚠️  Important: Ensure your application sets app.current_user_id');
		console.log('   before database operations for RLS to work correctly.');
	} catch (error) {
		console.error('\n❌ Failed to enable RLS:', error);
		if (error instanceof Error) {
			console.error('Error details:', error.message);
			console.error('Stack:', error.stack);
		}
		process.exit(1);
	} finally {
		await pool.end();
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

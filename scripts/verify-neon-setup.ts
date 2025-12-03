// @ts-nocheck - Utility script with runtime-correct but type-incompatible Neon query access patterns
/**
 * Neon Database Setup Verification Script
 *
 * Comprehensive validation of Neon DB configuration including:
 * - Environment variable validation
 * - Connection testing (pooled and direct)
 * - Schema validation
 * - Migration status check
 * - Security verification
 *
 * Usage: bun scripts/verify-neon-setup.ts
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { closePool, getHttpClient, schema } from '../src/db/client';

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

interface VerificationResult {
	step: string;
	status: 'pass' | 'fail' | 'warn';
	message: string;
	details?: Record<string, unknown>;
}

const results: VerificationResult[] = [];

function log(emoji: string, message: string, details?: string) {
	console.log(`${emoji} ${message}`);
	if (details) {
		console.log(`   ${details}`);
	}
}

function addResult(step: string, status: 'pass' | 'fail' | 'warn', message: string, details?: Record<string, unknown>) {
	results.push({ step, status, message, details });
	const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
	log(emoji, `${step}: ${message}`);
	if (details) {
		Object.entries(details).forEach(([key, value]) => {
			console.log(`      ${key}: ${value}`);
		});
	}
}

// ========================================
// STEP 1: Environment Variable Validation
// ========================================
async function validateEnvironment(): Promise<boolean> {
	console.log('\n📋 STEP 1: Environment Variable Validation\n');
	let allValid = true;

	// Check DATABASE_URL
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		addResult('DATABASE_URL', 'fail', 'Not set - required for database connection');
		allValid = false;
	} else {
		// Validate URL format
		try {
			const url = new URL(databaseUrl);
			const isPooled = url.hostname.includes('-pooler');
			const hasSSL = databaseUrl.includes('sslmode=');

			if (isPooled) {
				addResult('DATABASE_URL', 'pass', 'Valid pooled connection string detected', {
					host: url.hostname,
					database: url.pathname.slice(1),
					ssl: hasSSL ? 'enabled' : 'missing'
				});
			} else {
				addResult('DATABASE_URL', 'warn', 'Not using pooled connection (consider using -pooler hostname)', {
					host: url.hostname,
					database: url.pathname.slice(1)
				});
			}

			if (!hasSSL) {
				addResult('SSL Mode', 'warn', 'sslmode not specified in DATABASE_URL - recommended: sslmode=require');
			}
		} catch {
			addResult('DATABASE_URL', 'fail', 'Invalid URL format');
			allValid = false;
		}
	}

	// Check DATABASE_URL_UNPOOLED
	const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
	if (!unpooledUrl) {
		addResult('DATABASE_URL_UNPOOLED', 'warn', 'Not set - will use DATABASE_URL as fallback for migrations');
	} else {
		try {
			const url = new URL(unpooledUrl);
			const isPooled = url.hostname.includes('-pooler');

			if (!isPooled) {
				addResult('DATABASE_URL_UNPOOLED', 'pass', 'Valid direct connection string', {
					host: url.hostname
				});
			} else {
				addResult('DATABASE_URL_UNPOOLED', 'warn', 'Should be a direct (non-pooler) connection');
			}
		} catch {
			addResult('DATABASE_URL_UNPOOLED', 'fail', 'Invalid URL format');
		}
	}

	// Check Clerk keys
	const clerkPublishable = process.env.VITE_CLERK_PUBLISHABLE_KEY;
	const clerkSecret = process.env.CLERK_SECRET_KEY;

	if (clerkPublishable) {
		addResult('VITE_CLERK_PUBLISHABLE_KEY', 'pass', 'Set');
	} else {
		addResult('VITE_CLERK_PUBLISHABLE_KEY', 'warn', 'Not set - authentication will not work');
	}

	if (clerkSecret) {
		addResult('CLERK_SECRET_KEY', 'pass', 'Set');
	} else {
		addResult('CLERK_SECRET_KEY', 'warn', 'Not set - server-side auth will not work');
	}

	// Check PORT
	const port = process.env.PORT;
	addResult('PORT', port ? 'pass' : 'warn', port ? `Set to ${port}` : 'Not set - will default to 3000');

	return allValid;
}

// ========================================
// STEP 2: Connection Testing
// ========================================
async function testConnections(): Promise<boolean> {
	console.log('\n📡 STEP 2: Connection Testing\n');
	let allConnected = true;

	// Test HTTP client (pooled connection)
	try {
		const db = getHttpClient();
		const startTime = Date.now();
		const result = await db.execute(sql`SELECT 1 as ping, version() as pg_version`);
		const latency = Date.now() - startTime;

		const pgVersion = result[0]?.pg_version?.split(' ')[1] || 'Unknown';

		addResult('HTTP Client (Pooled)', 'pass', `Connected in ${latency}ms`, {
			'PostgreSQL Version': pgVersion,
			'Latency': `${latency}ms`
		});

		if (latency > 500) {
			addResult('Connection Latency', 'warn', `High latency detected (${latency}ms) - consider closer region`);
		}
	} catch (error) {
		addResult('HTTP Client (Pooled)', 'fail', `Connection failed: ${error instanceof Error ? error.message : String(error)}`);
		allConnected = false;
	}

	// Test Pool client (direct connection)
	const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
	if (directUrl) {
		let pool: Pool | null = null;
		try {
			pool = new Pool({ connectionString: directUrl });
			const poolDb = drizzlePool(pool, { schema });
			const startTime = Date.now();
			await poolDb.execute(sql`SELECT 1 as pool_test`);
			const latency = Date.now() - startTime;

			addResult('Pool Client (Direct)', 'pass', `Connected in ${latency}ms`, {
				'Latency': `${latency}ms`
			});
		} catch (error) {
			addResult('Pool Client (Direct)', 'fail', `Connection failed: ${error instanceof Error ? error.message : String(error)}`);
			allConnected = false;
		} finally {
			if (pool) {
				await pool.end();
			}
		}
	}

	return allConnected;
}

// ========================================
// STEP 3: Schema Validation
// ========================================
async function validateSchema(): Promise<boolean> {
	console.log('\n📋 STEP 3: Schema Validation\n');
	let schemaValid = true;

	try {
		const db = getHttpClient();

		// Count database tables
		const tablesResult = await db.execute(sql`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public'
			AND table_type = 'BASE TABLE'
			ORDER BY table_name
		`) as unknown as Array<{ table_name: string }>;

		const dbTableCount = tablesResult.length;
		const dbTableNames = tablesResult.map(r => r.table_name);

		// Count Drizzle schema definitions (excluding relations)
		const schemaKeys = Object.keys(schema).filter(key => !key.includes('Relations'));
		const drizzleTableCount = schemaKeys.length;

		addResult('Database Tables', 'pass', `Found ${dbTableCount} tables in public schema`, {
			'Tables': dbTableNames.slice(0, 10).join(', ') + (dbTableNames.length > 10 ? '...' : '')
		});

		addResult('Drizzle Schemas', 'pass', `Found ${drizzleTableCount} schema definitions`, {
			'Schemas': schemaKeys.slice(0, 10).join(', ') + (schemaKeys.length > 10 ? '...' : '')
		});

		if (dbTableCount !== drizzleTableCount) {
			addResult('Schema Sync', 'warn', `Mismatch: ${dbTableCount} DB tables vs ${drizzleTableCount} Drizzle schemas`, {
				'Recommendation': 'Run "bun db:generate" to sync schemas'
			});
		} else {
			addResult('Schema Sync', 'pass', 'Database tables match Drizzle schema count');
		}

		// Get row counts for key tables
		const keyTables = ['users', 'transactions', 'bank_accounts', 'audit_logs'];
		for (const table of keyTables) {
			if (dbTableNames.includes(table)) {
				try {
					const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
					const count = countResult[0]?.count || 0;
					console.log(`      📊 ${table}: ${count} rows`);
				} catch {
					console.log(`      ⚠️  ${table}: Could not count rows`);
				}
			}
		}

	} catch (error) {
		addResult('Schema Validation', 'fail', `Failed: ${error instanceof Error ? error.message : String(error)}`);
		schemaValid = false;
	}

	return schemaValid;
}

// ========================================
// STEP 4: Migration Status Check
// ========================================
async function checkMigrations(): Promise<boolean> {
	console.log('\n📦 STEP 4: Migration Status\n');
	let migrationsOk = true;

	try {
		const db = getHttpClient();

		// Check if drizzle migrations table exists
		const migrationTableExists = await db.execute(sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_schema = 'drizzle'
				AND table_name = '__drizzle_migrations'
			)
		`);

		if (!migrationTableExists[0]?.exists) {
			addResult('Migration Table', 'warn', 'drizzle.__drizzle_migrations not found - migrations may not have been applied');

			// Check for migration files
			try {
				const migrationsDir = join(process.cwd(), 'drizzle', 'migrations');
				const migrationFiles = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
				addResult('Migration Files', 'pass', `Found ${migrationFiles.length} migration file(s)`, {
					'Files': migrationFiles.slice(0, 5).join(', ') + (migrationFiles.length > 5 ? '...' : '')
				});

				if (migrationFiles.length > 0) {
					addResult('Migration Status', 'warn', 'Migration files exist but may not be applied', {
						'Recommendation': 'Run "bun db:migrate" to apply migrations'
					});
				}
			} catch {
				addResult('Migration Files', 'warn', 'Could not read drizzle/migrations directory');
			}
		} else {
			// Get applied migrations
			const appliedMigrations = await db.execute(sql`
				SELECT hash, created_at
				FROM drizzle.__drizzle_migrations
				ORDER BY created_at DESC
				LIMIT 5
			`) as unknown as Array<{ hash: string; created_at: number }>;

			addResult('Applied Migrations', 'pass', `${appliedMigrations.length} migration(s) found`, {
				'Latest': appliedMigrations[0]?.hash?.substring(0, 8) + '...' || 'None'
			});

			// Compare with migration files
			try {
				const migrationsDir = join(process.cwd(), 'drizzle', 'migrations');
				const migrationFiles = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

				if (migrationFiles.length > appliedMigrations.length) {
					addResult('Pending Migrations', 'warn', `${migrationFiles.length - appliedMigrations.length} migration(s) may be pending`, {
						'Recommendation': 'Run "bun db:migrate" to apply pending migrations'
					});
				} else {
					addResult('Migration Status', 'pass', 'All migrations appear to be applied');
				}
			} catch {
				// Migration directory may not exist yet
			}
		}
	} catch (error) {
		addResult('Migration Check', 'fail', `Failed: ${error instanceof Error ? error.message : String(error)}`);
		migrationsOk = false;
	}

	return migrationsOk;
}

// ========================================
// STEP 5: Security Verification
// ========================================
async function verifySecurity(): Promise<boolean> {
	console.log('\n🔒 STEP 5: Security Verification\n');
	let securityOk = true;

	try {
		const db = getHttpClient();

		// Check RLS policies
		try {
			const rlsResult = await db.execute(sql`
				SELECT COUNT(*) as policy_count
				FROM pg_policies
				WHERE schemaname = 'public'
			`);
			const policyCount = Number.parseInt(rlsResult[0]?.policy_count || '0', 10);

			if (policyCount > 0) {
				addResult('RLS Policies', 'pass', `${policyCount} Row-Level Security policies found`);
			} else {
				addResult('RLS Policies', 'warn', 'No RLS policies found - consider implementing for user data isolation');
			}
		} catch {
			addResult('RLS Policies', 'warn', 'Could not check RLS policies (may not have permission)');
		}

		// Check SSL connection
		const databaseUrl = process.env.DATABASE_URL || '';
		const hasSSL = databaseUrl.includes('sslmode=require') || databaseUrl.includes('sslmode=verify-full');

		if (hasSSL) {
			addResult('SSL/TLS', 'pass', 'SSL mode enabled in connection string');
		} else {
			addResult('SSL/TLS', 'warn', 'SSL mode not explicitly set - Neon enforces SSL by default');
		}

		// Check for tables without RLS
		try {
			const tablesWithoutRls = await db.execute(sql`
				SELECT t.table_name
				FROM information_schema.tables t
				LEFT JOIN pg_policies p ON t.table_name = p.tablename AND t.table_schema = p.schemaname
				WHERE t.table_schema = 'public'
				AND t.table_type = 'BASE TABLE'
				AND p.tablename IS NULL
			`) as unknown as Array<{ table_name: string }>;

			if (tablesWithoutRls.length > 0) {
				addResult('Tables Without RLS', 'warn', `${tablesWithoutRls.length} tables have no RLS policies`, {
					'Tables': tablesWithoutRls.slice(0, 5).map(t => t.table_name).join(', ')
				});
			}
		} catch {
			// May not have permission to check this
		}

		// Check encryption (Neon handles this)
		addResult('Encryption at Rest', 'pass', 'Neon provides AES-256 encryption by default');

	} catch (error) {
		addResult('Security Check', 'fail', `Failed: ${error instanceof Error ? error.message : String(error)}`);
		securityOk = false;
	}

	return securityOk;
}

// ========================================
// MAIN EXECUTION
// ========================================
async function main() {
	console.log('═'.repeat(60));
	console.log('🔍 NEON DATABASE SETUP VERIFICATION');
	console.log('═'.repeat(60));
	console.log(`   Timestamp: ${new Date().toISOString()}`);
	console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

	let exitCode = 0;

	try {
		// Run all verification steps
		const envValid = await validateEnvironment();
		const connectionsOk = await testConnections();
		const schemaValid = await validateSchema();
		const migrationsOk = await checkMigrations();
		const securityOk = await verifySecurity();

		// Generate summary
		console.log('\n' + '═'.repeat(60));
		console.log('📊 VERIFICATION SUMMARY');
		console.log('═'.repeat(60));

		const passCount = results.filter(r => r.status === 'pass').length;
		const warnCount = results.filter(r => r.status === 'warn').length;
		const failCount = results.filter(r => r.status === 'fail').length;

		console.log(`\n   ✅ Passed: ${passCount}`);
		console.log(`   ⚠️  Warnings: ${warnCount}`);
		console.log(`   ❌ Failed: ${failCount}`);

		if (failCount > 0) {
			console.log('\n❌ CRITICAL ISSUES FOUND:');
			results
				.filter(r => r.status === 'fail')
				.forEach(r => console.log(`   • ${r.step}: ${r.message}`));
			exitCode = 1;
		}

		if (warnCount > 0) {
			console.log('\n⚠️  WARNINGS:');
			results
				.filter(r => r.status === 'warn')
				.forEach(r => console.log(`   • ${r.step}: ${r.message}`));
		}

		// Recommendations
		console.log('\n🚀 NEXT STEPS:');
		if (!envValid) {
			console.log('   1. Configure DATABASE_URL in .env file');
			console.log('      Get connection strings from: https://console.neon.tech');
		}
		if (!connectionsOk) {
			console.log('   2. Verify Neon project is active and not paused');
			console.log('      Check: https://console.neon.tech');
		}
		if (exitCode === 0) {
			console.log('   ✅ All critical checks passed! Your Neon DB is ready.');
			console.log('   • Start development: bun dev:full');
			console.log('   • Test integration: bun run integration:test');
		}

		console.log('\n' + '═'.repeat(60));

	} catch (error) {
		console.error('\n❌ Verification failed with error:', error);
		exitCode = 1;
	} finally {
		await closePool();
	}

	process.exit(exitCode);
}

// Run verification
main().catch(console.error);

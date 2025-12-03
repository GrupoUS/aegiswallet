#!/usr/bin/env tsx
/**
 * Neon DB Migration Script
 *
 * Applies pending migrations to Neon database
 * Checks migration status and validates schema integrity
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { getPoolClient } from '../src/db/client';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATIONS_FOLDER = './drizzle/migrations';

/**
 * Get list of migration files
 */
async function getMigrationFiles(): Promise<string[]> {
	try {
		const files = await readdir(MIGRATIONS_FOLDER);
		return files
			.filter(file => file.endsWith('.sql'))
			.sort();
	} catch (error) {
		console.error(`❌ Failed to read migrations folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return [];
	}
}

/**
 * Check applied migrations in database
 */
async function getAppliedMigrations(): Promise<string[]> {
	const db = getPoolClient();

	try {
		// Check if migrations table exists
		const result = await db.execute(sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_schema = 'drizzle'
				AND table_name = '__drizzle_migrations'
			);
		`);

		const tableExists = result[0]?.exists;

		if (!tableExists) {
			console.log('📝 Migrations table does not exist, will be created');
			return [];
		}

		// Get applied migrations
		const migrations = await db.execute(sql`
			SELECT hash FROM drizzle.__drizzle_migrations
			ORDER BY created_at;
		`);

		return migrations.map((m: any) => m.hash);
	} catch (error) {
		console.log('⚠️  Could not check applied migrations');
		console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return [];
	}
}

/**
 * Apply migrations
 */
async function applyMigrations() {
	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	console.log('🚀 Applying database migrations...\n');
	console.log('='.repeat(60));

	// Get migration files
	const migrationFiles = await getMigrationFiles();
	console.log(`📁 Found ${migrationFiles.length} migration files`);

	if (migrationFiles.length === 0) {
		console.log('⚠️  No migration files found');
		return;
	}

	// Get applied migrations
	const appliedMigrations = await getAppliedMigrations();
	console.log(`✅ ${appliedMigrations.length} migrations already applied`);

	// Show pending migrations
	const pendingMigrations = migrationFiles.filter(file => {
		// Extract hash from filename (format: 0001_name.sql)
		// We'll compare by filename since we don't have hash in filename
		return true; // Apply all migrations, Drizzle will handle duplicates
	});

	if (pendingMigrations.length === 0 && appliedMigrations.length === migrationFiles.length) {
		console.log('\n✅ All migrations are already applied');
		return;
	}

	// Apply migrations using Drizzle migrator
	console.log('\n🔄 Applying migrations...');

	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	try {
		const sqlClient = neon(DATABASE_URL);
		const db = drizzle(sqlClient);

		console.log(`   📁 Migrations folder: ${MIGRATIONS_FOLDER}`);
		console.log(`   🔌 Database URL: ${DATABASE_URL.substring(0, 20)}...`);

		await migrate(db, {
			migrationsFolder: MIGRATIONS_FOLDER,
		});

		console.log('✅ Migrations applied successfully');

		// Verify applied migrations
		const newAppliedMigrations = await getAppliedMigrations();
		console.log(`\n📊 Total applied migrations: ${newAppliedMigrations.length}`);
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		throw error;
	}
}

/**
 * Validate schema integrity
 */
async function validateSchema() {
	console.log('\n🔍 Validating schema integrity...');

	const db = getPoolClient();

	try {
		// Check critical tables exist
		const criticalTables = ['users', 'organizations', 'subscriptions', 'transactions'];

		for (const tableName of criticalTables) {
			const result = await db.execute(sql`
				SELECT EXISTS (
					SELECT FROM information_schema.tables
					WHERE table_schema = 'public'
					AND table_name = ${tableName}
				);
			`);

			const exists = result[0]?.exists;
			if (exists) {
				console.log(`   ✅ Table '${tableName}' exists`);
			} else {
				console.log(`   ❌ Table '${tableName}' missing`);
			}
		}

		// Check users table has organization_id column
		const usersColumns = await db.execute(sql`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_schema = 'public'
			AND table_name = 'users'
			AND column_name = 'organization_id';
		`);

		if (usersColumns.length > 0) {
			console.log(`   ✅ Column 'users.organization_id' exists`);
		} else {
			console.log(`   ⚠️  Column 'users.organization_id' missing (may need migration)`);
		}

		console.log('\n✅ Schema validation complete');
	} catch (error) {
		console.error('❌ Schema validation failed:', error);
		throw error;
	}
}

/**
 * Main function
 */
async function main() {
	try {
		console.log('🚀 Starting migration process...\n');
		await applyMigrations();
		await validateSchema();

		console.log('\n✅ Migration process complete!');
	} catch (error) {
		console.error('\n💥 Migration process failed:', error);
		if (error instanceof Error) {
			console.error('Error details:', error.message);
			console.error('Stack:', error.stack);
		}
		process.exit(1);
	}
}

// Run if executed directly
main();

export { applyMigrations, validateSchema, getMigrationFiles, getAppliedMigrations };


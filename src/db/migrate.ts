/**
 * Database Migration Runner
 *
 * Applies pending migrations to the database
 * Run with: bun run db:migrate
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

import { logger } from '../lib/logging/logger';

const runMigrations = async () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const sql = neon(databaseUrl);
	const db = drizzle(sql);

	try {
		await migrate(db, {
			migrationsFolder: './drizzle/migrations',
		});
		process.exit(0);
	} catch (error) {
		logger.error('Database migration failed', {
			error: error instanceof Error ? error.message : String(error),
		});
		process.exit(1);
	}
};
runMigrations();

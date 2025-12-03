/**
 * Drizzle Kit Configuration
 *
 * Configuration for database migrations and schema management
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	// Schema files location - glob pattern to include all domain schema files
	// This ensures all tables are discovered for migration generation
	schema: './src/db/schema/**/*.ts',

	// Output directory for migrations
	out: './drizzle/migrations',

	// Database driver
	dialect: 'postgresql',

	// Database connection
	dbCredentials: {
		url: process.env.DATABASE_URL ?? '',
	},

	// Verbose logging during development
	verbose: true,

	// Strict mode for safety
	strict: true,

	// Table filters (include all tables)
	tablesFilter: ['*'],
});

/**
 * Drizzle Kit Configuration
 *
 * Configuration for database migrations and schema management
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	// Schema files location
	schema: './src/db/schema/index.ts',

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

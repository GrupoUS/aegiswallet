/**
 * Drizzle Database Client - Neon Serverless
 *
 * Factory for creating Drizzle ORM clients using Neon's serverless driver
 * Supports both HTTP (for simple queries) and WebSocket (for transactions) connections
 */

import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

// ========================================
// CONFIGURATION
// ========================================

// Get the pooled database URL from environment (for API operations)
const getPooledDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	return url;
};

// Get the direct database URL from environment (for admin/migrations)
const getDirectDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL_UNPOOLED;
	if (!url) {
		// Fallback to pooled URL if direct URL not set
		console.warn('DATABASE_URL_UNPOOLED not set, using DATABASE_URL as fallback');
		return getPooledDatabaseUrl();
	}
	return url;
};

// ========================================
// HTTP CLIENT (Simple Queries)
// ========================================

/**
 * Create an HTTP-based Drizzle client (Pooled Connection)
 * Best for API endpoints with high concurrency in serverless functions
 * Uses PgBouncer connection pooling for better resource efficiency
 */
export const createHttpClient = () => {
	const sql = neon(getPooledDatabaseUrl());
	return drizzleNeon(sql, { schema });
};

// Singleton HTTP client
let httpClient: ReturnType<typeof createHttpClient> | null = null;

export const getHttpClient = () => {
	if (!httpClient) {
		httpClient = createHttpClient();
	}
	return httpClient;
};

// ========================================
// POOL CLIENT (Transactions)
// ========================================

/**
 * Create a Pool-based Drizzle client (Direct Connection)
 * Required for transactions, migrations, and session-based operations
 * Uses WebSocket connections with direct database access (no pooling)
 * Full PostgreSQL feature support including SET statements
 */
export const createPoolClient = () => {
	const pool = new Pool({ connectionString: getDirectDatabaseUrl() });
	return drizzlePool(pool, { schema });
};

// Singleton pool client
let pool: Pool | null = null;
let poolClient: ReturnType<typeof createPoolClient> | null = null;

export const getPoolClient = () => {
	if (!poolClient) {
		pool = new Pool({ connectionString: getDirectDatabaseUrl() });
		poolClient = drizzlePool(pool, { schema });
	}
	return poolClient;
};

export const closePool = async () => {
	if (pool) {
		await pool.end();
		pool = null;
		poolClient = null;
	}
};

/**
 * Get organization-scoped database client
 *
 * ⚠️ WARNING: Multi-tenant isolation is NOT yet implemented!
 * This is a placeholder stub that returns the same shared pool client
 * regardless of organization ID. DO NOT use this function expecting
 * organization-level data isolation.
 *
 * @param _organizationId - The organization ID (currently IGNORED, reserved for future multi-tenant support)
 * @returns The shared pool client (NOT organization-scoped)
 */
export const getOrganizationClient = (_organizationId: string) => {
	// TODO: Implement proper organization-scoped connection pooling
	// when multi-tenant support is added
	return getPoolClient();
};

// ========================================
// DEFAULT EXPORT
// ========================================

/**
 * Default database client (Pooled HTTP-based for API endpoints)
 * Use getPoolClient() when you need transactions or admin operations
 *
 * Note: In browser context, this will be null. Only use on server-side.
 */
export const db =
	typeof window === 'undefined' && process.env.DATABASE_URL
		? getHttpClient()
		: (null as unknown as ReturnType<typeof createHttpClient>);

/**
 * Admin database client (Direct connection for migrations/admin)
 * Use this for database migrations, schema changes, and admin operations
 *
 * Note: In browser context, this will be null. Only use on server-side.
 */
export const adminDb =
	typeof window === 'undefined' && process.env.DATABASE_URL_UNPOOLED
		? getPoolClient()
		: (null as unknown as ReturnType<typeof createPoolClient>);

// ========================================
// TYPE EXPORTS
// ========================================

export type HttpClient = ReturnType<typeof createHttpClient>;
export type PoolClient = ReturnType<typeof createPoolClient>;

// Re-export schema for convenience
export { schema };

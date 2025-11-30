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

// Note: fetchConnectionCache option removed - it's deprecated (now always true)

// Get the database URL from environment
const getDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	return url;
};

// ========================================
// HTTP CLIENT (Simple Queries)
// ========================================

/**
 * Create an HTTP-based Drizzle client
 * Best for simple, one-shot queries in serverless functions
 * Lower latency but doesn't support transactions
 */
export const createHttpClient = () => {
	const sql = neon(getDatabaseUrl());
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
 * Create a Pool-based Drizzle client
 * Required for transactions and session-based operations
 * Uses WebSocket connections under the hood
 */
export const createPoolClient = () => {
	const pool = new Pool({ connectionString: getDatabaseUrl() });
	return drizzlePool(pool, { schema });
};

// Singleton pool client
let pool: Pool | null = null;
let poolClient: ReturnType<typeof createPoolClient> | null = null;

export const getPoolClient = () => {
	if (!poolClient) {
		pool = new Pool({ connectionString: getDatabaseUrl() });
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
 * Default database client (HTTP-based for simplicity)
 * Use getPoolClient() when you need transactions
 */
export const db = getHttpClient();

// ========================================
// TYPE EXPORTS
// ========================================

export type HttpClient = ReturnType<typeof createHttpClient>;
export type PoolClient = ReturnType<typeof createPoolClient>;

// Re-export schema for convenience
export { schema };

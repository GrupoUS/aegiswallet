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
 * Uses lazy initialization to avoid connection issues during module load.
 */
let cachedDb: ReturnType<typeof createHttpClient> | null = null;

export const db = new Proxy({} as ReturnType<typeof createHttpClient>, {
	get(_, prop) {
		if (typeof window !== 'undefined') {
			throw new Error('Database client cannot be used in browser context');
		}
		if (!cachedDb) {
			if (!process.env.DATABASE_URL) {
				throw new Error('DATABASE_URL environment variable is not set');
			}
			cachedDb = getHttpClient();
		}
		return (cachedDb as unknown as Record<string | symbol, unknown>)[prop];
	},
});

/**
 * Admin database client (Direct connection for migrations/admin)
 * Use this for database migrations, schema changes, and admin operations
 *
 * Note: In browser context, this will be null. Only use on server-side.
 * Uses lazy initialization to avoid connection issues during module load.
 */
let cachedAdminDb: ReturnType<typeof createPoolClient> | null = null;

export const adminDb = new Proxy({} as ReturnType<typeof createPoolClient>, {
	get(_, prop) {
		if (typeof window !== 'undefined') {
			throw new Error('Admin database client cannot be used in browser context');
		}
		if (!cachedAdminDb) {
			const hasDbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
			if (!hasDbUrl) {
				throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL environment variable is not set');
			}
			cachedAdminDb = getPoolClient();
		}
		return (cachedAdminDb as unknown as Record<string | symbol, unknown>)[prop];
	},
});

// ========================================
// USER-SCOPED CLIENT (for RLS)
// ========================================

// Singleton shared pool for user-scoped queries
// This prevents connection exhaustion by reusing connections
let sharedPool: Pool | null = null;

/**
 * Get or create a shared connection pool
 * Uses singleton pattern to avoid creating new pools per request
 */
const getSharedPool = (): Pool => {
	if (!sharedPool) {
		sharedPool = new Pool({
			connectionString: getDirectDatabaseUrl(),
			connectionTimeoutMillis: 15000,
			idleTimeoutMillis: 30000,
			max: 10, // Limit total connections
		});

		// Log pool creation for debugging
		console.log('[DB] Shared pool created with max 10 connections');

		// Handle pool errors to prevent crashes
		sharedPool.on('error', (err: Error) => {
			console.error('[DB] Pool error:', err.message);
			// Don't destroy the pool on transient errors
		});
	}
	return sharedPool;
};

/**
 * Get connection pool statistics for monitoring
 */
export const getConnectionStats = () => {
	if (!sharedPool) {
		return {
			totalCount: 0,
			idleCount: 0,
			waitingCount: 0,
			isInitialized: false,
		};
	}
	return {
		totalCount: sharedPool.totalCount,
		idleCount: sharedPool.idleCount,
		waitingCount: sharedPool.waitingCount,
		isInitialized: true,
	};
};

/**
 * Create a user-scoped database client that sets RLS context
 * Uses SINGLETON pool to prevent connection exhaustion
 *
 * RLS is now enabled, so this client sets app.current_user_id before operations.
 * The user context is set per-query using set_config with local scope.
 *
 * @param userId - Clerk user ID (format: "user_xxx")
 * @returns Pool client (from singleton pool) with user context set
 * @throws Error if connection fails or userId is invalid
 */
export const createUserScopedClient = async (userId: string): Promise<PoolClient> => {
	// Validate userId format to prevent SQL injection
	// Clerk user IDs always start with "user_" followed by alphanumeric characters
	if (!userId || !/^user_[a-zA-Z0-9_]+$/.test(userId)) {
		throw new Error(`Invalid user ID format: ${userId}`);
	}

	const maxRetries = 3;
	const retryDelay = 500; // 500ms between retries
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Use singleton shared pool instead of creating new pool per request
			const pool = getSharedPool();
			const db = drizzlePool(pool, { schema });

			// Set user context for RLS using set_config with 'true' for local transaction scope
			// This is SQL-injection safe because we use parameterized query
			await pool.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);

			return db;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry on validation errors or if it's the last attempt
			if (attempt === maxRetries || (error instanceof Error && error.message.includes('Invalid user ID'))) {
				throw lastError;
			}

			// Log retry attempt
			console.warn(`[DB] Connection attempt ${attempt} failed, retrying...`, lastError.message);

			// Wait before retrying (exponential backoff)
			await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
		}
	}

	// This should never be reached, but TypeScript needs it
	throw lastError || new Error('Failed to create user-scoped database client');
};

// ========================================
// SERVICE ACCOUNT OPERATIONS (Bypasses RLS)
// ========================================

/**
 * Run a database operation as service account (bypasses RLS)
 * Uses single dedicated connection to avoid pool context issues
 * @param fn - Function to execute within service account context
 */
export async function runAsServiceAccount<T>(fn: (tx: any) => Promise<T>): Promise<T> {
	const pool = getSharedPool();
	const client = await pool.connect();

	try {
		await client.query('BEGIN');
		await client.query("SELECT set_config('app.is_service_account', 'true', false)");

		const tx = drizzlePool(client as any, { schema });
		const result = await fn(tx);

		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

// ========================================
// TYPE EXPORTS
// ========================================

export type HttpClient = ReturnType<typeof createHttpClient>;
export type PoolClient = ReturnType<typeof createPoolClient>;

// Re-export schema for convenience
export { schema };

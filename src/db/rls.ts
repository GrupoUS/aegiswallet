/**
 * Row Level Security (RLS) Utilities
 *
 * Provides user-scoped database clients that automatically set
 * the current user context for PostgreSQL RLS policies.
 */

import { neon, Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

// ========================================
// CONFIGURATION
// ========================================

const getDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	return url;
};

// ========================================
// USER-SCOPED HTTP CLIENT
// ========================================

/**
 * Creates an HTTP-based Drizzle client with user context for RLS
 *
 * @param userId - Clerk user ID (format: "user_xxx")
 * @returns Drizzle client with RLS context
 *
 * @example
 * ```typescript
 * const db = createUserScopedClient(auth.user.id);
 * const accounts = await db.select().from(bankAccounts);
 * // Only returns accounts for the authenticated user
 * ```
 */
export const createUserScopedClient = (userId: string) => {
	const sqlClient = neon(getDatabaseUrl());
	const db = drizzleNeon(sqlClient, { schema });

	// Create a wrapper that sets user context before each query
	return {
		...db,

		/**
		 * Execute a query with user context set
		 */
		async withUserContext<T>(queryFn: () => Promise<T>): Promise<T> {
			// Set the user context
			await db.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
			return queryFn();
		},

		/**
		 * Get the underlying db instance
		 */
		getDb: () => db,

		/**
		 * Get the user ID
		 */
		getUserId: () => userId,
	};
};

// ========================================
// USER-SCOPED POOL CLIENT (for transactions)
// ========================================

/**
 * Creates a Pool-based Drizzle client with user context for RLS
 * Required for transactions and session-based operations
 *
 * @param userId - Clerk user ID
 * @returns Pool client with RLS context
 */
export const createUserScopedPoolClient = async (userId: string) => {
	const pool = new Pool({
		connectionString: getDatabaseUrl(),
		max: 20,
		min: 5,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
	});

	const db = drizzlePool(pool, { schema });

	// Set user context for the session
	await pool.query(`SET LOCAL app.current_user_id = '${userId}'`);

	return {
		db,
		pool,

		/**
		 * Execute a transaction with user context
		 */
		async transaction<T>(fn: (tx: ReturnType<typeof drizzlePool>) => Promise<T>): Promise<T> {
			return await db.transaction(async (tx) => {
				// Set user context within transaction
				await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
				return fn(tx as unknown as ReturnType<typeof drizzlePool>);
			});
		},

		/**
		 * Close the pool connection
		 */
		async close() {
			await pool.end();
		},
	};
};

// ========================================
// SERVICE ACCOUNT CLIENT (bypasses RLS)
// ========================================

/**
 * Creates a service account client that bypasses RLS
 * Use only for admin operations, background jobs, and migrations
 *
 * @returns Service account client
 */
export const createServiceClient = () => {
	const sqlClient = neon(getDatabaseUrl());
	const db = drizzleNeon(sqlClient, { schema });

	return {
		...db,

		/**
		 * Execute a query with service account context (bypasses RLS)
		 */
		async withServiceContext<T>(queryFn: () => Promise<T>): Promise<T> {
			await db.execute(sql`SELECT set_config('app.is_service_account', 'true', true)`);
			return queryFn();
		},

		getDb: () => db,
	};
};

// ========================================
// MIDDLEWARE HELPER
// ========================================

/**
 * Helper to create user-scoped client from auth context
 * For use in Hono middleware
 *
 * @example
 * ```typescript
 * // In route handler:
 * const auth = c.get('auth');
 * const db = createClientFromAuth(auth);
 * ```
 */
export const createClientFromAuth = (auth: { user: { id: string } }) => {
	return createUserScopedClient(auth.user.id);
};

// ========================================
// TYPE EXPORTS
// ========================================

export type UserScopedClient = ReturnType<typeof createUserScopedClient>;
export type ServiceClient = ReturnType<typeof createServiceClient>;

// Re-export schema
export { schema };

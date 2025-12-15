/**
 * Drizzle Database Client - Universal
 *
 * Factory for creating Drizzle ORM clients that works with both
 * Neon serverless and standard PostgreSQL databases
 */

import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

// Detect if using Neon or standard PostgreSQL
const isNeonDatabase = (): boolean => {
        const url = process.env.DATABASE_URL || '';
        return url.includes('neon.tech') || url.includes('neon-');
};

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
                console.warn('DATABASE_URL_UNPOOLED not set, using DATABASE_URL as fallback');
                return getPooledDatabaseUrl();
        }
        return url;
};

// Singleton pool for standard PostgreSQL
let pgPool: PgPool | null = null;

const getPgPool = (): PgPool => {
        if (!pgPool) {
                pgPool = new PgPool({
                        connectionString: getPooledDatabaseUrl(),
                        max: 10,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 15000,
                });

                pgPool.on('error', (err: Error) => {
                        console.error('[DB] Pool error:', err.message);
                });
        }
        return pgPool;
};

// Create client using standard pg driver
const createPgHttpClient = () => {
        return drizzlePg(getPgPool(), { schema });
};

const createPgPoolClient = () => {
        const pool = new PgPool({ connectionString: getDirectDatabaseUrl() });
        return drizzlePg(pool, { schema });
};

// Cached clients for reuse
let neonHttpClient: ReturnType<typeof createPgHttpClient> | null = null;

export const createHttpClient = () => {
        if (isNeonDatabase()) {
                // Use Neon driver dynamically
                try {
                        const { neon } = require('@neondatabase/serverless');
                        const { drizzle: drizzleNeon } = require('drizzle-orm/neon-http');
                        const sql = neon(getPooledDatabaseUrl());
                        return drizzleNeon(sql, { schema });
                } catch {
                        console.warn('[DB] Neon driver not available, falling back to pg');
                        return createPgHttpClient();
                }
        }
        return createPgHttpClient();
};

export const getHttpClient = () => {
        if (!neonHttpClient) {
                neonHttpClient = createHttpClient();
        }
        return neonHttpClient;
};

export const createPoolClient = () => {
        if (isNeonDatabase()) {
                try {
                        const { Pool: NeonPool } = require('@neondatabase/serverless');
                        const { drizzle: drizzleNeonPool } = require('drizzle-orm/neon-serverless');
                        const pool = new NeonPool({ connectionString: getDirectDatabaseUrl() });
                        return drizzleNeonPool(pool, { schema });
                } catch {
                        console.warn('[DB] Neon driver not available, falling back to pg');
                        return createPgPoolClient();
                }
        }
        return createPgPoolClient();
};

let pool: PgPool | null = null;
let poolClient: ReturnType<typeof createPoolClient> | null = null;

export const getPoolClient = () => {
        if (!poolClient) {
                if (!isNeonDatabase()) {
                        pool = new PgPool({ connectionString: getDirectDatabaseUrl() });
                        poolClient = drizzlePg(pool, { schema });
                } else {
                        poolClient = createPoolClient();
                }
        }
        return poolClient;
};

export const closePool = async () => {
        if (pgPool) {
                await pgPool.end();
                pgPool = null;
        }
        if (pool) {
                await pool.end();
                pool = null;
                poolClient = null;
        }
        neonHttpClient = null;
        neonPoolClient = null;
};

export const getOrganizationClient = (_organizationId: string) => {
        return getPoolClient();
};

// Default database client with lazy initialization
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

// User-scoped client for RLS
let sharedPool: PgPool | null = null;

const getSharedPool = (): PgPool => {
        if (!sharedPool) {
                sharedPool = new PgPool({
                        connectionString: getDirectDatabaseUrl(),
                        connectionTimeoutMillis: 15000,
                        idleTimeoutMillis: 30000,
                        max: 10,
                });

                console.log('[DB] Shared pool created with max 10 connections');

                sharedPool.on('error', (err: Error) => {
                        console.error('[DB] Pool error:', err.message);
                });
        }
        return sharedPool;
};

export const getConnectionStats = () => {
        const activePool = sharedPool || pgPool;
        if (!activePool) {
                return {
                        totalCount: 0,
                        idleCount: 0,
                        waitingCount: 0,
                        isInitialized: false,
                };
        }
        return {
                totalCount: activePool.totalCount,
                idleCount: activePool.idleCount,
                waitingCount: activePool.waitingCount,
                isInitialized: true,
        };
};

const CLERK_USER_ID_PATTERN = /^user_[a-zA-Z0-9_]+$/;

const isValidClerkUserId = (userId: string | null | undefined): userId is string => {
        return typeof userId === 'string' && CLERK_USER_ID_PATTERN.test(userId);
};

export const createUserScopedClient = async (userId: string): Promise<PoolClient> => {
        if (!isValidClerkUserId(userId)) {
                throw new Error(`Invalid user ID format: ${userId}`);
        }

        const maxRetries = 3;
        const retryDelay = 500;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                        const connectionPool = getSharedPool();
                        const userScopedDb = drizzlePg(connectionPool, { schema });

                        await connectionPool.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);

                        return userScopedDb;
                } catch (error) {
                        lastError = error instanceof Error ? error : new Error(String(error));

                        if (
                                attempt === maxRetries ||
                                (error instanceof Error && error.message.includes('Invalid user ID'))
                        ) {
                                throw lastError;
                        }

                        console.warn(`[DB] Connection attempt ${attempt} failed, retrying...`, lastError.message);
                        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
                }
        }

        throw lastError || new Error('Failed to create user-scoped database client');
};

type ServiceAccountTransaction = ReturnType<typeof drizzlePg>;

export async function runAsServiceAccount<T>(
        fn: (tx: ServiceAccountTransaction) => Promise<T>,
): Promise<T> {
        const servicePool = getSharedPool();
        const client = await servicePool.connect();

        try {
                await client.query('BEGIN');
                await client.query("SELECT set_config('app.is_service_account', 'true', false)");

                const tx = drizzlePg(client as unknown as PgPool, { schema });
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

export type HttpClient = ReturnType<typeof createHttpClient>;
export type PoolClient = ReturnType<typeof createPoolClient>;
export type DbClient = HttpClient | PoolClient;

export { schema };

/**
 * Standard PostgreSQL Database Client
 *
 * Alternative client for environments using standard PostgreSQL (like Replit)
 * instead of Neon serverless
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

const getDatabaseUrl = (): string => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	return url;
};

let pool: Pool | null = null;

export const getPool = (): Pool => {
	if (!pool) {
		pool = new Pool({
			connectionString: getDatabaseUrl(),
			max: 10,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 15000,
		});

		pool.on('error', (err: Error) => {
			console.error('[DB] Pool error:', err.message);
		});
	}
	return pool;
};

export const createPgClient = () => {
	return drizzle(getPool(), { schema });
};

let cachedDb: ReturnType<typeof createPgClient> | null = null;

export const db = new Proxy({} as ReturnType<typeof createPgClient>, {
	get(_, prop) {
		if (typeof window !== 'undefined') {
			throw new Error('Database client cannot be used in browser context');
		}
		if (!cachedDb) {
			if (!process.env.DATABASE_URL) {
				throw new Error('DATABASE_URL environment variable is not set');
			}
			cachedDb = createPgClient();
		}
		return (cachedDb as unknown as Record<string | symbol, unknown>)[prop];
	},
});

export const adminDb = db;

export const closePool = async () => {
	if (pool) {
		await pool.end();
		pool = null;
		cachedDb = null;
	}
};

export const getConnectionStats = () => {
	if (!pool) {
		return {
			totalCount: 0,
			idleCount: 0,
			waitingCount: 0,
			isInitialized: false,
		};
	}
	return {
		totalCount: pool.totalCount,
		idleCount: pool.idleCount,
		waitingCount: pool.waitingCount,
		isInitialized: true,
	};
};

const CLERK_USER_ID_PATTERN = /^user_[a-zA-Z0-9_]+$/;

const isValidClerkUserId = (userId: string | null | undefined): userId is string => {
	return typeof userId === 'string' && CLERK_USER_ID_PATTERN.test(userId);
};

export const createUserScopedClient = async (userId: string) => {
	if (!isValidClerkUserId(userId)) {
		throw new Error(`Invalid user ID format: ${userId}`);
	}

	const connectionPool = getPool();
	const userScopedDb = drizzle(connectionPool, { schema });

	await connectionPool.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);

	return userScopedDb;
};

export async function runAsServiceAccount<T>(
	fn: (tx: ReturnType<typeof createPgClient>) => Promise<T>,
): Promise<T> {
	const client = await getPool().connect();

	try {
		await client.query('BEGIN');
		await client.query("SELECT set_config('app.is_service_account', 'true', false)");

		const tx = drizzle(client as unknown as Pool, { schema });
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

export type PgClient = ReturnType<typeof createPgClient>;
export type DbClient = PgClient;

export { schema };

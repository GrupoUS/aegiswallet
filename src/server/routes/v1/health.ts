/**
 * Health Check Endpoint for v1 API
 * Used to test Hono RPC patterns and monitor service status
 * Includes comprehensive database connectivity validation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

const healthRouter = new Hono<AppEnv>();

// Cache health status to avoid overwhelming database
let cachedDbHealth: {
	status: 'connected' | 'disconnected' | 'error';
	latency: number;
	timestamp: number;
} | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds

// Health check response schema (exported for type inference)
export const healthResponseSchema = z.object({
	services: z.object({
		database: z.enum(['connected', 'disconnected', 'error']),
		api: z.enum(['operational', 'degraded', 'down']),
		auth: z.enum(['operational', 'degraded', 'down']),
	}),
	status: z.enum(['ok', 'error']),
	timestamp: z.string(),
	uptime: z.number(),
	version: z.string(),
});

/**
 * Check database connectivity with caching
 * Primary test is SELECT 1, schema check is secondary and logged as warning if it fails
 */
async function checkDatabaseConnectivity(): Promise<{
	status: 'connected' | 'disconnected' | 'error';
	latency: number;
	schemaAccessible?: boolean;
}> {
	// Return cached result if valid
	if (cachedDbHealth && Date.now() - cachedDbHealth.timestamp < CACHE_TTL_MS) {
		return { status: cachedDbHealth.status, latency: cachedDbHealth.latency };
	}

	const dbStartTime = Date.now();

	try {
		// Import database client
		const { getHttpClient, schema } = await import('@/db/client');
		const { sql } = await import('drizzle-orm');

		// Test actual database connectivity
		const db = getHttpClient();

		// Create a timeout promise (5 seconds)
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Database query timeout')), 5000);
		});

		// Execute a simple query with timeout - THIS is the primary connectivity test
		await Promise.race([db.execute(sql`SELECT 1 as health_check`), timeoutPromise]);

		const latency = Date.now() - dbStartTime;

		// Test schema access (optional, for deeper validation)
		// Failure here should NOT affect overall connectivity status
		let schemaAccessible = true;
		try {
			await db.select({ count: sql<number>`count(*)` }).from(schema.users).limit(1);
		} catch (schemaError) {
			// Schema access failed, but basic connectivity works
			// This can happen on fresh databases before migrations run
			schemaAccessible = false;
			secureLogger.warn('Database schema access check failed (non-critical)', {
				error: schemaError instanceof Error ? schemaError.message : 'Unknown error',
				note: 'Basic connectivity succeeded, schema may not be migrated yet',
			});
		}

		// Cache successful result - connectivity is the key metric
		cachedDbHealth = { status: 'connected', latency, timestamp: Date.now() };

		return { status: 'connected', latency, schemaAccessible };
	} catch (error) {
		const latency = Date.now() - dbStartTime;
		secureLogger.error('Database health check failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			latency,
		});

		// Cache failure briefly
		cachedDbHealth = { status: 'error', latency, timestamp: Date.now() };

		return { status: 'error', latency, schemaAccessible: false };
	}
}

// Health check handler function
// biome-ignore lint/suspicious/noExplicitAny: Hono context type complexity
async function healthCheckHandler(c: Context<any, any, any>) {
	const startTime = Date.now();

	try {
		// Check database connection with caching
		const dbHealth = await checkDatabaseConnectivity();
		const databaseStatus = dbHealth.status;
		const databaseLatency = dbHealth.latency;

		// Determine overall status
		const isHealthy = databaseStatus === 'connected';

		const response = {
			services: {
				database: databaseStatus,
				api: isHealthy ? 'operational' : 'degraded',
				auth: isHealthy ? 'operational' : 'degraded',
			},
			status: isHealthy ? 'ok' : 'error',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: '1.0.0',
			metrics: {
				databaseLatency: databaseLatency,
				totalLatency: Date.now() - startTime,
			},
			checks: {
				server: { status: 'ok', uptime: process.uptime() },
				database: {
					status: databaseStatus,
					latency: databaseLatency,
				},
				memory: {
					used: process.memoryUsage().heapUsed,
					total: process.memoryUsage().heapTotal,
				},
			},
		};

		// Log health check
		secureLogger.info('Health check completed', {
			databaseStatus,
			duration: Date.now() - startTime,
			status: response.status,
		});

		// Return 503 if database is down
		if (!isHealthy) {
			return c.json(response, 503);
		}

		return c.json(response, 200);
	} catch (error) {
		secureLogger.error('Health check error', {
			duration: Date.now() - startTime,
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		return c.json(
			{
				services: {
					database: 'error',
					api: 'down',
					auth: 'down',
				},
				status: 'error',
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				version: '1.0.0',
			},
			500,
		);
	}
}

// Detailed health check at root and /health paths
healthRouter.get('/', healthCheckHandler);
healthRouter.get('/health', healthCheckHandler);

// Simple ping endpoint
healthRouter.get('/ping', (c) => {
	return c.json({
		message: 'pong',
		timestamp: new Date().toISOString(),
		version: 'v1',
	});
});

// Connection pool monitoring endpoint
healthRouter.get('/connections', async (c) => {
	try {
		const { getConnectionStats } = await import('@/db/client');
		const stats = getConnectionStats();

		return c.json({
			pool: stats,
			status: stats.isInitialized ? 'active' : 'not_initialized',
			timestamp: new Date().toISOString(),
			limits: {
				maxConnections: 10,
				warningThreshold: 8,
			},
			health: {
				isHealthy: stats.totalCount < 8,
				warning: stats.totalCount >= 8 ? 'High connection usage detected' : null,
			},
		});
	} catch (error) {
		secureLogger.error('Connection stats error', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		return c.json(
			{
				error: 'Failed to retrieve connection stats',
				status: 'error',
				timestamp: new Date().toISOString(),
			},
			500,
		);
	}
});

// Authenticated health check (tests auth middleware)
healthRouter.get(
	'/auth',
	// We'll add auth middleware when we set up the main router
	async (c) => {
		const auth = c.get('auth');

		return c.json({
			authenticated: !!auth,
			services: {
				database: 'connected',
				api: 'operational',
				auth: 'operational',
			},
			status: 'ok',
			timestamp: new Date().toISOString(),
			user: auth
				? {
						id: auth.user.id,
						email: auth.user.email,
					}
				: null,
			version: '1.0.0',
		});
	},
);

export default healthRouter;

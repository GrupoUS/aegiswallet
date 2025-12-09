/**
 * Health Check Route
 * Standardized health endpoint with detailed status information
 * Includes database connectivity validation
 */

import type { Hono } from 'hono';

import { secureLogger } from '@/lib/logging/secure-logger';
import { environment } from '@/server/config/environment';

// Cache health status to avoid overwhelming database
let cachedHealth: {
	database: { status: string; latency: number; error?: string };
	timestamp: number;
} | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds

/**
 * Check database connectivity with timeout
 */
async function checkDatabaseHealth(): Promise<{
	status: 'connected' | 'disconnected';
	latency: number;
	error?: string;
}> {
	// Return cached result if valid
	if (cachedHealth && Date.now() - cachedHealth.timestamp < CACHE_TTL_MS) {
		return cachedHealth.database as {
			status: 'connected' | 'disconnected';
			latency: number;
			error?: string;
		};
	}

	const startTime = Date.now();
	const timeout = 5000; // 5 second timeout

	try {
		// Dynamic import to avoid issues during module initialization
		const { getHttpClient } = await import('@/db/client');
		const { sql } = await import('drizzle-orm');

		const db = getHttpClient();

		// Create a timeout promise
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('Database query timeout')), timeout);
		});

		// Race between query and timeout
		await Promise.race([db.execute(sql`SELECT 1 as health_check`), timeoutPromise]);

		const latency = Date.now() - startTime;
		const result = { status: 'connected' as const, latency };

		// Cache the result
		cachedHealth = { database: result, timestamp: Date.now() };

		return result;
	} catch (error) {
		const latency = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

		// Log error securely (no connection string details)
		secureLogger.error('Database health check failed', {
			latency,
			error: errorMessage,
		});

		const result = {
			status: 'disconnected' as const,
			latency,
			error: errorMessage,
		};

		// Cache the failure briefly (5 seconds)
		cachedHealth = { database: result, timestamp: Date.now() };

		return result;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: Hono app type requires generic env type which is complex to type properly
export function setupHealthRoute(app: Hono<any>) {
	/**
	 * Simple liveness probe - always returns 200
	 * Use this for load balancers, uptime monitors, and infrastructure health checks
	 * that only need to know if the server process is running
	 */
	app.get('/api/ping', (c) => {
		return c.json(
			{
				status: 'ok',
				timestamp: new Date().toISOString(),
			},
			200,
		);
	});

	/**
	 * Full health check - returns 503 if database is unavailable
	 * Use this for deep health monitoring that needs to verify all dependencies
	 * Note: Returns 503 when database is down (not 200)
	 */
	app.get('/api/health', async (c) => {
		const startTime = Date.now();

		try {
			// Check database connectivity
			const databaseHealth = await checkDatabaseHealth();

			// Determine overall status
			const isHealthy = databaseHealth.status === 'connected';
			const status = isHealthy ? 'ok' : 'degraded';

			const response = {
				status,
				timestamp: new Date().toISOString(),
				service: 'aegiswallet-server',
				environment: environment.NODE_ENV,
				uptime: process.uptime?.() || 0,
				memory: process.memoryUsage?.() || {},
				database: {
					status: databaseHealth.status,
					latency: databaseHealth.latency,
					...(databaseHealth.error && { error: databaseHealth.error }),
				},
				responseTime: Date.now() - startTime,
			};

			// Return 503 if database is down
			if (!isHealthy) {
				return c.json(response, 503);
			}

			return c.json(response, 200);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			secureLogger.error('Health check error', { error: errorMessage });

			return c.json(
				{
					status: 'error',
					timestamp: new Date().toISOString(),
					service: 'aegiswallet-server',
					environment: environment.NODE_ENV,
					uptime: process.uptime?.() || 0,
					memory: process.memoryUsage?.() || {},
					database: {
						status: 'disconnected',
						latency: 0,
						error: 'Health check failed',
					},
					responseTime: Date.now() - startTime,
				},
				500,
			);
		}
	});
}

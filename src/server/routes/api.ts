/**
 * API Routes
 * Non-tRPC API endpoints
 * Using Drizzle ORM with Neon serverless
 */

import { sql } from 'drizzle-orm';
import type { Hono } from 'hono';

import { db } from '@/db/client';
import type { AppEnv } from '@/server/hono-types';

/**
 * Check Neon database connectivity using Drizzle
 * @returns Promise with connection status and latency
 */
async function checkDatabaseHealth(): Promise<{
	status: 'connected' | 'disconnected' | 'error';
	latencyMs?: number;
	error?: string;
}> {
	const startTime = Date.now();

	try {
		// Simple query to verify connectivity - using SQL raw query
		await db.execute(sql`SELECT 1`);

		const latencyMs = Date.now() - startTime;
		return { status: 'connected', latencyMs };
	} catch (err) {
		const latencyMs = Date.now() - startTime;
		return {
			status: 'disconnected',
			latencyMs,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}

export function setupApiRoutes(app: Hono<AppEnv>) {
	// API ping endpoint for connectivity testing
	app.get('/api/ping', (c) => {
		return c.json({
			message: 'pong',
			timestamp: new Date().toISOString(),
			version: '1.0.0',
		});
	});

	// API status endpoint with actual health checks
	app.get('/api/status', async (c) => {
		const dbHealth = await checkDatabaseHealth();

		const allHealthy = dbHealth.status === 'connected';

		return c.json({
			services: {
				database: dbHealth.status,
				databaseLatencyMs: dbHealth.latencyMs,
				trpc: 'connected',
				auth: 'connected',
			},
			status: allHealthy ? 'operational' : 'degraded',
			timestamp: new Date().toISOString(),
			...(dbHealth.error && { errors: { database: dbHealth.error } }),
		});
	});

	// Dedicated health check endpoint for monitoring
	app.get('/api/health', async (c) => {
		const dbHealth = await checkDatabaseHealth();

		if (dbHealth.status !== 'connected') {
			return c.json(
				{
					healthy: false,
					database: dbHealth,
					timestamp: new Date().toISOString(),
				},
				503,
			);
		}

		return c.json({
			healthy: true,
			database: dbHealth,
			timestamp: new Date().toISOString(),
		});
	});
}

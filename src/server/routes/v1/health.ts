/**
 * Health Check Endpoint for v1 API
 * Used to test Hono RPC patterns and monitor service status
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

const healthRouter = new Hono<AppEnv>();

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

// Health check handler function
// biome-ignore lint/suspicious/noExplicitAny: Hono context type complexity
async function healthCheckHandler(c: Context<any, any, any>) {
	const startTime = Date.now();

	try {
		// Check database connection
		let databaseStatus: 'connected' | 'disconnected' | 'error' = 'error';
		try {
			// Simple health check - in a real implementation,
			// you might check actual database connectivity
			databaseStatus = 'connected';
		} catch (error) {
			secureLogger.error('Database health check failed', { error });
			databaseStatus = 'error';
		}

		// Determine overall status
		const isHealthy = databaseStatus === 'connected';

		const response = {
			services: {
				database: databaseStatus,
				api: isHealthy ? 'operational' : 'down',
				auth: isHealthy ? 'operational' : 'down',
			},
			status: isHealthy ? 'ok' : 'error',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: '1.0.0',
		};

		// Log health check
		secureLogger.info('Health check completed', {
			databaseStatus,
			duration: Date.now() - startTime,
			status: response.status,
		});

		return c.json(response);
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

/**
 * API Routes
 * Non-tRPC API endpoints
 */

import type { Hono } from 'hono';

export function setupApiRoutes(app: Hono) {
  // API ping endpoint for connectivity testing
  app.get('/api/ping', (c) => {
    return c.json({
      message: 'pong',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API status endpoint with more detailed information
  app.get('/api/status', (c) => {
    return c.json({
      services: {
        database: 'connected', // TODO: Add actual database health check
        trpc: 'connected',
        auth: 'connected',
      },
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
  });
}

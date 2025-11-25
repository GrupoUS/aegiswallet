/**
 * Health Check Route
 * Standardized health endpoint with detailed status information
 */

import type { Hono } from 'hono';
import { environment } from '@/server/config/environment';

interface AppEnv {
  Variables: {
    requestId: string;
  };
}

export function setupHealthRoute(app: Hono<AppEnv>) {
  app.get('/api/health', (c) => {
    return c.json({
      environment: environment.NODE_ENV,
      memory: process.memoryUsage?.() || {},
      service: 'aegiswallet-server',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime?.() || 0,
    });
  });
}

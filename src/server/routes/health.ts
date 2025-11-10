/**
 * Health Check Route
 * Standardized health endpoint with detailed status information
 */

import type { Hono } from 'hono';
import { environment } from '@/server/config/environment';

export function setupHealthRoute(app: Hono) {
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: environment.NODE_ENV,
      uptime: process.uptime?.() || 0,
      memory: process.memoryUsage?.() || {},
      service: 'aegiswallet-server',
    });
  });
}

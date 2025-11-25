/**
 * CORS Middleware
 * Centralized CORS configuration
 */

import type { Context, Next } from 'hono';

/**
 * Standardized CORS middleware
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  // Basic CORS implementation
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  await next();
};

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureLogger } from '@/lib/logging/secure-logger';
import { authMiddleware } from '@/server/middleware/auth';
import { corsMiddleware } from '@/server/middleware/cors';
import { setupApiRoutes } from '@/server/routes/api';
import { setupHealthRoute } from '@/server/routes/health';
import { setupStaticRoutes } from '@/server/routes/static';
import {
  bankingRouter,
  contactsRouter,
  healthRouter,
  pixRouter,
  voiceRouter,
} from '@/server/routes/v1';

/**
 * Create and configure Hono application with edge-first architecture
 * Now using Hono RPC endpoints exclusively
 */
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);

// Request ID middleware for tracing
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  await next();
});

// Setup legacy route handlers
setupHealthRoute(app);
setupApiRoutes(app);

// Hono RPC v1 routes
app.route('/api/v1', healthRouter);
app.route('/api/v1/voice', voiceRouter);
app.route('/api/v1/banking', bankingRouter);
app.route('/api/v1/pix', pixRouter);
app.route('/api/v1/contacts', contactsRouter);

// Apply auth middleware to authenticated v1 routes
// Note: Individual routes will apply auth as needed
// app.use('/api/v1/protected/*', authMiddleware);

// Setup static file serving (development/production aware)
setupStaticRoutes(app);

// 404 handler
app.notFound((c) => {
  const requestId = c.get('requestId');

  secureLogger.warn('Route not found', {
    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'), method: c.req.method, path: c.req.path, requestId, userAgent: c.req.header('User-Agent'),
  });

  return c.json(
    {
      error: 'Not Found', message: `Route ${c.req.method} ${c.req.path} not found`, requestId, timestamp: new Date().toISOString(),
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  const requestId = c.get('requestId');

  secureLogger.error('Unhandled error', {
    error: err.message, method: c.req.method, path: c.req.path, requestId, stack: err.stack,
  });

  return c.json(
    {
      error: 'Internal server error', requestId, timestamp: new Date().toISOString(),
    },
    500
  );
});

export default app;

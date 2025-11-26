import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { corsMiddleware } from '@/server/middleware/cors';

import { setupApiRoutes } from '@/server/routes/api';
import { setupHealthRoute } from '@/server/routes/health';
import { setupStaticRoutes } from '@/server/routes/static';
import {
  bankAccountsRouter,
  bankingRouter,
  calendarRouter,
  complianceRouter,
  contactsRouter,
  googleCalendarRouter,
  healthRouter,
  // pixRouter removed - PIX functionality discontinued
  transactionsRouter,
  usersRouter,
  voiceRouter,
} from '@/server/routes/v1';

/**
 * Create and configure Hono application with edge-first architecture
 * Now using Hono RPC endpoints exclusively
 */
const app = new Hono<AppEnv>();

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
// app.route('/api/v1/pix', pixRouter); - PIX functionality removed
app.route('/api/v1/contacts', contactsRouter);
app.route('/api/v1/bank-accounts', bankAccountsRouter);
app.route('/api/v1/users', usersRouter);
app.route('/api/v1/transactions', transactionsRouter);
app.route('/api/v1/calendar', calendarRouter);
app.route('/api/v1/google-calendar', googleCalendarRouter);
app.route('/api/v1/compliance', complianceRouter);

// Apply auth middleware to authenticated v1 routes
// Note: Individual routes will apply auth as needed
// app.use('/api/v1/protected/*', authMiddleware);

// Setup static file serving (development/production aware)
setupStaticRoutes(app);

// 404 handler
app.notFound((c) => {
  const requestId = c.get('requestId');

  secureLogger.warn('Route not found', {
    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown',
    method: c.req.method,
    path: c.req.path,
    requestId,
    userAgent: c.req.header('User-Agent') || 'unknown',
  });

  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      requestId,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  const requestId = c.get('requestId');

  secureLogger.error('Unhandled error', {
    error: err.message,
    method: c.req.method,
    path: c.req.path,
    requestId,
    stack: err.stack,
  });

  return c.json(
    {
      error: 'Internal server error',
      requestId,
      timestamp: new Date().toISOString(),
    },
    500
  );
});

export default app;

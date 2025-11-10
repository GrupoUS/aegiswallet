import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { createContext } from '@/server/context';
import { corsMiddleware } from '@/server/middleware/cors';
import { setupApiRoutes } from '@/server/routes/api';
import { setupHealthRoute } from '@/server/routes/health';
import { setupStaticRoutes } from '@/server/routes/static';
import { appRouter } from '@/server/trpc';

/**
 * Create and configure Hono application with edge-first architecture
 */
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);

// Setup route handlers
setupHealthRoute(app);
setupApiRoutes(app);

// tRPC endpoint
app.use('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: createContext,
  });
});

// Setup static file serving (development/production aware)
setupStaticRoutes(app);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

export default app;

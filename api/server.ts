// Temporary minimal endpoint to test Vercel serverless function infrastructure
// This bypasses the full Hono app bundle to isolate the timeout issue

import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

// Minimal test endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'minimal'
  });
});

// Catch-all for diagnostics
app.all('*', (c) => {
  return c.json({
    error: 'Route not found in minimal mode',
    path: c.req.path,
    method: c.req.method,
    note: 'Full API temporarily disabled for debugging'
  }, 404);
});

export const config = {
  runtime: 'nodejs' as const,
};

export default handle(app);

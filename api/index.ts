// AegisWallet API - Vercel Edge Runtime
// Minimal Hono-based API for Edge deployment

import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'edge',
    version: '1.0.0',
  });
});

// API root
app.get('/', (c) => {
  return c.json({
    name: 'AegisWallet API',
    version: '1.0.0',
    runtime: 'edge',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// Echo endpoint for debugging
app.post('/echo', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      received: body,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
});

// Catch-all for unimplemented routes
app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    availableRoutes: [
      'GET /api',
      'GET /api/health',
      'POST /api/echo',
    ],
  }, 404);
});

export default handle(app);

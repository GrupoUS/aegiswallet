import { handle } from 'hono/vercel';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Simplified Vercel serverless entry point
// Uses inline Hono app instead of path aliases for compatibility

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://aegiswallet.vercel.app', 'http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
}));

// Health check endpoint
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api', (c) => {
  return c.json({
    name: 'AegisWallet API',
    version: '1.0.0',
    endpoints: ['/api/v1/health'],
    documentation: 'https://github.com/GrupoUS/aegiswallet',
  });
});

// Root health for Vercel
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Catch-all for API routes
app.all('/api/*', (c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString(),
  }, 404);
});

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default handle(app);

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { notFound } from 'hono/not-found'
import { createContext } from './context'
import { appRouter } from './trpc'

const app = new Hono()

// Determine CORS origins based on environment
const getCorsOrigins = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  return isDevelopment 
    ? ['http://localhost:5173', 'http://localhost:3000']
    : ['https://your-domain.com', 'http://localhost:3000'] // Update with your production domain
}

// Middleware
app.use('*', logger())

// CORS configuration
app.use(
  '*',
  cors({
    origin: getCorsOrigins(),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// tRPC endpoint
app.use('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: createContext,
  })
})

// API routes placeholder
app.get('/api/ping', (c) => {
  return c.json({ message: 'pong', timestamp: new Date().toISOString() })
})

// Serve static files from dist (for production)
// In development, Vite dev server handles static files
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }))
  
  // Fallback for SPA routing - serve index.html for non-API routes
  app.use('/*', serveStatic({ 
    path: './dist/index.html',
    rewriteRequestPath: (path) => path
  }))
} else {
  // Development mode message
  app.use('/*', (c) => {
    return c.json({ 
      message: 'Development mode - Frontend served by Vite dev server on port 5173',
      frontend: 'http://localhost:5173',
      api: 'http://localhost:3000'
    })
  })
}

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    timestamp: new Date().toISOString()
  }, 404)
})

export default app

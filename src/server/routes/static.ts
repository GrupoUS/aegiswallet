/**
 * Static File Routes
 * Handles static file serving with appropriate caching
 */

import type { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { environment } from '@/server/config/environment';
import { htmlCache, staticAssetsCache } from '@/server/middleware/cache';

export function setupStaticRoutes(app: Hono) {
  if (environment.IS_PRODUCTION) {
    // Serve static assets with aggressive caching
    app.use('/assets/*', staticAssetsCache(), serveStatic({ root: './dist' }));

    // Serve HTML files with no-cache
    app.use('/*.html', htmlCache(), serveStatic({ root: './dist' }));

    // Fallback for SPA routing - serve index.html for non-API routes
    app.use(
      '/*',
      htmlCache(),
      serveStatic({
        path: './dist/index.html',
        rewriteRequestPath: (path) => path,
      })
    );
  } else {
    // Development mode - inform about frontend dev server
    app.get('/*', (c) => {
      return c.json({
        api: `http://localhost:${environment.PORT}`,
        frontend: 'http://localhost:5173',
        message: 'Development mode - Frontend served by Vite dev server',
        mode: 'development',
      });
    });
  }
}

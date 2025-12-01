/**
 * Static File Routes
 * Handles static file serving with appropriate caching
 * NOTE: On Vercel, static files are served by the CDN, not the function
 */

import type { Hono } from 'hono';

import { environment } from '@/server/config/environment';
import type { AppEnv } from '@/server/hono-types';

// Check if running on Vercel (VERCEL env var is set by Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

export function setupStaticRoutes(app: Hono<AppEnv>) {
	// On Vercel, static files are served by the CDN via vercel.json rewrites
	// We only need to handle the development/Bun server case
	if (isVercel) {
		// Vercel handles static files via CDN, nothing to do here
		// The vercel.json rewrites handle routing non-API requests to index.html
		return;
	}

	if (environment.IS_PRODUCTION) {
		// For non-Vercel production (e.g., running with bun start)
		// Dynamic import to avoid bundling bun-specific code for Vercel
		import('hono/bun').then(({ serveStatic }) => {
			import('@/server/middleware/cache').then(({ htmlCache, staticAssetsCache }) => {
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
					}),
				);
			});
		});
	} else {
		// Development mode - inform about frontend dev server
		// Only for non-API routes
		app.get('/*', (c) => {
			// Skip API routes - they should 404 naturally
			if (c.req.path.startsWith('/api/')) {
				return c.notFound();
			}
			return c.json({
				api: `http://localhost:${environment.PORT}`,
				frontend: 'http://localhost:5173',
				message: 'Development mode - Frontend served by Vite dev server',
				mode: 'development',
			});
		});
	}
}

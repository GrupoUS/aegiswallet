/**
 * Import API Router - Main entry point for import functionality
 *
 * Mounts sub-routers for upload, status, and confirm operations
 */

import { Hono } from 'hono';

import { confirmRouter } from './confirm';
import { statusRouter } from './status';
import { uploadRouter } from './upload';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

// Create main import router
const importRouter = new Hono<AppEnv>();

// Apply authentication middleware to all routes
importRouter.use('*', authMiddleware);

// Apply rate limiting (10 requests per minute for general import operations)
importRouter.use(
	'*',
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30, // More permissive for status polling
		message: 'Muitas requisições de importação. Tente novamente em alguns minutos.',
	}),
);

// Mount sub-routers
importRouter.route('/upload', uploadRouter);
importRouter.route('/status', statusRouter);
importRouter.route('/confirm', confirmRouter);

// Health check endpoint for import service
importRouter.get('/health', (c) => {
	return c.json({
		status: 'ok',
		service: 'import',
		timestamp: new Date().toISOString(),
	});
});

export default importRouter;
export { importRouter };

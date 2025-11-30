/**
 * Google Calendar Sync API - Stub Implementation
 *
 * NOTE: Google Calendar sync functionality uses NeonDB for persistence
 * and requires migration to a different architecture (e.g., Hono workers, Vercel functions).
 *
 * Current status: Stub returning "not implemented" until architecture is rebuilt.
 */

import { Hono } from 'hono';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import {
	authMiddleware,
	userRateLimitMiddleware,
} from '@/server/middleware/auth';

const googleCalendarRouter = new Hono<AppEnv>();

const NOT_IMPLEMENTED_RESPONSE = {
	code: 'NOT_IMPLEMENTED',
	error:
		'Google Calendar sync is temporarily unavailable during migration. Please check back later.',
	message:
		'Esta funcionalidade está temporariamente indisponível durante a migração do sistema.',
};

// Middleware for all routes
const rateLimitMiddleware = userRateLimitMiddleware({
	max: 30,
	message: 'Muitas requisições, tente novamente mais tarde',
	windowMs: 60 * 1000,
});

/**
 * Get sync connection status
 * GET /v1/google-calendar/sync/status
 */
googleCalendarRouter.get(
	'/sync/status',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');

		secureLogger.info('Google Calendar status requested (not implemented)', {
			requestId,
			userId: user.id,
		});

		return c.json(
			{
				data: {
					googleEmail: null,
					isConnected: false,
					isEnabled: false,
					lastSyncAt: null,
					migrationNotice:
						'Google Calendar sync is being migrated to new infrastructure',
				},
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			},
			200,
		);
	},
);

/**
 * Get sync settings
 * GET /v1/google-calendar/sync/settings
 */
googleCalendarRouter.get(
	'/sync/settings',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json(
			{
				data: null,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
					notice: 'Google Calendar sync is being migrated',
				},
			},
			200,
		);
	},
);

/**
 * Get sync audit history
 * GET /v1/google-calendar/sync/history
 */
googleCalendarRouter.get(
	'/sync/history',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json(
			{
				data: [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
					notice: 'Google Calendar sync is being migrated',
				},
			},
			200,
		);
	},
);

/**
 * Update sync settings
 * PUT /v1/google-calendar/sync/settings
 */
googleCalendarRouter.put(
	'/sync/settings',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json({ ...NOT_IMPLEMENTED_RESPONSE, meta: { requestId } }, 501);
	},
);

/**
 * Request full sync
 * POST /v1/google-calendar/sync/full
 */
googleCalendarRouter.post(
	'/sync/full',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json({ ...NOT_IMPLEMENTED_RESPONSE, meta: { requestId } }, 501);
	},
);

/**
 * Request incremental sync
 * POST /v1/google-calendar/sync/incremental
 */
googleCalendarRouter.post(
	'/sync/incremental',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json({ ...NOT_IMPLEMENTED_RESPONSE, meta: { requestId } }, 501);
	},
);

/**
 * Sync a single event
 * POST /v1/google-calendar/sync/event
 */
googleCalendarRouter.post(
	'/sync/event',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json({ ...NOT_IMPLEMENTED_RESPONSE, meta: { requestId } }, 501);
	},
);

/**
 * Renew webhook channel
 * POST /v1/google-calendar/sync/channel/renew
 */
googleCalendarRouter.post(
	'/sync/channel/renew',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json({ ...NOT_IMPLEMENTED_RESPONSE, meta: { requestId } }, 501);
	},
);

/**
 * Get sync conflicts
 * GET /v1/google-calendar/sync/conflicts
 */
googleCalendarRouter.get(
	'/sync/conflicts',
	authMiddleware,
	rateLimitMiddleware,
	async (c) => {
		const requestId = c.get('requestId');

		return c.json(
			{
				data: [],
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
					notice: 'Google Calendar sync is being migrated',
				},
			},
			200,
		);
	},
);

export default googleCalendarRouter;

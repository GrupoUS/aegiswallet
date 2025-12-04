/**
 * Google Calendar Sync API - Complete Implementation
 *
 * Full API routes for Google Calendar bidirectional synchronization
 * with OAuth 2.0, webhooks, and conflict resolution.
 *
 * @file src/server/routes/v1/google-calendar.ts
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import {
	disconnectGoogleCalendar,
	exchangeCodeForTokens,
	getAuthUrl,
	getConnectionStatus,
	getSyncSettings,
	processWebhook,
	renewExpiringChannels,
	saveTokens,
	setupPushNotifications,
	stopPushNotifications,
	syncEventToGoogle,
	syncFromGoogle,
	updateSyncSettings,
} from '@/lib/services/google-calendar-service';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

const googleCalendarRouter = new Hono<AppEnv>();

// ========================================
// MIDDLEWARE
// ========================================

const rateLimitMiddleware = userRateLimitMiddleware({
	max: 30,
	message: 'Muitas requisições, tente novamente mais tarde',
	windowMs: 60 * 1000,
});

// Webhook has its own rate limit (more permissive)
const webhookRateLimitMiddleware = userRateLimitMiddleware({
	max: 100,
	message: 'Too many webhook requests',
	windowMs: 60 * 1000,
});

// ========================================
// VALIDATION SCHEMAS
// ========================================

const syncSettingsSchema = z.object({
	syncEnabled: z.boolean().optional(),
	syncDirection: z.enum(['one_way_to_google', 'one_way_from_google', 'bidirectional']).optional(),
	syncFinancialAmounts: z.boolean().optional(),
	syncCategories: z.array(z.string()).nullable().optional(),
	autoSyncIntervalMinutes: z.number().min(5).max(1440).optional(),
	defaultCalendarId: z.string().optional(),
	lgpdConsentGiven: z.boolean().optional(),
});

const syncEventSchema = z.object({
	eventId: z.string().uuid(),
});

// ========================================
// OAUTH 2.0 ROUTES
// ========================================

/**
 * Initiate OAuth 2.0 flow
 * GET /v1/google-calendar/connect
 */
googleCalendarRouter.get('/connect', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		// Generate state parameter for CSRF protection
		const state = Buffer.from(
			JSON.stringify({
				userId: user.id,
				requestId,
				timestamp: Date.now(),
			}),
		).toString('base64url');

		const authUrl = getAuthUrl(state);

		secureLogger.info('Google Calendar OAuth initiated', {
			requestId,
			userId: user.id,
		});

		return c.json({
			data: { authUrl },
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Failed to initiate OAuth', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to initiate Google Calendar connection',
				message: 'Não foi possível iniciar a conexão com o Google Calendar',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * OAuth 2.0 callback
 * GET /v1/google-calendar/callback
 */
googleCalendarRouter.get('/callback', async (c) => {
	const requestId = c.get('requestId');
	const code = c.req.query('code');
	const state = c.req.query('state');
	const oauthError = c.req.query('error');

	// Handle OAuth errors
	if (oauthError) {
		secureLogger.warn('OAuth error from Google', { requestId, error: oauthError });
		return c.redirect('/calendario?error=oauth_denied');
	}

	if (!code) {
		return c.redirect('/calendario?error=invalid_callback');
	}

	if (!state) {
		return c.redirect('/calendario?error=invalid_callback');
	}

	try {
		// Decode and validate state
		const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
		const { userId, timestamp } = stateData;

		// Check state is not too old (15 minutes max)
		if (Date.now() - timestamp > 15 * 60 * 1000) {
			return c.redirect('/calendario?error=state_expired');
		}

		// Exchange code for tokens
		const tokens = await exchangeCodeForTokens(code);

		// Get Google user info
		const { google } = await import('googleapis');
		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({ access_token: tokens.accessToken });

		const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
		const userInfo = await oauth2.userinfo.get();

		// Save tokens
		await saveTokens(
			userId,
			tokens,
			userInfo.data.email || undefined,
			userInfo.data.id || undefined,
		);

		// Initialize sync settings if not exists
		await updateSyncSettings(userId, {
			syncEnabled: false, // User must explicitly enable
			syncDirection: 'bidirectional',
			syncFinancialAmounts: false,
		});

		secureLogger.info('Google Calendar OAuth completed', {
			requestId,
			userId,
			googleEmail: userInfo.data.email,
		});

		return c.redirect('/calendario?success=google_connected');
	} catch (error) {
		secureLogger.error('OAuth callback failed', {
			requestId,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.redirect('/calendario?error=oauth_failed');
	}
});

/**
 * Disconnect Google Calendar
 * POST /v1/google-calendar/disconnect
 */
googleCalendarRouter.post('/disconnect', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		await disconnectGoogleCalendar(user.id);

		secureLogger.info('Google Calendar disconnected', {
			requestId,
			userId: user.id,
		});

		return c.json({
			data: { disconnected: true },
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Failed to disconnect', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to disconnect Google Calendar',
				message: 'Não foi possível desconectar o Google Calendar',
				meta: { requestId },
			},
			500,
		);
	}
});

// ========================================
// SYNC STATUS & SETTINGS
// ========================================

/**
 * Get sync connection status
 * GET /v1/google-calendar/sync/status
 */
googleCalendarRouter.get('/sync/status', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		const status = await getConnectionStatus(user.id);

		return c.json({
			data: status,
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		secureLogger.error('Failed to get sync status', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to get sync status',
				message: 'Não foi possível obter o status da sincronização',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Get sync settings
 * GET /v1/google-calendar/sync/settings
 */
googleCalendarRouter.get('/sync/settings', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		const settings = await getSyncSettings(user.id);

		return c.json({
			data: settings,
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		secureLogger.error('Failed to get sync settings', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to get sync settings',
				message: 'Não foi possível obter as configurações de sincronização',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Update sync settings
 * PUT /v1/google-calendar/sync/settings
 */
googleCalendarRouter.put(
	'/sync/settings',
	authMiddleware,
	rateLimitMiddleware,
	zValidator('json', syncSettingsSchema),
	async (c) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');
		const body = c.req.valid('json');

		try {
			// Check if user is connected
			const status = await getConnectionStatus(user.id);
			if (!status.isConnected) {
				return c.json(
					{
						error: 'Not connected to Google Calendar',
						message: 'Você precisa conectar ao Google Calendar primeiro',
						meta: { requestId },
					},
					400,
				);
			}

			// If enabling sync, require LGPD consent
			if (body.syncEnabled && !body.lgpdConsentGiven) {
				const currentSettings = await getSyncSettings(user.id);
				if (!currentSettings?.lgpdConsentGiven) {
					return c.json(
						{
							error: 'LGPD consent required',
							message:
								'Para habilitar a sincronização, você precisa aceitar os termos de compartilhamento de dados',
							meta: { requestId },
						},
						400,
					);
				}
			}

			// Update LGPD consent timestamp if given
			const updateData: Partial<typeof body> & {
				lgpdConsentTimestamp?: Date;
				lgpdConsentVersion?: string;
			} = { ...body };
			if (body.lgpdConsentGiven) {
				updateData.lgpdConsentTimestamp = new Date();
				updateData.lgpdConsentVersion = '1.0';
			}

			const settings = await updateSyncSettings(user.id, updateData);

			// Setup/stop push notifications based on sync enabled
			if (body.syncEnabled !== undefined) {
				if (body.syncEnabled) {
					await setupPushNotifications(user.id);
				} else {
					await stopPushNotifications(user.id);
				}
			}

			secureLogger.info('Sync settings updated', {
				requestId,
				userId: user.id,
				syncEnabled: settings.syncEnabled,
			});

			return c.json({
				data: settings,
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to update sync settings', {
				requestId,
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown',
			});

			return c.json(
				{
					error: 'Failed to update sync settings',
					message: 'Não foi possível atualizar as configurações de sincronização',
					meta: { requestId },
				},
				500,
			);
		}
	},
);

// ========================================
// SYNC OPERATIONS
// ========================================

/**
 * Request full sync from Google
 * POST /v1/google-calendar/sync/full
 */
googleCalendarRouter.post('/sync/full', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		// Check if connected and enabled
		const status = await getConnectionStatus(user.id);
		if (!status.isConnected) {
			return c.json(
				{
					error: 'Not connected to Google Calendar',
					message: 'Você precisa conectar ao Google Calendar primeiro',
					meta: { requestId },
				},
				400,
			);
		}

		if (!status.isEnabled) {
			return c.json(
				{
					error: 'Sync not enabled',
					message: 'A sincronização não está habilitada',
					meta: { requestId },
				},
				400,
			);
		}

		// Clear sync token to force full sync
		await updateSyncSettings(user.id, { syncToken: null });

		// Perform sync
		const result = await syncFromGoogle(user.id);

		secureLogger.info('Full sync completed', {
			requestId,
			userId: user.id,
			syncedCount: result.syncedCount,
			errorCount: result.errors.length,
		});

		return c.json({
			data: result,
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Full sync failed', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Full sync failed',
				message: 'Não foi possível sincronizar com o Google Calendar',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Request incremental sync from Google
 * POST /v1/google-calendar/sync/incremental
 */
googleCalendarRouter.post('/sync/incremental', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		// Check if connected and enabled
		const status = await getConnectionStatus(user.id);
		// biome-ignore lint/complexity/useSimplifiedLogicExpression: Clear condition check
		const isNotAvailable = !status.isConnected || !status.isEnabled;
		if (isNotAvailable) {
			return c.json(
				{
					error: 'Sync not available',
					message: 'A sincronização não está disponível',
					meta: { requestId },
				},
				400,
			);
		}

		// Perform incremental sync
		const result = await syncFromGoogle(user.id);

		secureLogger.info('Incremental sync completed', {
			requestId,
			userId: user.id,
			syncedCount: result.syncedCount,
		});

		return c.json({
			data: result,
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Incremental sync failed', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Incremental sync failed',
				message: 'Não foi possível sincronizar com o Google Calendar',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Sync a single event to Google
 * POST /v1/google-calendar/sync/event
 */
googleCalendarRouter.post(
	'/sync/event',
	authMiddleware,
	rateLimitMiddleware,
	zValidator('json', syncEventSchema),
	async (c) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');
		const { eventId } = c.req.valid('json');

		try {
			// Check if connected and enabled
			const status = await getConnectionStatus(user.id);
			// biome-ignore lint/complexity/useSimplifiedLogicExpression: Clear condition check
			if (!status.isConnected || !status.isEnabled) {
				return c.json(
					{
						error: 'Sync not available',
						message: 'A sincronização não está disponível',
						meta: { requestId },
					},
					400,
				);
			}

			await syncEventToGoogle(user.id, eventId);

			secureLogger.info('Event synced to Google', {
				requestId,
				userId: user.id,
				eventId,
			});

			return c.json({
				data: { synced: true, eventId },
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Event sync failed', {
				requestId,
				userId: user.id,
				eventId,
				error: error instanceof Error ? error.message : 'Unknown',
			});

			return c.json(
				{
					error: 'Event sync failed',
					message: 'Não foi possível sincronizar o evento',
					meta: { requestId },
				},
				500,
			);
		}
	},
);

// ========================================
// WEBHOOK
// ========================================

/**
 * Google Calendar webhook endpoint
 * POST /v1/google-calendar/webhook
 *
 * This endpoint receives push notifications from Google Calendar
 * when events are created, updated, or deleted.
 */
googleCalendarRouter.post('/webhook', webhookRateLimitMiddleware, async (c) => {
	const requestId = c.get('requestId');

	// Get headers from Google
	const channelId = c.req.header('X-Goog-Channel-ID');
	const resourceId = c.req.header('X-Goog-Resource-ID');
	const resourceState = c.req.header('X-Goog-Resource-State');
	const channelToken = c.req.header('X-Goog-Channel-Token');
	const messageNumber = c.req.header('X-Goog-Message-Number');

	secureLogger.info('Webhook received', {
		requestId,
		channelId,
		resourceState,
		messageNumber,
	});

	// Validate required headers
	// biome-ignore lint/complexity/useSimplifiedLogicExpression: Clear validation check
	if (!channelId || !resourceId || !resourceState) {
		return c.json({ error: 'Missing required headers' }, 400);
	}

	try {
		await processWebhook(channelId, resourceId, resourceState, channelToken || '');

		// Google expects 200 OK with empty body
		return c.body(null, 200);
	} catch (error) {
		secureLogger.error('Webhook processing failed', {
			requestId,
			channelId,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		// Still return 200 to prevent Google from retrying
		// (we handle retries internally)
		return c.body(null, 200);
	}
});

// ========================================
// CHANNEL MANAGEMENT
// ========================================

/**
 * Renew webhook channel
 * POST /v1/google-calendar/sync/channel/renew
 */
googleCalendarRouter.post('/sync/channel/renew', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		// Stop existing channel
		await stopPushNotifications(user.id);

		// Setup new channel
		await setupPushNotifications(user.id);

		const status = await getConnectionStatus(user.id);

		secureLogger.info('Channel renewed', {
			requestId,
			userId: user.id,
			channelExpiresAt: status.channelExpiresAt,
		});

		return c.json({
			data: {
				renewed: true,
				channelExpiresAt: status.channelExpiresAt,
			},
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Channel renewal failed', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Channel renewal failed',
				message: 'Não foi possível renovar o canal de notificações',
				meta: { requestId },
			},
			500,
		);
	}
});

// ========================================
// AUDIT & HISTORY
// ========================================

/**
 * Get sync audit history
 * GET /v1/google-calendar/sync/history
 */
googleCalendarRouter.get('/sync/history', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');
	const limit = Math.min(Number.parseInt(c.req.query('limit') || '50', 10), 100);
	const offset = Number.parseInt(c.req.query('offset') || '0', 10);

	try {
		const { db } = await import('@/db');
		const { calendarSyncAudit } = await import('@/db/schema/google-calendar-sync');
		const { eq, desc } = await import('drizzle-orm');

		const history = await db.query.calendarSyncAudit.findMany({
			where: eq(calendarSyncAudit.userId, user.id),
			orderBy: [desc(calendarSyncAudit.createdAt)],
			limit,
			offset,
		});

		return c.json({
			data: history,
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
				limit,
				offset,
			},
		});
	} catch (error) {
		secureLogger.error('Failed to get sync history', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to get sync history',
				message: 'Não foi possível obter o histórico de sincronização',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Get sync conflicts
 * GET /v1/google-calendar/sync/conflicts
 */
googleCalendarRouter.get('/sync/conflicts', authMiddleware, rateLimitMiddleware, async (c) => {
	const { user } = c.get('auth');
	const requestId = c.get('requestId');

	try {
		const { db } = await import('@/db');
		const { calendarSyncMappings } = await import('@/db/schema/google-calendar-sync');
		const { eq, and } = await import('drizzle-orm');

		const conflicts = await db.query.calendarSyncMappings.findMany({
			where: and(
				eq(calendarSyncMappings.userId, user.id),
				eq(calendarSyncMappings.syncStatus, 'conflict'),
			),
		});

		return c.json({
			data: conflicts,
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		secureLogger.error('Failed to get conflicts', {
			requestId,
			userId: user.id,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Failed to get conflicts',
				message: 'Não foi possível obter os conflitos de sincronização',
				meta: { requestId },
			},
			500,
		);
	}
});

// ========================================
// CRON ENDPOINTS (Internal)
// ========================================

/**
 * Cron job to renew expiring channels
 * POST /v1/google-calendar/cron/renew-channels
 *
 * This should be called by a Vercel cron job
 */
googleCalendarRouter.post('/cron/renew-channels', async (c) => {
	const requestId = c.get('requestId');

	// Verify cron secret
	const cronSecret = c.req.header('Authorization');
	const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

	if (cronSecret !== expectedSecret) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		await renewExpiringChannels();

		secureLogger.info('Cron: channels renewed', { requestId });

		return c.json({
			data: { success: true },
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Cron: channel renewal failed', {
			requestId,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Channel renewal failed',
				meta: { requestId },
			},
			500,
		);
	}
});

/**
 * Cron job to process sync queue
 * POST /v1/google-calendar/cron/process-queue
 */
googleCalendarRouter.post('/cron/process-queue', async (c) => {
	const requestId = c.get('requestId');

	// Verify cron secret
	const cronSecret = c.req.header('Authorization');
	const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

	if (cronSecret !== expectedSecret) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	try {
		const { processSyncQueue } = await import('@/lib/services/google-calendar-service');
		await processSyncQueue(20);

		secureLogger.info('Cron: sync queue processed', { requestId });

		return c.json({
			data: { success: true },
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Cron: queue processing failed', {
			requestId,
			error: error instanceof Error ? error.message : 'Unknown',
		});

		return c.json(
			{
				error: 'Queue processing failed',
				meta: { requestId },
			},
			500,
		);
	}
});

export default googleCalendarRouter;

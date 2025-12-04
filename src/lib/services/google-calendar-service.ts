/**
 * Google Calendar Service - Complete Implementation
 *
 * Handles OAuth 2.0, bidirectional sync, webhooks, and conflict resolution
 * for Google Calendar integration with AegisWallet.
 *
 * @file src/lib/services/google-calendar-service.ts
 */

import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { type calendar_v3, google } from 'googleapis';

import { db } from '@/db';
import { env } from '@/env';

import { type FinancialEvent, financialEvents } from '@/db/schema/calendar';
import {
	type CalendarSyncMapping,
	type CalendarSyncSettings,
	calendarSyncAudit,
	calendarSyncMappings,
	calendarSyncQueue,
	calendarSyncSettings,
	googleCalendarTokens,
} from '@/db/schema/google-calendar-sync';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface GoogleCalendarEvent {
	id?: string;
	summary?: string;
	description?: string;
	start?: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	end?: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	colorId?: string;
	status?: string;
	updated?: string;
	etag?: string;
	extendedProperties?: {
		private?: Record<string, string>;
	};
}

export interface SyncResult {
	success: boolean;
	syncedCount: number;
	errors: Array<{ eventId: string; error: string }>;
	nextSyncToken?: string;
}

export interface OAuthTokens {
	accessToken: string;
	refreshToken: string;
	expiryTimestamp: Date;
	scope: string;
}

// ========================================
// OAUTH 2.0 CLIENT
// ========================================

const oauth2Client = new google.auth.OAuth2(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	env.GOOGLE_REDIRECT_URI,
);

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getAuthUrl(state: string): string {
	return oauth2Client.generateAuthUrl({
		access_type: 'offline', // Required for refresh_token
		scope: [
			'https://www.googleapis.com/auth/calendar.events',
			'https://www.googleapis.com/auth/calendar.readonly',
			'https://www.googleapis.com/auth/userinfo.email',
		],
		state,
		prompt: 'consent', // Force consent screen to get refresh_token
	});
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
	const { tokens } = await oauth2Client.getToken(code);

	if (!(tokens.access_token && tokens.refresh_token)) {
		throw new Error('Failed to obtain required tokens');
	}

	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiryTimestamp: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
		scope: tokens.scope || '',
	};
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string> {
	const tokenRecord = await db.query.googleCalendarTokens.findFirst({
		where: eq(googleCalendarTokens.userId, userId),
	});

	if (!tokenRecord) {
		throw new Error('No Google Calendar tokens found for user');
	}

	if (!tokenRecord.isValid) {
		throw new Error('Google Calendar tokens are invalid. Please reconnect.');
	}

	// Check if token expires in less than 5 minutes
	const now = new Date();
	const expiryBuffer = 5 * 60 * 1000; // 5 minutes
	const needsRefresh = tokenRecord.expiryTimestamp.getTime() - now.getTime() < expiryBuffer;

	if (!needsRefresh) {
		// Update last used timestamp
		await db
			.update(googleCalendarTokens)
			.set({ lastUsedAt: now, updatedAt: now })
			.where(eq(googleCalendarTokens.id, tokenRecord.id));

		return tokenRecord.accessToken;
	}

	// Refresh the token
	try {
		oauth2Client.setCredentials({
			refresh_token: tokenRecord.refreshToken,
		});

		const { credentials } = await oauth2Client.refreshAccessToken();

		if (!credentials.access_token) {
			throw new Error('Failed to refresh access token');
		}

		const newExpiryTimestamp = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);

		// Update tokens in database
		await db
			.update(googleCalendarTokens)
			.set({
				accessToken: credentials.access_token,
				expiryTimestamp: newExpiryTimestamp,
				lastRefreshedAt: now,
				lastUsedAt: now,
				updatedAt: now,
			})
			.where(eq(googleCalendarTokens.id, tokenRecord.id));

		// Audit log
		await logSyncAudit(userId, 'oauth_refreshed', true);

		return credentials.access_token;
	} catch (error) {
		// Mark token as invalid
		await db
			.update(googleCalendarTokens)
			.set({ isValid: false, updatedAt: now })
			.where(eq(googleCalendarTokens.id, tokenRecord.id));

		await logSyncAudit(userId, 'oauth_refreshed', false, {
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		throw new Error('Failed to refresh Google Calendar token. Please reconnect.');
	}
}

/**
 * Get authenticated Google Calendar client
 */
export async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
	const accessToken = await getValidAccessToken(userId);

	oauth2Client.setCredentials({
		access_token: accessToken,
	});

	return google.calendar({ version: 'v3', auth: oauth2Client });
}

// ========================================
// TOKEN MANAGEMENT
// ========================================

/**
 * Save OAuth tokens for user
 */
export async function saveTokens(
	userId: string,
	tokens: OAuthTokens,
	googleEmail?: string,
	googleUserId?: string,
): Promise<void> {
	const now = new Date();

	// Upsert tokens
	await db
		.insert(googleCalendarTokens)
		.values({
			userId,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiryTimestamp: tokens.expiryTimestamp,
			scope: tokens.scope,
			googleUserEmail: googleEmail,
			googleUserId,
			isValid: true,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: googleCalendarTokens.userId,
			set: {
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
				expiryTimestamp: tokens.expiryTimestamp,
				scope: tokens.scope,
				googleUserEmail: googleEmail,
				googleUserId,
				isValid: true,
				updatedAt: now,
			},
		});

	await logSyncAudit(userId, 'oauth_connected', true, { googleEmail });
}

/**
 * Disconnect Google Calendar (revoke tokens)
 */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
	const tokenRecord = await db.query.googleCalendarTokens.findFirst({
		where: eq(googleCalendarTokens.userId, userId),
	});

	if (tokenRecord) {
		try {
			// Revoke token at Google
			await oauth2Client.revokeToken(tokenRecord.refreshToken);
		} catch (error) {
			secureLogger.warn('Failed to revoke Google token', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown',
			});
		}
	}

	// Delete tokens from database
	await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));

	// Clear sync settings
	await db.delete(calendarSyncSettings).where(eq(calendarSyncSettings.userId, userId));

	// Clear mappings
	await db.delete(calendarSyncMappings).where(eq(calendarSyncMappings.userId, userId));

	// Clear queue
	await db.delete(calendarSyncQueue).where(eq(calendarSyncQueue.userId, userId));

	await logSyncAudit(userId, 'oauth_disconnected', true);
}

// ========================================
// SYNC SETTINGS
// ========================================

/**
 * Get or create sync settings for user
 */
export async function getSyncSettings(userId: string): Promise<CalendarSyncSettings | null> {
	return await db.query.calendarSyncSettings.findFirst({
		where: eq(calendarSyncSettings.userId, userId),
	});
}

/**
 * Update sync settings
 */
export async function updateSyncSettings(
	userId: string,
	settings: Partial<CalendarSyncSettings>,
): Promise<CalendarSyncSettings> {
	const now = new Date();

	const [result] = await db
		.insert(calendarSyncSettings)
		.values({
			userId,
			...settings,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: calendarSyncSettings.userId,
			set: {
				...settings,
				updatedAt: now,
			},
		})
		.returning();

	await logSyncAudit(userId, 'settings_updated', true, { settings });

	return result;
}

// ========================================
// WEBHOOK / PUSH NOTIFICATIONS
// ========================================

/**
 * Setup push notifications for Google Calendar changes
 */
export async function setupPushNotifications(userId: string): Promise<void> {
	const calendar = await getCalendarClient(userId);
	const settings = await getSyncSettings(userId);
	const calendarId = settings?.defaultCalendarId || 'primary';

	// Generate unique channel ID and secret
	const channelId = crypto.randomUUID();
	const webhookSecret = crypto.randomUUID();

	// Webhook URL - use your production domain
	const webhookUrl = `${env.APP_URL}/api/v1/google-calendar/webhook`;

	// Channel expires in 7 days (maximum allowed by Google)
	const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

	try {
		const response = await calendar.events.watch({
			calendarId,
			requestBody: {
				id: channelId,
				type: 'web_hook',
				address: webhookUrl,
				token: webhookSecret, // Used to verify webhook origin
				expiration: String(expiration),
			},
		});

		// Save channel info to settings
		await updateSyncSettings(userId, {
			googleChannelId: channelId,
			googleResourceId: response.data.resourceId || undefined,
			channelExpiryAt: new Date(expiration),
			webhookSecret,
		});

		await logSyncAudit(userId, 'channel_renewed', true, {
			channelId,
			expiration: new Date(expiration).toISOString(),
		});

		secureLogger.info('Google Calendar push notifications setup', {
			userId,
			channelId,
			expiration: new Date(expiration).toISOString(),
		});
	} catch (error) {
		secureLogger.error('Failed to setup push notifications', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown',
		});
		throw error;
	}
}

/**
 * Stop push notifications
 */
export async function stopPushNotifications(userId: string): Promise<void> {
	const settings = await getSyncSettings(userId);

	if (!(settings?.googleChannelId && settings?.googleResourceId)) {
		return;
	}

	try {
		const calendar = await getCalendarClient(userId);

		await calendar.channels.stop({
			requestBody: {
				id: settings.googleChannelId,
				resourceId: settings.googleResourceId,
			},
		});

		await updateSyncSettings(userId, {
			googleChannelId: null,
			googleResourceId: null,
			channelExpiryAt: null,
		});

		await logSyncAudit(userId, 'channel_expired', true);
	} catch (error) {
		secureLogger.warn('Failed to stop push notifications', {
			userId,
			error: error instanceof Error ? error.message : 'Unknown',
		});
	}
}

/**
 * Process incoming webhook notification
 */
export async function processWebhook(
	channelId: string,
	resourceId: string,
	resourceState: string,
	channelToken: string,
): Promise<void> {
	// Find user by channel ID
	const settings = await db.query.calendarSyncSettings.findFirst({
		where: and(
			eq(calendarSyncSettings.googleChannelId, channelId),
			eq(calendarSyncSettings.googleResourceId, resourceId),
		),
	});

	if (!settings) {
		secureLogger.warn('Webhook received for unknown channel', { channelId, resourceId });
		return;
	}

	// Verify webhook secret
	if (settings.webhookSecret !== channelToken) {
		secureLogger.warn('Webhook token mismatch', { channelId, userId: settings.userId });
		return;
	}

	await logSyncAudit(settings.userId, 'webhook_received', true, {
		channelId,
		resourceState,
	});

	// Handle different resource states
	switch (resourceState) {
		case 'sync':
			// Initial sync notification - indicates channel is active
			secureLogger.info('Webhook channel sync confirmed', { userId: settings.userId });
			break;

		case 'exists':
		case 'update':
			// Event was created, updated, or deleted - queue incremental sync
			await enqueueSyncFromGoogle(settings.userId);
			break;

		case 'not_exists':
			// Resource was deleted - queue sync to check
			await enqueueSyncFromGoogle(settings.userId);
			break;

		default:
			secureLogger.warn('Unknown webhook resource state', { resourceState, channelId });
	}
}

// ========================================
// SYNC QUEUE MANAGEMENT
// ========================================

/**
 * Enqueue a sync operation from Google
 */
export async function enqueueSyncFromGoogle(
	userId: string,
	eventId?: string,
	priority = 0,
): Promise<void> {
	await db.insert(calendarSyncQueue).values({
		userId,
		eventId,
		syncDirection: 'from_google',
		status: 'pending',
		priority,
		metadata: { triggeredBy: 'webhook' },
	});
}

/**
 * Enqueue a sync operation to Google
 */
export async function enqueueSyncToGoogle(
	userId: string,
	eventId: string,
	priority = 0,
): Promise<void> {
	await db.insert(calendarSyncQueue).values({
		userId,
		eventId,
		syncDirection: 'to_google',
		status: 'pending',
		priority,
		metadata: { triggeredBy: 'aegis_change' },
	});
}

/**
 * Process pending items in sync queue
 */
export async function processSyncQueue(limit = 10): Promise<void> {
	const now = new Date();

	// Get pending items, ordered by priority and creation time
	const pendingItems = await db.query.calendarSyncQueue.findMany({
		where: and(
			eq(calendarSyncQueue.status, 'pending'),
			or(isNull(calendarSyncQueue.scheduledFor), lt(calendarSyncQueue.scheduledFor, now)),
		),
		orderBy: (queue, { desc, asc }) => [desc(queue.priority), asc(queue.createdAt)],
		limit,
	});

	for (const item of pendingItems) {
		try {
			// Mark as processing
			await db
				.update(calendarSyncQueue)
				.set({
					status: 'processing',
					lastAttemptAt: now,
				})
				.where(eq(calendarSyncQueue.id, item.id));

			// Process based on direction
			if (item.syncDirection === 'from_google') {
				await syncFromGoogle(item.userId);
			} else {
				if (!item.eventId) {
					throw new Error('Event ID required for to_google sync');
				}
				await syncEventToGoogle(item.userId, item.eventId);
			}

			// Mark as completed
			await db
				.update(calendarSyncQueue)
				.set({
					status: 'completed',
					processedAt: new Date(),
				})
				.where(eq(calendarSyncQueue.id, item.id));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Check if we should retry
			if (item.retryCount < item.maxRetries) {
				// Schedule retry with exponential backoff
				const backoffMs = 2 ** item.retryCount * 1000 * 60; // 1, 2, 4 minutes
				const scheduledFor = new Date(now.getTime() + backoffMs);

				await db
					.update(calendarSyncQueue)
					.set({
						status: 'pending',
						retryCount: item.retryCount + 1,
						errorMessage,
						scheduledFor,
					})
					.where(eq(calendarSyncQueue.id, item.id));
			} else {
				// Max retries reached - mark as failed
				await db
					.update(calendarSyncQueue)
					.set({
						status: 'failed',
						errorMessage,
						processedAt: new Date(),
					})
					.where(eq(calendarSyncQueue.id, item.id));

				await logSyncAudit(item.userId, 'sync_failed', false, {
					queueItemId: item.id,
					error: errorMessage,
				});
			}
		}
	}
}

// ========================================
// INCREMENTAL SYNC FROM GOOGLE
// ========================================

/**
 * Perform incremental sync from Google Calendar
 */
export async function syncFromGoogle(userId: string): Promise<SyncResult> {
	const settings = await getSyncSettings(userId);

	if (!settings?.syncEnabled) {
		return { success: false, syncedCount: 0, errors: [{ eventId: '', error: 'Sync not enabled' }] };
	}

	const calendar = await getCalendarClient(userId);
	const calendarId = settings.defaultCalendarId || 'primary';
	const errors: Array<{ eventId: string; error: string }> = [];
	let syncedCount = 0;

	await logSyncAudit(userId, 'sync_started', true, { direction: 'from_google' });

	try {
		// Build request parameters
		const params: calendar_v3.Params$Resource$Events$List = {
			calendarId,
			singleEvents: true,
			maxResults: 100,
		};

		// Use sync token if available for incremental sync
		if (settings.syncToken) {
			params.syncToken = settings.syncToken;
		} else {
			// Full sync - get events from last 30 days to 1 year in future
			const now = new Date();
			params.timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
			params.timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
		}

		let pageToken: string | undefined;
		let nextSyncToken: string | undefined;

		do {
			if (pageToken) {
				params.pageToken = pageToken;
			}

			let response: calendar_v3.Schema$Events;

			try {
				const result = await calendar.events.list(params);
				response = result.data;
			} catch (listError: unknown) {
				// Handle invalid sync token (410 Gone)
				const apiError = listError as { code?: number };
				if (apiError?.code === 410) {
					secureLogger.info('Sync token expired, performing full sync', { userId });

					// Clear sync token and retry with full sync
					await updateSyncSettings(userId, { syncToken: null });

					// Reset params for full sync
					params.syncToken = undefined;
					const now = new Date();
					params.timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
					params.timeMax = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

					const result = await calendar.events.list(params);
					response = result.data;
				} else {
					throw listError;
				}
			}

			// Process events
			for (const googleEvent of response.items || []) {
				try {
					await processGoogleEvent(userId, googleEvent, settings);
					syncedCount++;
				} catch (error) {
					errors.push({
						eventId: googleEvent.id || 'unknown',
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

			pageToken = response.nextPageToken || undefined;
			nextSyncToken = response.nextSyncToken || undefined;
		} while (pageToken);

		// Save the new sync token
		if (nextSyncToken) {
			await updateSyncSettings(userId, {
				syncToken: nextSyncToken,
				lastIncrementalSyncAt: new Date(),
			});
		}

		await logSyncAudit(userId, 'sync_completed', true, {
			direction: 'from_google',
			syncedCount,
			errorCount: errors.length,
		});

		return { success: true, syncedCount, errors, nextSyncToken };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		await logSyncAudit(userId, 'sync_failed', false, {
			direction: 'from_google',
			error: errorMessage,
		});

		return {
			success: false,
			syncedCount,
			errors: [...errors, { eventId: '', error: errorMessage }],
		};
	}
}

/**
 * Process a single Google Calendar event
 */
async function processGoogleEvent(
	userId: string,
	googleEvent: calendar_v3.Schema$Event,
	settings: CalendarSyncSettings,
): Promise<void> {
	if (!googleEvent.id) return;

	// Check for Aegis ID in extended properties (our events)
	const aegisId = googleEvent.extendedProperties?.private?.aegis_id;

	// Check for existing mapping
	const existingMapping = await db.query.calendarSyncMappings.findFirst({
		where: and(
			eq(calendarSyncMappings.userId, userId),
			eq(calendarSyncMappings.googleEventId, googleEvent.id),
		),
	});

	// Loop prevention: skip if recently synced from Aegis
	if (existingMapping && shouldSkipSync(existingMapping, 'google')) {
		return;
	}

	const now = new Date();

	// Handle cancelled/deleted events
	if (googleEvent.status === 'cancelled') {
		if (existingMapping) {
			// Delete the financial event
			await db
				.delete(financialEvents)
				.where(eq(financialEvents.id, existingMapping.financialEventId));

			// Delete the mapping
			await db.delete(calendarSyncMappings).where(eq(calendarSyncMappings.id, existingMapping.id));

			await logSyncAudit(userId, 'event_deleted', true, {
				source: 'google',
				financialEventId: existingMapping.financialEventId,
				googleEventId: googleEvent.id,
			});
		}
		return;
	}

	// Convert Google event to financial event data
	const eventData = convertGoogleToFinancialEvent(googleEvent, settings);

	if (existingMapping) {
		// Update existing financial event
		await db
			.update(financialEvents)
			.set({
				...eventData,
				updatedAt: now,
			})
			.where(eq(financialEvents.id, existingMapping.financialEventId));

		// Update mapping
		await db
			.update(calendarSyncMappings)
			.set({
				syncStatus: 'synced',
				syncSource: 'google',
				lastSyncedAt: now,
				lastModifiedAt: now,
				googleEtag: googleEvent.etag || undefined,
				version: existingMapping.version + 1,
				errorMessage: null,
				updatedAt: now,
			})
			.where(eq(calendarSyncMappings.id, existingMapping.id));

		await logSyncAudit(userId, 'event_updated', true, {
			source: 'google',
			financialEventId: existingMapping.financialEventId,
			googleEventId: googleEvent.id,
		});
	} else if (!aegisId) {
		// Create new financial event (only if not originally from Aegis)
		const [newEvent] = await db
			.insert(financialEvents)
			.values({
				userId,
				...eventData,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// Create mapping
		await db.insert(calendarSyncMappings).values({
			userId,
			financialEventId: newEvent.id,
			googleEventId: googleEvent.id,
			googleCalendarId: settings.defaultCalendarId || 'primary',
			syncStatus: 'synced',
			syncSource: 'google',
			lastSyncedAt: now,
			lastModifiedAt: now,
			googleEtag: googleEvent.etag || undefined,
			createdAt: now,
			updatedAt: now,
		});

		await logSyncAudit(userId, 'event_created', true, {
			source: 'google',
			financialEventId: newEvent.id,
			googleEventId: googleEvent.id,
		});
	}
}

// ========================================
// SYNC TO GOOGLE
// ========================================

/**
 * Sync a single financial event to Google Calendar
 */
export async function syncEventToGoogle(userId: string, eventId: string): Promise<void> {
	const settings = await getSyncSettings(userId);

	if (!settings?.syncEnabled) {
		throw new Error('Sync not enabled');
	}

	if (settings.syncDirection === 'one_way_from_google') {
		return; // Don't sync to Google if direction is from Google only
	}

	const financialEvent = await db.query.financialEvents.findFirst({
		where: and(eq(financialEvents.id, eventId), eq(financialEvents.userId, userId)),
	});

	if (!financialEvent) {
		throw new Error('Financial event not found');
	}

	// Check for existing mapping
	const existingMapping = await db.query.calendarSyncMappings.findFirst({
		where: and(
			eq(calendarSyncMappings.userId, userId),
			eq(calendarSyncMappings.financialEventId, eventId),
		),
	});

	// Loop prevention: skip if recently synced from Google
	if (existingMapping && shouldSkipSync(existingMapping, 'aegis')) {
		return;
	}

	const calendar = await getCalendarClient(userId);
	const calendarId = settings.defaultCalendarId || 'primary';
	const now = new Date();

	// Convert financial event to Google event
	const googleEventData = convertFinancialToGoogleEvent(financialEvent, settings);

	if (existingMapping) {
		// Update existing Google event
		const response = await calendar.events.patch({
			calendarId,
			eventId: existingMapping.googleEventId,
			requestBody: googleEventData,
		});

		// Update mapping
		await db
			.update(calendarSyncMappings)
			.set({
				syncStatus: 'synced',
				syncSource: 'aegis',
				lastSyncedAt: now,
				lastModifiedAt: now,
				googleEtag: response.data.etag || undefined,
				version: existingMapping.version + 1,
				errorMessage: null,
				updatedAt: now,
			})
			.where(eq(calendarSyncMappings.id, existingMapping.id));

		await logSyncAudit(userId, 'event_updated', true, {
			source: 'aegis',
			financialEventId: eventId,
			googleEventId: existingMapping.googleEventId,
		});
	} else {
		// Create new Google event
		const response = await calendar.events.insert({
			calendarId,
			requestBody: googleEventData,
		});

		if (!response.data.id) {
			throw new Error('Failed to create Google Calendar event');
		}

		// Create mapping
		await db.insert(calendarSyncMappings).values({
			userId,
			financialEventId: eventId,
			googleEventId: response.data.id,
			googleCalendarId: calendarId,
			syncStatus: 'synced',
			syncSource: 'aegis',
			lastSyncedAt: now,
			lastModifiedAt: now,
			googleEtag: response.data.etag || undefined,
			createdAt: now,
			updatedAt: now,
		});

		await logSyncAudit(userId, 'event_created', true, {
			source: 'aegis',
			financialEventId: eventId,
			googleEventId: response.data.id,
		});
	}
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleEvent(userId: string, financialEventId: string): Promise<void> {
	const mapping = await db.query.calendarSyncMappings.findFirst({
		where: and(
			eq(calendarSyncMappings.userId, userId),
			eq(calendarSyncMappings.financialEventId, financialEventId),
		),
	});

	if (!mapping) return;

	try {
		const calendar = await getCalendarClient(userId);

		await calendar.events.delete({
			calendarId: mapping.googleCalendarId,
			eventId: mapping.googleEventId,
		});
	} catch (deleteError: unknown) {
		// Ignore 404/410 errors (event already deleted)
		const apiError = deleteError as { code?: number };
		if (apiError?.code !== 404 && apiError?.code !== 410) {
			throw deleteError;
		}
	}

	// Delete mapping
	await db.delete(calendarSyncMappings).where(eq(calendarSyncMappings.id, mapping.id));

	await logSyncAudit(userId, 'event_deleted', true, {
		source: 'aegis',
		financialEventId,
		googleEventId: mapping.googleEventId,
	});
}

// ========================================
// DATA CONVERSION
// ========================================

/**
 * Convert Google Calendar event to financial event data
 */
function convertGoogleToFinancialEvent(
	googleEvent: calendar_v3.Schema$Event,
	settings: CalendarSyncSettings,
): Partial<FinancialEvent> {
	// Parse start/end dates
	const startDate = googleEvent.start?.dateTime
		? new Date(googleEvent.start.dateTime)
		: googleEvent.start?.date
			? new Date(googleEvent.start.date)
			: new Date();

	const endDate = googleEvent.end?.dateTime
		? new Date(googleEvent.end.dateTime)
		: googleEvent.end?.date
			? new Date(googleEvent.end.date)
			: startDate;

	const isAllDay = !googleEvent.start?.dateTime;

	// Get category from extended properties
	const category = googleEvent.extendedProperties?.private?.aegis_category;

	// Determine if income based on color (10 = green = income)
	const isIncome = googleEvent.colorId === '10';

	// Try to extract amount from description if sync_financial_amounts is enabled
	let amount: string | undefined;
	if (settings.syncFinancialAmounts && googleEvent.description) {
		const amountMatch = googleEvent.description.match(/R\$\s*([\d.,]+)/);
		if (amountMatch) {
			const numericAmount = Number.parseFloat(amountMatch[1].replace('.', '').replace(',', '.'));
			amount = isIncome ? String(numericAmount) : String(-numericAmount);
		}
	}

	return {
		title: googleEvent.summary || 'Evento do Google Calendar',
		description: googleEvent.description || undefined,
		startDate,
		endDate,
		allDay: isAllDay,
		amount: amount,
		category: category || 'other',
		isIncome,
		isRecurring: false, // Google recurrence is complex, handle separately
		recurrenceRule: undefined,
	};
}

/**
 * Convert financial event to Google Calendar event data
 */
function convertFinancialToGoogleEvent(
	event: FinancialEvent,
	settings: CalendarSyncSettings,
): calendar_v3.Schema$Event {
	// Build description
	let description = event.description || '';

	// Add amount to description if enabled
	if (settings.syncFinancialAmounts && event.amount) {
		const numericAmount = Number.parseFloat(event.amount);
		const formattedAmount = new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(Math.abs(numericAmount));

		description = `${description}\n\n💰 Valor: ${formattedAmount}`.trim();
	}

	// Color ID based on income/expense
	// 10 = green (income), 11 = red (expense)
	const colorId = event.isIncome ? '10' : '11';

	// Build event
	const googleEvent: calendar_v3.Schema$Event = {
		summary: event.title,
		description: description || undefined,
		colorId,
		extendedProperties: {
			private: {
				aegis_id: event.id,
				aegis_category: event.category || '',
				aegis_type: event.isIncome ? 'income' : 'expense',
			},
		},
	};

	// Set start/end based on all-day or timed event
	const timeZone = 'America/Sao_Paulo';

	if (event.allDay) {
		// All-day event uses date format
		googleEvent.start = {
			date: event.startDate.toISOString().split('T')[0],
			timeZone,
		};
		googleEvent.end = {
			date: event.endDate.toISOString().split('T')[0],
			timeZone,
		};
	} else {
		// Timed event uses dateTime format
		googleEvent.start = {
			dateTime: event.startDate.toISOString(),
			timeZone,
		};
		googleEvent.end = {
			dateTime: event.endDate.toISOString(),
			timeZone,
		};
	}

	return googleEvent;
}

// ========================================
// CONFLICT RESOLUTION
// ========================================

/**
 * Check if sync should be skipped to prevent loops
 * Skip if the mapping was recently synced from the same destination
 */
function shouldSkipSync(mapping: CalendarSyncMapping, destination: 'google' | 'aegis'): boolean {
	const source = destination === 'google' ? 'aegis' : 'google';

	// If last sync was from the same destination (meaning it originated there),
	// and it was less than 5 seconds ago, skip to prevent loops
	if (mapping.syncSource === source) {
		const timeSinceLastSync = Date.now() - mapping.lastSyncedAt.getTime();
		return timeSinceLastSync < 5000; // 5 seconds
	}

	return false;
}

// ========================================
// AUDIT LOGGING
// ========================================

// Valid audit action types
type AuditAction =
	| 'sync_started'
	| 'sync_completed'
	| 'sync_failed'
	| 'event_created'
	| 'event_updated'
	| 'event_deleted'
	| 'event_synced'
	| 'channel_renewed'
	| 'channel_expired'
	| 'webhook_received'
	| 'webhook_error'
	| 'oauth_connected'
	| 'oauth_disconnected'
	| 'oauth_refreshed'
	| 'conflict_resolved'
	| 'settings_updated';

/**
 * Log sync audit event
 */
async function logSyncAudit(
	userId: string,
	action: AuditAction,
	success: boolean,
	details?: Record<string, unknown>,
): Promise<void> {
	try {
		await db.insert(calendarSyncAudit).values({
			userId,
			action,
			success,
			details: details || {},
			createdAt: new Date(),
		});
	} catch (error) {
		secureLogger.warn('Failed to log sync audit', {
			userId,
			action,
			error: error instanceof Error ? error.message : 'Unknown',
		});
	}
}

// ========================================
// CHANNEL RENEWAL
// ========================================

/**
 * Renew expiring webhook channels
 * Should be called by a cron job
 */
export async function renewExpiringChannels(): Promise<void> {
	// Find channels expiring in the next 24 hours
	const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);

	const expiringSettings = await db.query.calendarSyncSettings.findMany({
		where: and(
			eq(calendarSyncSettings.syncEnabled, true),
			lt(calendarSyncSettings.channelExpiryAt, expiryThreshold),
		),
	});

	for (const settings of expiringSettings) {
		try {
			// Stop old channel
			await stopPushNotifications(settings.userId);

			// Setup new channel
			await setupPushNotifications(settings.userId);

			secureLogger.info('Renewed webhook channel', { userId: settings.userId });
		} catch (error) {
			secureLogger.error('Failed to renew webhook channel', {
				userId: settings.userId,
				error: error instanceof Error ? error.message : 'Unknown',
			});
		}
	}
}

// ========================================
// CONNECTION STATUS
// ========================================

/**
 * Get connection status for user
 */
export async function getConnectionStatus(userId: string): Promise<{
	isConnected: boolean;
	isEnabled: boolean;
	googleEmail: string | null;
	lastSyncAt: Date | null;
	channelExpiresAt: Date | null;
}> {
	const [token, settings] = await Promise.all([
		db.query.googleCalendarTokens.findFirst({
			where: eq(googleCalendarTokens.userId, userId),
		}),
		db.query.calendarSyncSettings.findFirst({
			where: eq(calendarSyncSettings.userId, userId),
		}),
	]);

	return {
		isConnected: !!token?.isValid,
		isEnabled: settings?.syncEnabled ?? false,
		googleEmail: token?.googleUserEmail ?? null,
		lastSyncAt: settings?.lastIncrementalSyncAt ?? settings?.lastFullSyncAt ?? null,
		channelExpiresAt: settings?.channelExpiryAt ?? null,
	};
}

/**
 * Google Calendar Sync Schema
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Tables for Google Calendar bidirectional synchronization
 *
 * @file src/db/schema/google-calendar-sync.ts
 */

import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

import { financialEvents } from './calendar';
import { users } from './users';

// ========================================
// ENUMS
// ========================================

export const syncDirectionEnum = pgEnum('sync_direction', [
	'one_way_to_google',
	'one_way_from_google',
	'bidirectional',
]);

export const syncStatusEnum = pgEnum('sync_status', [
	'synced',
	'pending',
	'error',
	'conflict',
]);

export const syncSourceEnum = pgEnum('sync_source', [
	'aegis',
	'google',
	'manual',
]);

export const syncQueueStatusEnum = pgEnum('sync_queue_status', [
	'pending',
	'processing',
	'completed',
	'failed',
]);

export const syncQueueDirectionEnum = pgEnum('sync_queue_direction', [
	'to_google',
	'from_google',
]);

export const syncAuditActionEnum = pgEnum('sync_audit_action', [
	'sync_started',
	'sync_completed',
	'sync_failed',
	'event_created',
	'event_updated',
	'event_deleted',
	'event_synced',
	'channel_renewed',
	'channel_expired',
	'webhook_received',
	'webhook_error',
	'oauth_connected',
	'oauth_disconnected',
	'oauth_refreshed',
	'conflict_resolved',
	'settings_updated',
]);

// ========================================
// GOOGLE CALENDAR TOKENS
// ========================================

/**
 * OAuth 2.0 tokens for Google Calendar API access
 * Stores encrypted refresh tokens for persistent access
 */
export const googleCalendarTokens = pgTable(
	'google_calendar_tokens',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// OAuth tokens
		accessToken: text('access_token').notNull(),
		refreshToken: text('refresh_token').notNull(),
		expiryTimestamp: timestamp('expiry_timestamp', { withTimezone: true }).notNull(),
		scope: text('scope').notNull(),

		// Google user info
		googleUserEmail: text('google_user_email'),
		googleUserId: text('google_user_id'),

		// Token metadata
		tokenType: text('token_type').default('Bearer'),
		isValid: boolean('is_valid').default(true).notNull(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
		lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: uniqueIndex('google_calendar_tokens_user_id_idx').on(table.userId),
	}),
);

// ========================================
// CALENDAR SYNC SETTINGS
// ========================================

/**
 * Per-user synchronization settings and preferences
 * Controls sync behavior, direction, and webhook configuration
 */
export const calendarSyncSettings = pgTable('calendar_sync_settings', {
	// Primary key is userId (one settings record per user)
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
		.primaryKey(),

	// Sync configuration
	syncEnabled: boolean('sync_enabled').default(false).notNull(),
	syncDirection: syncDirectionEnum('sync_direction').default('bidirectional').notNull(),
	syncFinancialAmounts: boolean('sync_financial_amounts').default(false).notNull(),
	syncCategories: text('sync_categories').array(), // Null = all categories
	autoSyncIntervalMinutes: integer('auto_sync_interval_minutes').default(15).notNull(),

	// Google incremental sync token
	syncToken: text('sync_token'),
	lastFullSyncAt: timestamp('last_full_sync_at', { withTimezone: true }),
	lastIncrementalSyncAt: timestamp('last_incremental_sync_at', { withTimezone: true }),

	// Webhook channel configuration
	googleChannelId: text('google_channel_id'),
	googleResourceId: text('google_resource_id'),
	channelExpiryAt: timestamp('channel_expiry_at', { withTimezone: true }),
	webhookSecret: text('webhook_secret'),

	// Default calendar to sync with
	defaultCalendarId: text('default_calendar_id').default('primary'),

	// LGPD consent tracking
	lgpdConsentGiven: boolean('lgpd_consent_given').default(false).notNull(),
	lgpdConsentTimestamp: timestamp('lgpd_consent_timestamp', { withTimezone: true }),
	lgpdConsentVersion: text('lgpd_consent_version'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ========================================
// CALENDAR SYNC MAPPINGS
// ========================================

/**
 * Mapping between AegisWallet financial events and Google Calendar events
 * Enables bidirectional sync and conflict resolution
 */
export const calendarSyncMappings = pgTable(
	'calendar_sync_mappings',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Event references
		financialEventId: text('financial_event_id')
			.references(() => financialEvents.id, { onDelete: 'cascade' })
			.notNull(),
		googleEventId: text('google_event_id').notNull(),
		googleCalendarId: text('google_calendar_id').default('primary').notNull(),

		// Sync state
		syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
		syncSource: syncSourceEnum('sync_source').notNull(),
		lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).notNull(),
		lastModifiedAt: timestamp('last_modified_at', { withTimezone: true }).notNull(),

		// Optimistic locking for conflict resolution
		version: integer('version').default(1).notNull(),
		googleEtag: text('google_etag'), // Google's ETag for optimistic concurrency

		// Error tracking
		errorMessage: text('error_message'),
		errorCount: integer('error_count').default(0).notNull(),
		lastErrorAt: timestamp('last_error_at', { withTimezone: true }),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userEventIdx: uniqueIndex('calendar_sync_mappings_user_event_idx').on(
			table.userId,
			table.financialEventId,
		),
		googleEventIdx: uniqueIndex('calendar_sync_mappings_google_event_idx').on(
			table.userId,
			table.googleEventId,
		),
	}),
);

// ========================================
// CALENDAR SYNC QUEUE
// ========================================

/**
 * Async queue for sync operations
 * Enables background processing and retry logic
 */
export const calendarSyncQueue = pgTable('calendar_sync_queue', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// What to sync
	eventId: text('event_id'), // Null for full sync from Google
	syncDirection: syncQueueDirectionEnum('sync_direction').notNull(),

	// Queue status
	status: syncQueueStatusEnum('status').default('pending').notNull(),
	priority: integer('priority').default(0).notNull(), // Higher = more urgent
	retryCount: integer('retry_count').default(0).notNull(),
	maxRetries: integer('max_retries').default(3).notNull(),

	// Error tracking
	errorMessage: text('error_message'),
	lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),

	// Metadata (webhook info, etc.)
	metadata: jsonb('metadata'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	scheduledFor: timestamp('scheduled_for', { withTimezone: true }), // For delayed processing
});

// ========================================
// CALENDAR SYNC AUDIT
// ========================================

/**
 * Audit log for all sync operations
 * Enables debugging and compliance tracking
 */
export const calendarSyncAudit = pgTable('calendar_sync_audit', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// Action details
	action: syncAuditActionEnum('action').notNull(),
	eventId: text('event_id'), // Financial event ID if applicable
	googleEventId: text('google_event_id'), // Google event ID if applicable

	// Operation result
	success: boolean('success').notNull(),
	errorMessage: text('error_message'),

	// Detailed info
	details: jsonb('details'), // Additional context (before/after, etc.)

	// Request metadata
	requestId: text('request_id'),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type GoogleCalendarToken = typeof googleCalendarTokens.$inferSelect;
export type InsertGoogleCalendarToken = typeof googleCalendarTokens.$inferInsert;

export type CalendarSyncSettings = typeof calendarSyncSettings.$inferSelect;
export type InsertCalendarSyncSettings = typeof calendarSyncSettings.$inferInsert;

export type CalendarSyncMapping = typeof calendarSyncMappings.$inferSelect;
export type InsertCalendarSyncMapping = typeof calendarSyncMappings.$inferInsert;

export type CalendarSyncQueueItem = typeof calendarSyncQueue.$inferSelect;
export type InsertCalendarSyncQueueItem = typeof calendarSyncQueue.$inferInsert;

export type CalendarSyncAuditLog = typeof calendarSyncAudit.$inferSelect;
export type InsertCalendarSyncAuditLog = typeof calendarSyncAudit.$inferInsert;

// ========================================
// RELATIONS (to be added to relations.ts)
// ========================================

/*
Add these to src/db/schema/relations.ts:

import { relations } from 'drizzle-orm';
import {
  googleCalendarTokens,
  calendarSyncSettings,
  calendarSyncMappings,
  calendarSyncQueue,
  calendarSyncAudit,
} from './google-calendar-sync';
import { users } from './users';
import { financialEvents } from './calendar';

export const googleCalendarTokensRelations = relations(googleCalendarTokens, ({ one }) => ({
  user: one(users, {
    fields: [googleCalendarTokens.userId],
    references: [users.id],
  }),
}));

export const calendarSyncSettingsRelations = relations(calendarSyncSettings, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncSettings.userId],
    references: [users.id],
  }),
}));

export const calendarSyncMappingsRelations = relations(calendarSyncMappings, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncMappings.userId],
    references: [users.id],
  }),
  financialEvent: one(financialEvents, {
    fields: [calendarSyncMappings.financialEventId],
    references: [financialEvents.id],
  }),
}));

export const calendarSyncQueueRelations = relations(calendarSyncQueue, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncQueue.userId],
    references: [users.id],
  }),
}));

export const calendarSyncAuditRelations = relations(calendarSyncAudit, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncAudit.userId],
    references: [users.id],
  }),
}));
*/

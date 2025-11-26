/**
 * @fileoverview Calendar sync schema - Google Calendar integration
 * @module db/schema/calendar
 */

import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { financialEvents } from './transactions'

/**
 * Google Calendar OAuth tokens
 */
export const googleCalendarTokens = pgTable('google_calendar_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiryTimestamp: timestamp('expiry_timestamp', { withTimezone: true }).notNull(),
  scope: text('scope').notNull(),
  googleUserEmail: text('google_user_email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Calendar sync settings per user
 */
export const calendarSyncSettings = pgTable('calendar_sync_settings', {
  userId: uuid('user_id').primaryKey(),
  syncEnabled: boolean('sync_enabled').default(false),
  syncDirection: text('sync_direction'), // one_way_to_google, one_way_from_google, bidirectional
  syncFinancialAmounts: boolean('sync_financial_amounts').default(false),
  syncCategories: text('sync_categories').array(),
  lastFullSyncAt: timestamp('last_full_sync_at', { withTimezone: true }),
  syncToken: text('sync_token'),
  autoSyncIntervalMinutes: integer('auto_sync_interval_minutes').default(15),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})


/**
 * Calendar sync mapping - Links between Aegis events and Google events
 */
export const calendarSyncMapping = pgTable('calendar_sync_mapping', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  aegisEventId: uuid('aegis_event_id').notNull().references(() => financialEvents.id),
  googleEventId: text('google_event_id').notNull(),
  googleCalendarId: text('google_calendar_id').default('primary'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).default(sql`now()`),
  syncStatus: text('sync_status').notNull(), // synced, pending, error, conflict
  syncDirection: text('sync_direction').notNull(), // aegis_to_google, google_to_aegis, bidirectional
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Calendar sync audit - Sync operation logs
 */
export const calendarSyncAudit = pgTable('calendar_sync_audit', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(), // sync_started, sync_completed, sync_failed, event_created, event_updated, event_deleted, auth_granted, auth_revoked
  eventId: uuid('event_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

// Type exports
export type GoogleCalendarToken = typeof googleCalendarTokens.$inferSelect
export type CalendarSyncSetting = typeof calendarSyncSettings.$inferSelect
export type CalendarSyncMapping = typeof calendarSyncMapping.$inferSelect
export type CalendarSyncAudit = typeof calendarSyncAudit.$inferSelect

/**
 * @fileoverview Banking connections and Open Banking schema
 * @module db/schema/banking
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  inet,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';
/**
 * Bank connections - Open Banking links
 */
export const bankConnections = pgTable('bank_connections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  institutionCode: text('institution_code').notNull(),
  institutionName: text('institution_name').notNull(),
  belvoLinkId: text('belvo_link_id').unique(),
  status: text('status').default('pending'), // active, expired, revoked, error, pending
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  nextSyncAt: timestamp('next_sync_at', { withTimezone: true }),
  syncFrequencyHours: integer('sync_frequency_hours').default(24),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  errorCount: integer('error_count').default(0),
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  connectedAt: timestamp('connected_at', { withTimezone: true }).default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Bank accounts - Accounts from Open Banking
 */
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  belvoAccountId: text('belvo_account_id').unique().notNull(),
  institutionId: text('institution_id').notNull(),
  institutionName: text('institution_name').notNull(),
  accountType: text('account_type').notNull(),
  accountNumber: text('account_number'),
  accountMask: text('account_mask').notNull(),
  accountHolderName: text('account_holder_name'),
  balance: numeric('balance').default(sql`0`),
  availableBalance: numeric('available_balance').default(sql`0`),
  currency: text('currency').default('BRL'),
  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),
  lastSync: timestamp('last_sync', { withTimezone: true }),
  syncStatus: text('sync_status').default('pending'),
  syncErrorMessage: text('sync_error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Bank tokens - Encrypted OAuth tokens
 */
export const bankTokens = pgTable('bank_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  connectionId: uuid('connection_id').references(() => bankConnections.id),
  userId: uuid('user_id'),
  encryptedAccessToken: text('encrypted_access_token').notNull(),
  encryptedRefreshToken: text('encrypted_refresh_token'),
  encryptionIv: text('encryption_iv').notNull(),
  encryptionAlgorithm: text('encryption_algorithm').default('AES-256-GCM'),
  tokenType: text('token_type').default('Bearer'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  refreshExpiresAt: timestamp('refresh_expires_at', { withTimezone: true }),
  scopes: text('scopes').array().default(sql`ARRAY['accounts:read', 'transactions:read']`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Bank consent - Open Banking consent records
 */
export const bankConsent = pgTable('bank_consent', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  connectionId: uuid('connection_id').references(() => bankConnections.id),
  userId: uuid('user_id'),
  consentId: text('consent_id'),
  scopes: text('scopes').array().notNull(),
  status: text('status').default('granted'), // granted, expired, revoked, pending_renewal
  grantedAt: timestamp('granted_at', { withTimezone: true }).default(sql`now()`),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  renewedAt: timestamp('renewed_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Bank audit logs - Compliance audit trail
 */
export const bankAuditLogs = pgTable('bank_audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  connectionId: uuid('connection_id').references(() => bankConnections.id),
  eventType: text('event_type').notNull(),
  institutionCode: text('institution_code'),
  status: text('status'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  digitalSignature: text('digital_signature').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  retentionUntil: timestamp('retention_until', { withTimezone: true }).default(
    sql`now() + interval '1 year'`
  ),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * @fileoverview LGPD compliance schema - Audit logs, data subject requests
 * @module db/schema/lgpd
 */

import { sql } from 'drizzle-orm';
import { boolean, inet, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Audit logs - Comprehensive compliance audit trail
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id'),
  sessionId: uuid('session_id'),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Data subject requests - LGPD rights requests
 */
export const dataSubjectRequests = pgTable('data_subject_requests', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  requestType: varchar('request_type', { length: 50 }).notNull(), // access, correction, deletion, portability, restriction
  status: varchar('status', { length: 50 }).default('pending'), // pending, processing, completed, rejected, cancelled
  requestData: jsonb('request_data'),
  response: jsonb('response'),
  notes: text('notes'),
  processedBy: uuid('processed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

/**
 * Legal holds - Prevent data deletion for legal reasons
 */
export const legalHolds = pgTable('legal_holds', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  holdType: varchar('hold_type', { length: 100 }).notNull(),
  reason: text('reason').notNull(),
  caseReference: varchar('case_reference', { length: 255 }),
  active: boolean('active').default(true),
  placedBy: uuid('placed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  releasedBy: uuid('released_by'),
});

// Type exports
export type AuditLog = typeof auditLogs.$inferSelect;
export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type LegalHold = typeof legalHolds.$inferSelect;

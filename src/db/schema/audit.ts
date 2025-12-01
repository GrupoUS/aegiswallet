/**
 * Audit Schema - Audit Logs, Error Logs, and Sessions
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * LGPD compliance: audit trails for all user actions
 */

import { boolean, inet, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// AUDIT LOGS
// ========================================

/**
 * Audit trail for all user actions (LGPD compliance)
 */
export const auditLogs = pgTable('audit_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Action details
	action: text('action').notNull(), // login, create_transaction, update_profile, etc.
	resourceType: text('resource_type'), // transaction, account, contact, etc.
	resourceId: text('resource_id'),

	// Data changes (LGPD audit trail)
	oldValues: jsonb('old_values'),
	newValues: jsonb('new_values'),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),
	sessionId: text('session_id'),

	// Status
	success: boolean('success').default(true),
	errorMessage: text('error_message'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// ERROR LOGS
// ========================================

/**
 * Error tracking and debugging logs
 */
export const errorLogs = pgTable('error_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Error details
	errorType: text('error_type').notNull(), // validation, api, database, voice_processing
	errorCode: text('error_code'),
	errorMessage: text('error_message').notNull(),
	stackTrace: text('stack_trace'),

	// Context
	context: jsonb('context'),
	userAgent: text('user_agent'),
	ipAddress: inet('ip_address'),
	sessionId: text('session_id'),

	// Resolution
	isResolved: boolean('is_resolved').default(false),
	resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	resolvedBy: text('resolved_by').references(() => users.id),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// USER SESSIONS
// ========================================

/**
 * User session tracking for security
 * Note: Clerk manages primary sessions, this is for additional tracking
 */
export const userSessions = pgTable('user_sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Session info
	sessionToken: text('session_token').unique().notNull(),

	// Device info
	deviceType: text('device_type'), // web, mobile, desktop
	deviceId: text('device_id'),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),

	// Status
	isActive: boolean('is_active').default(true),
	lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),

	// Validity
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// LGPD COMPLIANCE TABLES
// ========================================

/**
 * LGPD consent logs
 */
export const lgpdConsentLogs = pgTable('lgpd_consent_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Consent details
	consentType: text('consent_type').notNull(), // data_processing, marketing, analytics, third_party
	consentGiven: boolean('consent_given').notNull(),
	consentVersion: text('consent_version').notNull(),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),

	// Timestamps
	consentedAt: timestamp('consented_at', { withTimezone: true }).defaultNow(),
	revokedAt: timestamp('revoked_at', { withTimezone: true }),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Data export requests (LGPD right to data portability)
 */
export const dataExportRequests = pgTable('data_export_requests', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Request details
	requestType: text('request_type').notNull(), // export, deletion, correction
	status: text('status').default('pending'), // pending, processing, completed, failed

	// Processing info
	processedAt: timestamp('processed_at', { withTimezone: true }),
	downloadUrl: text('download_url'),
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),

	// Timestamps
	requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type LgpdConsentLog = typeof lgpdConsentLogs.$inferSelect;
export type InsertLgpdConsentLog = typeof lgpdConsentLogs.$inferInsert;

export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type InsertDataExportRequest = typeof dataExportRequests.$inferInsert;

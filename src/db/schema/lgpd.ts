/**
 * LGPD Compliance Schema - Brazilian Data Protection
 *
 * Tables for LGPD compliance including:
 * - Consent management (lgpd_consents, consent_templates)
 * - Data subject requests (data_deletion_requests)
 * - Retention policies (data_retention_policies)
 * - Compliance audit logging (compliance_audit_logs)
 * - Transaction limits (transaction_limits)
 */

import {
	boolean,
	date,
	decimal,
	inet,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// ENUMS
// ========================================

export const consentTypeEnum = pgEnum('consent_type', [
	'data_processing',
	'marketing',
	'analytics',
	'third_party',
	'third_party_sharing',
	'voice_data',
	'voice_recording',
	'biometric',
	'financial_data',
	'location',
	'open_banking',
]);

export const collectionMethodEnum = pgEnum('collection_method', [
	'signup',
	'settings',
	'settings_toggle',
	'prompt',
	'api',
	'import',
	'explicit_form',
	'terms_acceptance',
	'voice_command',
]);

export const deletionRequestTypeEnum = pgEnum('deletion_request_type', [
	'full_account',
	'full_deletion',
	'specific_data',
	'anonymization',
	'partial_deletion',
	'consent_withdrawal',
]);

export const deletionRequestStatusEnum = pgEnum('deletion_request_status', [
	'pending',
	'verified',
	'approved',
	'processing',
	'completed',
	'rejected',
	'cancelled',
]);

export const exportRequestTypeEnum = pgEnum('export_request_type', [
	'full_data',
	'full_export',
	'transactions',
	'profile',
	'consents',
	'audit_logs',
	'financial_only',
	'voice_commands',
	'specific_period',
]);

export const exportFormatEnum = pgEnum('export_format', ['json', 'csv', 'pdf']);

export const exportStatusEnum = pgEnum('export_status', [
	'pending',
	'processing',
	'completed',
	'failed',
	'expired',
]);

export const limitTypeEnum = pgEnum('limit_type', [
	'pix_daily',
	'pix_daytime',
	'pix_nighttime',
	'pix_transaction',
	'pix_total_daily',
	'boleto_daily',
	'ted_daily',
	'transfer_daily',
	'withdrawal_daily',
	'total_daily',
	'total_monthly',
]);

export const complianceEventTypeEnum = pgEnum('compliance_event_type', [
	'consent_granted',
	'consent_revoked',
	'data_export_requested',
	'data_export_completed',
	'data_deletion_requested',
	'data_deletion_completed',
	'data_accessed',
	'data_modified',
	'limit_updated',
	'policy_acknowledged',
]);

// ========================================
// CONSENT TEMPLATES
// ========================================

/**
 * Templates for consent types with versioning
 */
export const consentTemplates = pgTable('consent_templates', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	consentType: consentTypeEnum('consent_type').notNull(),
	version: text('version').notNull().default('1.0'),

	// Portuguese content (Brazilian market)
	titlePt: text('title_pt').notNull(),
	descriptionPt: text('description_pt').notNull(),
	fullTextPt: text('full_text_pt').notNull(),

	// English fallback
	titleEn: text('title_en'),
	descriptionEn: text('description_en'),
	fullTextEn: text('full_text_en'),

	// Metadata
	isMandatory: boolean('is_mandatory').default(false),
	isActive: boolean('is_active').default(true),
	legalBasis: text('legal_basis'), // LGPD legal basis (consent, legitimate interest, etc.)

	// Validity
	effectiveFrom: timestamp('effective_from', {
		withTimezone: true,
	}).defaultNow(),
	effectiveUntil: timestamp('effective_until', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// LGPD CONSENTS
// ========================================

/**
 * User consent records for LGPD compliance
 */
export const lgpdConsents = pgTable(
	'lgpd_consents',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Consent details
		consentType: consentTypeEnum('consent_type').notNull(),
		purpose: text('purpose').notNull(),
		legalBasis: text('legal_basis').notNull(), // LGPD art. 7 legal basis

		// Status
		granted: boolean('granted').notNull().default(false),
		grantedAt: timestamp('granted_at', { withTimezone: true }),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),

		// Version tracking
		consentVersion: text('consent_version').notNull(),
		consentTextHash: text('consent_text_hash'), // SHA-256 of consent text

		// Collection context
		collectionMethod: collectionMethodEnum('collection_method').notNull(),
		ipAddress: inet('ip_address'),
		userAgent: text('user_agent'),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	},
	(table) => [
		uniqueIndex('lgpd_consents_user_type_version_idx').on(
			table.userId,
			table.consentType,
			table.consentVersion,
		),
	],
);

// ========================================
// DATA RETENTION POLICIES
// ========================================

/**
 * Data retention policies (LGPD compliance)
 */
export const dataRetentionPolicies = pgTable('data_retention_policies', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	// Policy details
	dataType: text('data_type').notNull().unique(), // voice_recordings, biometric_patterns, etc.
	description: text('description'),
	descriptionPt: text('description_pt'), // Portuguese description

	// Retention rules
	retentionMonths: integer('retention_months').notNull(),
	retentionPeriodLabel: text('retention_period_label'), // Human-readable (e.g., "5 anos")

	// Deletion behavior
	autoDelete: boolean('auto_delete').default(false),
	deletionMethod: text('deletion_method').default('hard_delete'), // hard_delete, anonymization
	legalHold: boolean('legal_hold').default(false), // Cannot be deleted if true

	// Legal reference
	legalBasis: text('legal_basis'), // LGPD article or other regulation
	legalRequirement: boolean('legal_requirement').default(false),

	// Status
	isActive: boolean('is_active').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// DATA DELETION REQUESTS
// ========================================

/**
 * Data deletion requests (LGPD right to erasure)
 */
export const dataDeletionRequests = pgTable('data_deletion_requests', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// Request details
	requestType: deletionRequestTypeEnum('request_type').notNull(),
	scope: jsonb('scope').default({}), // Specific data types to delete
	reason: text('reason'),

	// Status
	status: deletionRequestStatusEnum('status').default('pending'),

	// Verification (security)
	verificationCode: text('verification_code'),
	verifiedAt: timestamp('verified_at', { withTimezone: true }),

	// Processing
	reviewDeadline: timestamp('review_deadline', { withTimezone: true }), // 15 days per LGPD
	processedAt: timestamp('processed_at', { withTimezone: true }),
	processedBy: text('processed_by'),
	processingNotes: text('processing_notes'),

	// Legal hold
	legalHold: boolean('legal_hold').default(false),
	legalHoldReason: text('legal_hold_reason'),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// ENHANCED DATA EXPORT REQUESTS
// ========================================

/**
 * Data export requests (LGPD right to data portability)
 * Enhanced version with more fields for compliance service
 */
export const lgpdExportRequests = pgTable('lgpd_export_requests', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// Request details
	requestType: exportRequestTypeEnum('request_type').notNull(),
	format: exportFormatEnum('format').default('json'),

	// Date range filter
	dateFrom: date('date_from'),
	dateTo: date('date_to'),

	// Status
	status: exportStatusEnum('status').default('pending'),

	// Processing
	processedAt: timestamp('processed_at', { withTimezone: true }),
	downloadUrl: text('download_url'),
	downloadExpiresAt: timestamp('download_expires_at', { withTimezone: true }),
	fileSizeBytes: integer('file_size_bytes'),

	// Error handling
	errorMessage: text('error_message'),
	retryCount: integer('retry_count').default(0),

	// Request context
	requestedVia: text('requested_via').default('app'), // app, api, admin
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TRANSACTION LIMITS
// ========================================

/**
 * User transaction limits (BCB compliance + user preferences)
 */
export const transactionLimits = pgTable(
	'transaction_limits',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Limit type
		limitType: limitTypeEnum('limit_type').notNull(),

		// Limits (BRL)
		dailyLimit: decimal('daily_limit', { precision: 15, scale: 2 }).notNull(),
		transactionLimit: decimal('transaction_limit', { precision: 15, scale: 2 }),
		monthlyLimit: decimal('monthly_limit', { precision: 15, scale: 2 }),

		// Current usage (reset daily/monthly)
		currentDailyUsed: decimal('current_daily_used', {
			precision: 15,
			scale: 2,
		}).default('0'),
		currentMonthlyUsed: decimal('current_monthly_used', {
			precision: 15,
			scale: 2,
		}).default('0'),
		lastResetAt: timestamp('last_reset_at', {
			withTimezone: true,
		}).defaultNow(),

		// Time-based limits (PIX noturno, etc.)
		nighttimeLimit: decimal('nighttime_limit', { precision: 15, scale: 2 }), // 20:00-06:00
		nighttimeStart: text('nighttime_start').default('20:00'),
		nighttimeEnd: text('nighttime_end').default('06:00'),

		// Status
		isActive: boolean('is_active').default(true),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	},
	(table) => [uniqueIndex('transaction_limits_user_type_idx').on(table.userId, table.limitType)],
);

// ========================================
// COMPLIANCE AUDIT LOGS
// ========================================

/**
 * Compliance-specific audit logs (separate from general audit_logs)
 * LGPD requires 5-year retention for financial data
 */
export const complianceAuditLogs = pgTable('compliance_audit_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

	// Event details
	eventType: complianceEventTypeEnum('event_type').notNull(),
	resourceType: text('resource_type').notNull(), // Table or entity type
	resourceId: text('resource_id'),
	description: text('description'),

	// Event data
	metadata: jsonb('metadata').default({}),
	previousState: jsonb('previous_state'),
	newState: jsonb('new_state'),

	// Request context
	ipAddress: inet('ip_address'),
	userAgent: text('user_agent'),
	sessionId: text('session_id'),

	// Retention (LGPD 5-year requirement)
	retentionUntil: timestamp('retention_until', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// LEGAL HOLDS
// ========================================

/**
 * Legal holds preventing data deletion
 */
export const legalHolds = pgTable('legal_holds', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// Hold details
	reason: text('reason').notNull(),
	description: text('description'),
	referenceNumber: text('reference_number'), // Legal case number, etc.

	// Scope
	dataTypes: jsonb('data_types').default([]), // Specific data types under hold
	allData: boolean('all_data').default(false), // Hold all user data

	// Status
	active: boolean('active').default(true),

	// Timeline
	startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	releasedAt: timestamp('released_at', { withTimezone: true }),
	releasedBy: text('released_by'),
	releaseReason: text('release_reason'),

	// Audit
	createdBy: text('created_by').notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type ConsentTemplate = typeof consentTemplates.$inferSelect;
export type InsertConsentTemplate = typeof consentTemplates.$inferInsert;

export type LgpdConsent = typeof lgpdConsents.$inferSelect;
export type InsertLgpdConsent = typeof lgpdConsents.$inferInsert;

export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type InsertDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;

export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
export type InsertDataDeletionRequest = typeof dataDeletionRequests.$inferInsert;

export type LgpdExportRequest = typeof lgpdExportRequests.$inferSelect;
export type InsertLgpdExportRequest = typeof lgpdExportRequests.$inferInsert;

export type TransactionLimit = typeof transactionLimits.$inferSelect;
export type InsertTransactionLimit = typeof transactionLimits.$inferInsert;

export type ComplianceAuditLog = typeof complianceAuditLogs.$inferSelect;
export type InsertComplianceAuditLog = typeof complianceAuditLogs.$inferInsert;

export type LegalHold = typeof legalHolds.$inferSelect;
export type InsertLegalHold = typeof legalHolds.$inferInsert;

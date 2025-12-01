/**
 * Organizations Schema - Multi-Tenant Support
 *
 * Tables for organization-based multi-tenancy:
 * - organizations (main organization records)
 * - organization_members (user-organization relationships with roles)
 * - organization_settings (organization-specific configuration)
 * - organization_pix_keys (PIX keys per organization)
 * - organization_consent_templates (Custom LGPD consent templates per org)
 */

import {
	boolean,
	decimal,
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

export const organizationTypeEnum = pgEnum('organization_type', [
	'individual',
	'mei',
	'limited_company',
	'corporation',
	'association',
	'foundation',
]);

export const organizationStatusEnum = pgEnum('organization_status', [
	'active',
	'inactive',
	'suspended',
	'pending_verification',
]);

export const memberRoleEnum = pgEnum('member_role', [
	'admin',
	'member',
	'viewer',
	'finance_manager',
	'compliance_officer',
]);

export const memberStatusEnum = pgEnum('member_status', [
	'active',
	'invited',
	'suspended',
	'removed',
]);

export const pixKeyTypeEnum = pgEnum('pix_key_type', [
	'cpf',
	'cnpj',
	'email',
	'phone',
	'random_key',
]);

export const pixKeyStatusEnum = pgEnum('pix_key_status', [
	'active',
	'inactive',
	'pending',
	'revoked',
]);

// ========================================
// ORGANIZATIONS
// ========================================

/**
 * Main organizations table for multi-tenant support
 */
export const organizations = pgTable('organizations', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	// Basic organization info
	name: text('name').notNull(),
	tradeName: text('trade_name'),
	fantasyName: text('fantasy_name'), // Nome fantasia

	// Legal identifiers (Brazilian)
	cnpj: text('cnpj').unique(),
	// CNPJ validation should use brazilianLocalization.validateCNPJ
	stateRegistration: text('state_registration'), // Inscrição Estadual
	municipalRegistration: text('municipal_registration'), // Inscrição Municipal

	// Organization type and status
	organizationType: organizationTypeEnum('organization_type').notNull(),
	status: organizationStatusEnum('status').default('pending_verification'),

	// Contact information
	email: text('email'),
	phone: text('phone'),
	website: text('website'),

	// Address
	address: jsonb('address').default({}), // Brazilian address format

	// Financial information
	annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
	employeeCount: integer('employee_count'),
	industry: text('industry'),

	// Compliance
	lgpdOfficerId: text('lgpd_officer_id').references(() => users.id),
	complianceFramework: text('compliance_framework'), // LGPD, PCI-DSS, etc.

	// Subscription limits
	memberLimit: integer('member_limit').default(5),
	transactionLimit: decimal('transaction_limit', { precision: 15, scale: 2 }),

	// Branding (for white-label)
	primaryColor: text('primary_color'),
	secondaryColor: text('secondary_color'),
	logoUrl: text('logo_url'),
	faviconUrl: text('favicon_url'),

	// Metadata
	metadata: jsonb('metadata').default({}),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	verifiedAt: timestamp('verified_at', { withTimezone: true }),
	suspendedAt: timestamp('suspended_at', { withTimezone: true }),
});

// ========================================
// ORGANIZATION MEMBERS
// ========================================

/**
 * Organization members with roles and permissions
 */
export const organizationMembers = pgTable(
	'organization_members',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		organizationId: text('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Role and permissions
		role: memberRoleEnum('role').notNull(),
		status: memberStatusEnum('status').default('invited'),

		// Access control
		permissions: jsonb('permissions').default([]), // Additional permissions beyond role
		restrictedResources: jsonb('restricted_resources').default([]), // Resources this member cannot access

		// Invitation details
		invitedBy: text('invited_by').references(() => users.id),
		inviteToken: text('invite_token'),
		inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),
		invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow(),

		// Membership details
		title: text('title'), // Job title
		department: text('department'),
		costCenter: text('cost_center'),

		// Session and security
		lastLogin: timestamp('last_login', { withTimezone: true }),
		twoFactorRequired: boolean('two_factor_required').default(false),

		// Status management
		suspendedBy: text('suspended_by').references(() => users.id),
		suspendedAt: timestamp('suspended_at', { withTimezone: true }),
		suspensionReason: text('suspension_reason'),
		removedBy: text('removed_by').references(() => users.id),
		removedAt: timestamp('removed_at', { withTimezone: true }),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	},
	(table) => [
		uniqueIndex('org_members_org_user_idx').on(table.organizationId, table.userId),
		uniqueIndex('org_members_invite_token_idx').on(table.inviteToken),
	],
);

// ========================================
// ORGANIZATION SETTINGS
// ========================================

/**
 * Organization-specific settings and configurations
 */
export const organizationSettings = pgTable('organization_settings', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.references(() => organizations.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),

	// Locale and language
	defaultLanguage: text('default_language').default('pt-BR'),
	timezone: text('timezone').default('America/Sao_Paulo'),
	currency: text('currency').default('BRL'),
	dateFormat: text('date_format').default('dd/MM/yyyy'),

	// Financial settings
	defaultTransactionCategory: text('default_transaction_category'),
	budgetAlertsEnabled: boolean('budget_alerts_enabled').default(true),
	autoCategorizationEnabled: boolean('auto_categorization_enabled').default(true),

	// PIX settings
	pixDailyLimit: decimal('pix_daily_limit', { precision: 15, scale: 2 }),
	pixNighttimeLimit: decimal('pix_nighttime_limit', {
		precision: 15,
		scale: 2,
	}),
	pixNighttimeStart: text('pix_nighttime_start').default('20:00'),
	pixNighttimeEnd: text('pix_nighttime_end').default('06:00'),
	pixRequireApproval: boolean('pix_require_approval').default(false),
	pixApprovalThreshold: decimal('pix_approval_threshold', {
		precision: 15,
		scale: 2,
	}),

	// Banking integration
	plaidEnabled: boolean('plaid_enabled').default(false),
	openBankingEnabled: boolean('open_banking_enabled').default(false),

	// Security settings
	twoFactorRequired: boolean('two_factor_required').default(false),
	sessionTimeoutMinutes: integer('session_timeout_minutes').default(30),
	ipWhitelist: jsonb('ip_whitelist').default([]),

	// Compliance settings
	lgpdRetentionMonths: integer('lgpd_retention_months').default(60),
	dataExportEnabled: boolean('data_export_enabled').default(true),
	auditLogEnabled: boolean('audit_log_enabled').default(true),

	// Notification settings
	emailNotificationsEnabled: boolean('email_notifications_enabled').default(true),
	smsNotificationsEnabled: boolean('sms_notifications_enabled').default(false),
	pushNotificationsEnabled: boolean('push_notifications_enabled').default(true),

	// UI/UX settings
	theme: text('theme').default('light'), // light, dark, system
	compactMode: boolean('compact_mode').default(false),
	accessibilityHighContrast: boolean('accessibility_high_contrast').default(false),
	accessibilityLargeText: boolean('accessibility_large_text').default(false),

	// Custom branding
	customCss: text('custom_css'),
	customScripts: text('custom_scripts'),

	// Feature flags
	features: jsonb('features').default({}), // Feature flag overrides per organization

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// ORGANIZATION PIX KEYS
// ========================================

/**
 * PIX keys managed at organization level
 */
export const organizationPixKeys = pgTable(
	'organization_pix_keys',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		organizationId: text('organization_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),

		// Key details
		keyType: pixKeyTypeEnum('key_type').notNull(),
		keyValue: text('key_value').notNull(),

		// Account association
		bankName: text('bank_name').notNull(),
		bankCode: text('bank_code').notNull(),
		agencyNumber: text('agency_number'),
		accountNumber: text('account_number').notNull(),
		accountType: text('account_type'), // checking, savings, payment

		// Key metadata
		displayName: text('display_name').notNull(), // User-friendly name
		description: text('description'),
		isDefault: boolean('is_default').default(false),

		// Status and limits
		status: pixKeyStatusEnum('status').default('pending'),
		dailyLimit: decimal('daily_limit', { precision: 15, scale: 2 }),
		transactionLimit: decimal('transaction_limit', { precision: 15, scale: 2 }),

		// Ownership
		ownerId: text('owner_id').references(() => users.id),
		createdBy: text('created_by')
			.references(() => users.id)
			.notNull(),

		// Verification
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		verifiedBy: text('verified_by').references(() => users.id),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		revokedBy: text('revoked_by').references(() => users.id),

		// Metadata
		metadata: jsonb('metadata').default({}),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	},
	(table) => [uniqueIndex('org_pix_keys_org_key_idx').on(table.organizationId, table.keyValue)],
);

// ========================================
// ORGANIZATION CONSENT TEMPLATES
// ========================================

/**
 * Custom LGPD consent templates per organization
 */
export const organizationConsentTemplates = pgTable('organization_consent_templates', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: text('organization_id')
		.references(() => organizations.id, { onDelete: 'cascade' })
		.notNull(),

	// Template details
	name: text('name').notNull(),
	version: text('version').notNull().default('1.0'),
	consentType: text('consent_type').notNull(),

	// Portuguese content (primary for Brazilian market)
	titlePt: text('title_pt').notNull(),
	descriptionPt: text('description_pt').notNull(),
	fullTextPt: text('full_text_pt').notNull(),

	// English fallback
	titleEn: text('title_en'),
	descriptionEn: text('description_en'),
	fullTextEn: text('full_text_en'),

	// Template configuration
	isMandatory: boolean('is_mandatory').default(false),
	isActive: boolean('is_active').default(true),
	legalBasis: text('legal_basis'),
	retentionMonths: integer('retention_months'),

	// Display settings
	displayOnSignup: boolean('display_on_signup').default(false),
	displayInSettings: boolean('display_in_settings').default(true),
	requireExplicitAcceptance: boolean('require_explicit_acceptance').default(true),

	// Categories for granular consent
	categories: jsonb('categories').default([]), // Data categories this consent covers
	purposes: jsonb('purposes').default([]), // Specific purposes

	// Validity
	effectiveFrom: timestamp('effective_from', {
		withTimezone: true,
	}).defaultNow(),
	effectiveUntil: timestamp('effective_until', { withTimezone: true }),

	// Metadata
	createdBy: text('created_by')
		.references(() => users.id)
		.notNull(),
	approvedBy: text('approved_by').references(() => users.id),
	approvedAt: timestamp('approved_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

export type OrganizationSetting = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSetting = typeof organizationSettings.$inferInsert;

export type OrganizationPixKey = typeof organizationPixKeys.$inferSelect;
export type InsertOrganizationPixKey = typeof organizationPixKeys.$inferInsert;

export type OrganizationConsentTemplate = typeof organizationConsentTemplates.$inferSelect;
export type InsertOrganizationConsentTemplate = typeof organizationConsentTemplates.$inferInsert;

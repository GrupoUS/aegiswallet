/**
 * Users Schema - User Management & Authentication
 *
 * Migrated from Supabase to Drizzle ORM with Clerk Auth
 * - User ID is now TEXT (Clerk user_id format: "user_xxx")
 * - RLS policies replaced by application-level authorization
 */

import {
	boolean,
	date,
	integer,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

// ========================================
// USER PROFILES
// ========================================

/**
 * Main user profiles table
 * Extends Clerk auth with Brazilian-specific fields
 */
export const users = pgTable('users', {
	// Clerk user_id (format: "user_xxx") - replaces Supabase auth.users UUID
	id: text('id').primaryKey(),

	// Basic info
	email: text('email').unique().notNull(),
	fullName: text('full_name'),
	phone: text('phone'),

	// Brazilian-specific fields (LGPD sensitive)
	cpf: text('cpf').unique(),
	birthDate: date('birth_date'),

	// AegisWallet-specific settings
	autonomyLevel: integer('autonomy_level').default(50),
	voiceCommandEnabled: boolean('voice_command_enabled').default(true),
	language: text('language').default('pt-BR'),
	timezone: text('timezone').default('America/Sao_Paulo'),
	currency: text('currency').default('BRL'),
	profileImageUrl: text('profile_image_url'),

	// Status
	isActive: boolean('is_active').default(true),
	lastLogin: timestamp('last_login', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// USER PREFERENCES
// ========================================

/**
 * User preferences and settings
 */
export const userPreferences = pgTable('user_preferences', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Theme
	theme: text('theme').default('system'), // light, dark, system

	// Notifications
	notificationsEmail: boolean('notifications_email').default(true),
	notificationsPush: boolean('notifications_push').default(true),
	notificationsSms: boolean('notifications_sms').default(false),

	// Features
	autoCategorize: boolean('auto_categorize').default(true),
	budgetAlerts: boolean('budget_alerts').default(true),
	voiceFeedback: boolean('voice_feedback').default(true),

	// Accessibility (WCAG 2.1 AA+)
	accessibilityHighContrast: boolean('accessibility_high_contrast').default(
		false,
	),
	accessibilityLargeText: boolean('accessibility_large_text').default(false),
	accessibilityScreenReader: boolean('accessibility_screen_reader').default(
		false,
	),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// USER SECURITY
// ========================================

/**
 * User security settings
 * Note: Most auth security is handled by Clerk
 */
export const userSecurity = pgTable('user_security', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Biometric (app-level)
	biometricEnabled: boolean('biometric_enabled').default(false),

	// 2FA (Clerk handles this, but we track preference)
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
	twoFactorSecret: text('two_factor_secret'),

	// Voice biometric (AegisWallet-specific)
	voiceBiometricEnabled: boolean('voice_biometric_enabled').default(false),
	voiceSampleEncrypted: text('voice_sample_encrypted'),

	// Session settings
	sessionTimeoutMinutes: integer('session_timeout_minutes').default(30),
	maxFailedAttempts: integer('max_failed_attempts').default(5),
	lockedUntil: timestamp('locked_until', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

export type UserSecurity = typeof userSecurity.$inferSelect;
export type InsertUserSecurity = typeof userSecurity.$inferInsert;

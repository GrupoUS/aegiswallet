/**
 * @fileoverview User domain schema - Core user tables for AegisWallet
 * @module db/schema/users
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  inet,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
// Reference to auth.users (Supabase managed)
export const authUsers = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 255 }),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  () => []
);
/**
 * Public users table - Extended user profile data
 * References auth.users via id FK
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id),
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  cpf: text('cpf').unique(),
  birthDate: date('birth_date'),
  autonomyLevel: integer('autonomy_level').default(50),
  voiceCommandEnabled: boolean('voice_command_enabled').default(true),
  language: text('language').default('pt-BR'),
  timezone: text('timezone').default('America/Sao_Paulo'),
  currency: text('currency').default('BRL'),
  profileImageUrl: text('profile_image_url'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * User preferences - Theme, notifications, accessibility
 */
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id')
    .unique()
    .references(() => users.id),
  theme: text('theme').default('system'),
  notificationsEmail: boolean('notifications_email').default(true),
  notificationsPush: boolean('notifications_push').default(true),
  notificationsSms: boolean('notifications_sms').default(false),
  autoCategorize: boolean('auto_categorize').default(true),
  budgetAlerts: boolean('budget_alerts').default(true),
  voiceFeedback: boolean('voice_feedback').default(true),
  accessibilityHighContrast: boolean('accessibility_high_contrast').default(false),
  accessibilityLargeText: boolean('accessibility_large_text').default(false),
  accessibilityScreenReader: boolean('accessibility_screen_reader').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * User activity tracking for retention policy calculations
 */
export const userActivity = pgTable('user_activity', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  activityData: jsonb('activity_data'),
  lastActivity: timestamp('last_activity', { withTimezone: true }).default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * LGPD consent records with version tracking
 */
export const userConsent = pgTable('user_consent', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id),
  consentType: varchar('consent_type', { length: 100 }).notNull(),
  granted: boolean('granted').default(false).notNull(),
  consentVersion: varchar('consent_version', { length: 20 }).default('1.0.0'),
  consentDate: timestamp('consent_date', { withTimezone: true }).default(sql`now()`),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * User PIN storage for additional authentication
 */
export const userPins = pgTable('user_pins', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => authUsers.id),
  pinHash: text('pin_hash').notNull(),
  salt: text('salt').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * User security preferences for authentication
 */
export const userSecurityPreferences = pgTable('user_security_preferences', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => authUsers.id),
  requireBiometric: boolean('require_biometric').default(false),
  requireOtpForSensitiveOperations: boolean('require_otp_for_sensitive_operations').default(true),
  sessionTimeoutMinutes: integer('session_timeout_minutes').default(30),
  maxFailedAttempts: integer('max_failed_attempts').default(5),
  lockoutDurationMinutes: integer('lockout_duration_minutes').default(15),
  enablePushNotifications: boolean('enable_push_notifications').default(true),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

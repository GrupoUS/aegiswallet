/**
 * @fileoverview Authentication and security schema - Auth, sessions, security events
 * @module db/schema/auth
 */

import { sql } from 'drizzle-orm'
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
} from 'drizzle-orm/pg-core'

// Forward reference to auth.users
const authUsersRef = () => import('./users').then(m => m.authUsers)

/**
 * Authentication attempts tracking for rate limiting
 */
export const authAttempts = pgTable('auth_attempts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  method: text('method').notNull(), // platform, pin, sms, push
  failedAttempts: integer('failed_attempts').default(0),
  isLocked: boolean('is_locked').default(false),
  lockoutUntil: timestamp('lockout_until', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }).default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * User authentication sessions
 */
export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  sessionToken: text('session_token').unique().notNull(),
  method: text('method').notNull(), // platform, pin, sms, push
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  lastActivity: timestamp('last_activity', { withTimezone: true }).default(sql`now()`),
})


/**
 * Biometric credentials for WebAuthn
 */
export const biometricCredentials = pgTable('biometric_credentials', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  credentialId: text('credential_id').notNull(),
  credentialType: text('credential_type').default('public-key'),
  publicKey: text('public_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * OTP codes for SMS verification
 */
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  phoneNumber: text('phone_number').notNull(),
  otpCode: text('otp_code').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isUsed: boolean('is_used').default(false),
  usedAt: timestamp('used_at', { withTimezone: true }),
  attempts: integer('attempts').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Push authentication requests
 */
export const pushAuthRequests = pgTable('push_auth_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  pushToken: text('push_token').unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: text('status').default('pending'), // pending, approved, denied, expired
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Security events log
 */
export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  eventType: text('event_type').notNull(),
  method: text('method'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  riskScore: numeric('risk_score').default(sql`0`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Security alerts for users
 */
export const securityAlerts = pgTable('security_alerts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(), // low, medium, high, critical
  title: text('title').notNull(),
  description: text('description'),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
})

/**
 * Fraud detection rules
 */
export const fraudDetectionRules = pgTable('fraud_detection_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ruleType: text('rule_type').notNull(),
  threshold: numeric('threshold').notNull(),
  enabled: boolean('enabled').default(true),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
})

// Type exports
export type AuthAttempt = typeof authAttempts.$inferSelect
export type AuthSession = typeof authSessions.$inferSelect
export type SecurityEvent = typeof securityEvents.$inferSelect
export type SecurityAlert = typeof securityAlerts.$inferSelect

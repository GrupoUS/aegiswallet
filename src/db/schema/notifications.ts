/**
 * Notifications Schema - Notifications & Alerts
 *
 * Migrated from Supabase to Drizzle ORM
 * User notifications, alert rules, and delivery logs
 */

import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// NOTIFICATIONS
// ========================================

/**
 * User notifications and alerts
 */
export const notifications = pgTable('notifications', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Notification content
	title: text('title').notNull(),
	message: text('message').notNull(),

	// Type and category
	type: text('type').notNull(), // info, warning, error, success
	category: text('category'), // transaction, calendar, budget, security, system
	priority: text('priority').default('normal'), // low, normal, high, urgent

	// Status
	isRead: boolean('is_read').default(false),
	readAt: timestamp('read_at', { withTimezone: true }),

	// Action
	actionUrl: text('action_url'),
	actionText: text('action_text'),

	// Metadata
	metadata: jsonb('metadata'),

	// Validity
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// ALERT RULES
// ========================================

/**
 * Custom alert rules for automated monitoring
 */
export const alertRules = pgTable('alert_rules', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Rule info
	ruleName: text('rule_name').notNull(),
	ruleType: text('rule_type').notNull(), // budget_threshold, large_transaction, unusual_activity

	// Configuration
	conditions: jsonb('conditions').notNull(),
	actions: jsonb('actions').notNull(),

	// Status
	isActive: boolean('is_active').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// NOTIFICATION LOGS
// ========================================

/**
 * Delivery logs for notifications
 */
export const notificationLogs = pgTable('notification_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	notificationId: text('notification_id').references(() => notifications.id, {
		onDelete: 'cascade',
	}),

	// Delivery info
	deliveryMethod: text('delivery_method').notNull(), // push, email, sms, voice
	status: text('status').notNull(), // sent, delivered, failed, bounced

	// Timing
	sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
	deliveredAt: timestamp('delivered_at', { withTimezone: true }),

	// Error info
	errorMessage: text('error_message'),
	externalId: text('external_id'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Type for alert rule conditions
 */
export type AlertRuleConditions = {
	threshold?: number;
	categoryIds?: string[];
	amountMin?: number;
	amountMax?: number;
	timeframe?: 'day' | 'week' | 'month';
};

/**
 * Type for alert rule actions
 */
export type AlertRuleActions = {
	sendNotification?: boolean;
	sendEmail?: boolean;
	sendSms?: boolean;
	sendVoice?: boolean;
	customMessage?: string;
};

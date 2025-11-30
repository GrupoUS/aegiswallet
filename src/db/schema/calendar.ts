/**
 * Calendar Schema - Financial Calendar & Events
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Calendar events for bills, payments, and income
 */

import {
	boolean,
	date,
	decimal,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

import { bankAccounts } from './bank-accounts';
import { transactionCategories, transactions } from './transactions';
import { users } from './users';

// ========================================
// EVENT TYPES
// ========================================

/**
 * Types of financial events for calendar
 */
export const eventTypes = pgTable('event_types', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	// Type info
	name: text('name').unique().notNull(),
	description: text('description'),
	color: text('color').default('#3B82F6'),
	icon: text('icon').default('calendar'),

	// Settings
	isSystem: boolean('is_system').default(true),
	defaultReminderHours: integer('default_reminder_hours').default(24),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// FINANCIAL EVENTS
// ========================================

/**
 * Calendar events for bills, payments, and income
 */
export const financialEvents = pgTable('financial_events', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	accountId: text('account_id').references(() => bankAccounts.id, {
		onDelete: 'set null',
	}),
	categoryId: text('category_id').references(() => transactionCategories.id, {
		onDelete: 'set null',
	}),
	eventTypeId: text('event_type_id').references(() => eventTypes.id, {
		onDelete: 'set null',
	}),

	// Event info
	title: text('title').notNull(),
	description: text('description'),
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),

	// Status
	status: text('status').notNull().default('pending'), // pending, paid, scheduled, cancelled, completed

	// Dates
	startDate: timestamp('start_date', { withTimezone: true }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true }).notNull(),
	allDay: boolean('all_day').default(false),

	// Appearance
	color: text('color').notNull().default('blue'),
	icon: text('icon'),

	// Type flags
	isIncome: boolean('is_income').default(false),
	isCompleted: boolean('is_completed').default(false),

	// Recurring
	isRecurring: boolean('is_recurring').default(false),
	recurrenceRule: text('recurrence_rule'),
	parentEventId: text('parent_event_id'), // Self-reference for recurring instances

	// Additional info
	location: text('location'),
	notes: text('notes'),
	dueDate: date('due_date'),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	priority: text('priority').default('normal'),

	// Metadata
	tags: text('tags').array(),
	attachments: text('attachments').array(),

	// Brazilian-specific
	brazilianEventType: text('brazilian_event_type'),
	installmentInfo: jsonb('installment_info'),
	merchantCategory: text('merchant_category'),
	metadata: jsonb('metadata'),

	// Link to executed transaction
	transactionId: text('transaction_id').references(() => transactions.id, {
		onDelete: 'set null',
	}),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// EVENT REMINDERS
// ========================================

/**
 * Reminders for financial events
 */
export const eventReminders = pgTable('event_reminders', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	eventId: text('event_id').references(() => financialEvents.id, {
		onDelete: 'cascade',
	}),

	// Reminder details
	remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
	reminderType: text('reminder_type').default('notification'), // notification, email, sms, voice
	message: text('message'),

	// Status
	isSent: boolean('is_sent').default(false),
	sentAt: timestamp('sent_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type EventType = typeof eventTypes.$inferSelect;
export type InsertEventType = typeof eventTypes.$inferInsert;

export type FinancialEvent = typeof financialEvents.$inferSelect;
export type InsertFinancialEvent = typeof financialEvents.$inferInsert;

export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = typeof eventReminders.$inferInsert;

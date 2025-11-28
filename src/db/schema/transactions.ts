/**
 * Transactions Schema - Financial Data
 *
 * Migrated from Supabase to Drizzle ORM
 * All financial transactions including debits, credits, transfers
 */

import {
	boolean,
	date,
	decimal,
	jsonb,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

import { bankAccounts } from './bank-accounts';
import { users } from './users';

// ========================================
// TRANSACTION CATEGORIES
// ========================================

/**
 * Transaction categories (user-defined and system)
 */
export const transactionCategories = pgTable('transaction_categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Category info
	name: text('name').notNull(),
	color: text('color').default('#6B7280'),
	icon: text('icon').default('circle'),

	// Type
	isSystem: boolean('is_system').default(false),
	parentId: text('parent_id'), // Self-reference for subcategories

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TRANSACTIONS
// ========================================

/**
 * All financial transactions
 */
export const transactions = pgTable('transactions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('account_id').references(() => bankAccounts.id, {
		onDelete: 'set null',
	}),
	categoryId: text('category_id').references(() => transactionCategories.id, {
		onDelete: 'set null',
	}),

	// Amount
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	originalAmount: decimal('original_amount', { precision: 15, scale: 2 }),
	currency: text('currency').default('BRL'),

	// Description
	description: text('description').notNull(),
	merchantName: text('merchant_name'),

	// Dates
	transactionDate: timestamp('transaction_date', {
		withTimezone: true,
	}).notNull(),
	postedDate: timestamp('posted_date', { withTimezone: true }),

	// Type & Method
	transactionType: text('transaction_type').notNull(), // debit, credit, transfer, pix, boleto
	paymentMethod: text('payment_method'), // debit_card, credit_card, pix, boleto, cash
	status: text('status').default('posted'), // pending, posted, failed, cancelled

	// Recurring
	isRecurring: boolean('is_recurring').default(false),
	recurringRule: jsonb('recurring_rule'), // RRULE for recurring transactions

	// Metadata
	tags: text('tags').array(),
	notes: text('notes'),
	attachments: text('attachments').array(),

	// AI categorization
	confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
	isCategorized: boolean('is_categorized').default(false),

	// Source
	isManualEntry: boolean('is_manual_entry').default(false),
	externalId: text('external_id'),
	externalSource: text('external_source'), // belvo, manual, import

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TRANSACTION SCHEDULES
// ========================================

/**
 * Scheduled future payments and transfers
 */
export const transactionSchedules = pgTable('transaction_schedules', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('account_id').references(() => bankAccounts.id, {
		onDelete: 'set null',
	}),
	categoryId: text('category_id').references(() => transactionCategories.id, {
		onDelete: 'set null',
	}),

	// Amount
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	description: text('description').notNull(),

	// Recipient
	recipientName: text('recipient_name'),
	recipientAccount: text('recipient_account'),
	recipientPixKey: text('recipient_pix_key'),

	// Schedule
	scheduledDate: date('scheduled_date').notNull(),
	recurrenceRule: text('recurrence_rule'), // RRULE format

	// Status
	isActive: boolean('is_active').default(true),
	autoExecute: boolean('auto_execute').default(false),
	notificationSent: boolean('notification_sent').default(false),
	executed: boolean('executed').default(false),
	executedTransactionId: text('executed_transaction_id').references(
		() => transactions.id,
	),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type TransactionCategory = typeof transactionCategories.$inferSelect;
export type InsertTransactionCategory =
	typeof transactionCategories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type TransactionSchedule = typeof transactionSchedules.$inferSelect;
export type InsertTransactionSchedule =
	typeof transactionSchedules.$inferInsert;

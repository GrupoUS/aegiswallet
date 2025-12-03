/**
 * Bank Accounts Schema - Banking & Integration
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Includes Belvo integration support
 */

import { boolean, decimal, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// BANK ACCOUNTS
// ========================================

/**
 * Bank accounts integrated via Belvo API
 */
export const bankAccounts = pgTable('bank_accounts', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

	// Belvo integration
	belvoAccountId: text('belvo_account_id').unique().notNull(),
	institutionId: text('institution_id').notNull(),
	institutionName: text('institution_name').notNull(),

	// Account details
	accountType: text('account_type').notNull(), // CHECKING, SAVINGS, INVESTMENT
	accountNumber: text('account_number'),
	accountMask: text('account_mask').notNull(),
	accountHolderName: text('account_holder_name'),

	// Balances
	balance: decimal('balance', { precision: 15, scale: 2 }).default('0'),
	availableBalance: decimal('available_balance', {
		precision: 15,
		scale: 2,
	}).default('0'),
	currency: text('currency').default('BRL'),

	// Status
	isActive: boolean('is_active').default(true),
	isPrimary: boolean('is_primary').default(false),

	// Sync info
	lastSync: timestamp('last_sync', { withTimezone: true }),
	syncStatus: text('sync_status').default('pending'), // pending, success, error
	syncErrorMessage: text('sync_error_message'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// ACCOUNT BALANCE HISTORY
// ========================================

/**
 * Historical balance snapshots for analytics
 */
export const accountBalanceHistory = pgTable('account_balance_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	accountId: text('account_id').references(() => bankAccounts.id, {
		onDelete: 'cascade',
	}),

	// Balance snapshot
	balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
	availableBalance: decimal('available_balance', { precision: 15, scale: 2 }),

	// Metadata
	recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
	source: text('source').default('sync'), // sync, manual, correction
});

// ========================================
// BANK SYNC LOGS
// ========================================

/**
 * Synchronization logs for bank account integrations
 */
export const bankSyncLogs = pgTable('bank_sync_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('account_id').references(() => bankAccounts.id, {
		onDelete: 'cascade',
	}),

	// Sync details
	syncType: text('sync_type').notNull(), // full, incremental, balance_only
	status: text('status').notNull(), // started, success, error, partial
	recordsSynced: integer('records_synced').default(0),
	errorMessage: text('error_message'),

	// Timing
	startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	durationMs: integer('duration_ms'),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

export type AccountBalanceHistory = typeof accountBalanceHistory.$inferSelect;
export type InsertAccountBalanceHistory = typeof accountBalanceHistory.$inferInsert;

export type BankSyncLog = typeof bankSyncLogs.$inferSelect;
export type InsertBankSyncLog = typeof bankSyncLogs.$inferInsert;

/**
 * @fileoverview Financial transactions and events schema
 * @module db/schema/transactions
 */

import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Financial categories for transaction classification
 */
export const financialCategories = pgTable('financial_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 20 }).default('#3B82F6'),
  icon: varchar('icon', { length: 50 }).default('default'),
  parentId: uuid('parent_id').references((): AnyPgColumn => financialCategories.id),
  isSystem: boolean('is_system').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Event types for financial calendar
 */
export const eventTypes = pgTable('event_types', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').unique().notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('calendar'),
  isSystem: boolean('is_system').default(true),
  defaultReminderHours: integer('default_reminder_hours').default(24),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Financial events - Calendar items for income, expenses, bills
 */
export const financialEvents = pgTable('financial_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  category: text('category'),
  eventType: text('event_type').notNull(), // income, expense, bill, scheduled, transfer
  status: text('status').default('pending'), // pending, paid, scheduled, cancelled
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  allDay: boolean('all_day').default(false),
  color: text('color').default('blue'),
  icon: text('icon'),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: text('recurrence_rule'),
  parentEventId: uuid('parent_event_id').references((): AnyPgColumn => financialEvents.id),
  location: text('location'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  isIncome: boolean('is_income').default(false),
  dueDate: date('due_date'),
  priority: text('priority').default('normal'),
  tags: text('tags').array(),
  attachments: text('attachments').array(),
  brazilianEventType: text('brazilian_event_type'),
  merchantCategory: text('merchant_category'),
  installmentInfo: jsonb('installment_info').default(sql`'{}'::jsonb`),
  eventTypeId: uuid('event_type_id').references(() => eventTypes.id),
});

/**
 * Event reminders for notifications
 */
export const eventReminders = pgTable('event_reminders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  eventId: uuid('event_id').references(() => financialEvents.id),
  reminderType: text('reminder_type').default('notification'),
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  message: text('message'),
  isSent: boolean('is_sent').default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Transactions - Normalized list of user transactions
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  accountId: uuid('account_id'),
  categoryId: uuid('category_id').references(() => financialCategories.id),
  amount: numeric('amount').notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).default(sql`now()`),
  transactionType: text('transaction_type'), // debit, credit, transfer, pix, boleto
  status: text('status').default('posted'), // pending, posted, failed, cancelled
  merchantName: text('merchant_name'),
  isManualEntry: boolean('is_manual_entry').default(true),
  currency: text('currency').default('BRL'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Financial accounts - User bank accounts
 */
export const financialAccounts = pgTable('financial_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // checking, savings, credit, investment, cash
  provider: varchar('provider', { length: 255 }),
  balance: numeric('balance').default(sql`0.00`),
  currency: varchar('currency', { length: 10 }).default('BRL'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Budget categories with spending limits
 */
export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => financialCategories.id),
  budgetAmount: numeric('budget_amount').notNull(),
  budgetPeriod: text('budget_period').notNull(), // daily, weekly, monthly, yearly
  currentSpent: numeric('current_spent').default(sql`0`),
  rolloverEnabled: boolean('rollover_enabled').default(false),
  rolloverAmount: numeric('rollover_amount').default(sql`0`),
  alertThreshold: numeric('alert_threshold').default(sql`0.80`),
  alertSent: boolean('alert_sent').default(false),
  color: text('color').default('#3B82F6'),
  icon: text('icon').default('wallet'),
  isActive: boolean('is_active').default(true),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Spending patterns - Cached analytics for AI context
 */
export const spendingPatterns = pgTable('spending_patterns', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  patternType: text('pattern_type').notNull(),
  category: text('category'),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  totalAmount: numeric('total_amount'),
  transactionCount: integer('transaction_count'),
  averageAmount: numeric('average_amount'),
  minAmount: numeric('min_amount'),
  maxAmount: numeric('max_amount'),
  trendDirection: text('trend_direction'), // up, down, stable
  trendPercentage: numeric('trend_percentage'),
  patternData: jsonb('pattern_data').default(sql`'{}'::jsonb`),
  previousPeriodAmount: numeric('previous_period_amount'),
  changePercentage: numeric('change_percentage'),
  confidenceScore: numeric('confidence_score'),
  lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true }).default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Financial snapshots - Historical data for AI chat and reporting
 */
export const financialSnapshots = pgTable('financial_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  snapshotType: text('snapshot_type').notNull(),
  snapshotDate: date('snapshot_date').notNull(),
  totalBalance: numeric('total_balance'),
  totalIncome: numeric('total_income'),
  totalExpenses: numeric('total_expenses'),
  netCashflow: numeric('net_cashflow'),
  accountBalances: jsonb('account_balances').default(sql`'[]'::jsonb`),
  categorySpending: jsonb('category_spending').default(sql`'[]'::jsonb`),
  upcomingBills: jsonb('upcoming_bills').default(sql`'[]'::jsonb`),
  upcomingIncome: jsonb('upcoming_income').default(sql`'[]'::jsonb`),
  transactionCount: integer('transaction_count'),
  largestExpense: jsonb('largest_expense'),
  largestIncome: jsonb('largest_income'),
  recentTransactions: jsonb('recent_transactions').default(sql`'[]'::jsonb`),
  spendingTrends: jsonb('spending_trends').default(sql`'{}'::jsonb`),
  dataVersion: integer('data_version').default(1),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// Type exports
export type FinancialCategory = typeof financialCategories.$inferSelect;
export type FinancialEvent = typeof financialEvents.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type SpendingPattern = typeof spendingPatterns.$inferSelect;

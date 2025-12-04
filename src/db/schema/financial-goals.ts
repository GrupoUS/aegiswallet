/**
 * Financial Goals Schema
 *
 * Drizzle ORM schema for user financial goals and targets.
 * Supports tracking savings goals, debt payoff, emergency funds, etc.
 */

import { boolean, decimal, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// FINANCIAL GOALS
// ========================================

/**
 * User financial goals with progress tracking
 */
export const financialGoals = pgTable('financial_goals', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),

	// Goal details
	name: text('name').notNull(),
	description: text('description'),

	// Financial targets
	targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
	currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0'),

	// Timeline
	targetDate: timestamp('target_date', { withTimezone: true }),

	// Categorization
	category: text('category'), // emergency_fund, savings, debt_payoff, investment, travel, education, retirement, other

	// Priority (1 = highest, 5 = lowest)
	priority: text('priority').default('3'), // 1, 2, 3, 4, 5

	// Status flags
	isActive: boolean('is_active').default(true),
	isCompleted: boolean('is_completed').default(false),
	completedAt: timestamp('completed_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPES
// ========================================

export type FinancialGoal = typeof financialGoals.$inferSelect;
export type InsertFinancialGoal = typeof financialGoals.$inferInsert;

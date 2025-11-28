/**
 * Billing Schema - Subscription & Payment Management
 *
 * Integrates with Stripe for Brazilian market (BRL currency)
 * LGPD: Payment data is sensitive and follows retention policies
 */

import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// ENUMS
// ========================================

export const subscriptionStatusEnum = pgEnum('subscription_status', [
	'free',
	'trialing',
	'active',
	'past_due',
	'canceled',
	'unpaid',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
	'succeeded',
	'failed',
	'pending',
]);

// ========================================
// SUBSCRIPTION PLANS
// ========================================

/**
 * Available subscription plans
 * Seeded with: free, basic, advanced
 */
export const subscriptionPlans = pgTable('subscription_plans', {
	id: text('id').primaryKey(), // 'free', 'basic', 'advanced'
	name: text('name').notNull(), // 'Gratuito', 'Básico', 'Avançado'
	description: text('description'),

	// Pricing (in cents, BRL)
	priceCents: integer('price_cents').notNull().default(0),
	currency: text('currency').notNull().default('BRL'),
	interval: text('interval'), // 'month', 'year', null for free

	// Stripe integration
	stripeProductId: text('stripe_product_id'),
	stripePriceId: text('stripe_price_id'),

	// Plan features (JSONB for flexibility)
	features: jsonb('features').$type<string[]>().default([]),
	aiModels: jsonb('ai_models').$type<string[]>().default([]),

	// Limits
	maxBankAccounts: integer('max_bank_accounts').default(1),
	maxTransactionsPerMonth: integer('max_transactions_per_month'),

	// Status
	isActive: boolean('is_active').default(true),
	displayOrder: integer('display_order').default(0),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// USER SUBSCRIPTIONS
// ========================================

/**
 * User subscription records
 * Links Clerk user to Stripe subscription
 * LGPD: Sensitive billing data - follow retention policies
 */
export const subscriptions = pgTable('subscriptions', {
	id: uuid('id').primaryKey().defaultRandom(),

	// User reference (Clerk user_id)
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),

	// Stripe references
	stripeCustomerId: text('stripe_customer_id'),
	stripeSubscriptionId: text('stripe_subscription_id').unique(),

	// Plan reference
	planId: text('plan_id')
		.notNull()
		.default('free')
		.references(() => subscriptionPlans.id),

	// Subscription status
	status: subscriptionStatusEnum('status').notNull().default('free'),

	// Billing period
	currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
	currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),

	// Cancellation
	cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
	canceledAt: timestamp('canceled_at', { withTimezone: true }),

	// Trial
	trialStart: timestamp('trial_start', { withTimezone: true }),
	trialEnd: timestamp('trial_end', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// PAYMENT HISTORY
// ========================================

/**
 * Payment transaction history
 * LGPD: Sensitive financial data - retain per legal requirements
 */
export const paymentHistory = pgTable('payment_history', {
	id: uuid('id').primaryKey().defaultRandom(),

	// User reference
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),

	// Subscription reference (optional - for subscription payments)
	subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
		onDelete: 'set null',
	}),

	// Stripe references
	stripePaymentIntentId: text('stripe_payment_intent_id'),
	stripeInvoiceId: text('stripe_invoice_id'),
	stripeChargeId: text('stripe_charge_id'),

	// Payment details
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull().default('BRL'),
	status: paymentStatusEnum('status').notNull(),

	// Metadata
	description: text('description'),
	receiptUrl: text('receipt_url'),
	invoicePdf: text('invoice_pdf'),

	// Failure details
	failureCode: text('failure_code'),
	failureMessage: text('failure_message'),

	// Timestamp
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;

export type SubscriptionStatus =
	(typeof subscriptionStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

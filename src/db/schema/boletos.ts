/**
 * Boletos Schema - Brazilian Payment Slips
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Brazilian payment slips (boletos)
 */

import {
	date,
	decimal,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

import { transactions } from './transactions';
import { users } from './users';

// ========================================
// ENUMS
// ========================================

export const boletoStatusEnum = pgEnum('boleto_status', [
	'pending',
	'paid',
	'overdue',
	'cancelled',
	'scheduled',
]);

// ========================================
// BOLETOS
// ========================================

/**
 * Brazilian payment slips (boletos)
 */
export const boletos = pgTable('boletos', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Boleto identification
	barcode: text('barcode').unique().notNull(),
	lineIdDigitable: text('line_id_digitable').unique().notNull(),

	// Amount
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),

	// Due date
	dueDate: date('due_date').notNull(),

	// Beneficiary info
	beneficiaryName: text('beneficiary_name').notNull(),
	beneficiaryCnpj: text('beneficiary_cnpj'),
	description: text('description'),

	// Status
	status: text('status').default('pending'), // pending, paid, overdue, cancelled, scheduled

	// Payment info
	paymentDate: timestamp('payment_date', { withTimezone: true }),
	paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }),
	paidWith: text('paid_with'), // balance, credit_card, etc.
	transactionId: text('transaction_id').references(() => transactions.id),

	// Additional fees
	fineAmount: decimal('fine_amount', { precision: 15, scale: 2 }).default('0'),
	interestAmount: decimal('interest_amount', {
		precision: 15,
		scale: 2,
	}).default('0'),
	discountAmount: decimal('discount_amount', {
		precision: 15,
		scale: 2,
	}).default('0'),

	// PDF
	pdfUrl: text('pdf_url'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// BOLETO PAYMENTS
// ========================================

/**
 * Payment records for boletos
 */
export const boletoPayments = pgTable('boleto_payments', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	boletoId: text('boleto_id').references(() => boletos.id, {
		onDelete: 'cascade',
	}),

	// Payment details
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	paymentDate: timestamp('payment_date', { withTimezone: true }).defaultNow(),
	paymentMethod: text('payment_method').notNull(),
	transactionId: text('transaction_id').references(() => transactions.id),

	// Status
	status: text('status').default('processing'), // processing, completed, failed
	externalId: text('external_id'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type Boleto = typeof boletos.$inferSelect;
export type InsertBoleto = typeof boletos.$inferInsert;

export type BoletoPayment = typeof boletoPayments.$inferSelect;
export type InsertBoletoPayment = typeof boletoPayments.$inferInsert;

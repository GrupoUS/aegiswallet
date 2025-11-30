/**
 * PIX Schema - Brazilian Instant Payment System
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * PIX keys, transactions, and QR codes
 */

import {
	boolean,
	decimal,
	integer,
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

export const pixKeyTypeEnum = pgEnum('pix_key_type', [
	'CPF',
	'CNPJ',
	'EMAIL',
	'PHONE',
	'RANDOM',
]);
export const pixTransactionStatusEnum = pgEnum('pix_transaction_status', [
	'pending',
	'processing',
	'completed',
	'failed',
	'cancelled',
	'reversed',
]);
export const pixTransactionTypeEnum = pgEnum('pix_transaction_type_enum', [
	'sent',
	'received',
	'scheduled',
]);

// ========================================
// PIX KEYS
// ========================================

/**
 * PIX keys for instant Brazilian payments
 */
export const pixKeys = pgTable('pix_keys', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Key details
	keyType: text('key_type').notNull(), // CPF, CNPJ, EMAIL, PHONE, RANDOM
	keyValue: text('key_value').notNull(),
	keyName: text('key_name').notNull(),
	bankName: text('bank_name'),

	// Status
	isFavorite: boolean('is_favorite').default(false),
	isActive: boolean('is_active').default(true),
	verificationStatus: text('verification_status').default('pending'), // pending, verified, rejected

	// Usage stats
	lastUsed: timestamp('last_used', { withTimezone: true }),
	usageCount: integer('usage_count').default(0),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// PIX QR CODES
// ========================================

/**
 * Generated QR codes for receiving PIX payments
 * Note: Defined before pix_transactions due to reference
 */
export const pixQrCodes = pgTable('pix_qr_codes', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// QR code data
	qrCodeData: text('qr_code_data').notNull(),
	pixCopyPaste: text('pix_copy_paste').notNull(),

	// Payment details
	amount: decimal('amount', { precision: 15, scale: 2 }),
	description: text('description'),
	recipientName: text('recipient_name'),
	recipientPixKey: text('recipient_pix_key'),

	// Validity
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	// Usage
	isActive: boolean('is_active').default(true),
	isSingleUse: boolean('is_single_use').default(false),
	usageCount: integer('usage_count').default(0),
	maxUsage: integer('max_usage'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// PIX TRANSACTIONS
// ========================================

/**
 * PIX transaction records with full status tracking
 */
export const pixTransactions = pgTable('pix_transactions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	transactionId: text('transaction_id').references(() => transactions.id, {
		onDelete: 'set null',
	}),

	// Official PIX identifier
	endToEndId: text('end_to_end_id').unique(),

	// PIX key info
	pixKey: text('pix_key').notNull(),
	pixKeyType: text('pix_key_type').notNull(), // CPF, CNPJ, EMAIL, PHONE, RANDOM

	// Recipient info
	recipientName: text('recipient_name').notNull(),
	recipientDocument: text('recipient_document'),
	recipientBank: text('recipient_bank'),

	// Amount
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	description: text('description'),

	// Dates & Status
	transactionDate: timestamp('transaction_date', {
		withTimezone: true,
	}).notNull(),
	status: text('status').default('pending'), // pending, processing, completed, failed, cancelled, reversed
	transactionType: text('transaction_type').default('sent'), // sent, received, scheduled

	// Scheduling
	scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
	processedAt: timestamp('processed_at', { withTimezone: true }),

	// QR code reference
	qrCodeId: text('qr_code_id').references(() => pixQrCodes.id),

	// External reference
	externalId: text('external_id'),
	errorMessage: text('error_message'),
	feeAmount: decimal('fee_amount', { precision: 15, scale: 2 }).default('0'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type PixKey = typeof pixKeys.$inferSelect;
export type InsertPixKey = typeof pixKeys.$inferInsert;

export type PixQrCode = typeof pixQrCodes.$inferSelect;
export type InsertPixQrCode = typeof pixQrCodes.$inferInsert;

export type PixTransaction = typeof pixTransactions.$inferSelect;
export type InsertPixTransaction = typeof pixTransactions.$inferInsert;

/**
 * Contacts Schema - Contacts & Recipients
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Contact directory for payments and transfers
 */

import { boolean, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// ENUMS
// ========================================

export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
	'PIX',
	'BANK_ACCOUNT',
	'BOLETO',
]);

// ========================================
// CONTACTS
// ========================================

/**
 * Contact directory for payments and transfers
 */
export const contacts = pgTable('contacts', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Contact info
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),

	// Brazilian documents
	cpf: text('cpf'),
	cnpj: text('cnpj'),

	// Additional info
	notes: text('notes'),
	isFavorite: boolean('is_favorite').default(false),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// CONTACT PAYMENT METHODS
// ========================================

/**
 * Payment methods associated with contacts
 */
export const contactPaymentMethods = pgTable('contact_payment_methods', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	contactId: text('contact_id').references(() => contacts.id, {
		onDelete: 'cascade',
	}),

	// Method details
	methodType: text('method_type').notNull(), // PIX, BANK_ACCOUNT, BOLETO
	methodDetails: jsonb('method_details').notNull(), // Store method-specific data

	// Status
	isDefault: boolean('is_default').default(false),
	isActive: boolean('is_active').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

export type ContactPaymentMethod = typeof contactPaymentMethods.$inferSelect;
export type InsertContactPaymentMethod = typeof contactPaymentMethods.$inferInsert;

/**
 * Type for PIX payment method details
 */
export type PixPaymentMethodDetails = {
	pixKey: string;
	pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
	bankName?: string;
};

/**
 * Type for bank account payment method details
 */
export type BankAccountPaymentMethodDetails = {
	bankCode: string;
	bankName: string;
	agency: string;
	accountNumber: string;
	accountType: 'checking' | 'savings';
	accountHolderName: string;
	accountHolderDocument: string;
};

/**
 * Type for boleto payment method details
 */
export type BoletoPaymentMethodDetails = {
	beneficiaryName: string;
	beneficiaryCnpj?: string;
	lastBarcode?: string;
};

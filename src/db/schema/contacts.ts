/**
 * @fileoverview Contacts schema - User contacts and payment methods
 * @module db/schema/contacts
 */

import { sql } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Contacts - User contact list
 */
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  cpf: text('cpf'),
  notes: text('notes'),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Contact payment methods - PIX, TED, DOC associated with contacts
 */
export const contactPaymentMethods = pgTable('contact_payment_methods', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  contactId: uuid('contact_id')
    .notNull()
    .references(() => contacts.id),
  paymentType: text('payment_type').notNull(), // pix, ted, doc, boleto
  pixKeyType: text('pix_key_type'), // cpf, cnpj, email, phone, random
  pixKeyValue: text('pix_key_value'),
  bankCode: text('bank_code'),
  bankName: text('bank_name'),
  agency: text('agency'),
  accountNumber: text('account_number'),
  accountType: text('account_type'), // checking, savings
  label: text('label'),
  isFavorite: boolean('is_favorite').default(false),
  isVerified: boolean('is_verified').default(false),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type ContactPaymentMethod = typeof contactPaymentMethods.$inferSelect;

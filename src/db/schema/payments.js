/**
 * @fileoverview Payments schema - PIX, boletos, scheduled payments
 * @module db/schema/payments
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
/**
 * PIX keys registered by users
 */
export const pixKeys = pgTable('pix_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  keyType: text('key_type').notNull(), // email, cpf, cnpj, phone, random
  keyValue: text('key_value').notNull(),
  label: text('label'),
  isFavorite: boolean('is_favorite').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Payment rules for autonomous payments
 */
export const paymentRules = pgTable('payment_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  payeeName: text('payee_name').notNull(),
  payeeType: text('payee_type').default('pix'), // pix, boleto, ted, doc
  payeeKey: text('payee_key'),
  maxAmount: numeric('max_amount').notNull(),
  tolerancePercentage: integer('tolerance_percentage').default(5),
  preferredTime: time('preferred_time').default(sql`'09:00:00'::time`),
  autonomyLevel: integer('autonomy_level').default(50), // 50, 75, 95
  category: text('category'),
  description: text('description'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Scheduled payments for autonomous execution
 */
export const scheduledPayments = pgTable('scheduled_payments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  ruleId: uuid('rule_id').references(() => paymentRules.id),
  payeeName: text('payee_name').notNull(),
  payeeKey: text('payee_key').notNull(),
  amount: numeric('amount').notNull(),
  paymentType: text('payment_type').default('pix'), // pix, boleto, ted, doc
  dueDate: date('due_date').notNull(),
  scheduledTime: timestamp('scheduled_time', { withTimezone: true }).notNull(),
  status: text('status').default('pending'), // pending, awaiting_approval, approved, executing, executed, failed, cancelled
  executionAttempts: integer('execution_attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  requiresApproval: boolean('requires_approval').default(false),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  approvalMethod: text('approval_method'),
  transactionId: text('transaction_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * PIX transfers initiated by user
 */
export const pixTransfers = pgTable('pix_transfers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  pixKey: text('pix_key').notNull(),
  pixKeyType: text('pix_key_type'), // cpf, cnpj, email, phone, random
  recipientName: text('recipient_name').notNull(),
  recipientDocument: text('recipient_document'),
  recipientBank: text('recipient_bank'),
  amount: numeric('amount').notNull(),
  description: text('description'),
  status: text('status').default('pending'), // pending, awaiting_confirmation, confirmed, processing, completed, failed, cancelled
  initiationMethod: text('initiation_method'), // voice, manual, scheduled
  requiresConfirmation: boolean('requires_confirmation').default(true),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  confirmationMethod: text('confirmation_method'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  transactionId: text('transaction_id'),
  endToEndId: text('end_to_end_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});
/**
 * Boletos - Brazilian bank slips
 */
export const boletos = pgTable('boletos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id'),
  barcode: text('barcode').unique().notNull(),
  digitableLine: text('digitable_line'),
  payeeName: text('payee_name').notNull(),
  payeeDocument: text('payee_document'),
  amount: numeric('amount').notNull(),
  dueDate: date('due_date').notNull(),
  discountAmount: numeric('discount_amount').default(sql`0`),
  interestAmount: numeric('interest_amount').default(sql`0`),
  fineAmount: numeric('fine_amount').default(sql`0`),
  status: text('status').default('pending'), // pending, scheduled, paid, expired, cancelled
  captureMethod: text('capture_method'), // ocr, barcode, manual, voice
  scheduledPaymentId: uuid('scheduled_payment_id').references(() => scheduledPayments.id),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentConfirmation: text('payment_confirmation'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

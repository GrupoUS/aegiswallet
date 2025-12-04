/**
 * Import Sessions Schema - Bank Statement Import Tracking
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Tracks import sessions and temporarily stores extracted transactions
 */

import { relations } from 'drizzle-orm';
import {
	boolean,
	decimal,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

import { users } from './users';

// ========================================
// ENUMS
// ========================================

/**
 * File types supported for import
 */
export const importFileTypeEnum = pgEnum('import_file_type', ['PDF', 'CSV']);

/**
 * Import session status
 */
export const importSessionStatusEnum = pgEnum('import_session_status', [
	'PROCESSING',
	'REVIEW',
	'CONFIRMED',
	'CANCELLED',
	'COMPLETED',
	'FAILED',
]);

/**
 * Extracted transaction type
 */
export const extractedTransactionTypeEnum = pgEnum('extracted_transaction_type', [
	'CREDIT',
	'DEBIT',
]);

// ========================================
// IMPORT SESSIONS
// ========================================

/**
 * Import sessions table - tracks bank statement import progress
 */
export const importSessions = pgTable('import_sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),

	// File information
	fileName: text('file_name').notNull(),
	fileType: importFileTypeEnum('file_type').notNull(),
	fileSize: integer('file_size').notNull(),
	fileUrl: text('file_url'), // Vercel Blob URL for temporary storage

	// Bank detection
	bankDetected: text('bank_detected'),

	// Status tracking
	status: importSessionStatusEnum('status').notNull().default('PROCESSING'),
	errorMessage: text('error_message'),

	// Statistics
	transactionsExtracted: integer('transactions_extracted').default(0),
	transactionsImported: integer('transactions_imported').default(0),
	duplicatesFound: integer('duplicates_found').default(0),
	averageConfidence: decimal('average_confidence', { precision: 3, scale: 2 }),
	processingTimeMs: integer('processing_time_ms'),

	// Metadata (raw extraction data, etc.)
	metadata: jsonb('metadata').$type<{
		rawExtractionData?: unknown;
		geminiResponse?: unknown;
		processingSteps?: Array<{
			step: string;
			timestamp: string;
			success: boolean;
			error?: string;
		}>;
	}>(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ========================================
// EXTRACTED TRANSACTIONS (TEMPORARY)
// ========================================

/**
 * Extracted transactions - temporary storage before user confirmation
 * These are deleted after import is confirmed or cancelled
 */
export const extractedTransactions = pgTable('extracted_transactions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	sessionId: text('session_id')
		.notNull()
		.references(() => importSessions.id, { onDelete: 'cascade' }),

	// Transaction data
	date: timestamp('date', { withTimezone: true }).notNull(),
	description: text('description').notNull(),
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	type: extractedTransactionTypeEnum('type').notNull(),
	balance: decimal('balance', { precision: 15, scale: 2 }),

	// Extraction metadata
	rawText: text('raw_text').notNull(),
	confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
	lineNumber: integer('line_number'),

	// Duplicate detection
	isPossibleDuplicate: boolean('is_possible_duplicate').default(false),
	duplicateReason: text('duplicate_reason'),
	duplicateTransactionId: text('duplicate_transaction_id'), // Reference to existing transaction

	// Selection for import
	isSelected: boolean('is_selected').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// RELATIONS
// ========================================

export const importSessionsRelations = relations(importSessions, ({ one, many }) => ({
	user: one(users, {
		fields: [importSessions.userId],
		references: [users.id],
	}),
	extractedTransactions: many(extractedTransactions),
}));

export const extractedTransactionsRelations = relations(extractedTransactions, ({ one }) => ({
	session: one(importSessions, {
		fields: [extractedTransactions.sessionId],
		references: [importSessions.id],
	}),
}));

// ========================================
// TYPE EXPORTS
// ========================================

export type ImportSession = typeof importSessions.$inferSelect;
export type InsertImportSession = typeof importSessions.$inferInsert;
export type ExtractedTransaction = typeof extractedTransactions.$inferSelect;
export type InsertExtractedTransaction = typeof extractedTransactions.$inferInsert;

// Status type helper
export type ImportSessionStatus = 'PROCESSING' | 'REVIEW' | 'COMPLETED' | 'FAILED';
export type ImportFileType = 'PDF' | 'CSV';
export type ExtractedTransactionType = 'CREDIT' | 'DEBIT';

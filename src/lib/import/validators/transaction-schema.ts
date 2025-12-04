/**
 * Transaction Schema Validators
 *
 * Zod schemas for validating extracted transactions and import operations
 */

import { z } from 'zod';

import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE,
	MAX_TRANSACTIONS_PER_IMPORT,
} from '@/lib/import/constants/bank-patterns';

// ========================================
// EXTRACTED TRANSACTION SCHEMA
// ========================================

/**
 * Schema for a single extracted transaction from bank statement
 */
export const extractedTransactionSchema = z.object({
	/** Transaction date (ISO 8601 format) */
	date: z.coerce
		.date()
		.refine((date) => date <= new Date(), { message: 'Transaction date cannot be in the future' }),

	/** Transaction description */
	description: z.string().min(1, 'Description is required').max(500, 'Description too long'),

	/** Transaction amount (positive for credit, negative for debit) */
	amount: z.number().refine((val) => val !== 0, { message: 'Amount cannot be zero' }),

	/** Transaction type */
	type: z.enum(['CREDIT', 'DEBIT']),

	/** Balance after transaction (optional) */
	balance: z.number().optional(),

	/** Original raw text from extraction */
	rawText: z.string().min(1, 'Raw text is required'),

	/** Confidence score (0-1) */
	confidence: z.number().min(0).max(1),

	/** Line number in original document (optional) */
	lineNumber: z.number().int().positive().optional(),
});

export type ExtractedTransactionInput = z.infer<typeof extractedTransactionSchema>;

// ========================================
// GEMINI EXTRACTION RESPONSE SCHEMA
// ========================================

/**
 * Schema for Gemini AI extraction response
 */
export const geminiExtractionResponseSchema = z.object({
	/** Detected bank name (optional) */
	bank: z.string().optional(),

	/** Array of extracted transactions */
	transactions: z.array(extractedTransactionSchema),

	/** Extraction metadata */
	metadata: z
		.object({
			extractionDate: z.string().optional(),
			totalFound: z.number().optional(),
			periodStart: z.string().optional(),
			periodEnd: z.string().optional(),
			warnings: z.array(z.string()).optional(),
		})
		.optional(),
});

export type GeminiExtractionResponse = z.infer<typeof geminiExtractionResponseSchema>;

// ========================================
// UPLOAD FILE SCHEMA
// ========================================

/**
 * Schema for file upload validation
 */
export const uploadFileSchema = z.object({
	/** Original file name */
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name too long')
		.refine(
			(name) => {
				const extension = name.toLowerCase().slice(name.lastIndexOf('.'));
				return extension === '.pdf' || extension === '.csv';
			},
			{ message: 'Only PDF and CSV files are allowed' },
		),

	/** File size in bytes */
	fileSize: z
		.number()
		.positive('File size must be positive')
		.max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),

	/** MIME type */
	mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]], {
		message: 'Invalid file type. Only PDF and CSV files are allowed.',
	}),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

// ========================================
// CONFIRM IMPORT SCHEMA
// ========================================

/**
 * Schema for confirming import operation
 */
export const confirmImportSchema = z.object({
	/** Import session ID */
	sessionId: z.string().uuid('Invalid session ID'),

	/** Array of selected transaction IDs to import */
	selectedTransactionIds: z
		.array(z.string().uuid('Invalid transaction ID'))
		.min(1, 'At least one transaction must be selected')
		.max(
			MAX_TRANSACTIONS_PER_IMPORT,
			`Maximum ${MAX_TRANSACTIONS_PER_IMPORT} transactions per import`,
		),

	/** Target bank account ID (optional) */
	accountId: z.string().uuid('Invalid account ID').optional(),
});

export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;

// ========================================
// SESSION STATUS QUERY SCHEMA
// ========================================

/**
 * Schema for querying import session status
 */
export const sessionStatusQuerySchema = z.object({
	sessionId: z.string().uuid('Invalid session ID'),
});

export type SessionStatusQueryInput = z.infer<typeof sessionStatusQuerySchema>;

// ========================================
// IMPORT SUMMARY SCHEMA
// ========================================

/**
 * Schema for import summary response
 */
export const importSummarySchema = z.object({
	total: z.number().int().nonnegative(),
	selected: z.number().int().nonnegative(),
	duplicates: z.number().int().nonnegative(),
	lowConfidence: z.number().int().nonnegative(),
	totalCredits: z.number(),
	totalDebits: z.number(),
	netBalance: z.number(),
	periodStart: z.string().optional(),
	periodEnd: z.string().optional(),
});

export type ImportSummary = z.infer<typeof importSummarySchema>;

// ========================================
// BATCH TRANSACTION VALIDATION
// ========================================

/**
 * Validate a batch of extracted transactions
 */
export function validateTransactionBatch(transactions: unknown[]): {
	valid: ExtractedTransactionInput[];
	invalid: Array<{ index: number; errors: string[] }>;
} {
	const valid: ExtractedTransactionInput[] = [];
	const invalid: Array<{ index: number; errors: string[] }> = [];

	for (let i = 0; i < transactions.length; i++) {
		const result = extractedTransactionSchema.safeParse(transactions[i]);
		if (result.success) {
			valid.push(result.data);
		} else {
			invalid.push({
				index: i,
				errors: result.error.issues.map((e) => `${String(e.path.join('.'))}: ${e.message}`),
			});
		}
	}

	return { valid, invalid };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate import summary from extracted transactions
 */
export function calculateImportSummary(
	transactions: ExtractedTransactionInput[],
	selectedIds: string[] = [],
): ImportSummary {
	const selected =
		selectedIds.length > 0
			? transactions.filter((_, i) => selectedIds.includes(String(i)))
			: transactions;

	const totalCredits = selected
		.filter((t) => t.type === 'CREDIT')
		.reduce((sum, t) => sum + t.amount, 0);

	const totalDebits = selected
		.filter((t) => t.type === 'DEBIT')
		.reduce((sum, t) => sum + Math.abs(t.amount), 0);

	const duplicates = transactions.filter((t) => t.confidence < 0.5).length;
	const lowConfidence = transactions.filter(
		(t) => t.confidence >= 0.5 && t.confidence < 0.7,
	).length;

	const dates = transactions.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime());

	return {
		total: transactions.length,
		selected: selected.length,
		duplicates,
		lowConfidence,
		totalCredits,
		totalDebits,
		netBalance: totalCredits - totalDebits,
		periodStart: dates[0]?.toISOString().split('T')[0],
		periodEnd: dates[dates.length - 1]?.toISOString().split('T')[0],
	};
}

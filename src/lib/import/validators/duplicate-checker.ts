/**
 * Duplicate Checker - Transaction duplicate detection
 *
 * Detects potential duplicate transactions by comparing
 * extracted transactions with existing ones in the database
 */

import { and, between, eq } from 'drizzle-orm';

import type { HttpClient, PoolClient } from '@/db/client';
import { transactions } from '@/db/schema';
import { DUPLICATE_DETECTION_DAYS } from '@/lib/import/constants/bank-patterns';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

type DbClient = HttpClient | PoolClient;

export interface ExtractedTransactionForCheck {
	id: string;
	date: Date;
	description: string;
	amount: number;
	type: 'CREDIT' | 'DEBIT';
}

export interface ExistingTransaction {
	id: string;
	transactionDate: Date;
	description: string;
	amount: string;
	transactionType: string;
}

export interface DuplicateCheckResult {
	extractedId: string;
	isPossibleDuplicate: boolean;
	duplicateReason: string | null;
	existingTransactionId: string | null;
	confidence: number;
}

export interface DuplicateSummary {
	totalChecked: number;
	duplicatesFound: number;
	duplicateResults: DuplicateCheckResult[];
}

// ========================================
// MAIN DUPLICATE CHECKING
// ========================================

/**
 * Check extracted transactions for duplicates against database
 *
 * @param extractedTransactions - Transactions to check
 * @param userId - User ID to check against
 * @param db - Database client
 * @returns Summary of duplicate check results
 */
export async function checkForDuplicates(
	extractedTransactions: ExtractedTransactionForCheck[],
	userId: string,
	db: DbClient,
): Promise<DuplicateSummary> {
	const startTime = Date.now();
	const results: DuplicateCheckResult[] = [];

	if (extractedTransactions.length === 0) {
		return {
			totalChecked: 0,
			duplicatesFound: 0,
			duplicateResults: [],
		};
	}

	// Get date range for the extracted transactions
	const dates = extractedTransactions.map((t) => t.date);
	const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
	const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

	// Expand range by 1 day on each side for timezone tolerance
	minDate.setDate(minDate.getDate() - 1);
	maxDate.setDate(maxDate.getDate() + 1);

	// Also limit to recent transactions (configurable days back)
	const recentCutoff = new Date();
	recentCutoff.setDate(recentCutoff.getDate() - DUPLICATE_DETECTION_DAYS);

	const effectiveMinDate = minDate > recentCutoff ? minDate : recentCutoff;

	try {
		// Fetch existing transactions in batch for the relevant date range
		const existingTransactions = await db
			.select({
				id: transactions.id,
				transactionDate: transactions.transactionDate,
				description: transactions.description,
				amount: transactions.amount,
				transactionType: transactions.transactionType,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					between(transactions.transactionDate, effectiveMinDate, maxDate),
				),
			);

		secureLogger.info('Loaded existing transactions for duplicate check', {
			component: 'duplicate-checker',
			action: 'load',
			existingCount: existingTransactions.length,
			dateRange: {
				from: effectiveMinDate.toISOString(),
				to: maxDate.toISOString(),
			},
		});

		// Check each extracted transaction against existing ones
		for (const extracted of extractedTransactions) {
			const result = checkSingleTransaction(extracted, existingTransactions);
			results.push(result);
		}

		const duplicatesFound = results.filter((r) => r.isPossibleDuplicate).length;
		const processingTime = Date.now() - startTime;

		secureLogger.info('Duplicate check completed', {
			component: 'duplicate-checker',
			action: 'check',
			totalChecked: extractedTransactions.length,
			duplicatesFound,
			processingTimeMs: processingTime,
		});

		return {
			totalChecked: extractedTransactions.length,
			duplicatesFound,
			duplicateResults: results,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Duplicate check failed', {
			component: 'duplicate-checker',
			action: 'check',
			error: errorMessage,
		});

		// Return no duplicates on error (fail open)
		return {
			totalChecked: extractedTransactions.length,
			duplicatesFound: 0,
			duplicateResults: extractedTransactions.map((t) => ({
				extractedId: t.id,
				isPossibleDuplicate: false,
				duplicateReason: null,
				existingTransactionId: null,
				confidence: 0,
			})),
		};
	}
}

// ========================================
// SINGLE TRANSACTION CHECK
// ========================================

/**
 * Check a single transaction against existing ones
 */
function checkSingleTransaction(
	extracted: ExtractedTransactionForCheck,
	existingTransactions: ExistingTransaction[],
): DuplicateCheckResult {
	for (const existing of existingTransactions) {
		const result = compareTransactions(extracted, existing);

		if (result.isDuplicate) {
			return {
				extractedId: extracted.id,
				isPossibleDuplicate: true,
				duplicateReason: result.reason,
				existingTransactionId: existing.id,
				confidence: result.confidence,
			};
		}
	}

	return {
		extractedId: extracted.id,
		isPossibleDuplicate: false,
		duplicateReason: null,
		existingTransactionId: null,
		confidence: 0,
	};
}

/**
 * Compare two transactions for potential duplicate
 */
function compareTransactions(
	extracted: ExtractedTransactionForCheck,
	existing: ExistingTransaction,
): { isDuplicate: boolean; reason: string | null; confidence: number } {
	// Check date match (within 1 day tolerance)
	const extractedDate = new Date(extracted.date);
	const existingDate = new Date(existing.transactionDate);
	const daysDiff = Math.abs(
		(extractedDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (daysDiff > 1) {
		return { isDuplicate: false, reason: null, confidence: 0 };
	}

	// Check amount match (exact)
	const extractedAmount = Math.abs(extracted.amount);
	const existingAmount = Math.abs(Number.parseFloat(existing.amount));

	if (Math.abs(extractedAmount - existingAmount) > 0.01) {
		return { isDuplicate: false, reason: null, confidence: 0 };
	}

	// Date and amount match - high confidence duplicate
	let confidence = 0.8;
	let reason = 'Mesma data e valor';

	// Check description similarity for even higher confidence
	const similarity = calculateSimilarity(extracted.description, existing.description);

	if (similarity > 0.7) {
		confidence = 0.95;
		reason = 'Mesma data, valor e descrição similar';
	} else if (similarity > 0.5) {
		confidence = 0.9;
		reason = 'Mesma data e valor, descrição parcialmente similar';
	}

	return { isDuplicate: true, reason, confidence };
}

// ========================================
// STRING SIMILARITY
// ========================================

/**
 * Calculate similarity between two strings (0-1)
 * Uses a simplified Levenshtein-based approach
 */
export function calculateSimilarity(str1: string, str2: string): number {
	// Normalize strings
	const s1 = normalizeDescription(str1);
	const s2 = normalizeDescription(str2);

	if (s1 === s2) return 1;
	if (s1.length === 0 || s2.length === 0) return 0;

	// For very different lengths, low similarity
	const lengthRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
	if (lengthRatio < 0.3) return 0;

	// Calculate Levenshtein distance
	const distance = levenshteinDistance(s1, s2);
	const maxLength = Math.max(s1.length, s2.length);

	return 1 - distance / maxLength;
}

/**
 * Normalize description for comparison
 */
function normalizeDescription(str: string): string {
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove accents
		.replace(/[^a-z0-9\s]/g, '') // Remove special chars
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
	const len1 = s1.length;
	const len2 = s2.length;

	// Use shorter algorithm for short strings
	if (len1 === 0) return len2;
	if (len2 === 0) return len1;

	// Create matrix
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost, // substitution
			);
		}
	}

	return matrix[len1][len2];
}

// ========================================
// MARK DUPLICATES
// ========================================

/**
 * Mark extracted transactions with duplicate flags
 *
 * @param extractedTransactions - Transactions to mark
 * @param duplicateResults - Results from duplicate check
 * @returns Transactions with duplicate flags set
 */
export function markDuplicates<
	T extends {
		id: string;
		isPossibleDuplicate?: boolean;
		duplicateReason?: string | null;
		isSelected?: boolean;
	},
>(extractedTransactions: T[], duplicateResults: DuplicateCheckResult[]): T[] {
	const resultMap = new Map(duplicateResults.map((r) => [r.extractedId, r]));

	return extractedTransactions.map((transaction) => {
		const result = resultMap.get(transaction.id);

		if (result?.isPossibleDuplicate) {
			return {
				...transaction,
				isPossibleDuplicate: true,
				duplicateReason: result.duplicateReason,
				isSelected: false, // Deselect duplicates by default
			};
		}

		return transaction;
	});
}

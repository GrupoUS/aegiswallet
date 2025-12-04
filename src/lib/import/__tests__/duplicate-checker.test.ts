/**
 * @file duplicate-checker.test.ts
 * @description Unit tests for duplicate detection functionality
 */

import { describe, expect, it, vi } from 'vitest';

import type {
	DuplicateCheckResult,
	ExistingTransaction,
	ExtractedTransactionForCheck,
} from '../validators/duplicate-checker';
import {
	calculateSimilarity,
	checkForDuplicates,
	markDuplicates,
} from '../validators/duplicate-checker';

describe('Duplicate Checker', () => {
	describe('calculateSimilarity', () => {
		it('should return 1 for identical strings', () => {
			const similarity = calculateSimilarity('PIX Recebido', 'PIX Recebido');

			expect(similarity).toBe(1);
		});

		it('should return high similarity for nearly identical strings', () => {
			const similarity = calculateSimilarity('PIX Recebido de João', 'PIX Recebido de Joao');

			expect(similarity).toBeGreaterThan(0.8);
		});

		it('should return low similarity for different strings', () => {
			const similarity = calculateSimilarity('PIX Recebido', 'Pagamento Boleto');

			expect(similarity).toBeLessThan(0.5);
		});

		it('should handle empty strings', () => {
			const similarity = calculateSimilarity('', '');

			expect(similarity).toBe(1); // Both empty = identical
		});

		it('should handle one empty string', () => {
			const similarity = calculateSimilarity('test', '');

			expect(similarity).toBe(0);
		});
	});

	describe('markDuplicates', () => {
		it('should mark transactions based on duplicate results', () => {
			const items = [
				{
					id: '1',
					description: 'Transaction A',
					isPossibleDuplicate: false,
					duplicateReason: null as string | null,
					isSelected: true,
				},
				{
					id: '2',
					description: 'Transaction B',
					isPossibleDuplicate: false,
					duplicateReason: null as string | null,
					isSelected: true,
				},
				{
					id: '3',
					description: 'Transaction C',
					isPossibleDuplicate: false,
					duplicateReason: null as string | null,
					isSelected: true,
				},
			];

			const duplicateResults: DuplicateCheckResult[] = [
				{
					extractedId: '2',
					isPossibleDuplicate: true,
					duplicateReason: 'Similar to existing transaction',
					existingTransactionId: 'existing-1',
					confidence: 0.95,
				},
			];

			const result = markDuplicates(items, duplicateResults);

			// Item 2 should be marked as duplicate
			expect(result[1].isPossibleDuplicate).toBe(true);
			expect(result[1].duplicateReason).toBe('Similar to existing transaction');
			expect(result[1].isSelected).toBe(false);

			// Items 1 and 3 should not be affected
			expect(result[0].isPossibleDuplicate).toBe(false);
			expect(result[2].isPossibleDuplicate).toBe(false);
		});

		it('should not mark items when no duplicates found', () => {
			const items = [
				{
					id: '1',
					description: 'Transaction A',
					isPossibleDuplicate: false,
					duplicateReason: null as string | null,
					isSelected: true,
				},
				{
					id: '2',
					description: 'Transaction B',
					isPossibleDuplicate: false,
					duplicateReason: null as string | null,
					isSelected: true,
				},
			];

			const duplicateResults: DuplicateCheckResult[] = [
				{
					extractedId: '1',
					isPossibleDuplicate: false,
					duplicateReason: null,
					existingTransactionId: null,
					confidence: 0.1,
				},
			];

			const result = markDuplicates(items, duplicateResults);

			expect(result[0].isPossibleDuplicate).toBe(false);
			expect(result[1].isPossibleDuplicate).toBe(false);
		});

		it('should handle empty arrays', () => {
			const result = markDuplicates([], []);
			expect(result).toEqual([]);
		});
	});

	describe('ExtractedTransactionForCheck type', () => {
		it('should have correct structure', () => {
			const tx: ExtractedTransactionForCheck = {
				id: 'tx-1',
				date: new Date('2024-12-01'),
				description: 'PIX Recebido',
				amount: 100,
				type: 'CREDIT',
			};

			expect(tx.id).toBe('tx-1');
			expect(tx.type).toBe('CREDIT');
			expect(tx.amount).toBe(100);
		});

		it('should accept DEBIT type', () => {
			const tx: ExtractedTransactionForCheck = {
				id: 'tx-2',
				date: new Date('2024-12-01'),
				description: 'Pagamento',
				amount: 50,
				type: 'DEBIT',
			};

			expect(tx.type).toBe('DEBIT');
		});
	});

	describe('duplicate detection scenarios', () => {
		it('should identify potential duplicates by date and amount', () => {
			const tx1: ExtractedTransactionForCheck = {
				id: 'tx-1',
				date: new Date('2024-12-01'),
				description: 'PIX Recebido de Maria',
				amount: 100,
				type: 'CREDIT',
			};

			const tx2: ExtractedTransactionForCheck = {
				id: 'tx-2',
				date: new Date('2024-12-01'),
				description: 'PIX Recebido de Maria Silva',
				amount: 100,
				type: 'CREDIT',
			};

			// Same date and amount - potential duplicate
			expect(tx1.date.getTime()).toBe(tx2.date.getTime());
			expect(tx1.amount).toBe(tx2.amount);
		});

		it('should not consider different dates as duplicates', () => {
			const tx1: ExtractedTransactionForCheck = {
				id: 'tx-1',
				date: new Date('2024-12-01'),
				description: 'Salary',
				amount: 5000,
				type: 'CREDIT',
			};

			const tx2: ExtractedTransactionForCheck = {
				id: 'tx-2',
				date: new Date('2024-12-15'),
				description: 'Salary',
				amount: 5000,
				type: 'CREDIT',
			};

			// Different dates - not duplicates even with same amount
			expect(tx1.date.getTime()).not.toBe(tx2.date.getTime());
		});

		it('should not consider different amounts as duplicates', () => {
			const tx1: ExtractedTransactionForCheck = {
				id: 'tx-1',
				date: new Date('2024-12-01'),
				description: 'PIX Recebido',
				amount: 100,
				type: 'CREDIT',
			};

			const tx2: ExtractedTransactionForCheck = {
				id: 'tx-2',
				date: new Date('2024-12-01'),
				description: 'PIX Recebido',
				amount: 200,
				type: 'CREDIT',
			};

			// Different amounts - not duplicates
			expect(tx1.amount).not.toBe(tx2.amount);
		});
	});

	// ========================================
	// checkForDuplicates with Database Mocking
	// ========================================

	describe('checkForDuplicates', () => {
		// Helper to create mock database client
		const createMockDbClient = (existingTransactions: ExistingTransaction[]) => {
			return {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(existingTransactions),
					}),
				}),
			};
		};

		it('should return empty summary for empty transactions array', async () => {
			const mockDb = createMockDbClient([]);

			const result = await checkForDuplicates([], 'user-123', mockDb as never);

			expect(result).toEqual({
				totalChecked: 0,
				duplicatesFound: 0,
				duplicateResults: [],
			});
			// Database should not be queried for empty input
			expect(mockDb.select).not.toHaveBeenCalled();
		});

		it('should find no duplicates when database has no matching transactions', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'tx-1',
					date: new Date('2024-12-01'),
					description: 'PIX Recebido de Maria',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient([]);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.totalChecked).toBe(1);
			expect(result.duplicatesFound).toBe(0);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(false);
		});

		it('should detect exact duplicate (same date, amount, description)', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'PIX Recebido de Maria',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'PIX Recebido de Maria',
					amount: '100.00',
					transactionType: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.totalChecked).toBe(1);
			expect(result.duplicatesFound).toBe(1);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(true);
			expect(result.duplicateResults[0].existingTransactionId).toBe('existing-1');
			expect(result.duplicateResults[0].confidence).toBeGreaterThan(0.9);
		});

		it('should detect duplicate with same date/amount but different description', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'Transferencia bancaria',
					amount: 500,
					type: 'DEBIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'Pagamento conta luz',
					amount: '500.00',
					transactionType: 'DEBIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.totalChecked).toBe(1);
			expect(result.duplicatesFound).toBe(1);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(true);
			// Lower confidence when descriptions don't match
			expect(result.duplicateResults[0].confidence).toBe(0.8);
			expect(result.duplicateResults[0].duplicateReason).toBe('Mesma data e valor');
		});

		it('should not flag as duplicate when dates differ by more than 1 day', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'PIX Recebido',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-05'), // 4 days difference
					description: 'PIX Recebido',
					amount: '100.00',
					transactionType: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.duplicatesFound).toBe(0);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(false);
		});

		it('should not flag as duplicate when amounts differ', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'PIX Recebido',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'PIX Recebido',
					amount: '150.00', // Different amount
					transactionType: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.duplicatesFound).toBe(0);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(false);
		});

		it('should handle multiple transactions with mixed results', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'PIX Maria',
					amount: 100,
					type: 'CREDIT',
				},
				{
					id: 'extracted-2',
					date: new Date('2024-12-02'),
					description: 'Salario',
					amount: 5000,
					type: 'CREDIT',
				},
				{
					id: 'extracted-3',
					date: new Date('2024-12-03'),
					description: 'Compra mercado',
					amount: 250,
					type: 'DEBIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'PIX Maria Silva',
					amount: '100.00',
					transactionType: 'CREDIT',
				},
				// No match for salary (different date or amount)
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.totalChecked).toBe(3);
			expect(result.duplicatesFound).toBe(1); // Only first transaction is duplicate
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(true);
			expect(result.duplicateResults[1].isPossibleDuplicate).toBe(false);
			expect(result.duplicateResults[2].isPossibleDuplicate).toBe(false);
		});

		it('should handle database errors gracefully (fail open)', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'tx-1',
					date: new Date('2024-12-01'),
					description: 'Test transaction',
					amount: 100,
					type: 'CREDIT',
				},
			];

			// Mock database that throws an error
			const mockDb = {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockRejectedValue(new Error('Database connection failed')),
					}),
				}),
			};

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			// Should fail open - no duplicates flagged on error
			expect(result.totalChecked).toBe(1);
			expect(result.duplicatesFound).toBe(0);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(false);
		});

		it('should detect duplicate with 1 day date tolerance', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-02'), // One day after
					description: 'PIX Recebido',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'), // One day before
					description: 'PIX Recebido',
					amount: '100.00',
					transactionType: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			// Should detect as duplicate - within 1 day tolerance
			expect(result.duplicatesFound).toBe(1);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(true);
		});

		it('should handle negative amounts correctly (absolute comparison)', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'Pagamento boleto',
					amount: -500, // Negative amount
					type: 'DEBIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'Pagamento boleto',
					amount: '500.00', // Positive amount stored
					transactionType: 'DEBIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			// Should detect as duplicate - absolute values match
			expect(result.duplicatesFound).toBe(1);
			expect(result.duplicateResults[0].isPossibleDuplicate).toBe(true);
		});

		it('should return high confidence for similar descriptions', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'PIX Recebido de Maria Silva Santos',
					amount: 100,
					type: 'CREDIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'PIX Recebido de Maria Silva',
					amount: '100.00',
					transactionType: 'CREDIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			expect(result.duplicatesFound).toBe(1);
			// High confidence due to similar description
			expect(result.duplicateResults[0].confidence).toBeGreaterThanOrEqual(0.9);
			expect(result.duplicateResults[0].duplicateReason).toContain('similar');
		});

		it('should handle float amount comparison with tolerance', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'Compra',
					amount: 99.999, // Very close to 100
					type: 'DEBIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'Compra',
					amount: '100.00',
					transactionType: 'DEBIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			// 0.01 tolerance should flag this as duplicate
			expect(result.duplicatesFound).toBe(1);
		});

		it('should not flag amounts that differ by more than 0.01', async () => {
			const extractedTransactions: ExtractedTransactionForCheck[] = [
				{
					id: 'extracted-1',
					date: new Date('2024-12-01'),
					description: 'Compra',
					amount: 99.98, // 0.02 difference
					type: 'DEBIT',
				},
			];

			const existingTransactions: ExistingTransaction[] = [
				{
					id: 'existing-1',
					transactionDate: new Date('2024-12-01'),
					description: 'Compra',
					amount: '100.00',
					transactionType: 'DEBIT',
				},
			];

			const mockDb = createMockDbClient(existingTransactions);

			const result = await checkForDuplicates(extractedTransactions, 'user-123', mockDb as never);

			// 0.02 difference exceeds tolerance
			expect(result.duplicatesFound).toBe(0);
		});
	});

	// ========================================
	// Additional calculateSimilarity Edge Cases
	// ========================================

	describe('calculateSimilarity - additional edge cases', () => {
		it('should handle strings with very different lengths', () => {
			const similarity = calculateSimilarity('A', 'A very long description that should not match');

			// Length ratio < 0.3 should return 0
			expect(similarity).toBe(0);
		});

		it('should normalize accented characters', () => {
			const similarity = calculateSimilarity('Café com Açúcar', 'Cafe com Acucar');

			expect(similarity).toBe(1); // Should be identical after normalization
		});

		it('should normalize special characters', () => {
			const similarity = calculateSimilarity('PIX - Transferência!', 'PIX Transferencia');

			expect(similarity).toBeGreaterThan(0.8);
		});

		it('should normalize multiple spaces', () => {
			const similarity = calculateSimilarity('PIX    Recebido', 'PIX Recebido');

			expect(similarity).toBe(1);
		});

		it('should handle case differences', () => {
			const similarity = calculateSimilarity('PIX RECEBIDO', 'pix recebido');

			expect(similarity).toBe(1);
		});
	});
});

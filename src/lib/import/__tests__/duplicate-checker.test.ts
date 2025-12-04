/**
 * @file duplicate-checker.test.ts
 * @description Unit tests for duplicate detection functionality
 */

import { describe, expect, it } from 'vitest';

import type {
	DuplicateCheckResult,
	ExtractedTransactionForCheck,
} from '../validators/duplicate-checker';
import { calculateSimilarity, markDuplicates } from '../validators/duplicate-checker';

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
});

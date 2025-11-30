import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock functions that we can control
const mockGetAccountBalances = vi.fn().mockResolvedValue({
	accounts: [],
	totalBalance: 0,
	totalAvailable: 0,
	summary: 'Mocked response',
});

// Mock all handlers
vi.mock('../handlers', () => ({
	getAccountBalances: mockGetAccountBalances,
	getRecentTransactions: vi.fn().mockResolvedValue({
		transactions: [],
		count: 0,
		summary: 'Mocked response',
	}),
	getSpendingByCategory: vi.fn().mockResolvedValue({
		categories: [],
		totalSpending: 0,
		period: 'mês atual',
		summary: 'Mocked response',
	}),
	getUpcomingPayments: vi.fn().mockResolvedValue({
		payments: [],
		totalAmount: 0,
		count: 0,
		summary: 'Mocked response',
	}),
	getBudgetStatus: vi.fn().mockResolvedValue({
		budgets: [],
		overallStatus: 'ok',
		summary: 'Mocked response',
	}),
	getFinancialInsights: vi.fn().mockResolvedValue({
		insights: [],
		count: 0,
		summary: 'Mocked response',
	}),
	getSpendingTrends: vi.fn().mockResolvedValue({
		trends: [],
		averageSpending: 0,
		trend: 'stable',
		trendPercentage: 0,
		summary: 'Mocked response',
	}),
}));

import { executeTool, getAvailableTools, isValidToolName } from '../executor';

describe('Tool Executor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the mock to default behavior
		mockGetAccountBalances.mockResolvedValue({
			accounts: [],
			totalBalance: 0,
			totalAvailable: 0,
			summary: 'Mocked response',
		});
	});

	describe('executeTool', () => {
		it('should execute get_account_balances successfully', async () => {
			const result = await executeTool('get_account_balances', 'user-123', {});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.result).toHaveProperty('summary');
			}
		});

		it('should return error for unknown tool', async () => {
			const result = await executeTool('unknown_tool', 'user-123', {});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain('Unknown tool');
			}
		});

		it('should handle tool execution errors gracefully', async () => {
			mockGetAccountBalances.mockRejectedValueOnce(new Error('Database error'));

			const result = await executeTool('get_account_balances', 'user-123', {});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain('Database error');
			}
		});
	});

	describe('isValidToolName', () => {
		it('should return true for valid tool names', () => {
			expect(isValidToolName('get_account_balances')).toBe(true);
			expect(isValidToolName('get_recent_transactions')).toBe(true);
			expect(isValidToolName('get_spending_trends')).toBe(true);
		});

		it('should return false for invalid tool names', () => {
			expect(isValidToolName('invalid_tool')).toBe(false);
			expect(isValidToolName('')).toBe(false);
		});
	});

	describe('getAvailableTools', () => {
		it('should return all 7 tool names', () => {
			const tools = getAvailableTools();

			expect(tools).toHaveLength(7);
			expect(tools).toContain('get_account_balances');
			expect(tools).toContain('get_spending_trends');
		});
	});
});

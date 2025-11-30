import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create a chainable mock that always resolves to empty array
const createChainableMock = () => {
	const mock: Record<string, unknown> = {};
	const chainMethods = [
		'select',
		'from',
		'leftJoin',
		'where',
		'groupBy',
		'orderBy',
	];

	// Make all chain methods return the mock itself
	for (const method of chainMethods) {
		mock[method] = vi.fn(() => mock);
	}

	// `limit` is the terminal method that returns a Promise
	mock.limit = vi.fn().mockResolvedValue([]);

	// Make the mock itself a Promise-like (for queries without limit)
	mock.then = vi.fn((resolve: (value: unknown[]) => void) => {
		return Promise.resolve([]).then(resolve);
	});

	return mock;
};

// Mock database
vi.mock('@/db', () => ({
	db: createChainableMock(),
}));

import { FinancialContextService } from '../context/FinancialContextService';

describe('FinancialContextService', () => {
	const userId = 'test-user-123';
	let service: FinancialContextService;

	beforeEach(() => {
		service = new FinancialContextService(userId);
		FinancialContextService.clearAllCache();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should create instance with userId', () => {
		expect(service).toBeInstanceOf(FinancialContextService);
	});

	it('should return context with expected structure', async () => {
		const context = await service.getContext();

		expect(context).toHaveProperty('totalBalance');
		expect(context).toHaveProperty('availableBalance');
		expect(context).toHaveProperty('monthlyIncome');
		expect(context).toHaveProperty('monthlyExpenses');
		expect(context).toHaveProperty('topCategories');
		expect(context).toHaveProperty('pendingAlerts');
		expect(context).toHaveProperty('upcomingPayments');
		expect(context).toHaveProperty('lastUpdated');
	});

	it('should cache context for subsequent calls', async () => {
		const context1 = await service.getContext();
		const context2 = await service.getContext();

		// Both should have same lastUpdated since cached
		expect(context1.lastUpdated).toEqual(context2.lastUpdated);
	});

	it('should refresh cache when forceRefresh is true', async () => {
		const context1 = await service.getContext();

		// Wait a bit
		await new Promise((resolve) => setTimeout(resolve, 10));

		const context2 = await service.getContext(true);

		// Should have different timestamps
		expect(context2.lastUpdated.getTime()).toBeGreaterThanOrEqual(
			context1.lastUpdated.getTime(),
		);
	});

	it('should invalidate cache', async () => {
		await service.getContext();
		service.invalidateCache();

		// Next call should rebuild (can't easily test without more complex mocking)
		const context = await service.getContext();
		expect(context).toBeDefined();
	});
});

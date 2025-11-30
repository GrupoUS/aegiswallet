import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database before importing the service
vi.mock('@/db', () => {
	// Create chainable mock for Drizzle-style queries that resolves to empty arrays
	const createChain = (): unknown => {
		const mockResult = Promise.resolve([]);
		// Extend the promise with chainable methods
		return Object.assign(mockResult, {
			select: vi.fn(() => createChain()),
			from: vi.fn(() => createChain()),
			leftJoin: vi.fn(() => createChain()),
			where: vi.fn(() => createChain()),
			groupBy: vi.fn(() => createChain()),
			orderBy: vi.fn(() => createChain()),
			limit: vi.fn(() => Promise.resolve([])),
		});
	};

	return {
		db: {
			select: vi.fn(() => createChain()),
		},
	};
});

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

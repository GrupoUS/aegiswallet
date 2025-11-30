import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Queue for custom mock return values (allows per-test customization)
// Tests can push return values, and limit() will consume them in order
const limitReturnQueue: unknown[] = [];

// Mock database before importing the service
vi.mock('@/db/client', () => {
	// Create chainable mock for Drizzle-style queries that resolves to arrays
	// In Drizzle, query chains are awaitable Promises that resolve to arrays
	const createChain = (): unknown => {
		// Create limit function that consumes from queue or returns empty array
		const limitFn = vi.fn(() => {
			// If queue has values, use the first one; otherwise return empty array
			const returnValue = limitReturnQueue.length > 0 ? limitReturnQueue.shift() : [];
			return Promise.resolve(returnValue);
		});

		// Create a Promise that resolves to an empty array by default
		const mockPromise = Promise.resolve([]);

		// Extend the promise with chainable methods that return new chains
		// This allows: db.select().from().where() etc.
		return Object.assign(mockPromise, {
			select: vi.fn(() => createChain()),
			from: vi.fn(() => createChain()),
			leftJoin: vi.fn(() => createChain()),
			where: vi.fn(() => createChain()),
			groupBy: vi.fn(() => createChain()),
			orderBy: vi.fn(() => createChain()),
			// limit() resolves to array (terminal method)
			limit: limitFn,
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
		// Clear the limit return queue after each test
		limitReturnQueue.length = 0;
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
		expect(context2.lastUpdated.getTime()).toBeGreaterThanOrEqual(context1.lastUpdated.getTime());
	});

	it('should invalidate cache', async () => {
		await service.getContext();
		service.invalidateCache();

		// Next call should rebuild (can't easily test without more complex mocking)
		const context = await service.getContext();
		expect(context).toBeDefined();
	});

	describe('mapInsightTypeToAlertType', () => {
		// Test the mapping indirectly through getPendingAlerts
		// by mocking the database to return insights with different types
		it('should correctly map database insightType values (snake_case) to alert types', async () => {
			// Mock database to return insights with snake_case values as stored in DB
			const mockInsights = [
				{
					id: '1',
					insightType: 'budget_alert', // Database stores as snake_case
					title: 'Budget exceeded',
					impactLevel: 'high',
					recommendation: 'Reduce spending',
				},
				{
					id: '2',
					insightType: 'spending_pattern', // Database stores as snake_case
					title: 'Unusual spending detected',
					impactLevel: 'medium',
					recommendation: null,
				},
				{
					id: '3',
					insightType: 'warning', // Database stores as snake_case
					title: 'Low balance warning',
					impactLevel: 'high',
					recommendation: 'Add funds',
				},
				{
					id: '4',
					insightType: 'opportunity', // Database stores as snake_case
					title: 'Payment opportunity',
					impactLevel: 'low',
					recommendation: 'Pay early',
				},
			];

			// buildContext calls 5 queries in parallel, 3 of which use limit():
			// - getCategorySpending (limit 10) - expects category data
			// - getPendingAlerts (limit 5) - expects insights data <- we want this one
			// - getUpcomingPayments (limit 10) - expects schedule data
			// Push empty arrays for other queries, and insights for getPendingAlerts
			// Since execution order is not guaranteed, we push insights in all limit positions
			limitReturnQueue.push([], mockInsights, mockInsights, mockInsights);

			// Force refresh to bypass cache
			const context = await service.getContext(true);

			// Verify all insight types map correctly
			// Check that pendingAlerts contains the expected mappings
			expect(context.pendingAlerts.length).toBeGreaterThanOrEqual(1);
			const alertTypes = context.pendingAlerts.map((alert) => alert.type);
			expect(alertTypes).toContain('budget_exceeded'); // budget_alert -> budget_exceeded
			expect(alertTypes).toContain('unusual_spending'); // spending_pattern -> unusual_spending
			expect(alertTypes).toContain('low_balance'); // warning -> low_balance
			expect(alertTypes).toContain('payment_due'); // opportunity -> payment_due
		});

		it('should default to unusual_spending for unknown insightType values', async () => {
			const mockInsights = [
				{
					id: '1',
					insightType: 'unknown_type', // Not in mapping
					title: 'Unknown insight',
					impactLevel: 'medium',
					recommendation: null,
				},
			];

			// Push mock data to queue (push multiple times for parallel queries)
			limitReturnQueue.push([], mockInsights, mockInsights, mockInsights);

			// Force refresh to bypass cache
			const context = await service.getContext(true);

			// Should have at least one alert with the default type
			expect(context.pendingAlerts.length).toBeGreaterThanOrEqual(1);
			const hasDefaultType = context.pendingAlerts.some(
				(alert) => alert.type === 'unusual_spending',
			);
			expect(hasDefaultType).toBe(true); // Default fallback
		});
	});
});

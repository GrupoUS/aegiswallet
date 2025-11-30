import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock data
const mockAccountsData = [
	{
		id: 'acc-1',
		institutionName: 'Banco do Brasil',
		accountType: 'CHECKING',
		balance: '5000.00',
		availableBalance: '4500.00',
		currency: 'BRL',
		lastSync: new Date('2024-01-15'),
	},
	{
		id: 'acc-2',
		institutionName: 'Nubank',
		accountType: 'SAVINGS',
		balance: '10000.00',
		availableBalance: '10000.00',
		currency: 'BRL',
		lastSync: new Date('2024-01-15'),
	},
];

// We need to store the mock function reference that will be used in the mock factory
const mockDbWhere = vi.fn();

// Mock the database module - this needs to be defined BEFORE any imports
vi.mock('@/db/client', () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: mockDbWhere,
			})),
		})),
	},
}));

// Import the handler type for dynamic import
import type { getAccountBalances as GetAccountBalancesType } from '../getAccountBalances';

describe('getAccountBalances', () => {
	const userId = 'test-user-123';
	let getAccountBalances: typeof GetAccountBalancesType;

	beforeAll(async () => {
		// Reset modules to clear any previous mocks
		vi.resetModules();

		// Re-apply our mock
		vi.doMock('@/db/client', () => ({
			db: {
				select: vi.fn(() => ({
					from: vi.fn(() => ({
						where: mockDbWhere,
					})),
				})),
			},
		}));

		// Dynamic import to get fresh module with our mock
		const module = await import('../getAccountBalances');
		getAccountBalances = module.getAccountBalances;
	});

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset to default mock data
		mockDbWhere.mockResolvedValue(mockAccountsData);
	});

	it('should return account balances with totals', async () => {
		const result = await getAccountBalances(userId, { includeInactive: false });

		expect(result.accounts).toHaveLength(2);
		expect(result.totalBalance).toBe(15000);
		expect(result.totalAvailable).toBe(14500);
		expect(result.summary).toContain('2 conta(s)');
		expect(result.summary).toContain('R$');
	});

	it('should format currency correctly in summary', async () => {
		const result = await getAccountBalances(userId, { includeInactive: false });

		// Summary should be in Portuguese Brazilian format
		expect(result.summary).toMatch(/R\$/);
	});

	it('should handle empty accounts list', async () => {
		mockDbWhere.mockResolvedValueOnce([]);

		const result = await getAccountBalances(userId, { includeInactive: false });

		expect(result.accounts).toHaveLength(0);
		expect(result.totalBalance).toBe(0);
		expect(result.summary).toContain('Nenhuma conta');
	});
});

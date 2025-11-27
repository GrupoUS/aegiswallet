import { vi } from 'vitest';

// Mock do cliente Supabase
export const createMockSupabaseClient = () => ({
	auth: {
		getUser: vi.fn().mockResolvedValue({
			data: { user: { email: 'test@example.com', id: 'test-user-id' } },
			error: null,
		}),
		onAuthStateChange: vi.fn().mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } },
		}),
		signInWithPassword: vi.fn().mockResolvedValue({
			data: { user: { email: 'test@example.com', id: 'test-user-id' } },
			error: null,
		}),
		signOut: vi.fn().mockResolvedValue({ error: null }),
	},
	from: vi.fn().mockImplementation((_table: string) => ({
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		mockResolve: vi
			.fn()
			.mockReturnValue([
				{ created_at: new Date().toISOString(), id: 'test-id' },
			]),
		order: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({
			data: null,
			error: null,
		}),
		update: vi.fn().mockReturnThis(),
	})),
	realtime: {
		subscribe: vi.fn().mockReturnValue({
			subscription: { unsubscribe: vi.fn() },
		}),
	},
	storage: {
		from: vi.fn().mockReturnValue({
			getPublicUrl: vi
				.fn()
				.mockReturnValue({ data: { publicUrl: 'https://test-url.com' } }),
			remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
			upload: vi
				.fn()
				.mockResolvedValue({ data: { path: 'test-path' }, error: null }),
		}),
	},
});

// Mock dados de teste
export const mockUsers = [
	{
		created_at: '2024-01-01T00:00:00Z',
		email: 'test@example.com',
		id: 'test-user-id',
	},
];

export const mockTransactions = [
	{
		amount: 100.5,
		category: 'test',
		created_at: '2024-01-01T00:00:00Z',
		description: 'Test transaction',
		id: 'test-transaction-id',
		transaction_date: '2024-01-01T00:00:00Z',
		user_id: 'test-user-id',
	},
];

// Mock de funções de banco de dados
export const mockSupabaseFunctions = {
	createTransaction: vi
		.fn()
		.mockResolvedValue({ data: mockTransactions[0], error: null }),
	createUser: vi.fn().mockResolvedValue({ data: mockUsers[0], error: null }),
	getTransactions: vi
		.fn()
		.mockResolvedValue({ data: mockTransactions, error: null }),
};

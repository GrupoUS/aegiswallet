import { vi } from 'vitest';

// Mock do cliente Supabase
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockImplementation((_table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    mockResolve: vi.fn().mockReturnValue([{ id: 'test-id', created_at: new Date().toISOString() }]),
  })),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } }),
    }),
  },
  realtime: {
    subscribe: vi.fn().mockReturnValue({
      subscription: { unsubscribe: vi.fn() },
    }),
  },
});

// Mock dados de teste
export const mockUsers = [
  {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockTransactions = [
  {
    id: 'test-transaction-id',
    user_id: 'test-user-id',
    amount: 100.5,
    description: 'Test transaction',
    category: 'test',
    transaction_date: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Mock de funções de banco de dados
export const mockSupabaseFunctions = {
  createUser: vi.fn().mockResolvedValue({ data: mockUsers[0], error: null }),
  createTransaction: vi.fn().mockResolvedValue({ data: mockTransactions[0], error: null }),
  getTransactions: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
};

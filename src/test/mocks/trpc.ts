import { vi } from 'vitest';

// Mock do tRPC router
export const createMockTRPCRouter = () => ({
  auth: {
    signIn: vi.fn().mockResolvedValue({
      success: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
    }),
    getProfile: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      autonomy_level: 50,
    }),
    signUp: vi.fn().mockResolvedValue({
      success: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
    }),
  },
  transactions: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'test-transaction-id',
        amount: 100.5,
        description: 'Test transaction',
        category: 'test',
        date: '2024-01-01',
      },
    ]),
    create: vi.fn().mockResolvedValue({
      id: 'test-transaction-id',
      amount: 100.5,
      description: 'Test transaction',
      category: 'test',
      date: '2024-01-01',
    }),
    categorize: vi.fn().mockResolvedValue({
      category: 'food',
      confidence: 0.95,
    }),
  },
  voice: {
    processCommand: vi.fn().mockResolvedValue({
      transcript: 'Como está meu saldo?',
      intent: 'balance_query',
      confidence: 0.98,
      response: 'Seu saldo atual é de R$ 1.234,56',
    }),
    getHistory: vi.fn().mockResolvedValue([
      {
        id: 'test-command-id',
        command: 'Como está meu saldo?',
        intent: 'balance_query',
        confidence: 0.98,
        response: 'Seu saldo atual é de R$ 1.234,56',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]),
  },
  banking: {
    linkAccount: vi.fn().mockResolvedValue({
      id: 'test-account-id',
      institution_name: 'Test Bank',
      account_mask: '****1234',
      balance: 5000.0,
    }),
    syncTransactions: vi.fn().mockResolvedValue({
      synced: 10,
      errors: [],
    }),
    getAccounts: vi.fn().mockResolvedValue([
      {
        id: 'test-account-id',
        institution_name: 'Test Bank',
        account_mask: '****1234',
        balance: 5000.0,
        is_active: true,
      },
    ]),
  },
  pix: {
    sendTransfer: vi.fn().mockResolvedValue({
      success: true,
      transaction_id: 'test-pix-id',
      amount: 100.0,
      recipient: 'test@example.com',
    }),
    getLimits: vi.fn().mockResolvedValue({
      daily_limit: 5000.0,
      remaining_daily: 4900.0,
    }),
  },
});

// Mock do tRPC client
export const createMockTRPCClient = () => {
  const mockRouter = createMockTRPCRouter();

  return {
    auth: mockRouter.auth,
    transactions: mockRouter.transactions,
    voice: mockRouter.voice,
    banking: mockRouter.banking,
    pix: mockRouter.pix,
  };
};

// Mock do createCaller para testes de backend
export const createMockCaller = () => {
  const mockRouter = createMockTRPCRouter();

  return {
    auth: mockRouter.auth,
    transactions: mockRouter.transactions,
    voice: mockRouter.voice,
    banking: mockRouter.banking,
    pix: mockRouter.pix,
    // Mock user context
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  };
};

// Mock de dados de teste
export const mockTRPCResponses = {
  auth: {
    signIn: {
      success: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
    },
    getProfile: {
      id: 'test-user-id',
      email: 'test@example.com',
      autonomy_level: 50,
    },
  },
  transactions: {
    getAll: [
      {
        id: 'test-transaction-id',
        amount: 100.5,
        description: 'Test transaction',
        category: 'test',
        date: '2024-01-01',
      },
    ],
  },
  voice: {
    processCommand: {
      transcript: 'Como está meu saldo?',
      intent: 'balance_query',
      confidence: 0.98,
      response: 'Seu saldo atual é de R$ 1.234,56',
    },
  },
};

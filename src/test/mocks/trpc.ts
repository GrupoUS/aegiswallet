import { vi } from 'vitest';

// Mock do tRPC router
export const createMockTRPCRouter = () => ({
  auth: {
    getProfile: vi.fn().mockResolvedValue({
      autonomy_level: 50,
      email: 'test@example.com',
      id: 'test-user-id',
    }),
    signIn: vi.fn().mockResolvedValue({
      success: true,
      user: { email: 'test@example.com', id: 'test-user-id' },
    }),
    signUp: vi.fn().mockResolvedValue({
      success: true,
      user: { email: 'test@example.com', id: 'test-user-id' },
    }),
  },
  banking: {
    getAccounts: vi.fn().mockResolvedValue([
      {
        account_mask: '****1234',
        balance: 5000.0,
        id: 'test-account-id',
        institution_name: 'Test Bank',
        is_active: true,
      },
    ]),
    linkAccount: vi.fn().mockResolvedValue({
      account_mask: '****1234',
      balance: 5000.0,
      id: 'test-account-id',
      institution_name: 'Test Bank',
    }),
    syncTransactions: vi.fn().mockResolvedValue({
      errors: [],
      synced: 10,
    }),
  },
  pix: {
    getLimits: vi.fn().mockResolvedValue({
      daily_limit: 5000.0,
      remaining_daily: 4900.0,
    }),
    sendTransfer: vi.fn().mockResolvedValue({
      amount: 100.0,
      recipient: 'test@example.com',
      success: true,
      transaction_id: 'test-pix-id',
    }),
  },
  transactions: {
    categorize: vi.fn().mockResolvedValue({
      category: 'food',
      confidence: 0.95,
    }),
    create: vi.fn().mockResolvedValue({
      amount: 100.5,
      category: 'test',
      date: '2024-01-01',
      description: 'Test transaction',
      id: 'test-transaction-id',
    }),
    getAll: vi.fn().mockResolvedValue([
      {
        amount: 100.5,
        category: 'test',
        date: '2024-01-01',
        description: 'Test transaction',
        id: 'test-transaction-id',
      },
    ]),
  },
  voice: {
    getHistory: vi.fn().mockResolvedValue([
      {
        command: 'Como está meu saldo?',
        confidence: 0.98,
        created_at: '2024-01-01T00:00:00Z',
        id: 'test-command-id',
        intent: 'balance_query',
        response: 'Seu saldo atual é de R$ 1.234,56',
      },
    ]),
    processCommand: vi.fn().mockResolvedValue({
      confidence: 0.98,
      intent: 'balance_query',
      response: 'Seu saldo atual é de R$ 1.234,56',
      transcript: 'Como está meu saldo?',
    }),
  },
});

// Mock do tRPC client
export const createMockTRPCClient = () => {
  const mockRouter = createMockTRPCRouter();

  return {
    auth: mockRouter.auth,
    banking: mockRouter.banking,
    pix: mockRouter.pix,
    transactions: mockRouter.transactions,
    voice: mockRouter.voice,
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
      email: 'test@example.com',
      id: 'test-user-id',
    },
  };
};

// Mock de dados de teste
export const mockTRPCResponses = {
  auth: {
    getProfile: {
      autonomy_level: 50,
      email: 'test@example.com',
      id: 'test-user-id',
    },
    signIn: {
      success: true,
      user: { email: 'test@example.com', id: 'test-user-id' },
    },
  },
  transactions: {
    getAll: [
      {
        amount: 100.5,
        category: 'test',
        date: '2024-01-01',
        description: 'Test transaction',
        id: 'test-transaction-id',
      },
    ],
  },
  voice: {
    processCommand: {
      confidence: 0.98,
      intent: 'balance_query',
      response: 'Seu saldo atual é de R$ 1.234,56',
      transcript: 'Como está meu saldo?',
    },
  },
};

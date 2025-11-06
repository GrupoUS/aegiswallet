// Belvo API stub implementation for banking integration
// This is a mock implementation for development purposes

export interface BelvoAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: 'BRL';
  institution: string;
  lastUpdated: string;
}

export interface BelvoTransaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  reference?: string;
}

export interface BelvoInstitution {
  id: string;
  name: string;
  type: 'bank' | 'credit_union';
  country: 'BR';
  logo?: string;
}

// Mock data for development
const mockAccounts: BelvoAccount[] = [
  {
    id: 'acc_001',
    name: 'Conta Corrente',
    type: 'checking',
    balance: 5842.5,
    currency: 'BRL',
    institution: 'Banco do Brasil',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'acc_002',
    name: 'Poupança',
    type: 'savings',
    balance: 12500.0,
    currency: 'BRL',
    institution: 'Banco do Brasil',
    lastUpdated: new Date().toISOString(),
  },
];

const mockTransactions: BelvoTransaction[] = [
  {
    id: 'txn_001',
    account_id: 'acc_001',
    amount: 5000.0,
    description: 'Salário - Empresa XYZ',
    date: '2024-10-01',
    type: 'income',
    category: 'salary',
  },
  {
    id: 'txn_002',
    account_id: 'acc_001',
    amount: -1500.0,
    description: 'Aluguel',
    date: '2024-10-05',
    type: 'expense',
    category: 'housing',
  },
  {
    id: 'txn_003',
    account_id: 'acc_001',
    amount: -450.0,
    description: 'Supermercado Extra',
    date: '2024-10-10',
    type: 'expense',
    category: 'food',
  },
];

const mockInstitutions: BelvoInstitution[] = [
  { id: 'bb', name: 'Banco do Brasil', type: 'bank', country: 'BR' },
  { id: 'itau', name: 'Itaú Unibanco', type: 'bank', country: 'BR' },
  { id: 'bradesco', name: 'Bradesco', type: 'bank', country: 'BR' },
  { id: 'santander', name: 'Santander Brasil', type: 'bank', country: 'BR' },
  { id: 'caixa', name: 'Caixa Econômica Federal', type: 'bank', country: 'BR' },
];

/**
 * Belvo API Client - Stub Implementation
 * This is a mock implementation that returns static data
 * In production, this would make actual API calls to Belvo
 */
export class BelvoApiClient {
  constructor(
    apiKey: string,
    secretKey: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl =
      environment === 'sandbox' ? 'https://sandbox.belvo.com' : 'https://api.belvo.com';
  }

  /**
   * Get available institutions
   */
  async getInstitutions(): Promise<BelvoInstitution[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockInstitutions;
  }

  /**
   * Get user accounts
   */
  async getAccounts(_userId: string): Promise<BelvoAccount[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockAccounts;
  }

  /**
   * Get account transactions
   */
  async getTransactions(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<BelvoTransaction[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Filter transactions by account
    let transactions = mockTransactions.filter((t) => t.account_id === accountId);

    // Apply date filters if provided
    if (startDate) {
      transactions = transactions.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((t) => t.date <= endDate);
    }

    return transactions;
  }

  /**
   * Sync account data (refresh from bank)
   */
  async syncAccount(_accountId: string): Promise<{ status: string; message: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      status: 'success',
      message: 'Account data synchronized successfully',
    };
  }

  /**
   * Create a link token for account connection
   */
  async createLinkToken(userId: string): Promise<{ link_token: string; expiration: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      link_token: `link_token_${Date.now()}_${userId}`,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
  }
}

// Default client instance
export const belvoClient = new BelvoApiClient(
  process.env.BELVO_API_KEY || 'mock_api_key',
  process.env.BELVO_SECRET_KEY || 'mock_secret_key',
  'sandbox'
);

// Utility functions
export const bankingUtils = {
  formatAccountNumber: (accountNumber: string) => {
    // Format Brazilian account number
    const cleaned = accountNumber.replace(/[^\d]/g, '');
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
    }
    return accountNumber;
  },

  formatAgency: (agency: string) => {
    // Format Brazilian agency number
    const cleaned = agency.replace(/[^\d]/g, '');
    if (cleaned.length === 4) {
      return cleaned;
    }
    return agency;
  },

  validateBankAccount: (agency: string, account: string) => {
    // Basic validation for Brazilian bank account
    const cleanedAgency = agency.replace(/[^\d]/g, '');
    const cleanedAccount = account.replace(/[^\d]/g, '');

    return cleanedAgency.length >= 3 && cleanedAccount.length >= 4;
  },
};

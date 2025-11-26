/**
 * Open Banking Connector - Story 02.01
 * Integration with Brazilian Open Banking via Belvo API
 */

export interface BankAccount {
  id: string;
  institution: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  accountNumber: string;
  branch: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  amount: number;
  description: string;
  type: 'debit' | 'credit';
  category?: string;
  merchant?: string;
}

export class OpenBankingConnector {
  private readonly apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async connectBank(_params: {
    userId: string;
    institutionCode: string;
    credentials: Record<string, unknown>;
  }): Promise<{ linkId: string }> {
    // Implementation would call Belvo API
    return { linkId: `link_${Date.now()}` };
  }

  async listAccounts(_linkId: string): Promise<BankAccount[]> {
    // Mock data for MVP
    return [
      {
        accountNumber: '12345-6',
        balance: 5000.0,
        branch: '0001',
        currency: 'BRL',
        id: 'acc_1',
        institution: 'Banco do Brasil',
        type: 'checking',
      },
    ];
  }

  async listTransactions(
    _accountId: string,
    _dateFrom: Date,
    _dateTo: Date
  ): Promise<Transaction[]> {
    // Mock data for MVP
    return [
      {
        accountId: _accountId,
        amount: -150.0,
        category: 'food',
        date: new Date(),
        description: 'Supermercado',
        id: 'tx_1',
        type: 'debit',
      },
    ];
  }

  async getBalance(accountId: string): Promise<number> {
    const accounts = await this.listAccounts('link_default');
    const account = accounts.find((a) => a.id === accountId);
    return account?.balance || 0;
  }
}

let connectorInstance: OpenBankingConnector | null = null;

export function getOpenBankingConnector(): OpenBankingConnector {
  if (!connectorInstance) {
    connectorInstance = new OpenBankingConnector(process.env.BELVO_API_KEY || '');
  }
  return connectorInstance;
}

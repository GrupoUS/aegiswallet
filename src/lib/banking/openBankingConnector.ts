/**
 * Open Banking Connector - Story 02.01
 * Integration with Brazilian Open Banking via Belvo API
 */

export interface BankAccount {
  id: string
  institution: string
  type: 'checking' | 'savings' | 'investment'
  balance: number
  currency: string
  accountNumber: string
  branch: string
}

export interface Transaction {
  id: string
  accountId: string
  date: Date
  amount: number
  description: string
  type: 'debit' | 'credit'
  category?: string
  merchant?: string
}

export class OpenBankingConnector {
  private belvoUrl = 'https://api.belvo.com'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async connectBank(_params: {
    userId: string
    institutionCode: string
    credentials: any
  }): Promise<{ linkId: string }> {
    // Implementation would call Belvo API
    return { linkId: `link_${Date.now()}` }
  }

  async listAccounts(_linkId: string): Promise<BankAccount[]> {
    // Mock data for MVP
    return [
      {
        id: 'acc_1',
        institution: 'Banco do Brasil',
        type: 'checking',
        balance: 5000.0,
        currency: 'BRL',
        accountNumber: '12345-6',
        branch: '0001',
      },
    ]
  }

  async listTransactions(
    _accountId: string,
    _dateFrom: Date,
    _dateTo: Date
  ): Promise<Transaction[]> {
    // Mock data for MVP
    return [
      {
        id: 'tx_1',
        accountId: _accountId,
        date: new Date(),
        amount: -150.0,
        description: 'Supermercado',
        type: 'debit',
        category: 'food',
      },
    ]
  }

  async getBalance(accountId: string): Promise<number> {
    const accounts = await this.listAccounts('link_default')
    const account = accounts.find((a) => a.id === accountId)
    return account?.balance || 0
  }
}

let connectorInstance: OpenBankingConnector | null = null

export function getOpenBankingConnector(): OpenBankingConnector {
  if (!connectorInstance) {
    connectorInstance = new OpenBankingConnector(process.env.BELVO_API_KEY || '')
  }
  return connectorInstance
}

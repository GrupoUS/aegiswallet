// PIX API stub implementation for Brazilian instant payments
// This is a mock implementation for development purposes

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

export interface PixKey {
  id: string
  type: PixKeyType
  value: string
  account_id: string
  created_at: string
  status: 'active' | 'inactive' | 'pending'
}

export interface PixTransaction {
  id: string
  amount: number
  description?: string
  sender: {
    name: string
    document: string
    bank: string
    key?: string
  }
  receiver: {
    name: string
    document: string
    bank: string
    key: string
  }
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at?: string
  end_to_end_id?: string
  transaction_id: string
}

export interface PixQRCode {
  id: string
  qr_code: string
  qr_code_url: string
  amount?: number
  description?: string
  expires_at: string
  status: 'active' | 'expired' | 'used'
}

// Mock data for development
const mockPixKeys: PixKey[] = [
  {
    id: 'key_001',
    type: 'cpf',
    value: '123.456.789-00',
    account_id: 'acc_001',
    created_at: '2024-01-15T10:00:00Z',
    status: 'active',
  },
  {
    id: 'key_002',
    type: 'email',
    value: 'usuario@email.com',
    account_id: 'acc_001',
    created_at: '2024-01-20T14:30:00Z',
    status: 'active',
  },
]

const mockPixTransactions: PixTransaction[] = [
  {
    id: 'pix_001',
    amount: 150.00,
    description: 'Pagamento almoço',
    sender: {
      name: 'João Silva',
      document: '123.456.789-00',
      bank: 'Banco do Brasil',
      key: '123.456.789-00',
    },
    receiver: {
      name: 'Maria Santos',
      document: '987.654.321-00',
      bank: 'Itaú Unibanco',
      key: 'maria@email.com',
    },
    status: 'completed',
    created_at: '2024-10-15T12:30:00Z',
    completed_at: '2024-10-15T12:30:05Z',
    end_to_end_id: 'E12345678202410151230000000001',
    transaction_id: 'TXN_PIX_001',
  },
]

/**
 * PIX API Client - Stub Implementation
 * This is a mock implementation for Brazilian PIX instant payments
 * In production, this would integrate with actual PIX infrastructure
 */
export class PixApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey
    this.baseUrl = environment === 'sandbox' 
      ? 'https://sandbox-pix.bcb.gov.br' 
      : 'https://api-pix.bcb.gov.br'
  }

  /**
   * Get user's PIX keys
   */
  async getPixKeys(userId: string): Promise<PixKey[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`Fetching PIX keys for user: ${userId}`)
    return mockPixKeys
  }

  /**
   * Create a new PIX key
   */
  async createPixKey(userId: string, type: PixKeyType, value: string): Promise<PixKey> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    console.log(`Creating PIX key for user: ${userId}`, { type, value })
    
    const newKey: PixKey = {
      id: `key_${Date.now()}`,
      type,
      value,
      account_id: 'acc_001', // Mock account
      created_at: new Date().toISOString(),
      status: 'pending',
    }
    
    return newKey
  }

  /**
   * Send PIX payment
   */
  async sendPixPayment(
    fromAccountId: string,
    toPixKey: string,
    amount: number,
    description?: string
  ): Promise<PixTransaction> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log(`Sending PIX payment`, { fromAccountId, toPixKey, amount, description })
    
    const transaction: PixTransaction = {
      id: `pix_${Date.now()}`,
      amount,
      description,
      sender: {
        name: 'Usuário Teste',
        document: '123.456.789-00',
        bank: 'Banco do Brasil',
        key: '123.456.789-00',
      },
      receiver: {
        name: 'Destinatário',
        document: '987.654.321-00',
        bank: 'Banco Destinatário',
        key: toPixKey,
      },
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      end_to_end_id: `E12345678${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      transaction_id: `TXN_PIX_${Date.now()}`,
    }
    
    return transaction
  }

  /**
   * Generate PIX QR Code
   */
  async generateQRCode(
    accountId: string,
    amount?: number,
    description?: string,
    expiresInMinutes: number = 30
  ): Promise<PixQRCode> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    console.log(`Generating PIX QR Code`, { accountId, amount, description })
    
    const qrCode: PixQRCode = {
      id: `qr_${Date.now()}`,
      qr_code: `00020126580014BR.GOV.BCB.PIX0136${Date.now()}520400005303986${amount ? `54${amount.toFixed(2).padStart(13, '0')}` : ''}5802BR5925Usuario Teste6009SAO PAULO62070503***6304${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      qr_code_url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Mock base64 image
      amount,
      description,
      expires_at: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
      status: 'active',
    }
    
    return qrCode
  }

  /**
   * Get PIX transaction history
   */
  async getPixTransactions(accountId: string, startDate?: string, endDate?: string): Promise<PixTransaction[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700))
    
    console.log(`Fetching PIX transactions for account: ${accountId}`, { startDate, endDate })
    
    let transactions = [...mockPixTransactions]
    
    // Apply date filters if provided
    if (startDate) {
      transactions = transactions.filter(t => t.created_at >= startDate)
    }
    if (endDate) {
      transactions = transactions.filter(t => t.created_at <= endDate)
    }
    
    return transactions
  }

  /**
   * Validate PIX key
   */
  async validatePixKey(pixKey: string): Promise<{ valid: boolean; type?: PixKeyType; name?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    console.log(`Validating PIX key: ${pixKey}`)
    
    // Simple validation logic (mock)
    if (pixKey.includes('@')) {
      return { valid: true, type: 'email', name: 'Usuário Email' }
    } else if (pixKey.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      return { valid: true, type: 'cpf', name: 'Usuário CPF' }
    } else if (pixKey.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
      return { valid: true, type: 'phone', name: 'Usuário Telefone' }
    } else if (pixKey.length === 32) {
      return { valid: true, type: 'random', name: 'Usuário Chave Aleatória' }
    }
    
    return { valid: false }
  }
}

// Default client instance
export const pixClient = new PixApiClient(
  process.env.PIX_API_KEY || 'mock_pix_key',
  'sandbox'
)

// PIX utility functions
export const pixUtils = {
  formatPixKey: (key: string, type: PixKeyType) => {
    switch (type) {
      case 'cpf':
        return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      case 'cnpj':
        return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      case 'phone':
        return key.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
      default:
        return key
    }
  },
  
  validatePixKeyFormat: (key: string, type: PixKeyType) => {
    const patterns = {
      cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
      cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/,
      random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    }
    
    return patterns[type]?.test(key) || false
  },
  
  generateEndToEndId: () => {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    return `E12345678${timestamp}${random}`
  },
}

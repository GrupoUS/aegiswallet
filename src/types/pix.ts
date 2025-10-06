/**
 * PIX Transaction Types for AegisWallet
 * Brazilian instant payment system
 */

export type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'phone' | 'random'

export type PixTransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type PixTransactionType = 'sent' | 'received' | 'scheduled'

export interface PixKey {
  id: string
  type: PixKeyType
  value: string
  label?: string
  isFavorite: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface PixTransaction {
  id: string
  userId: string
  type: PixTransactionType
  status: PixTransactionStatus
  amount: number
  description?: string
  pixKey: string
  pixKeyType: PixKeyType
  recipientName?: string
  recipientDocument?: string
  transactionId?: string
  endToEndId?: string
  scheduledDate?: string
  completedAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface PixQRCode {
  id: string
  userId: string
  pixKey: string
  amount?: number
  description?: string
  qrCodeData: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface PixTransferInput {
  pixKey: string
  pixKeyType: PixKeyType
  amount: number
  description?: string
  scheduledDate?: string
}

export interface PixReceiveInput {
  pixKey: string
  amount?: number
  description?: string
  expiresInMinutes?: number
}

export interface PixChartData {
  date: string
  time?: string
  sent: number
  received: number
  total: number
}

export interface PixStats {
  totalSent: number
  totalReceived: number
  transactionCount: number
  averageTransaction: number
  largestTransaction: number
  period: '24h' | '7d' | '30d' | '1y'
}

// Validation helpers
export const PIX_KEY_REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  cpf: /^\d{11}$/,
  cnpj: /^\d{14}$/,
  phone: /^\d{11,13}$/,
  random: /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
}

export function validatePixKey(key: string, type?: PixKeyType): boolean {
  if (type) {
    return PIX_KEY_REGEX[type].test(key.replace(/[^\w@.-]/g, ''))
  }
  
  // Try all types
  const cleanKey = key.replace(/[^\w@.-]/g, '')
  return Object.values(PIX_KEY_REGEX).some(regex => regex.test(cleanKey))
}

export function detectPixKeyType(key: string): PixKeyType | null {
  const cleanKey = key.replace(/[^\w@.-]/g, '')
  
  if (PIX_KEY_REGEX.email.test(cleanKey)) return 'email'
  if (PIX_KEY_REGEX.random.test(cleanKey)) return 'random'
  if (PIX_KEY_REGEX.cnpj.test(cleanKey)) return 'cnpj'
  if (PIX_KEY_REGEX.cpf.test(cleanKey)) return 'cpf'
  if (PIX_KEY_REGEX.phone.test(cleanKey)) return 'phone'
  
  return null
}

export function formatPixKey(key: string, type: PixKeyType): string {
  const cleanKey = key.replace(/\D/g, '')
  
  switch (type) {
    case 'cpf':
      return cleanKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    case 'cnpj':
      return cleanKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    case 'phone':
      if (cleanKey.length === 11) {
        return cleanKey.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3')
      }
      return cleanKey.replace(/(\d{2})(\d{4})(\d{4})/, '+55 ($1) $2-$3')
    default:
      return key
  }
}

export function maskPixKey(key: string, type: PixKeyType): string {
  switch (type) {
    case 'email':
      const [local, domain] = key.split('@')
      return `${local?.slice(0, 3)}***@${domain}`
    case 'cpf':
      return `***.${key.slice(4, 7)}.***-**`
    case 'cnpj':
      return `**.***.***/****-**`
    case 'phone':
      return `+55 (**) *****-${key.slice(-4)}`
    default:
      return `${key.slice(0, 8)}...${key.slice(-4)}`
  }
}

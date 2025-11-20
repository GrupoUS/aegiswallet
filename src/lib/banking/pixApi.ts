// PIX API implementation for Brazilian instant payments
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface PixKey {
  id: string;
  type: PixKeyType;
  value: string;
  account_id: string;
  created_at: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface PixTransaction {
  id: string;
  amount: number;
  description?: string;
  sender: {
    name: string;
    document: string;
    bank: string;
    key?: string;
  };
  receiver: {
    name: string;
    document: string;
    bank: string;
    key: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  end_to_end_id?: string;
  transaction_id: string;
}

export interface PixQRCode {
  id: string;
  qr_code: string;
  qr_code_url: string;
  amount?: number;
  description?: string;
  expires_at: string;
  status: 'active' | 'expired' | 'used';
}

/**
 * PIX API Client - Supabase Implementation
 */
export class PixApiClient {
  baseUrl: string;

  constructor(_apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.baseUrl =
      environment === 'sandbox' ? 'https://sandbox-pix.bcb.gov.br' : 'https://api-pix.bcb.gov.br';
  }

  /**
   * Get user's PIX keys
   */
  async getPixKeys(userId: string): Promise<PixKey[]> {
    const { data, error } = await supabase.from('pix_keys').select('*').eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch PIX keys', {
        operation: 'pix_keys_fetch',
        userId,
        error: (error as Error).message,
      });
      throw error;
    }

    return (data || []).map((key) => ({
      id: key.id,
      type: key.key_type as PixKeyType,
      value: key.key_value,
      account_id: 'default', // Placeholder as DB doesn't link keys to accounts directly
      created_at: key.created_at || new Date().toISOString(),
      status: key.is_active ? 'active' : 'inactive',
    }));
  }

  /**
   * Create a new PIX key
   */
  async createPixKey(userId: string, type: PixKeyType, value: string): Promise<PixKey> {
    const { data, error } = await supabase
      .from('pix_keys')
      .insert({
        user_id: userId,
        key_type: type,
        key_value: value,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create PIX key', {
        operation: 'pix_keys_create',
        userId,
        error: (error as Error).message,
      });
      throw error;
    }

    return {
      id: data.id,
      type: data.key_type as PixKeyType,
      value: data.key_value,
      account_id: 'default',
      created_at: data.created_at || new Date().toISOString(),
      status: data.is_active ? 'active' : 'inactive',
    };
  }

  /**
   * Send PIX payment
   */
  async sendPixPayment(
    _fromAccountId: string, // Not used in DB insert currently, assuming user context
    toPixKey: string,
    amount: number,
    description?: string
  ): Promise<PixTransaction> {
    const transactionId = `TXN_PIX_${Date.now()}`;
    const endToEndId = pixUtils.generateEndToEndId();

    // Get current user for user_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pix_transfers')
      .insert({
        user_id: user.id,
        pix_key: toPixKey,
        amount: amount,
        description: description,
        status: 'completed', // Simulating instant completion
        recipient_name: 'Unknown Receiver', // In real flow, this comes from key lookup
        transaction_id: transactionId,
        end_to_end_id: endToEndId,
        confirmed_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Pix payment failed', {
        operation: 'pix_payment',
        userId: user.id,
        error: (error as Error).message,
      });
      throw error;
    }

    return {
      id: data.id,
      amount: Number(data.amount),
      description: data.description || undefined,
      sender: {
        name: 'Me', // Placeholder
        document: '***',
        bank: 'NeonPro',
      },
      receiver: {
        name: data.recipient_name,
        document: data.recipient_document || '***',
        bank: data.recipient_bank || 'Unknown',
        key: data.pix_key,
      },
      status: (data.status as PixTransaction['status']) || 'pending',
      created_at: data.created_at || new Date().toISOString(),
      completed_at: data.executed_at || undefined,
      end_to_end_id: data.end_to_end_id || undefined,
      transaction_id: data.transaction_id || transactionId,
    };
  }

  /**
   * Generate PIX QR Code
   */
  async generateQRCode(
    _accountId: string,
    amount?: number,
    description?: string,
    expiresInMinutes: number = 30
  ): Promise<PixQRCode> {
    // This is still largely a mock because generating a real EMV QR code requires backend logic not present in basic DB schema.
    // However, we can return a structure that the frontend expects.
    // We could store this in a 'pix_qr_codes' table if we had one, but for now we'll generate on the fly.

    const qrCodeId = `qr_${Date.now()}`;

    // Mocking the QR code string for now as we don't have the generator logic here yet
    const qrCodeString = `00020126580014BR.GOV.BCB.PIX0136${Date.now()}520400005303986${amount ? `54${amount.toFixed(2).padStart(13, '0')}` : ''}5802BR5925Usuario Teste6009SAO PAULO62070503***6304${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, '0')}`;

    const qrCode: PixQRCode = {
      id: qrCodeId,
      qr_code: qrCodeString,
      qr_code_url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Placeholder image
      amount,
      description,
      expires_at: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
      status: 'active',
    };

    return qrCode;
  }

  /**
   * Get PIX transaction history
   */
  async getPixTransactions(
    _accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PixTransaction[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase.from('pix_transfers').select('*').eq('user_id', user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch PIX transactions', {
        operation: 'pix_transactions',
        userId: user.id,
        error: (error as Error).message,
      });
      throw error;
    }

    return (data || []).map((txn) => ({
      id: txn.id,
      amount: Number(txn.amount),
      description: txn.description || undefined,
      sender: {
        name: 'Me',
        document: '***',
        bank: 'NeonPro',
      },
      receiver: {
        name: txn.recipient_name,
        document: txn.recipient_document || '***',
        bank: txn.recipient_bank || 'Unknown',
        key: txn.pix_key,
      },
      status: (txn.status as PixTransaction['status']) || 'pending',
      created_at: txn.created_at || new Date().toISOString(),
      completed_at: txn.executed_at || undefined,
      end_to_end_id: txn.end_to_end_id || undefined,
      transaction_id: txn.transaction_id || `TXN_${txn.id}`,
    }));
  }

  /**
   * Validate PIX key
   */
  async validatePixKey(
    pixKey: string
  ): Promise<{ valid: boolean; type?: PixKeyType; name?: string }> {
    // This is a client-side validation helper + potential API check.
    // Since we don't have a "Dict" API connection, we'll stick to format validation.

    if (pixKey.includes('@')) {
      // Simple email check
      return { valid: true, type: 'email', name: 'Usuário Email' };
    }
    if (pixKey.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      return { valid: true, type: 'cpf', name: 'Usuário CPF' };
    }
    if (pixKey.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
      return { valid: true, type: 'phone', name: 'Usuário Telefone' };
    }
    if (pixKey.length === 32) {
      return { valid: true, type: 'random', name: 'Usuário Chave Aleatória' };
    }
    // Try pure numbers for CPF/Phone
    if (pixKey.match(/^\d{11}$/)) {
      return { valid: true, type: 'cpf', name: 'Usuário CPF' }; // or phone
    }

    return { valid: false };
  }
}

// Default client instance
export const pixClient = new PixApiClient(import.meta.env.VITE_PIX_API_KEY || 'api_key', 'sandbox');

// PIX utility functions
export const pixUtils = {
  formatPixKey: (key: string, type: PixKeyType) => {
    switch (type) {
      case 'cpf':
        return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      case 'cnpj':
        return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      case 'phone':
        return key.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      default:
        return key;
    }
  },

  validatePixKeyFormat: (key: string, type: PixKeyType) => {
    const patterns = {
      cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
      cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/,
      random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    };

    return patterns[type]?.test(key) || false;
  },

  generateEndToEndId: () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `E12345678${timestamp}${random}`;
  },
};

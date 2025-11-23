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
        error: (error as Error).message,
        operation: 'pix_keys_fetch',
        userId,
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
        is_active: true,
        key_type: type,
        key_value: value,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create PIX key', {
        error: (error as Error).message,
        operation: 'pix_keys_create',
        userId,
      });
      throw error;
    }

    return {
      account_id: 'default',
      created_at: data.created_at || new Date().toISOString(),
      id: data.id,
      status: data.is_active ? 'active' : 'inactive',
      type: data.key_type as PixKeyType,
      value: data.key_value,
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
    if (!user) {
      throw new Error('User not authenticated');
    }

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
        error: (error as Error).message,
        operation: 'pix_payment',
        userId: user.id,
      });
      throw error;
    }

    return {
      amount: Number(data.amount),
      completed_at: data.executed_at || undefined,
      created_at: data.created_at || new Date().toISOString(),
      description: data.description || undefined,
      end_to_end_id: data.end_to_end_id || undefined,
      id: data.id,
      receiver: {
        bank: data.recipient_bank || 'Unknown',
        document: data.recipient_document || '***',
        key: data.pix_key,
        name: data.recipient_name,
      },
      sender: {
        name: 'Me', // Placeholder
        document: '***',
        bank: 'NeonPro',
      },
      status: (data.status as PixTransaction['status']) || 'pending',
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
    if (!user) {
      return [];
    }

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
        error: (error as Error).message,
        operation: 'pix_transactions',
        userId: user.id,
      });
      throw error;
    }

    return (data || []).map((txn) => ({
      amount: Number(txn.amount),
      completed_at: txn.executed_at || undefined,
      created_at: txn.created_at || new Date().toISOString(),
      description: txn.description || undefined,
      end_to_end_id: txn.end_to_end_id || undefined,
      id: txn.id,
      receiver: {
        bank: txn.recipient_bank || 'Unknown',
        document: txn.recipient_document || '***',
        key: txn.pix_key,
        name: txn.recipient_name,
      },
      sender: {
        bank: 'NeonPro',
        document: '***',
        name: 'Me',
      },
      status: (txn.status as PixTransaction['status']) || 'pending',
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
      return { name: 'Usuário Email', type: 'email', valid: true };
    }
    if (pixKey.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      return { name: 'Usuário CPF', type: 'cpf', valid: true };
    }
    if (pixKey.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
      return { name: 'Usuário Telefone', type: 'phone', valid: true };
    }
    if (pixKey.length === 32) {
      return { name: 'Usuário Chave Aleatória', type: 'random', valid: true };
    }
    // Try pure numbers for CPF/Phone
    if (pixKey.match(/^\d{11}$/)) {
      return { name: 'Usuário CPF', type: 'cpf', valid: true }; // or phone
    }

    return { valid: false };
  }
}

// Default client instance
export const pixClient = new PixApiClient(process.env.NODE_ENV as 'sandbox' | 'production');

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
  validatePixKeyFormat: (key: string, type: PixKeyType) => {
    const patterns = {
      cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
      cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/,
      random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    };

    return patterns[type]?.test(key) || false;
  },
};

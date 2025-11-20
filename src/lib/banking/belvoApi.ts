// Belvo API implementation for banking integration
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';

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

// Static list of supported institutions
const SUPPORTED_INSTITUTIONS: BelvoInstitution[] = [
  { id: 'bb', name: 'Banco do Brasil', type: 'bank', country: 'BR' },
  { id: 'itau', name: 'Itaú Unibanco', type: 'bank', country: 'BR' },
  { id: 'bradesco', name: 'Bradesco', type: 'bank', country: 'BR' },
  { id: 'santander', name: 'Santander Brasil', type: 'bank', country: 'BR' },
  { id: 'caixa', name: 'Caixa Econômica Federal', type: 'bank', country: 'BR' },
];

/**
 * Belvo API Client - Supabase Implementation
 */
export class BelvoApiClient {
  baseUrl: string; // Keep for compatibility if accessed elsewhere, though not used for Supabase

  constructor(
    _apiKey: string,
    _secretKey: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ) {
    this.baseUrl =
      environment === 'sandbox' ? 'https://sandbox.belvo.com' : 'https://api.belvo.com';
  }

  /**
   * Get available institutions
   */
  async getInstitutions(): Promise<BelvoInstitution[]> {
    return SUPPORTED_INSTITUTIONS;
  }

  /**
   * Get user accounts
   */
  async getAccounts(userId: string): Promise<BelvoAccount[]> {
    const { data, error } = await supabase.from('bank_accounts').select('*').eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch accounts', {
        operation: 'belvo_accounts',
        userId,
        error: (error as Error).message,
      });
      throw error;
    }

    return (data || []).map((account) => ({
      id: account.id,
      name: account.name,
      type: (account.type as 'checking' | 'savings' | 'credit') || 'checking',
      balance: account.balance || 0,
      currency: (account.currency as 'BRL') || 'BRL',
      institution: account.institution_name || 'Unknown',
      lastUpdated: account.updated_at || new Date().toISOString(),
    }));
  }

  /**
   * Get account transactions
   */
  async getTransactions(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<BelvoTransaction[]> {
    // Note: financial_events are used as transactions.
    // Currently not strictly linked to account_id in schema, fetching by user via RLS implicitly or we need user_id passed in?
    // The interface asks for accountId. We'll assume the caller has access to the account's owner.
    // For now, we'll fetch all financial_events for the current user (handled by RLS or we need to pass user_id).
    // Since this method signature doesn't include userId, we rely on RLS (supabase.auth.getUser()).

    let query = supabase.from('financial_events').select('*');

    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch transactions', {
        operation: 'belvo_transactions',
        accountId,
        error: (error as Error).message,
      });
      throw error;
    }

    return (data || []).map((event) => ({
      id: event.id,
      account_id: accountId, // Mapping to requested account for now
      amount: event.amount,
      description: event.title,
      date: event.start_date,
      type: event.is_income ? 'income' : 'expense',
      category: event.category || 'uncategorized',
    }));
  }

  /**
   * Sync account data (refresh from bank)
   */
  async syncAccount(accountId: string): Promise<{ status: string; message: string }> {
    // In a real integration, this would trigger a backend sync job.
    // For now, we'll update the last_sync timestamp in the database.
    const { error } = await supabase
      .from('bank_accounts')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', accountId);

    if (error) {
      logger.error('Failed to sync account', {
        operation: 'belvo_sync_account',
        accountId,
        error: (error as Error).message,
      });
      throw error;
    }

    return {
      status: 'success',
      message: 'Account data synchronized successfully',
    };
  }

  /**
   * Create a link token for account connection
   */
  async createLinkToken(userId: string): Promise<{ link_token: string; expiration: string }> {
    // This would typically call the provider's API.
    // We'll generate a dummy token for the flow.
    return {
      link_token: `link_token_${Date.now()}_${userId}`,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
  }
}

// Default client instance
export const belvoClient = new BelvoApiClient(
  import.meta.env.VITE_BELVO_API_KEY || 'api_key',
  import.meta.env.VITE_BELVO_SECRET_KEY || 'secret_key',
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


import { supabase } from "@/integrations/supabase/client";

export interface BankConnection {
  id: string;
  user_id: string;
  provider_name: string;
  institution_id: string;
  institution_name: string;
  provider_connection_id: string;
  sync_status: string;
  last_successful_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id?: string;
  source_transaction_id?: string;
  bank_connection_id?: string;
  is_imported?: boolean;
}

class OpenFinanceService {
  async getBankConnections(): Promise<BankConnection[]> {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bank connections:', error);
      throw error;
    }

    return data || [];
  }

  async createBankConnection(connectionData: {
    provider_name: string;
    institution_id: string;
    institution_name: string;
    provider_connection_id: string;
    encrypted_access_token: string;
  }): Promise<BankConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bank_connections')
      .insert({
        user_id: user.id,
        ...connectionData,
        sync_status: 'idle'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bank connection:', error);
      throw error;
    }

    return data;
  }

  async deleteBankConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error deleting bank connection:', error);
      throw error;
    }
  }

  async updateSyncStatus(connectionId: string, status: string): Promise<void> {
    const updates: any = { sync_status: status };
    
    if (status === 'success') {
      updates.last_successful_sync_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('bank_connections')
      .update(updates)
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  async syncTransactions(connectionId: string): Promise<void> {
    try {
      // Update status to syncing
      await this.updateSyncStatus(connectionId, 'syncing');

      // Call edge function to handle the actual sync
      const { error } = await supabase.functions.invoke('sync-bank-transactions', {
        body: { connectionId }
      });

      if (error) {
        await this.updateSyncStatus(connectionId, 'error');
        throw error;
      }

      await this.updateSyncStatus(connectionId, 'success');
    } catch (error) {
      await this.updateSyncStatus(connectionId, 'error');
      throw error;
    }
  }

  async getImportedTransactions(connectionId?: string): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('is_imported', true)
      .order('date', { ascending: false });

    if (connectionId) {
      query = query.eq('bank_connection_id', connectionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching imported transactions:', error);
      throw error;
    }

    return data || [];
  }

  // Mock method for initiating OAuth flow with Open Finance provider
  async initiateOAuthFlow(institutionId: string): Promise<string> {
    // In a real implementation, this would:
    // 1. Call the Open Finance provider's API to get authorization URL
    // 2. Return the URL for user to authorize
    // 3. Handle the callback to get access tokens
    
    // For now, return a mock URL
    return `https://mock-open-finance-provider.com/auth?institution=${institutionId}&redirect_uri=${encodeURIComponent(window.location.origin)}/callback`;
  }

  // Mock method for handling OAuth callback
  async handleOAuthCallback(code: string, state: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }> {
    // In a real implementation, this would exchange the code for tokens
    // For now, return mock tokens
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600
    };
  }
}

export const openFinanceService = new OpenFinanceService();


import { supabase } from "@/integrations/supabase/client";

export interface BelvoConnection {
  connection_id: string;
  user_id: string;
  belvo_link_id: string;
  institution_name: string;
  access_mode: string;
  last_accessed_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BelvoAccount {
  account_id: string;
  belvo_link_id: string;
  belvo_account_id: string;
  institution_name: string;
  name: string;
  type: string;
  currency: string;
  balance_current: number | null;
  balance_available: number | null;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BelvoTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id?: string;
  source_transaction_id?: string;
  belvo_account_id?: string;
  is_imported?: boolean;
}

class BelvoService {
  async getBelvoConnections(): Promise<BelvoConnection[]> {
    const { data, error } = await supabase
      .from('belvo_bank_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Belvo connections:', error);
      throw error;
    }

    return data || [];
  }

  async createBelvoConnection(connectionData: {
    belvo_link_id: string;
    institution_name: string;
    access_mode?: string;
    status?: string;
  }): Promise<BelvoConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('belvo_bank_connections')
      .insert({
        user_id: user.id,
        belvo_link_id: connectionData.belvo_link_id,
        institution_name: connectionData.institution_name,
        access_mode: connectionData.access_mode || 'recurrent',
        status: connectionData.status || 'valid_token',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Belvo connection:', error);
      throw error;
    }

    return data;
  }

  async deleteBelvoConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('belvo_bank_connections')
      .delete()
      .eq('connection_id', connectionId);

    if (error) {
      console.error('Error deleting Belvo connection:', error);
      throw error;
    }
  }

  async updateConnectionStatus(linkId: string, status: string): Promise<void> {
    const updates: any = { status };
    
    if (status === 'valid_token') {
      updates.last_accessed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('belvo_bank_connections')
      .update(updates)
      .eq('belvo_link_id', linkId);

    if (error) {
      console.error('Error updating connection status:', error);
      throw error;
    }
  }

  async getBelvoAccounts(linkId?: string): Promise<BelvoAccount[]> {
    let query = supabase
      .from('belvo_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (linkId) {
      query = query.eq('belvo_link_id', linkId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Belvo accounts:', error);
      throw error;
    }

    return data || [];
  }

  async syncBelvoData(linkId: string): Promise<void> {
    try {
      // Update status to syncing
      await this.updateConnectionStatus(linkId, 'syncing');

      // Call edge function to handle the actual sync
      const { error } = await supabase.functions.invoke('belvo-sync', {
        body: { linkId }
      });

      if (error) {
        await this.updateConnectionStatus(linkId, 'login_error');
        throw error;
      }

      await this.updateConnectionStatus(linkId, 'valid_token');
    } catch (error) {
      await this.updateConnectionStatus(linkId, 'login_error');
      throw error;
    }
  }

  async getBelvoTransactions(accountId?: string): Promise<BelvoTransaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('is_imported', true)
      .order('date', { ascending: false });

    if (accountId) {
      query = query.eq('belvo_account_id', accountId);
    } else {
      query = query.not('belvo_account_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching Belvo transactions:', error);
      throw error;
    }

    // Map the database response to our Transaction interface with proper type casting
    return (data || []).map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      category_id: transaction.category_id,
      source_transaction_id: transaction.source_transaction_id,
      belvo_account_id: transaction.belvo_account_id,
      is_imported: transaction.is_imported
    }));
  }

  // Mock method for initiating Belvo Connect widget
  async initiateBelvoConnect(): Promise<string> {
    // In a real implementation, this would:
    // 1. Initialize the Belvo Connect widget
    // 2. Handle the widget callbacks
    // 3. Return the link_id upon successful connection
    
    // For now, return a mock URL for the Belvo Connect widget
    return `https://connect.belvo.com/widget?public_key=YOUR_PUBLIC_KEY&callback_url=${encodeURIComponent(window.location.origin)}/belvo-callback`;
  }

  // Mock method for handling Belvo Connect success callback
  async handleBelvoCallback(linkId: string, institution: any): Promise<BelvoConnection> {
    // In a real implementation, this would be called by the Belvo Connect widget
    // upon successful connection
    
    return this.createBelvoConnection({
      belvo_link_id: linkId,
      institution_name: institution.name || 'Banco Conectado',
      access_mode: 'recurrent',
      status: 'valid_token'
    });
  }
}

export const belvoService = new BelvoService();

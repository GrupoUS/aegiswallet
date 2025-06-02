
import { supabase } from '@/integrations/supabase/client';

// Tipos para a integração Belvo
export interface BelvoAccount {
  id: string;
  institution: string;
  name: string;
  type: string;
  balance: {
    current: number;
    available: number;
  };
  currency: string;
  last_accessed_at: string;
}

export interface BelvoTransaction {
  id: string;
  account: string;
  amount: number;
  currency: string;
  description: string;
  merchant?: {
    name: string;
    category: string;
  };
  category: string;
  subcategory: string;
  value_date: string;
  accounting_date: string;
  status: string;
  type: string;
}

export interface BelvoLink {
  id: string;
  institution: string;
  access_mode: string;
  status: string;
  created_at: string;
  external_id: string;
}

// Configuração da API Belvo
const BELVO_API_URL = process.env.NEXT_PUBLIC_BELVO_API_URL || 'https://sandbox.belvo.com';
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID;
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD;

class BelvoService {
  private baseURL: string;
  private credentials: string;

  constructor() {
    this.baseURL = BELVO_API_URL;
    this.credentials = Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: Record<string, unknown>) {
    const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Belvo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Criar link com instituição bancária
  async createLink(institution: string, username: string, password: string, userId: string): Promise<BelvoLink> {
    try {
      const linkData = await this.makeRequest('links/', 'POST', {
        institution,
        username,
        password,
        access_mode: 'single'
      });

      // Salvar link no Supabase
      await supabase.from('belvo_bank_connections').insert({
        user_id: userId,
        belvo_link_id: linkData.id,
        institution_name: linkData.institution,
        status: linkData.status,
        created_at: new Date().toISOString()
      });

      return linkData;
    } catch (error) {
      console.error('Erro ao criar link Belvo:', error);
      throw error;
    }
  }

  // Buscar contas de um link
  async getAccounts(linkId: string, userId: string): Promise<BelvoAccount[]> {
    try {
      const accounts = await this.makeRequest('accounts/', 'POST', {
        link: linkId,
        save_data: true
      });

      // Salvar contas no Supabase - removendo user_id que não existe na tabela
      for (const account of accounts) {
        await supabase.from('belvo_accounts').upsert({
          belvo_account_id: account.id,
          belvo_link_id: linkId,
          name: account.name,
          type: account.type,
          balance_current: account.balance.current,
          balance_available: account.balance.available,
          currency: account.currency,
          institution_name: account.institution,
          collected_at: account.last_accessed_at
        });
      }

      return accounts;
    } catch (error) {
      console.error('Erro ao buscar contas Belvo:', error);
      throw error;
    }
  }

  // Buscar transações de uma conta
  async getTransactions(linkId: string, accountId: string, userId: string, dateFrom?: string, dateTo?: string): Promise<BelvoTransaction[]> {
    try {
      const requestBody: Record<string, unknown> = {
        link: linkId,
        account: accountId,
        save_data: true
      };

      if (dateFrom) requestBody.date_from = dateFrom;
      if (dateTo) requestBody.date_to = dateTo;

      const transactions = await this.makeRequest('transactions/', 'POST', requestBody);

      // Converter e salvar transações no formato do sistema
      for (const transaction of transactions) {
        const categoryId = await this.mapBelvoCategory(transaction.category, userId);
        
        const transactionData = {
          user_id: userId,
          amount: Math.abs(transaction.amount),
          description: transaction.description || transaction.merchant?.name || 'Transação bancária',
          date: transaction.value_date,
          type: transaction.amount >= 0 ? 'income' as const : 'expense' as const,
          category_id: categoryId,
          belvo_account_id: accountId,
          source_transaction_id: transaction.id
        };

        // Verificar se a transação já existe
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('source_transaction_id', transaction.id)
          .single();

        if (!existingTransaction) {
          await supabase.from('transactions').insert(transactionData);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Erro ao buscar transações Belvo:', error);
      throw error;
    }
  }

  // Mapear categoria Belvo para categoria do sistema
  private async mapBelvoCategory(belvoCategory: string, userId: string): Promise<string> {
    // Mapeamento de categorias Belvo para categorias do sistema
    const categoryMapping: Record<string, string> = {
      'Food & Groceries': 'Alimentação',
      'Transportation': 'Transporte',
      'Healthcare': 'Saúde',
      'Entertainment': 'Lazer',
      'Shopping': 'Compras',
      'Bills & Utilities': 'Contas',
      'Transfer': 'Transferência',
      'ATM': 'Saque',
      'Salary': 'Salário',
      'Investment': 'Investimento'
    };

    const mappedCategory = categoryMapping[belvoCategory] || 'Outros';

    // Buscar categoria existente ou criar nova
    let { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('name', mappedCategory)
      .or(`user_id.eq.${userId},is_predefined.eq.true`)
      .single();

    if (!category) {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          name: mappedCategory,
          user_id: userId,
          is_predefined: false
        })
        .select('id')
        .single();
      
      category = newCategory;
    }

    return category?.id || '';
  }

  // Sincronizar dados de todas as contas do usuário
  async syncUserData(userId: string): Promise<void> {
    try {
      // Buscar todas as conexões do usuário
      const { data: connections } = await supabase
        .from('belvo_bank_connections')
        .select('belvo_link_id, institution_name')
        .eq('user_id', userId)
        .eq('status', 'valid');

      if (!connections || connections.length === 0) {
        throw new Error('Nenhuma conexão bancária válida encontrada');
      }

      for (const connection of connections) {
        // Atualizar contas
        await this.getAccounts(connection.belvo_link_id, userId);

        // Buscar contas salvas
        const { data: accounts } = await supabase
          .from('belvo_accounts')
          .select('belvo_account_id')
          .eq('belvo_link_id', connection.belvo_link_id);

        // Sincronizar transações dos últimos 30 dias
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        
        for (const account of accounts || []) {
          await this.getTransactions(
            connection.belvo_link_id,
            account.belvo_account_id,
            userId,
            dateFrom.toISOString().split('T')[0]
          );
        }
      }
    } catch (error) {
      console.error('Erro na sincronização Belvo:', error);
      throw error;
    }
  }

  // Deletar link
  async deleteLink(linkId: string, userId: string): Promise<void> {
    try {
      await this.makeRequest(`links/${linkId}/`, 'DELETE');
      
      // Remover do Supabase
      await supabase
        .from('belvo_bank_connections')
        .delete()
        .eq('belvo_link_id', linkId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao deletar link Belvo:', error);
      throw error;
    }
  }

  // Listar instituições disponíveis
  async getInstitutions(country: string = 'BR'): Promise<any[]> {
    try {
      return await this.makeRequest(`institutions/?country_code=${country}`);
    } catch (error) {
      console.error('Erro ao buscar instituições Belvo:', error);
      throw error;
    }
  }
}

export const belvoService = new BelvoService();

// Hook para usar o serviço Belvo
export function useBelvo() {
  const connectBank = async (institution: string, username: string, password: string, userId: string) => {
    return await belvoService.createLink(institution, username, password, userId);
  };

  const syncData = async (userId: string) => {
    return await belvoService.syncUserData(userId);
  };

  const getInstitutions = async () => {
    return await belvoService.getInstitutions();
  };

  const disconnectBank = async (linkId: string, userId: string) => {
    return await belvoService.deleteLink(linkId, userId);
  };

  return {
    connectBank,
    syncData,
    getInstitutions,
    disconnectBank
  };
}

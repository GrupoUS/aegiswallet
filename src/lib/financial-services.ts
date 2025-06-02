
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Tipos para facilitar o uso
export type Transaction = Tables<'transactions'>;
export type Category = Tables<'categories'>;
export type BankConnection = Tables<'bank_connections'>;
export type BillReminder = Tables<'bill_reminders'>;
export type Profile = Tables<'profiles'>;

export type TransactionInsert = TablesInsert<'transactions'>;
export type CategoryInsert = TablesInsert<'categories'>;
export type BillReminderInsert = TablesInsert<'bill_reminders'>;

// Serviços para Transações
export const transactionService = {
  // Buscar todas as transações do usuário
  async getAll(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    type?: string;
  }) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          is_predefined
        ),
        bank_connections (
          id,
          institution_name
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    return query;
  },

  // Criar nova transação
  async create(transaction: TransactionInsert) {
    return supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
  },

  // Atualizar transação
  async update(id: string, updates: TablesUpdate<'transactions'>) {
    return supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Deletar transação
  async delete(id: string) {
    return supabase
      .from('transactions')
      .delete()
      .eq('id', id);
  },

  // Buscar transações por período para análise
  async getByPeriod(userId: string, startDate: string, endDate: string) {
    return supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          is_predefined
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
  },

  // Análise de gastos por categoria
  async getSpendingByCategory(userId: string, startDate: string, endDate: string) {
    return supabase
      .from('transactions')
      .select(`
        amount,
        type,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
  }
};

// Serviços para Categorias
export const categoryService = {
  // Buscar todas as categorias (predefinidas + do usuário)
  async getAll(userId: string) {
    return supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_predefined.eq.true`)
      .order('name');
  },

  // Criar nova categoria
  async create(category: CategoryInsert) {
    return supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
  },

  // Atualizar categoria
  async update(id: string, updates: TablesUpdate<'categories'>) {
    return supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Deletar categoria (apenas as do usuário)
  async delete(id: string, userId: string) {
    return supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_predefined', false);
  }
};

// Serviços para Conexões Bancárias
export const bankConnectionService = {
  // Buscar todas as conexões do usuário
  async getAll(userId: string) {
    return supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  // Buscar contas Belvo do usuário
  async getBelvoAccounts(userId: string) {
    return supabase
      .from('belvo_accounts')
      .select(`
        *,
        belvo_bank_connections!inner (
          user_id
        )
      `)
      .eq('belvo_bank_connections.user_id', userId);
  }
};

// Serviços para Lembretes de Contas
export const billReminderService = {
  // Buscar todos os lembretes do usuário
  async getAll(userId: string) {
    return supabase
      .from('bill_reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date');
  },

  // Buscar contas próximas ao vencimento
  async getUpcoming(userId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return supabase
      .from('bill_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date');
  },

  // Criar novo lembrete
  async create(reminder: BillReminderInsert) {
    return supabase
      .from('bill_reminders')
      .insert(reminder)
      .select()
      .single();
  },

  // Marcar conta como paga
  async markAsPaid(id: string) {
    return supabase
      .from('bill_reminders')
      .update({ is_paid: true })
      .eq('id', id)
      .select()
      .single();
  },

  // Deletar lembrete
  async delete(id: string) {
    return supabase
      .from('bill_reminders')
      .delete()
      .eq('id', id);
  }
};

// Serviços para Análises Financeiras
export const analyticsService = {
  // Resumo financeiro geral
  async getFinancialSummary(userId: string, startDate: string, endDate: string) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!transactions) return null;

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: transactions.length
    };
  },

  // Gastos por categoria (para gráficos)
  async getExpensesByCategory(userId: string, startDate: string, endDate: string) {
    const { data } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (!data) return [];

    const categoryTotals = data.reduce((acc, transaction) => {
      const categoryName = transaction.categories?.name || 'Sem Categoria';
      const amount = Math.abs(transaction.amount);
      
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += amount;
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, amount]) => ({
      category: name,
      amount
    }));
  },

  // Evolução de gastos ao longo do tempo
  async getSpendingTrend(userId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data } = await supabase
      .from('transactions')
      .select('amount, date, type')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date');

    if (!data) return [];

    // Agrupar por mês
    const monthlyData = data.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7); // YYYY-MM
      
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += Math.abs(transaction.amount);
      }
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses
    }));
  },

  // Buscar transações por período (novo método para PDF)
  async getTransactionsByPeriod(userId: string, startDate: string, endDate: string) {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (!data) return [];

    return data.map(transaction => ({
      ...transaction,
      category_name: transaction.categories?.name || 'Sem categoria'
    }));
  },

  // Buscar transações por categoria (novo método para PDF)
  async getTransactionsByCategory(userId: string, categoryId: string, startDate: string, endDate: string) {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (!data) return [];

    return data.map(transaction => ({
      ...transaction,
      category_name: transaction.categories?.name || 'Sem categoria'
    }));
  }
};

// Serviço para o Chat AI acessar dados
export const aiDataService = {
  // Obter contexto completo do usuário para o AI
  async getUserFinancialContext(userId: string) {
    const [
      profileResult,
      transactionsResult,
      categoriesResult,
      bankConnectionsResult,
      billRemindersResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      transactionService.getAll(userId),
      categoryService.getAll(userId),
      bankConnectionService.getAll(userId),
      billReminderService.getAll(userId)
    ]);

    // Calcular resumo dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const summary = await analyticsService.getFinancialSummary(
      userId,
      thirtyDaysAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    return {
      profile: profileResult.data,
      transactions: transactionsResult.data || [],
      categories: categoriesResult.data || [],
      bankConnections: bankConnectionsResult.data || [],
      billReminders: billRemindersResult.data || [],
      summary
    };
  }
};

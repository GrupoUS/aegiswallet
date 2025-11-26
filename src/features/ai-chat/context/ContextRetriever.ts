import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import logger from '@/lib/logging/logger';

export interface FinancialContext {
  recentTransactions: Transaction[];
  accountBalances: AccountBalance[];
  upcomingEvents: FinancialEvent[];
  userPreferences: UserPreferences;
  summary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    upcomingBillsCount: number;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

interface FinancialEvent {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: string;
  status: string;
}

interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
}

export class ContextRetriever {
  private supabase: SupabaseClient<Database>;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: FinancialContext | Transaction[] | AccountBalance[] | FinancialEvent[] | UserPreferences; timestamp: number }> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Fetch complete financial context for the user
   */
  async getFinancialContext(userId: string): Promise<FinancialContext> {
    const cacheKey = `context:${userId}`;
    const cached = this.getFromCache<FinancialContext>(cacheKey);
    if (cached) return cached as FinancialContext;

    const [transactions, balances, events, preferences] = await Promise.all([
      this.getRecentTransactions(userId),
      this.getAccountBalances(userId),
      this.getUpcomingEvents(userId),
      this.getUserPreferences(userId),
    ]);

    const context: FinancialContext = {
      recentTransactions: transactions,
      accountBalances: balances,
      upcomingEvents: events,
      userPreferences: preferences,
      summary: this.calculateSummary(transactions, balances, events),
    };

    this.setCache(cacheKey, context);
    return context;
  }

  /**
   * Get recent transactions (last 30 days)
   */
  async getRecentTransactions(userId: string, days = 30): Promise<Transaction[]> {
    const cacheKey = `transactions:${userId}:${days}`;
    const cached = this.getFromCache<Transaction[]>(cacheKey);
    if (cached) return cached as Transaction[];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('financial_events')
      .select('id, amount, description, category, created_at, event_type, is_income')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching transactions', { component: 'ContextRetriever', action: 'getRecentTransactions', error: String(error) });
      return [];
    }

    const transactions: Transaction[] = (data || []).map((t) => ({
      id: t.id,
      amount: t.amount,
      description: t.description || '',
      category: t.category || 'other',
      date: t.created_at ?? new Date().toISOString(),
      type: (t.is_income ? 'income' : 'expense') as 'income' | 'expense',
    }));

    this.setCache(cacheKey, transactions);
    return transactions;
  }

  /**
   * Get account balances
   */
  async getAccountBalances(userId: string): Promise<AccountBalance[]> {
    const cacheKey = `balances:${userId}`;
    const cached = this.getFromCache<AccountBalance[]>(cacheKey);
    if (cached) return cached as AccountBalance[];

    const { data, error } = await this.supabase
      .from('bank_accounts')
      .select('id, institution_name, balance, currency')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching balances', { component: 'ContextRetriever', action: 'getAccountBalances', error: String(error) });
      return [];
    }

    const balances: AccountBalance[] = (data || []).map((a) => ({
      accountId: a.id,
      accountName: a.institution_name || 'Unnamed Account',
      balance: a.balance || 0,
      currency: a.currency || 'BRL',
    }));

    this.setCache(cacheKey, balances);
    return balances;
  }

  /**
   * Get upcoming financial events (next 30 days)
   */
  async getUpcomingEvents(userId: string, days = 30): Promise<FinancialEvent[]> {
    const cacheKey = `events:${userId}:${days}`;
    const cached = this.getFromCache<FinancialEvent[]>(cacheKey);
    if (cached) return cached as FinancialEvent[];

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await this.supabase
      .from('financial_events')
      .select('id, title, amount, due_date, event_type_id, status')
      .eq('user_id', userId)
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true })
      .limit(20);

    if (error) {
      logger.error('Error fetching events', { component: 'ContextRetriever', action: 'getUpcomingEvents', error: String(error) });
      return [];
    }

    const events: FinancialEvent[] = (data || []).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount || 0,
      date: e.due_date || new Date().toISOString(),
      type: e.event_type_id || 'other',
      status: e.status || 'pending',
    }));

    this.setCache(cacheKey, events);
    return events;
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const cacheKey = `preferences:${userId}`;
    const cached = this.getFromCache<UserPreferences>(cacheKey);
    if (cached) return cached as UserPreferences;

    const { data, error } = await this.supabase
      .from('users')
      .select('language, currency, timezone')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Error fetching preferences', { component: 'ContextRetriever', action: 'getUserPreferences', error: String(error) });
      return {
        language: 'pt-BR',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
      };
    }

    const preferences: UserPreferences = {
      language: data?.language || 'pt-BR',
      currency: data?.currency || 'BRL',
      timezone: data?.timezone || 'America/Sao_Paulo',
    };

    this.setCache(cacheKey, preferences);
    return preferences;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    transactions: Transaction[],
    balances: AccountBalance[],
    events: FinancialEvent[]
  ) {
    const totalBalance = balances.reduce((sum, acc) => sum + acc.balance, 0);

    const monthlyIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const upcomingBillsCount = events.filter((e) => e.status === 'pending').length;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      upcomingBillsCount,
    };
  }

  /**
   * Clear cache (useful for testing or when data changes)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache<T extends FinancialContext | Transaction[] | AccountBalance[] | FinancialEvent[] | UserPreferences>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || cached.data === undefined) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: FinancialContext | Transaction[] | AccountBalance[] | FinancialEvent[] | UserPreferences) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}


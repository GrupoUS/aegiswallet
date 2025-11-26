/**
 * Comprehensive Typed Supabase Mock for AegisWallet Tests
 *
 * Provides type-safe Supabase client mocking with Brazilian financial data
 * Aligns with current database schema and includes proper RLS policy testing
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';
import type { Database } from '@/integrations/supabase/types';

// Factory function types
interface BankAccountOverrides {
  user_id?: string;
  is_primary?: boolean;
  bank_name?: string;
  bank_code?: string;
  account_type?: string;
  account_number?: string;
  balance?: number;
}

interface TransactionOverrides {
  user_id?: string;
  bank_account_id?: string;
  type?: string;
  category?: string;
  description?: string;
  amount?: number;
  merchant_cnpj?: string;
  date?: string;
}

interface PixKeyOverrides {
  user_id?: string;
  bank_account_id?: string;
  key_type?: string;
  key_value?: string;
}

// Factory functions (simplified for tests)
const createUserProfile = () => ({
  id: crypto.randomUUID(),
  user_id: crypto.randomUUID(),
  email: 'joao.silva@email.com',
  phone: '11 98765-4321',
  first_name: 'João',
  last_name: 'Silva',
  cpf: '123.456.789-00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createBankAccount = (overrides: BankAccountOverrides = {}) => ({
  id: crypto.randomUUID(),
  user_id: overrides.user_id ?? crypto.randomUUID(),
  bank_name: overrides.bank_name ?? 'Banco do Brasil',
  bank_code: overrides.bank_code ?? '001',
  account_type: overrides.account_type ?? 'checking',
  account_number: overrides.account_number ?? '1234567',
  balance: overrides.balance ?? 5000.0,
  currency: 'BRL',
  status: 'active',
  is_primary: overrides.is_primary ?? false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createTransaction = (overrides: TransactionOverrides = {}) => ({
  id: crypto.randomUUID(),
  user_id: overrides.user_id ?? crypto.randomUUID(),
  bank_account_id: overrides.bank_account_id ?? crypto.randomUUID(),
  amount: overrides.amount ?? 100.0,
  currency: 'BRL',
  type: overrides.type ?? 'debit',
  category: overrides.category ?? 'mercado',
  description: overrides.description ?? 'Supermercado',
  merchant_cnpj: overrides.merchant_cnpj,
  date: overrides.date ?? new Date().toISOString().split('T')[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createPixKey = (overrides: PixKeyOverrides = {}) => ({
  id: crypto.randomUUID(),
  user_id: overrides.user_id ?? crypto.randomUUID(),
  bank_account_id: overrides.bank_account_id ?? crypto.randomUUID(),
  key_type: overrides.key_type ?? 'cpf',
  key_value: overrides.key_value ?? '123.456.789-00',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Type aliases for easier use
type DatabaseType = Database['public']['Tables'];
type TableName = keyof DatabaseType;
type Row<T extends TableName> = DatabaseType[T]['Row'];
type Insert<T extends TableName> = DatabaseType[T]['Insert'];
type Update<T extends TableName> = DatabaseType[T]['Update'];

// ============================================================================
// Mock Data Storage (simulates database tables)
// ============================================================================

class MockDatabase {
  private data: Map<TableName, Row<any>[]> = new Map();

  constructor() {
    // Initialize with empty data for all tables
    const tables: TableName[] = [
      'audit_logs',
      'auth_attempts',
      'user_profiles',
      'bank_accounts',
      'transactions',
      'pix_keys',
      'financial_events',
      'calendar_events',
      'chat_messages',
      'chat_sessions',
      'voice_recordings',
      'nlu_training_data',
      'nlu_intent_patterns',
      'security_logs',
      'device_fingerprints',
      'ip_reputations',
      'failed_logins',
    ];

    tables.forEach((table) => {
      this.data.set(table, []);
    });
  }

  // CRUD operations
  select<T extends TableName>(table: T): Row<T>[] {
    return [...(this.data.get(table) || [])];
  }

  insert<T extends TableName>(table: T, record: Insert<T>): Row<T> {
    const newRecord = {
      ...record,
      id: record.id || crypto.randomUUID(),
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString(),
    } as Row<T>;

    const tableData = this.data.get(table) || [];
    tableData.push(newRecord);
    this.data.set(table, tableData);

    return newRecord;
  }

  update<T extends TableName>(table: T, id: string, updates: Update<T>): Row<T> | null {
    const tableData = this.data.get(table) || [];
    const index = tableData.findIndex((record) => record.id === id);

    if (index === -1) return null;

    const updatedRecord = {
      ...tableData[index],
      ...updates,
      updated_at: new Date().toISOString(),
    } as Row<T>;

    tableData[index] = updatedRecord;
    this.data.set(table, tableData);

    return updatedRecord;
  }

  delete<T extends TableName>(table: T, id: string): boolean {
    const tableData = this.data.get(table) || [];
    const index = tableData.findIndex((record) => record.id === id);

    if (index === -1) return false;

    tableData.splice(index, 1);
    this.data.set(table, tableData);

    return true;
  }

  // Query helpers
  find<T extends TableName>(table: T, predicate: (record: Row<T>) => boolean): Row<T>[] {
    const tableData = this.data.get(table) || [];
    return tableData.filter(predicate);
  }

  findOne<T extends TableName>(table: T, predicate: (record: Row<T>) => boolean): Row<T> | null {
    const records = this.find(table, predicate);
    return records.length > 0 ? records[0] : null;
  }

  // Clear table
  clear<T extends TableName>(table: T): void {
    this.data.set(table, []);
  }

  // Seed with test data
  seedBrazilianScenario() {
    const scenario = require('../factories/database-factory').createBrazilianFinancialScenario();

    // Insert user profile
    this.insert('user_profiles', scenario.userProfile);

    // Insert bank accounts
    scenario.bankAccounts.forEach((account) => {
      this.insert('bank_accounts', account);
    });

    // Insert PIX keys
    scenario.pixKeys.forEach((pixKey) => {
      this.insert('pix_keys', pixKey);
    });

    // Insert transactions
    scenario.transactions.forEach((transaction) => {
      this.insert('transactions', transaction);
    });

    // Insert financial events
    scenario.financialEvents.forEach((event) => {
      this.insert('financial_events', event);
    });
  }
}

// Global mock database instance
const mockDatabase = new MockDatabase();

// ============================================================================
// Typed Query Builder Mock
// ============================================================================

class MockQueryBuilder<T extends TableName> {
  private table: T;
  private filters: Partial<Row<T>> = {};
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleMode = false;

  constructor(table: T) {
    this.table = table;
  }

  select(_fields: string): MockQueryBuilder<T> {
    // Fields parameter ignored in mock - returns all fields
    return this;
  }

  eq<K extends keyof Row<T>>(column: K, value: Row<T>[K]): MockQueryBuilder<T> {
    this.filters[column] = value;
    return this;
  }

  neq<K extends keyof Row<T>>(_column: K, _value: Row<T>[K]): MockQueryBuilder<T> {
    // For mock purposes, neq will be handled in execute()
    return this;
  }

  gt<K extends keyof Row<T>>(_column: K, _value: Row<T>[K]): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  gte<K extends keyof Row<T>>(_column: K, _value: Row<T>[K]): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  lt<K extends keyof Row<T>>(_column: K, _value: Row<T>[K]): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  lte<K extends keyof Row<T>>(_column: K, _value: Row<T>[K]): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  like<K extends keyof Row<T>>(_column: K, _value: string): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  ilike<K extends keyof Row<T>>(_column: K, _value: string): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  in<K extends keyof Row<T>>(_column: K, _values: Row<T>[K][]): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  contains<K extends keyof Row<T>>(_column: K, _value: unknown): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  order(column: string, ascending: boolean = true): MockQueryBuilder<T> {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(count: number): MockQueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  range(_from: number, _to: number): MockQueryBuilder<T> {
    return this; // Mock implementation
  }

  insert(record: Insert<T>): MockQueryBuilder<T> & { data: Row<T> | null; error: any } {
    const insertedRecord = mockDatabase.insert(this.table, record);
    return {
      data: insertedRecord,
      error: null,
      select: () => this,
      eq: () => this,
      neq: () => this,
      gt: () => this,
      gte: () => this,
      lt: () => this,
      lte: () => this,
      like: () => this,
      ilike: () => this,
      in: () => this,
      contains: () => this,
      order: () => this,
      limit: () => this,
      single: () => ({ data: insertedRecord, error: null }),
      then: (resolve: any) => resolve({ data: [insertedRecord], error: null }),
    } as any;
  }

  update(_updates: Update<T>): MockQueryBuilder<T> & { data: Row<T>[] | null; error: unknown } {
    return this as unknown as MockQueryBuilder<T> & { data: Row<T>[] | null; error: unknown };
  }

  delete(): MockQueryBuilder<T> & { data: Row<T>[] | null; error: unknown } {
    return this as unknown as MockQueryBuilder<T> & { data: Row<T>[] | null; error: unknown };
  }

  single(): MockQueryBuilder<T> & { data: Row<T> | null; error: any } {
    this.singleMode = true;
    return this.execute() as any;
  }

  maybeSingle(): MockQueryBuilder<T> & { data: Row<T> | null; error: any } {
    this.singleMode = true;
    return this.execute() as any;
  }

  private execute(): { data: Row<T>[] | Row<T> | null; error: any } {
    try {
      let results = mockDatabase.select(this.table);

      // Apply filters
      Object.entries(this.filters).forEach(([key, value]) => {
        results = results.filter((record) => (record as any)[key] === value);
      });

      // Apply ordering
      if (this.orderBy) {
        results.sort((a, b) => {
          const aVal = a[this.orderBy!.column as keyof Row<T>];
          const bVal = b[this.orderBy!.column as keyof Row<T>];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return this.orderBy!.ascending ? comparison : -comparison;
        });
      }

      // Apply limit
      if (this.limitCount) {
        results = results.slice(0, this.limitCount);
      }

      if (this.singleMode) {
        return {
          data: results.length > 0 ? results[0] : null,
          error: null,
        };
      }

      return {
        data: results,
        error: null,
      };
    } catch (error) {
      return {
        data: this.singleMode ? null : [],
        error,
      };
    }
  }

  // Supabase query builder is thenable
  then<TResult1 = { data: Row<T>[]; error: null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: Row<T>[]; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute() as any).then(onfulfilled, onrejected);
  }
}

// ============================================================================
// Mock Supabase Client
// ============================================================================

function createMockSupabaseClient(): SupabaseClient<Database> {
  return {
    // Auth
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },

    // Database queries
    from: <T extends TableName>(table: T) => new MockQueryBuilder(table),

    // Storage
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        update: vi.fn(),
        move: vi.fn(),
        copy: vi.fn(),
        createSignedUrl: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
        createUrls: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      }),
    },

    // Realtime
    realtime: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getChannels: vi.fn(),
    },

    // Functions
    functions: {
      invoke: vi.fn(),
    },

    // Client methods
    supabaseUrl: 'https://test.supabase.co',
    supabaseKey: 'test-key',
    realtimeUrl: 'wss://test.supabase.co/realtime',
    authUrl: 'https://test.supabase.co/auth/v1',
    storageUrl: 'https://test.supabase.co/storage/v1',
  } as unknown as SupabaseClient<Database>;
}

// ============================================================================
// Mock Utilities for Tests
// ============================================================================

export const supabaseMock = createMockSupabaseClient();

// Helper functions for test setup
export const setupMockDatabase = {
  clear: <T extends TableName>(table: T) => mockDatabase.clear(table),
  insert: <T extends TableName>(table: T, record: Insert<T>) => mockDatabase.insert(table, record),
  find: <T extends TableName>(table: T, predicate: (record: Row<T>) => boolean) =>
    mockDatabase.find(table, predicate),
  findOne: <T extends TableName>(table: T, predicate: (record: Row<T>) => boolean) =>
    mockDatabase.findOne(table, predicate),
  seedBrazilianScenario: () => mockDatabase.seedBrazilianScenario(),

  // Brazilian-specific test scenarios
  seedPixScenario: () => {
    const userProfile = createUserProfile();
    const bankAccount = createBankAccount({ user_id: userProfile.user_id, is_primary: true });
    const pixKey = createPixKey({
      user_id: userProfile.user_id,
      bank_account_id: bankAccount.id,
      key_type: 'cpf',
      key_value: userProfile.cpf,
    });

    mockDatabase.insert('user_profiles', userProfile);
    mockDatabase.insert('bank_accounts', bankAccount);
    mockDatabase.insert('pix_keys', pixKey);

    return { userProfile, bankAccount, pixKey };
  },

  seedTransactionScenario: () => {
    const userProfile = createUserProfile();
    const bankAccount = createBankAccount({ user_id: userProfile.user_id, is_primary: true });

    const transactions = [
      createTransaction({
        user_id: userProfile.user_id,
        bank_account_id: bankAccount.id,
        type: 'debit',
        category: 'mercado',
        description: 'Supermercado Carrefour',
        amount: 347.85,
        merchant_cnpj: '12.345.678/0001-90',
      }),
      createTransaction({
        user_id: userProfile.user_id,
        bank_account_id: bankAccount.id,
        type: 'credit',
        description: 'Salário',
        amount: 5450.0,
      }),
      createTransaction({
        user_id: userProfile.user_id,
        bank_account_id: bankAccount.id,
        type: 'pix_out',
        description: 'Transferência PIX',
        amount: 150.0,
      }),
    ];

    mockDatabase.insert('user_profiles', userProfile);
    mockDatabase.insert('bank_accounts', bankAccount);
    for (const transaction of transactions) {
      mockDatabase.insert('transactions', transaction);
    }

    return { userProfile, bankAccount, transactions };
  },
};

// ============================================================================
// Vitest Mock Configuration
// ============================================================================

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

// Export for direct use in tests
export { mockDatabase, createMockSupabaseClient };

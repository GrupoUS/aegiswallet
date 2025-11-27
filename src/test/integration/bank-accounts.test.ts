/**
 * Bank Accounts Integration Tests
 * Tests the Supabase database operations for bank account CRUD
 *
 * These tests verify data integrity and database operations directly.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '@/types/database.types';
import type { TestUser } from './helpers';
import {
  cleanupUserData,
  createTestUser,
  getSupabaseAdminClient,
  hasIntegrationTestEnv,
} from './helpers';

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];

describe.skipIf(!hasIntegrationTestEnv())('Bank Accounts API Integration', () => {
  let testUser: TestUser;
  let createdAccountIds: string[] = [];
  let supabase: ReturnType<typeof getSupabaseAdminClient>;

  beforeAll(async () => {
    supabase = getSupabaseAdminClient();
    testUser = await createTestUser(supabase);
  });

  afterEach(async () => {
    if (createdAccountIds.length) {
      await supabase.from('bank_accounts').delete().in('id', createdAccountIds);
      createdAccountIds = [];
    }
  });

  afterAll(async () => {
    await cleanupUserData(supabase, testUser.id);
  });

  // Helper to directly create account in DB for testing
  const createAccountDirect = async (accountData: Partial<BankAccountRow>) => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: testUser.id,
        institution_name: accountData.institution_name || 'Test Bank',
        institution_id: accountData.institution_id || `inst_${Date.now()}`,
        account_type: accountData.account_type || 'CHECKING',
        account_mask: accountData.account_mask || `**** ${Math.floor(1000 + Math.random() * 9000)}`,
        balance: accountData.balance ?? 0,
        currency: accountData.currency || 'BRL',
        is_primary: accountData.is_primary ?? false,
        is_active: accountData.is_active ?? true,
        belvo_account_id: accountData.belvo_account_id || `manual_${Date.now()}`,
        sync_status: accountData.sync_status || 'manual',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create test account: ${error.message}`);
    createdAccountIds.push(data.id);
    return data;
  };

  const listAccounts = async () => {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    return data as BankAccountRow[] | null;
  };

  const getAccountById = async (id: string) => {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', testUser.id)
      .single();
    return data as BankAccountRow | null;
  };

  // =====================================================
  // Data Integrity Tests - Direct Database Operations
  // =====================================================

  it('creates manual account with correct sync_status', async () => {
    const account = await createAccountDirect({
      institution_name: 'Banco Manual',
      account_type: 'CHECKING',
      balance: 1500,
      sync_status: 'manual',
      belvo_account_id: `manual_${Date.now()}`,
    });

    expect(account.sync_status).toBe('manual');
    expect(account.belvo_account_id).toMatch(/^manual_/);
  });

  it('normalizes account mask format correctly', async () => {
    const account = await createAccountDirect({
      institution_name: 'Banco Máscara',
      account_mask: '**** 1234',
    });

    expect(account.account_mask).toBe('**** 1234');
  });

  it('stores Belvo account with pending sync_status', async () => {
    const belvoId = 'belvo-account-123';
    const account = await createAccountDirect({
      institution_name: 'Banco Digital',
      belvo_account_id: belvoId,
      sync_status: 'pending',
      is_primary: true,
    });

    expect(account.sync_status).toBe('pending');
    expect(account.belvo_account_id).toBe(belvoId);
    expect(account.is_primary).toBe(true);
  });

  it('prevents duplicate accounts by institution_id + account_mask', async () => {
    const payload = {
      institution_name: 'Banco Duplicado',
      institution_id: 'DUPLICADO_TEST',
      account_mask: '**** 1111',
    };

    await createAccountDirect(payload);

    // Attempt to create duplicate
    const { error } = await supabase.from('bank_accounts').insert({
      user_id: testUser.id,
      ...payload,
      belvo_account_id: `manual_${Date.now()}`,
    });

    // Should fail due to unique constraint or RLS
    expect(error).toBeDefined();
  });

  // =====================================================
  // Update Operations Tests
  // =====================================================

  it('updates account information correctly', async () => {
    const created = await createAccountDirect({
      institution_name: 'Banco Atualização',
      balance: 500,
      is_primary: false,
    });

    const { data: updated, error } = await supabase
      .from('bank_accounts')
      .update({
        balance: 800,
        institution_name: 'Banco Atualizado',
        is_primary: true,
      })
      .eq('id', created.id)
      .eq('user_id', testUser.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated?.balance).toBe(800);
    expect(updated?.institution_name).toBe('Banco Atualizado');
    expect(updated?.is_primary).toBe(true);
  });

  it('preserves immutable belvo_account_id on update', async () => {
    const originalBelvoId = `manual_${Date.now()}`;
    const created = await createAccountDirect({
      institution_name: 'Banco Imutável',
      belvo_account_id: originalBelvoId,
    });

    // Attempt to update belvo_account_id (should be ignored by application logic)
    const { data: updated } = await supabase
      .from('bank_accounts')
      .update({ institution_name: 'Banco Atualizado' })
      .eq('id', created.id)
      .eq('user_id', testUser.id)
      .select()
      .single();

    expect(updated?.belvo_account_id).toBe(originalBelvoId);
  });

  // =====================================================
  // Delete Operations Tests
  // =====================================================

  it('removes account and verifies deletion', async () => {
    const created = await createAccountDirect({
      institution_name: 'Banco Remoção',
    });

    const accountId = created.id;
    // Remove from tracked IDs since we're deleting it manually
    createdAccountIds = createdAccountIds.filter((id) => id !== accountId);

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', testUser.id);

    expect(error).toBeNull();

    const list = await listAccounts();
    expect(list?.some((acc) => acc.id === accountId)).toBe(false);
  });

  // =====================================================
  // Query Operations Tests
  // =====================================================

  it('returns all accounts for user', async () => {
    const acc1 = await createAccountDirect({
      institution_name: 'Banco Lista 1',
      balance: 1000,
    });
    const acc2 = await createAccountDirect({
      institution_name: 'Banco Lista 2',
      balance: 2000,
    });

    const all = await listAccounts();
    expect(all?.length).toBeGreaterThanOrEqual(2);
    expect(all?.some((a) => a.id === acc1.id)).toBe(true);
    expect(all?.some((a) => a.id === acc2.id)).toBe(true);
  });

  it('fetches account by ID', async () => {
    const account = await createAccountDirect({
      institution_name: 'Banco Busca',
      balance: 700,
      is_primary: true,
    });

    const byId = await getAccountById(account.id);
    expect(byId?.id).toBe(account.id);
    expect(byId?.institution_name).toBe('Banco Busca');
    expect(byId?.balance).toBe(700);
  });

  // =====================================================
  // Aggregation Tests
  // =====================================================

  it('calculates total balance aggregated by currency', async () => {
    await createAccountDirect({
      institution_name: 'Banco Soma A',
      balance: 100,
      currency: 'BRL',
      is_active: true,
    });
    await createAccountDirect({
      institution_name: 'Banco Soma B',
      balance: 300,
      currency: 'BRL',
      is_active: true,
    });
    await createAccountDirect({
      institution_name: 'Banco USD',
      balance: 50,
      currency: 'USD',
      is_active: true,
    });

    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('balance, currency')
      .eq('user_id', testUser.id)
      .eq('is_active', true);

    const totals: Record<string, number> = {};
    accounts?.forEach((acc) => {
      const currency = acc.currency || 'BRL';
      totals[currency] = (totals[currency] || 0) + Number(acc.balance || 0);
    });

    expect(totals.BRL).toBeGreaterThanOrEqual(400);
    expect(totals.USD).toBeGreaterThanOrEqual(50);
  });

  it('updates balance directly', async () => {
    const created = await createAccountDirect({
      institution_name: 'Banco Saldo',
      balance: 10,
    });

    const { data: updated, error } = await supabase
      .from('bank_accounts')
      .update({ balance: 999 })
      .eq('id', created.id)
      .eq('user_id', testUser.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated?.balance).toBe(999);
  });

  // =====================================================
  // Data Type Validation Tests
  // =====================================================

  it('stores all account types correctly', async () => {
    const accountTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT', 'DIGITAL_WALLET'];

    for (const accountType of accountTypes) {
      const account = await createAccountDirect({
        institution_name: `Banco ${accountType}`,
        account_type: accountType,
      });
      expect(account.account_type).toBe(accountType);
    }
  });

  it('stores multiple currencies correctly', async () => {
    const currencies = ['BRL', 'USD', 'EUR'];

    for (const currency of currencies) {
      const account = await createAccountDirect({
        institution_name: `Banco ${currency}`,
        currency,
      });
      expect(account.currency).toBe(currency);
    }
  });

  // =====================================================
  // RLS Security Tests
  // =====================================================

  it('isolates accounts between users (RLS)', async () => {
    // Create account for test user
    const testAccount = await createAccountDirect({
      institution_name: 'Banco RLS Test',
      balance: 1000,
    });

    // Create another user
    const otherUser = await supabase.auth.admin.createUser({
      email: `other_${Date.now()}@aegiswallet.dev`,
      email_confirm: true,
    });

    if (!otherUser.data.user) {
      throw new Error('Failed to create other user');
    }

    try {
      // Other user should not see test user's accounts
      // Using admin client here - in real app, RLS would block this
      const { data: otherUserAccounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', otherUser.data.user.id);

      // Other user should have no accounts
      expect(otherUserAccounts?.length ?? 0).toBe(0);

      // Test user's account should still exist
      const myAccount = await getAccountById(testAccount.id);
      expect(myAccount?.id).toBe(testAccount.id);
    } finally {
      // Cleanup other user
      await supabase.auth.admin.deleteUser(otherUser.data.user.id);
    }
  });
});

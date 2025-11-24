import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bankAccountsRouter } from '@/server/routers/bankAccounts';
import type { Database } from '@/types/database.types';
import { cleanupUserData, createTestUser, getSupabaseAdminClient, type TestUser } from './helpers';

const supabase = getSupabaseAdminClient();

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];

describe('Bank Accounts Router Integration', () => {
  let testUser: TestUser;
  let caller: ReturnType<typeof bankAccountsRouter.createCaller>;
  let createdAccountIds: string[] = [];

  const buildCaller = (client: SupabaseClient<Database>, user: TestUser) => {
    const fakeUser: User = {
      id: user.id,
      aud: 'authenticated',
      email: user.email,
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
      factors: [],
      identities: [],
      last_sign_in_at: new Date().toISOString(),
      phone: '',
      role: 'authenticated',
    };

    const session: Session = {
      access_token: 'test-token',
      token_type: 'bearer',
      user: fakeUser,
      expires_at: null,
      expires_in: 3600,
      refresh_token: null,
      provider_token: null,
      provider_refresh_token: null,
    };

    return bankAccountsRouter.createCaller({
      session,
      supabase: client,
      user: fakeUser,
    });
  };

  beforeAll(async () => {
    testUser = await createTestUser(supabase);
    caller = buildCaller(supabase, testUser);
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

  const listAccounts = async () => {
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    return data as BankAccountRow[] | null;
  };

  it('cria conta manual com sync_status manual', async () => {
    const account = await caller.create.mutate({
      institution_name: 'Banco Manual',
      institution_id: 'MANUAL_BANK',
      account_type: 'CHECKING',
      account_mask: '**** 4321',
      balance: 1500,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });

    createdAccountIds.push(account.id);
    expect(account.sync_status).toBe('manual');
    expect(account.belvo_account_id.startsWith('manual_')).toBe(true);
  });

  it('cria conta Belvo com sync_status pending', async () => {
    const belvoId = 'belvo-account-123';
    const account = await caller.create.mutate({
      institution_name: 'Banco Digital',
      institution_id: 'DIGITAL_BANK',
      account_type: 'SAVINGS',
      account_mask: '**** 9876',
      belvo_account_id: belvoId,
      balance: 3200,
      currency: 'BRL',
      is_active: true,
      is_primary: true,
    });

    createdAccountIds.push(account.id);
    expect(account.sync_status).toBe('pending');
    expect(account.belvo_account_id).toBe(belvoId);
  });

  it('rejeita criação com máscara inválida', async () => {
    await expect(
      caller.create.mutate({
        institution_name: 'Banco Teste',
        institution_id: 'TESTE',
        account_type: 'CHECKING',
        account_mask: '1234',
        balance: 0,
        currency: 'BRL',
        is_active: true,
        is_primary: false,
      })
    ).rejects.toThrow(/Dados inválidos/);
  });

  it('impede duplicidade por institution_id + account_mask', async () => {
    const payload = {
      institution_name: 'Banco Duplicado',
      institution_id: 'DUPLICADO',
      account_type: 'CHECKING',
      account_mask: '**** 1111',
      balance: 100,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    };

    const created = await caller.create.mutate(payload);
    createdAccountIds.push(created.id);

    await expect(caller.create.mutate(payload)).rejects.toThrow(/mesma instituição e final/);
  });

  it('atualiza informações principais da conta', async () => {
    const created = await caller.create.mutate({
      institution_name: 'Banco Atualização',
      institution_id: 'UPDATE_BANK',
      account_type: 'CHECKING',
      account_mask: '**** 2222',
      balance: 500,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.update.mutate({
      id: created.id,
      balance: 800,
      institution_name: 'Banco Atualizado',
      is_primary: true,
    });

    expect(updated.balance).toBe(800);
    expect(updated.institution_name).toBe('Banco Atualizado');
    expect(updated.is_primary).toBe(true);
  });

  it('ignora tentativa de atualizar belvo_account_id', async () => {
    const created = await caller.create.mutate({
      institution_name: 'Banco Imutável',
      institution_id: 'IMMUTABLE',
      account_type: 'SAVINGS',
      account_mask: '**** 3333',
      balance: 200,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.update.mutate({
      id: created.id,
      belvo_account_id: 'novo-id',
    });

    expect(updated.belvo_account_id).toBe(created.belvo_account_id);
  });

  it('remove conta e garante remoção', async () => {
    const created = await caller.create.mutate({
      institution_name: 'Banco Remoção',
      institution_id: 'REMOVE',
      account_type: 'SALARY',
      account_mask: '**** 4444',
      balance: 50,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });

    await caller.delete.mutate({ id: created.id });
    const list = await listAccounts();
    expect(list?.some((acc) => acc.id === created.id)).toBe(false);
  });

  it('retorna todas as contas do usuário', async () => {
    const acc1 = await caller.create.mutate({
      institution_name: 'Banco Lista 1',
      institution_id: 'LISTA1',
      account_type: 'CHECKING',
      account_mask: '**** 5555',
      balance: 1000,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    const acc2 = await caller.create.mutate({
      institution_name: 'Banco Lista 2',
      institution_id: 'LISTA2',
      account_type: 'CHECKING',
      account_mask: '**** 6666',
      balance: 2000,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(acc1.id, acc2.id);

    const all = await caller.getAll.query();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('busca conta por ID', async () => {
    const account = await caller.create.mutate({
      institution_name: 'Banco Busca',
      institution_id: 'SEARCH',
      account_type: 'CHECKING',
      account_mask: '**** 7777',
      balance: 700,
      currency: 'BRL',
      is_active: true,
      is_primary: true,
    });
    createdAccountIds.push(account.id);

    const byId = await caller.getById.query({ id: account.id });
    expect(byId?.id).toBe(account.id);
  });

  it('calcula saldo total agregado', async () => {
    const accountA = await caller.create.mutate({
      institution_name: 'Banco Soma A',
      institution_id: 'SUMA',
      account_type: 'CHECKING',
      account_mask: '**** 8888',
      balance: 100,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    const accountB = await caller.create.mutate({
      institution_name: 'Banco Soma B',
      institution_id: 'SUMB',
      account_type: 'CHECKING',
      account_mask: '**** 9999',
      balance: 300,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(accountA.id, accountB.id);

    const totals = await caller.getTotalBalance.query();
    expect(totals.BRL).toBeGreaterThanOrEqual(400);
  });

  it('atualiza saldo diretamente pela mutation updateBalance', async () => {
    const created = await caller.create.mutate({
      institution_name: 'Banco Saldo',
      institution_id: 'BALANCE_BANK',
      account_type: 'CHECKING',
      account_mask: '**** 1234',
      balance: 10,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.updateBalance.mutate({ id: created.id, balance: 999 });
    expect(updated.balance).toBe(999);
  });

  it('retorna histórico de saldo (mock) para conta específica', async () => {
    const created = await caller.create.mutate({
      institution_name: 'Banco Histórico',
      institution_id: 'HISTORY_BANK',
      account_type: 'CHECKING',
      account_mask: '**** 2468',
      balance: 500,
      currency: 'BRL',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const history = await caller.getBalanceHistory.query({ accountId: created.id, days: 5 });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(5);
  });
});

import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { bankAccountsRouter } from '@/server/routers/bankAccounts';
import type { Database } from '@/integrations/supabase/types';
import type { TestUser } from './helpers';
import { cleanupUserData, createTestUser, getSupabaseAdminClient } from './helpers';

const supabase = getSupabaseAdminClient();

type BankAccountRow = Database['public']['Tables']['bank_accounts']['Row'];

describe('Bank Accounts Router Integration', () => {
  let testUser: TestUser;
  let caller: ReturnType<typeof bankAccountsRouter.createCaller>;
  let createdAccountIds: string[] = [];

  const buildCaller = (client: SupabaseClient<Database>, user: TestUser) => {
    const fakeUser: User = {
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: user.email,
      factors: [],
      id: user.id,
      identities: [],
      last_sign_in_at: new Date().toISOString(),
      phone: '',
      role: 'authenticated',
      user_metadata: {},
    };

    const session: Session = {
      access_token: 'test-token',
      expires_at: undefined,
      expires_in: 3600,
      provider_refresh_token: null,
      provider_token: null,
      refresh_token: '',
      token_type: 'bearer',
      user: fakeUser,
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
      account_mask: '**** 4321',
      account_type: 'CHECKING',
      balance: 1500,
      currency: 'BRL',
      institution_id: 'MANUAL_BANK',
      institution_name: 'Banco Manual',
      is_active: true,
      is_primary: false,
    });

    createdAccountIds.push(account.id);
    expect(account.sync_status).toBe('manual');
    expect(account.belvo_account_id.startsWith('manual_')).toBe(true);
  });

  it('normaliza máscara sem espaço em contas válidas', async () => {
    const account = await caller.create.mutate({
      account_mask: '****1234',
      account_type: 'SAVINGS',
      balance: 250,
      currency: 'BRL',
      institution_id: 'MASK_BANK',
      institution_name: 'Banco Máscara',
      is_active: true,
      is_primary: false,
    });

    createdAccountIds.push(account.id);
    expect(account.account_mask).toBe('**** 1234');
  });

  it('cria conta Belvo com sync_status pending', async () => {
    const belvoId = 'belvo-account-123';
    const account = await caller.create.mutate({
      account_mask: '**** 9876',
      account_type: 'SAVINGS',
      balance: 3200,
      belvo_account_id: belvoId,
      currency: 'BRL',
      institution_id: 'DIGITAL_BANK',
      institution_name: 'Banco Digital',
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
        account_mask: '1234',
        account_type: 'CHECKING',
        balance: 0,
        currency: 'BRL',
        institution_id: 'TESTE',
        institution_name: 'Banco Teste',
        is_active: true,
        is_primary: false,
      })
    ).rejects.toThrow(/Dados inválidos/);
  });

  it('impede duplicidade por institution_id + account_mask', async () => {
    const payload = {
      account_mask: '**** 1111',
      account_type: 'CHECKING',
      balance: 100,
      currency: 'BRL',
      institution_id: 'DUPLICADO',
      institution_name: 'Banco Duplicado',
      is_active: true,
      is_primary: false,
    };

    const created = await caller.create.mutate(payload);
    createdAccountIds.push(created.id);

    await expect(caller.create.mutate(payload)).rejects.toThrow(/mesma instituição e final/);
  });

  it('atualiza informações principais da conta', async () => {
    const created = await caller.create.mutate({
      account_mask: '**** 2222',
      account_type: 'CHECKING',
      balance: 500,
      currency: 'BRL',
      institution_id: 'UPDATE_BANK',
      institution_name: 'Banco Atualização',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.update.mutate({
      balance: 800,
      id: created.id,
      institution_name: 'Banco Atualizado',
      is_primary: true,
    });

    expect(updated.balance).toBe(800);
    expect(updated.institution_name).toBe('Banco Atualizado');
    expect(updated.is_primary).toBe(true);
  });

  it('ignora tentativa de atualizar belvo_account_id', async () => {
    const created = await caller.create.mutate({
      account_mask: '**** 3333',
      account_type: 'SAVINGS',
      balance: 200,
      currency: 'BRL',
      institution_id: 'IMMUTABLE',
      institution_name: 'Banco Imutável',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.update.mutate({
      belvo_account_id: 'novo-id',
      id: created.id,
    });

    expect(updated.belvo_account_id).toBe(created.belvo_account_id);
  });

  it('remove conta e garante remoção', async () => {
    const created = await caller.create.mutate({
      account_mask: '**** 4444',
      account_type: 'SALARY',
      balance: 50,
      currency: 'BRL',
      institution_id: 'REMOVE',
      institution_name: 'Banco Remoção',
      is_active: true,
      is_primary: false,
    });

    await caller.delete.mutate({ id: created.id });
    const list = await listAccounts();
    expect(list?.some((acc) => acc.id === created.id)).toBe(false);
  });

  it('retorna todas as contas do usuário', async () => {
    const acc1 = await caller.create.mutate({
      account_mask: '**** 5555',
      account_type: 'CHECKING',
      balance: 1000,
      currency: 'BRL',
      institution_id: 'LISTA1',
      institution_name: 'Banco Lista 1',
      is_active: true,
      is_primary: false,
    });
    const acc2 = await caller.create.mutate({
      account_mask: '**** 6666',
      account_type: 'CHECKING',
      balance: 2000,
      currency: 'BRL',
      institution_id: 'LISTA2',
      institution_name: 'Banco Lista 2',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(acc1.id, acc2.id);

    const all = await caller.getAll.query();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('busca conta por ID', async () => {
    const account = await caller.create.mutate({
      account_mask: '**** 7777',
      account_type: 'CHECKING',
      balance: 700,
      currency: 'BRL',
      institution_id: 'SEARCH',
      institution_name: 'Banco Busca',
      is_active: true,
      is_primary: true,
    });
    createdAccountIds.push(account.id);

    const byId = await caller.getById.query({ id: account.id });
    expect(byId?.id).toBe(account.id);
  });

  it('calcula saldo total agregado', async () => {
    const accountA = await caller.create.mutate({
      account_mask: '**** 8888',
      account_type: 'CHECKING',
      balance: 100,
      currency: 'BRL',
      institution_id: 'SUMA',
      institution_name: 'Banco Soma A',
      is_active: true,
      is_primary: false,
    });
    const accountB = await caller.create.mutate({
      account_mask: '**** 9999',
      account_type: 'CHECKING',
      balance: 300,
      currency: 'BRL',
      institution_id: 'SUMB',
      institution_name: 'Banco Soma B',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(accountA.id, accountB.id);

    const totals = await caller.getTotalBalance.query();
    expect(totals.BRL).toBeGreaterThanOrEqual(400);
  });

  it('atualiza saldo diretamente pela mutation updateBalance', async () => {
    const created = await caller.create.mutate({
      account_mask: '**** 1234',
      account_type: 'CHECKING',
      balance: 10,
      currency: 'BRL',
      institution_id: 'BALANCE_BANK',
      institution_name: 'Banco Saldo',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const updated = await caller.updateBalance.mutate({ balance: 999, id: created.id });
    expect(updated.balance).toBe(999);
  });

  it('retorna histórico de saldo (mock) para conta específica', async () => {
    const created = await caller.create.mutate({
      account_mask: '**** 2468',
      account_type: 'CHECKING',
      balance: 500,
      currency: 'BRL',
      institution_id: 'HISTORY_BANK',
      institution_name: 'Banco Histórico',
      is_active: true,
      is_primary: false,
    });
    createdAccountIds.push(created.id);

    const history = await caller.getBalanceHistory.query({ accountId: created.id, days: 5 });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(5);
  });
});

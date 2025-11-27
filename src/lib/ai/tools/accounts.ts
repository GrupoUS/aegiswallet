import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { filterSensitiveData } from '../security/filter';

export function createAccountTools(userId: string, supabase: SupabaseClient) {
  const listAccountsSchema = z.object({
    includeInactive: z.boolean().default(false).describe('Incluir contas inativas'),
  });

  const getAccountBalanceSchema = z.object({
    accountId: z.string().uuid().optional().describe('ID da conta (omitir para total)'),
  });

  return {
    listAccounts: {
      description: 'Lista todas as contas bancárias do usuário.',
      parameters: listAccountsSchema,
      execute: async (args: z.infer<typeof listAccountsSchema>) => {
        const { includeInactive } = args;
        let query = supabase
          .from('bank_accounts')
          .select(
            'id, institution_name, account_type, balance, available_balance, currency, is_active, is_primary, last_sync'
          )
          .eq('user_id', userId)
          .order('is_primary', { ascending: false });

        if (!includeInactive) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro: ${error.message}`);

        const totalBalance = data?.reduce((sum, acc) => sum + (acc.balance ?? 0), 0) ?? 0;

        return {
          accounts: data?.map(filterSensitiveData) ?? [],
          totalBalance,
          count: data?.length ?? 0,
        };
      },
    },

    getAccountBalance: {
      description: 'Obtém saldo atual de uma conta específica ou total de todas as contas.',
      parameters: getAccountBalanceSchema,
      execute: async (args: z.infer<typeof getAccountBalanceSchema>) => {
        const { accountId } = args;
        if (accountId) {
          const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, institution_name, balance, available_balance, currency, last_sync')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

          if (error) throw new Error(`Conta não encontrada: ${error.message}`);

          return filterSensitiveData(data);
        }

        // Total de todas as contas
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('balance, available_balance, currency')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) throw new Error(`Erro: ${error.message}`);

        const totalBalance = data?.reduce((sum, acc) => sum + (acc.balance ?? 0), 0) ?? 0;
        const totalAvailable =
          data?.reduce((sum, acc) => sum + (acc.available_balance ?? 0), 0) ?? 0;

        return {
          totalBalance,
          totalAvailable,
          currency: 'BRL',
          accountCount: data?.length ?? 0,
        };
      },
    },
  };
}

import { tool } from 'ai';
import { z } from 'zod';
import { filterSensitiveData } from '../security/filter';

export function createAccountTools(userId: string) {
  return {
    listAccounts: tool({
      description: 'Lista todas as contas bancárias do usuário.',
      inputSchema: z.object({
        includeInactive: z.boolean().default(false).describe('Incluir contas inativas'),
      }),
      execute: async ({ includeInactive }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

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
    }),

    getAccountBalance: tool({
      description: 'Obtém saldo atual de uma conta específica ou total de todas as contas.',
      inputSchema: z.object({
        accountId: z.string().uuid().optional().describe('ID da conta (omitir para total)'),
      }),
      execute: async ({ accountId }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

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
    }),
  };
}

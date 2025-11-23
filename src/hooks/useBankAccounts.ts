import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trpc } from '@/lib/trpc';

/**
 * Hook para gerenciar contas bancárias
 */
export function useBankAccounts() {
  const utils = trpc.useUtils();

  const { data: accounts, isLoading, error, refetch } = trpc.bankAccounts.getAll.useQuery();

  const { mutate: createAccount, isPending: isCreating } = trpc.bankAccounts.create.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar conta bancária');
    },
    onSuccess: (data) => {
      utils.bankAccounts.getAll.setData(undefined, (old) => {
        if (!old) {
          return [data];
        }
        return [data, ...old];
      });
      toast.success('Conta bancária criada com sucesso!');
    },
  });

  const { mutate: updateAccount, isPending: isUpdating } = trpc.bankAccounts.update.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar conta bancária');
    },
    onSuccess: (data) => {
      utils.bankAccounts.getAll.setData(undefined, (old) => {
        if (!old) {
          return old;
        }
        return old.map((account) => (account.id === data.id ? data : account));
      });
      toast.success('Conta bancária atualizada com sucesso!');
    },
  });

  const { mutate: deleteAccount, isPending: isDeleting } = trpc.bankAccounts.delete.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover conta bancária');
    },
    onSuccess: () => {
      utils.bankAccounts.getAll.invalidate();
      toast.success('Conta bancária removida com sucesso!');
    },
  });

  const { mutate: updateBalance, isPending: isUpdatingBalance } =
    trpc.bankAccounts.updateBalance.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar saldo');
      },
      onSuccess: (data) => {
        utils.bankAccounts.getAll.setData(undefined, (old) => {
          if (!old) {
            return old;
          }
          return old.map((account) => (account.id === data.id ? data : account));
        });
        utils.bankAccounts.getTotalBalance.invalidate();
        toast.success('Saldo atualizado com sucesso!');
      },
    });

  // Real-time subscription para contas bancárias
  useEffect(() => {
    if (!accounts) {
      return;
    }

    const channel = supabase
      .channel('bank_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
        },
        (_payload) => {
          utils.bankAccounts.getAll.invalidate();
          utils.bankAccounts.getTotalBalance.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accounts, utils]);

  return {
    accounts: accounts || [],
    createAccount,
    deleteAccount,
    error,
    isCreating,
    isDeleting,
    isLoading,
    isUpdating,
    isUpdatingBalance,
    refetch,
    updateAccount,
    updateBalance,
  };
}

/**
 * Hook para obter saldo total
 */
export function useTotalBalance() {
  const { data: balances, isLoading, error } = trpc.bankAccounts.getTotalBalance.useQuery();

  return {
    balances: balances || {},
    error,
    isLoading,
    totalBRL: balances?.BRL || 0,
  };
}

/**
 * Hook para obter conta específica
 */
export function useBankAccount(accountId: string) {
  const {
    data: account,
    isLoading,
    error,
  } = trpc.bankAccounts.getById.useQuery({ id: accountId }, { enabled: !!accountId });

  return {
    account,
    error,
    isLoading,
  };
}

/**
 * Hook para obter histórico de saldos
 */
export function useBalanceHistory(accountId: string, days: number = 30) {
  const {
    data: history,
    isLoading,
    error,
  } = trpc.bankAccounts.getBalanceHistory.useQuery({ accountId, days }, { enabled: !!accountId });

  return {
    error,
    history: history || [],
    isLoading,
  };
}

/**
 * Hook para estatísticas das contas
 */
export function useBankAccountsStats() {
  const { accounts } = useBankAccounts();

  const stats = {
    accountsByCurrency: accounts.reduce(
      (acc, account) => {
        const currency = account.currency || 'BRL';
        acc[currency] = (acc[currency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    activeAccounts: accounts.filter((account) => account.is_active).length,
    primaryAccounts: accounts.filter((account) => account.is_primary).length,
    totalAccounts: accounts.length,
    totalBalance: accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0),
  };

  return stats;
}

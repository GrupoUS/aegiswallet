import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trpc } from '@/lib/trpc';

/**
 * Hook para gerenciar transações financeiras
 */
export function useFinancialTransactions(filters?: {
  categoryId?: string;
  accountId?: string;
  type?: 'debit' | 'credit' | 'transfer' | 'pix' | 'boleto';
  status?: 'pending' | 'posted' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.financialTransactions.getAll.useQuery(
    filters || {}
  );

  const transactions = useMemo(() => {
    return data?.transactions || [];
  }, [data]);

  const total = useMemo(() => {
    return data?.totalCount || 0;
  }, [data]);

  const { mutate: createTransaction, isPending: isCreating } =
    trpc.financialTransactions.create.useMutation({
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação criada com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar transação');
      },
    });

  const { mutate: updateTransaction, isPending: isUpdating } =
    trpc.financialTransactions.update.useMutation({
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação atualizada com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar transação');
      },
    });

  const { mutate: deleteTransaction, isPending: isDeleting } =
    trpc.financialTransactions.delete.useMutation({
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação removida com sucesso!');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover transação');
      },
    });

  // Real-time subscription para transações
  useEffect(() => {
    if (!transactions.length) return;

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (_payload) => {
          utils.financialTransactions.getAll.invalidate();
          utils.financialTransactions.getStatistics.invalidate();
          // getByCategory procedure doesn't exist - removed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactions.length, utils]);

  return {
    transactions,
    total,
    isLoading,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

/**
 * Hook para obter transação específica
 */
export function useFinancialTransaction(transactionId: string) {
  const {
    data: transaction,
    isLoading,
    error,
  } = trpc.financialTransactions.getById.useQuery(
    { id: transactionId },
    { enabled: !!transactionId }
  );

  return {
    transaction,
    isLoading,
    error,
  };
}

/**
 * Hook para estatísticas de transações
 */
export function useTransactionStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const {
    data: stats,
    isLoading,
    error,
  } = trpc.financialTransactions.getStatistics.useQuery({ period }, { enabled: !!period });

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Hook para transações por categoria
 */
export function useTransactionsByCategory(
  _period: 'week' | 'month' | 'quarter' | 'year',
  categoryId?: string
) {
  const {
    data: categoryStats,
    isLoading,
    error,
  } = trpc.financialTransactions.getAll.useQuery(
    {
      limit: 100,
      categoryId,
    },
    { enabled: !!categoryId }
  );

  return {
    categoryStats: categoryStats?.transactions || [],
    isLoading,
    error,
  };
}

/**
 * Hook para resumo financeiro
 */
export function useFinancialSummary(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const { transactions } = useFinancialTransactions();
  const { stats } = useTransactionStats(period);
  const { categoryStats } = useTransactionsByCategory(period);

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const topCategories = (categoryStats || [])
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalTransactions: transactions.length,
      topCategories,
      stats,
    };
  }, [transactions, stats, categoryStats]);

  return summary;
}

/**
 * Hook para busca otimizada de transações
 */
export function useTransactionSearch(query: string, limit: number = 10) {
  const {
    data: results,
    isLoading,
    error,
  } = trpc.financialTransactions.getAll.useQuery(
    {
      search: query,
      limit,
    },
    {
      enabled: !!query && query.length >= 2,
    }
  );

  return {
    results: results?.transactions || [],
    isLoading,
    error,
  };
}

/**
 * Hook para transações recentes
 */
export function useRecentTransactions(limit: number = 5) {
  const { data, isLoading, error } = trpc.financialTransactions.getAll.useQuery(
    {
      limit,
      offset: 0,
    },
    {
      staleTime: 1000 * 60, // 1 minuto
    }
  );

  return {
    transactions: data?.transactions || [],
    isLoading,
    error,
  };
}

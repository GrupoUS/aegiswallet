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
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar transação');
      },
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação criada com sucesso!');
      },
    });

  const { mutate: updateTransaction, isPending: isUpdating } =
    trpc.financialTransactions.update.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar transação');
      },
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação atualizada com sucesso!');
      },
    });

  const { mutate: deleteTransaction, isPending: isDeleting } =
    trpc.financialTransactions.delete.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover transação');
      },
      onSuccess: () => {
        utils.financialTransactions.getAll.invalidate();
        utils.financialTransactions.getStatistics.invalidate();
        toast.success('Transação removida com sucesso!');
      },
    });

  // Real-time subscription para transações
  useEffect(() => {
    if (!transactions.length) {
      return;
    }

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
    createTransaction,
    deleteTransaction,
    error,
    isCreating,
    isDeleting,
    isLoading,
    isUpdating,
    refetch,
    total,
    transactions,
    updateTransaction,
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
    error,
    isLoading,
    transaction,
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
    error,
    isLoading,
    stats,
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
      categoryId,
      limit: 100,
    },
    { enabled: !!categoryId }
  );

  return {
    categoryStats: categoryStats?.transactions || [],
    error,
    isLoading,
  };
}

/**
 * Hook para resumo financeiro
 */
export function useFinancialSummary(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const { transactions } = useFinancialTransactions();
  const { stats } = useTransactionStats(period);

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const categoryTotals = transactions.reduce<Record<string, number>>((acc, transaction) => {
      const typedTransaction = transaction as {
        category_id?: string | null;
        categoryId?: string | null;
        amount?: number | string;
      };
      const categoryKey =
        typedTransaction.category_id ?? typedTransaction.categoryId ?? 'uncategorized';
      const amountValue = Number(typedTransaction.amount ?? transaction.amount ?? 0);
      acc[categoryKey] = (acc[categoryKey] ?? 0) + Math.abs(amountValue);
      return acc;
    }, {});

    const topCategories = Object.entries(categoryTotals)
      .map(([categoryId, totalAmount]) => ({ categoryId, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      netBalance: totalIncome - totalExpenses,
      stats,
      topCategories,
      totalExpenses,
      totalIncome,
      totalTransactions: transactions.length,
    };
  }, [transactions, stats]);

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
      limit,
      search: query,
    },
    {
      enabled: !!query && query.length >= 2,
    }
  );

  return {
    error,
    isLoading,
    results: results?.transactions || [],
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
    error,
    isLoading,
    transactions: data?.transactions || [],
  };
}

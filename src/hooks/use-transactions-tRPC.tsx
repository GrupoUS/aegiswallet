/**
 * Transaction management using tRPC (replaces use-transactions-api.tsx)
 */

import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
  status: 'cancelled' | 'failed' | 'pending' | 'posted';
  description?: string;
  category_id?: string;
  account_id?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionStats {
  balance: number;
  expenses: number;
  income: number;
  period: string;
  transactionsCount: number;
}

export function useTransactions(filters?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  accountId?: string;
  type?: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
  status?: 'cancelled' | 'failed' | 'pending' | 'posted';
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { data, isLoading, error, refetch } = trpc.transactions.list.useQuery(filters || {});

  const transactions = data || [];
  const total = transactions.length;

  return {
    transactions,
    total,
    error,
    isLoading,
    refetch,
  };
}

export function useCreateTransaction() {
  const { mutate, isPending } = trpc.transactions.create.useMutation({
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar transação');
    },
    onSuccess: () => {
      toast.success('Transação criada com sucesso!');
    },
  });

  return {
    createTransaction: mutate,
    isCreating: isPending,
  };
}

export function useUpdateTransaction() {
  const { mutate, isPending } = trpc.transactions.update.useMutation({
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar transação');
    },
    onSuccess: () => {
      toast.success('Transação atualizada com sucesso!');
    },
  });

  return {
    updateTransaction: mutate,
    isUpdating: isPending,
  };
}

export function useDeleteTransaction() {
  const { mutate, isPending } = trpc.transactions.delete.useMutation({
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover transação');
    },
    onSuccess: () => {
      toast.success('Transação removida com sucesso!');
    },
  });

  return {
    deleteTransaction: mutate,
    isDeleting: isPending,
  };
}

export function useTransactionsStats(
  period?: 'week' | 'month' | 'quarter' | 'year',
  accountId?: string
) {
  const { data, isLoading, error } = trpc.transactions.getStatistics.useQuery({
    period: period || 'month',
    accountId,
  });

  return {
    stats: data,
    error,
    isLoading,
  };
}

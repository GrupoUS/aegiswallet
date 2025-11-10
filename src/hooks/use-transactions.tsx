import { trpc } from '@/lib/trpc';

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
  return trpc.financialTransactions.getAll.useQuery(filters || {});
}

export function useCreateTransaction() {
  return trpc.financialTransactions.create.useMutation();
}

export function useDeleteTransaction() {
  return trpc.financialTransactions.delete.useMutation();
}

export function useTransactionsStats(
  period?: 'week' | 'month' | 'quarter' | 'year',
  accountId?: string
) {
  return trpc.financialTransactions.getStatistics.useQuery({
    period: period || 'month',
    accountId,
  });
}

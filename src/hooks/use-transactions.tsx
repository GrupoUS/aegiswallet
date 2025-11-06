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
  period?: '7d' | '30d' | '1y' | '90d',
  categoryId?: string,
  accountId?: string
) {
  return trpc.financialTransactions.getStats.useQuery({
    period: period || '30d',
    categoryId,
    accountId,
  });
}

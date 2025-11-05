import { trpc } from '@/lib/trpc'

export function useTransactions(filters?: {
  limit?: number
  offset?: number
  categoryId?: string
  accountId?: string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}) {
  return trpc.transactions.getAll.useQuery(filters || {})
}

export function useCreateTransaction() {
  return trpc.transactions.create.useMutation()
}

export function useDeleteTransaction() {
  return trpc.transactions.delete.useMutation()
}

export function useTransactionsStats(period?: string, categoryId?: string, accountId?: string) {
  return trpc.transactions.getStats.useQuery({
    period: (period as any) || '30d',
    categoryId,
    accountId,
  })
}

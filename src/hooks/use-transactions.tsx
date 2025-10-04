import { trpc } from '@/lib/trpc'

export function useTransactions() {
  return trpc.transactions.getAll.useQuery()
}

export function useCreateTransaction() {
  return trpc.transactions.create.useMutation()
}

export function useDeleteTransaction() {
  return trpc.transactions.delete.useMutation()
}

export function useTransactionsSummary() {
  return trpc.transactions.getSummary.useQuery()
}
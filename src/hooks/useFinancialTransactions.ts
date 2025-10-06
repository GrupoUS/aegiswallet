import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'

/**
 * Hook para gerenciar transações financeiras
 */
export function useFinancialTransactions(filters?: {
  categoryId?: string
  accountId?: string
  type?: string
  status?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const utils = trpc.useUtils()
  
  const { data, isLoading, error, fetchNextPage, hasNextPage, refetch } = trpc.financialTransactions.getAll.useInfiniteQuery(
    filters || {},
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.hasMore) {
          return {
            ...filters,
            offset: (filters?.offset || 0) + (filters?.limit || 20),
          }
        }
        return undefined
      },
    }
  )

  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.transactions) || []
  }, [data])

  const total = useMemo(() => {
    return data?.pages[0]?.total || 0
  }, [data])

  const { mutate: createTransaction, isPending: isCreating } = trpc.financialTransactions.create.useMutation({
    onSuccess: (data) => {
      utils.financialTransactions.getAll.setData(undefined, (old) => {
        if (!old) return { pages: [{ transactions: [data], total: 1, hasMore: false }] }
        return {
          ...old,
          pages: [{
            ...old.pages[0],
            transactions: [data, ...old.pages[0].transactions],
            total: old.pages[0].total + 1,
          }, ...old.pages.slice(1)]
        }
      })
      utils.financialTransactions.getStats.invalidate()
      toast.success('Transação criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar transação')
    },
  })

  const { mutate: updateTransaction, isPending: isUpdating } = trpc.financialTransactions.update.useMutation({
    onSuccess: (data) => {
      utils.financialTransactions.getAll.setData(undefined, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            transactions: page.transactions.map(t => t.id === data.id ? data : t)
          }))
        }
      })
      utils.financialTransactions.getStats.invalidate()
      toast.success('Transação atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar transação')
    },
  })

  const { mutate: deleteTransaction, isPending: isDeleting } = trpc.financialTransactions.delete.useMutation({
    onSuccess: () => {
      utils.financialTransactions.getAll.invalidate()
      utils.financialTransactions.getStats.invalidate()
      toast.success('Transação removida com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover transação')
    },
  })

  // Real-time subscription para transações
  useEffect(() => {
    if (!transactions.length) return

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('Transaction change detected:', payload)
          utils.financialTransactions.getAll.invalidate()
          utils.financialTransactions.getStats.invalidate()
          utils.financialTransactions.getByCategory.invalidate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactions.length, utils])

  return {
    transactions,
    total,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
  }
}

/**
 * Hook para obter transação específica
 */
export function useFinancialTransaction(transactionId: string) {
  const { data: transaction, isLoading, error } = trpc.financialTransactions.getById.useQuery(
    { id: transactionId },
    { enabled: !!transactionId }
  )

  return {
    transaction,
    isLoading,
    error,
  }
}

/**
 * Hook para estatísticas de transações
 */
export function useTransactionStats(period: string = '30d') {
  const { data: stats, isLoading, error } = trpc.financialTransactions.getStats.useQuery(
    { period },
    { enabled: !!period }
  )

  return {
    stats,
    isLoading,
    error,
  }
}

/**
 * Hook para transações por categoria
 */
export function useTransactionsByCategory(period: string = '30d') {
  const { data: categoryStats, isLoading, error } = trpc.financialTransactions.getByCategory.useQuery(
    { period },
    { enabled: !!period }
  )

  return {
    categoryStats: categoryStats || [],
    isLoading,
    error,
  }
}

/**
 * Hook para resumo financeiro
 */
export function useFinancialSummary() {
  const { transactions } = useFinancialTransactions()
  const { stats } = useTransactionStats('30d')
  const { categoryStats } = useTransactionsByCategory('30d')

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const topCategories = categoryStats
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalTransactions: transactions.length,
      topCategories,
      stats,
    }
  }, [transactions, stats, categoryStats])

  return summary
}

/**
 * Hook para busca otimizada de transações
 */
export function useTransactionSearch(query: string, limit: number = 10) {
  const { data: results, isLoading, error } = trpc.financialTransactions.getAll.useQuery(
    {
      search: query,
      limit,
    },
    {
      enabled: !!query && query.length >= 2,
    }
  )

  return {
    results: results?.transactions || [],
    isLoading,
    error,
  }
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
  )

  return {
    transactions: data?.transactions || [],
    isLoading,
    error,
  }
}

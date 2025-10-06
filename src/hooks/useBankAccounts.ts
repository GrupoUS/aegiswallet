import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

/**
 * Hook para gerenciar contas bancárias
 */
export function useBankAccounts() {
  const utils = trpc.useUtils()
  
  const { data: accounts, isLoading, error, refetch } = trpc.bankAccounts.getAll.useQuery()
  
  const { mutate: createAccount, isPending: isCreating } = trpc.bankAccounts.create.useMutation({
    onSuccess: (data) => {
      utils.bankAccounts.getAll.setData(undefined, (old) => {
        if (!old) return [data]
        return [data, ...old]
      })
      toast.success('Conta bancária criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar conta bancária')
    },
  })
  
  const { mutate: updateAccount, isPending: isUpdating } = trpc.bankAccounts.update.useMutation({
    onSuccess: (data) => {
      utils.bankAccounts.getAll.setData(undefined, (old) => {
        if (!old) return old
        return old.map(account => account.id === data.id ? data : account)
      })
      toast.success('Conta bancária atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar conta bancária')
    },
  })
  
  const { mutate: deleteAccount, isPending: isDeleting } = trpc.bankAccounts.delete.useMutation({
    onSuccess: () => {
      utils.bankAccounts.getAll.invalidate()
      toast.success('Conta bancária removida com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover conta bancária')
    },
  })
  
  const { mutate: updateBalance, isPending: isUpdatingBalance } = trpc.bankAccounts.updateBalance.useMutation({
    onSuccess: (data) => {
      utils.bankAccounts.getAll.setData(undefined, (old) => {
        if (!old) return old
        return old.map(account => account.id === data.id ? data : account)
      })
      utils.bankAccounts.getTotalBalance.invalidate()
      toast.success('Saldo atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar saldo')
    },
  })
  
  // Real-time subscription para contas bancárias
  useEffect(() => {
    if (!accounts) return

    const channel = supabase
      .channel('bank_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_accounts',
        },
        (payload) => {
          console.log('Bank account change detected:', payload)
          utils.bankAccounts.getAll.invalidate()
          utils.bankAccounts.getTotalBalance.invalidate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accounts, utils])
  
  return {
    accounts: accounts || [],
    isLoading,
    error,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingBalance,
  }
}

/**
 * Hook para obter saldo total
 */
export function useTotalBalance() {
  const { data: balances, isLoading, error } = trpc.bankAccounts.getTotalBalance.useQuery()
  
  return {
    balances: balances || {},
    isLoading,
    error,
    totalBRL: balances?.BRL || 0,
  }
}

/**
 * Hook para obter conta específica
 */
export function useBankAccount(accountId: string) {
  const { data: account, isLoading, error } = trpc.bankAccounts.getById.useQuery(
    { id: accountId },
    { enabled: !!accountId }
  )
  
  return {
    account,
    isLoading,
    error,
  }
}

/**
 * Hook para obter histórico de saldos
 */
export function useBalanceHistory(accountId: string, days: number = 30) {
  const { data: history, isLoading, error } = trpc.bankAccounts.getBalanceHistory.useQuery(
    { accountId, days },
    { enabled: !!accountId }
  )
  
  return {
    history: history || [],
    isLoading,
    error,
  }
}

/**
 * Hook para estatísticas das contas
 */
export function useBankAccountsStats() {
  const { accounts } = useBankAccounts()
  
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(account => account.is_active).length,
    totalBalance: accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0),
    primaryAccounts: accounts.filter(account => account.is_primary).length,
    accountsByCurrency: accounts.reduce((acc, account) => {
      const currency = account.currency || 'BRL'
      acc[currency] = (acc[currency] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
  
  return stats
}

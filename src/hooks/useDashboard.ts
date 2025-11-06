import { useBankAccounts, useBankAccountsStats, useTotalBalance } from '@/hooks/useBankAccounts'
import {
  useContacts,
  useContactsForTransfer,
  useContactsStats,
  useFavoriteContacts,
} from '@/hooks/useContacts'
import { useCalendarStats, useOverdueEvents, useUpcomingEvents } from '@/hooks/useFinancialCalendar'
import { useFinancialEvents, useFinancialEventMutations } from '@/hooks/useFinancialEvents'
import {
  useFinancialTransactions,
  useRecentTransactions,
  useTransactionStats,
} from '@/hooks/useFinancialTransactions'
import { useProfile, useUserStatus } from '@/hooks/useProfile'

/**
 * Hook principal para o Dashboard - combina dados de todas as fontes
 */
export function useDashboard() {
  // Dados do usuário
  const { profile, isLoading: profileLoading } = useProfile()
  const { status: userStatus, isActive } = useUserStatus()

  // Dados financeiros
  const { accounts, isLoading: accountsLoading } = useBankAccounts()
  const { balances, isLoading: balancesLoading } = useTotalBalance()
  const { transactions, isLoading: transactionsLoading } = useFinancialTransactions({ limit: 10 })
  const { stats: transactionStats, isLoading: statsLoading } = useTransactionStats('30d')

  // Dados do calendário
  const { upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents()
  const { overdueEvents, isLoading: overdueLoading } = useOverdueEvents()

  // Dados dos contatos
  const { favoriteContacts, isLoading: contactsLoading } = useFavoriteContacts()
  const { stats: contactStats, isLoading: contactStatsLoading } = useContactsStats()
  const { contacts: transferContacts } = useContactsForTransfer()

  // Calcular totais e estatísticas
  const dashboardData = {
    // Informações do usuário
    user: {
      profile,
      isActive,
      status: userStatus,
    },

    // Resumo financeiro
    financial: {
      totalBalance: balances.BRL || 0,
      totalAccounts: accounts.length,
      totalTransactions: transactions.length,
      recentTransactions: transactions.slice(0, 5),
      stats: transactionStats,
      accounts,
    },

    // Eventos e lembretes
    events: {
      upcoming: upcomingEvents.length,
      overdue: overdueEvents.length,
      upcomingEvents: upcomingEvents.slice(0, 3),
      overdueEvents: overdueEvents.slice(0, 3),
    },

    // Contatos
    contacts: {
      total: contactStats?.totalContacts || 0,
      favorites: favoriteContacts.length,
      favoriteContacts: favoriteContacts.slice(0, 5),
      transferableContacts: transferContacts.slice(0, 5),
    },

    // Estatísticas combinadas
    stats: {
      bankStats: useBankAccountsStats(),
      calendarStats: useCalendarStats(),
      contactStats,
    },
  }

  const isLoading =
    profileLoading ||
    accountsLoading ||
    balancesLoading ||
    transactionsLoading ||
    statsLoading ||
    upcomingLoading ||
    overdueLoading ||
    contactsLoading ||
    contactStatsLoading

  return {
    dashboardData,
    isLoading,
    refresh: () => {
      // Função para refresh de todos os dados
      // Isso pode ser usado em botões de refresh ou quando a página ganha foco
    },
  }
}

/**
 * Hook para widgets do Dashboard
 */
export function useDashboardWidgets() {
  // Widget 1: Resumo Financeiro
  const { balances } = useTotalBalance()
  const { stats } = useTransactionStats('30d')

  // Widget 2: Próximos Eventos
  const { upcomingEvents } = useUpcomingEvents()

  // Widget 3: Contatos Favoritos
  const { favoriteContacts } = useFavoriteContacts()

  // Widget 4: Transações Recentes
  const { transactions } = useRecentTransactions(5)

  const widgets = {
    financialSummary: {
      totalBalance: balances.BRL || 0,
      income: stats?.income || 0,
      expenses: stats?.expenses || 0,
      netBalance: stats?.netBalance || 0,
      period: '30d',
    },

    upcomingEvents: {
      count: upcomingEvents.length,
      events: upcomingEvents.slice(0, 3),
    },

    favoriteContacts: {
      count: favoriteContacts.length,
      contacts: favoriteContacts.slice(0, 4),
    },

    recentTransactions: {
      count: transactions.length,
      transactions: transactions.slice(0, 4),
    },
  }

  return widgets
}

/**
 * Hook para dados em tempo real do Dashboard
 */
export function useRealTimeDashboard() {
  const { dashboardData, isLoading } = useDashboard()

  // Aqui você pode adicionar subscriptions em tempo real para atualizações automáticas
  // Por exemplo, novas transações, eventos, etc.

  return {
    dashboardData,
    isLoading,
    isRealTime: true, // Indica que os dados são atualizados em tempo real
  }
}

/**
 * Hook para métricas de desempenho do Dashboard
 */
export function useDashboardMetrics() {
  const { isLoading } = useDashboard()

  const metrics = {
    loadingTime: 0, // Seria calculado com performance.now()
    dataPoints: {
      transactions: 0,
      events: 0,
      contacts: 0,
      accounts: 0,
    },
    lastUpdated: new Date().toISOString(),
  }

  return {
    metrics,
    isLoading,
  }
}

/**
 * Hook para configurações do Dashboard
 */
export function useDashboardSettings() {
  const { profile } = useProfile()

  const settings = {
    theme: profile?.user_preferences?.theme || 'system',
    notifications: {
      email: profile?.user_preferences?.notifications_email ?? true,
      push: profile?.user_preferences?.notifications_push ?? true,
    },
    voice: {
      enabled: profile?.voice_command_enabled ?? true,
      feedback: profile?.user_preferences?.voice_feedback ?? true,
    },
    accessibility: {
      highContrast: profile?.user_preferences?.accessibility_high_contrast ?? false,
      largeText: profile?.user_preferences?.accessibility_large_text ?? false,
      screenReader: profile?.user_preferences?.accessibility_screen_reader ?? false,
    },
  }

  return settings
}

/**
 * Hook para ações rápidas do Dashboard
 */
export function useDashboardActions() {
  const { createTransaction } = useFinancialTransactions()
  const { addEvent } = useFinancialEventMutations()
  const { createContact } = useContacts()
  const { createAccount } = useBankAccounts()

  const actions = {
    quickTransaction: (data: any) => {
      // Implementar lógica para transação rápida
      return createTransaction(data)
    },

    quickEvent: (data: any) => {
      // Implementar lógica para evento rápido
      return addEvent(data)
    },

    quickContact: (data: any) => {
      // Implementar lógica para contato rápido
      return createContact(data)
    },

    quickAccount: (data: any) => {
      // Implementar lógica para conta rápida
      return createAccount(data)
    },
  }

  return actions
}

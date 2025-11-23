import { useBankAccounts, useBankAccountsStats, useTotalBalance } from '@/hooks/useBankAccounts';
import {
  useContacts,
  useContactsForTransfer,
  useContactsStats,
  useFavoriteContacts,
} from '@/hooks/useContacts';
import {
  useCalendarStats,
  useOverdueEvents,
  useUpcomingEvents,
} from '@/hooks/useFinancialCalendar';
import { useFinancialEventMutations } from '@/hooks/useFinancialEvents';
import {
  useFinancialTransactions,
  useRecentTransactions,
  useTransactionStats,
} from '@/hooks/useFinancialTransactions';
import { useProfile, useUserStatus } from '@/hooks/useProfile';

/**
 * Hook principal para o Dashboard - combina dados de todas as fontes
 */
export function useDashboard() {
  // Dados do usuário
  const { profile, isLoading: profileLoading } = useProfile();
  const { status: userStatus, isActive } = useUserStatus();

  // Dados financeiros
  const { accounts, isLoading: accountsLoading } = useBankAccounts();
  const { balances, isLoading: balancesLoading } = useTotalBalance();
  const { transactions, isLoading: transactionsLoading } = useFinancialTransactions({ limit: 10 });
  const { stats: transactionStats, isLoading: statsLoading } = useTransactionStats('month');

  // Dados do calendário
  const { upcomingEvents, isLoading: upcomingLoading } = useUpcomingEvents();
  const { overdueEvents, isLoading: overdueLoading } = useOverdueEvents();

  // Dados dos contatos
  const { favoriteContacts, isLoading: contactsLoading } = useFavoriteContacts();
  const { stats: contactStats, isLoading: contactStatsLoading } = useContactsStats();
  const { contacts: transferContacts } = useContactsForTransfer();

  // Calcular totais e estatísticas
  const dashboardData = {
    // Informações do usuário
    user: {
      isActive,
      profile,
      status: userStatus,
    },

    // Resumo financeiro
    financial: {
      accounts,
      recentTransactions: transactions.slice(0, 5),
      stats: transactionStats,
      totalAccounts: accounts.length,
      totalBalance: balances.BRL || 0,
      totalTransactions: transactions.length,
    },

    // Eventos e lembretes
    events: {
      overdue: overdueEvents.length,
      overdueEvents: overdueEvents.slice(0, 3),
      upcoming: upcomingEvents.length,
      upcomingEvents: upcomingEvents.slice(0, 3),
    },

    // Contatos
    contacts: {
      favoriteContacts: favoriteContacts.slice(0, 5),
      favorites: favoriteContacts.length,
      total: contactStats?.totalContacts || 0,
      transferableContacts: transferContacts.slice(0, 5),
    },

    // Estatísticas combinadas
    stats: {
      bankStats: useBankAccountsStats(),
      calendarStats: useCalendarStats(),
      contactStats,
    },
  };

  const isLoading =
    profileLoading ||
    accountsLoading ||
    balancesLoading ||
    transactionsLoading ||
    statsLoading ||
    upcomingLoading ||
    overdueLoading ||
    contactsLoading ||
    contactStatsLoading;

  return {
    dashboardData,
    isLoading,
    refresh: () => {
      // Função para refresh de todos os dados
      // Isso pode ser usado em botões de refresh ou quando a página ganha foco
    },
  };
}

/**
 * Hook para widgets do Dashboard
 */
export function useDashboardWidgets() {
  // Widget 1: Resumo Financeiro
  const { balances } = useTotalBalance();
  const { stats } = useTransactionStats('month');

  // Widget 2: Próximos Eventos
  const { upcomingEvents } = useUpcomingEvents();

  // Widget 3: Contatos Favoritos
  const { favoriteContacts } = useFavoriteContacts();

  // Widget 4: Transações Recentes
  const { transactions } = useRecentTransactions(5);

  const widgets = {
    favoriteContacts: {
      contacts: favoriteContacts.slice(0, 4),
      count: favoriteContacts.length,
    },
    financialSummary: {
      balance: stats?.balance || 0,
      expenses: stats?.expenses || 0,
      income: stats?.income || 0,
      period: '30d',
      totalBalance: balances.BRL || 0,
    },
    recentTransactions: {
      count: transactions.length,
      transactions: transactions.slice(0, 4),
    },
    upcomingEvents: {
      count: upcomingEvents.length,
      events: upcomingEvents.slice(0, 3),
    },
  };

  return widgets;
}

/**
 * Hook para dados em tempo real do Dashboard
 */
export function useRealTimeDashboard() {
  const { dashboardData, isLoading } = useDashboard();

  // Aqui você pode adicionar subscriptions em tempo real para atualizações automáticas
  // Por exemplo, novas transações, eventos, etc.

  return {
    dashboardData,
    isLoading,
    isRealTime: true, // Indica que os dados são atualizados em tempo real
  };
}

/**
 * Hook para métricas de desempenho do Dashboard
 */
export function useDashboardMetrics() {
  const { isLoading } = useDashboard();

  const metrics = {
    loadingTime: 0, // Seria calculado com performance.now()
    dataPoints: {
      accounts: 0,
      contacts: 0,
      events: 0,
      transactions: 0,
    },
    lastUpdated: new Date().toISOString(),
  };

  return {
    isLoading,
    metrics,
  };
}

export function useDashboardSettings() {
  const { profile } = useProfile();

  const preferences = profile?.user_preferences?.[0] ?? null;

  const settings = {
    accessibility: {
      highContrast: preferences?.accessibility_high_contrast ?? false,
      largeText: preferences?.accessibility_large_text ?? false,
      screenReader: preferences?.accessibility_screen_reader ?? false,
    },
    autonomyLevel: preferences?.autonomy_level ?? 50,
    currency: preferences?.currency ?? 'BRL',
    language: preferences?.language ?? 'pt-BR',
    notifications: {
      email: preferences?.email_notifications ?? true,
      enabled: preferences?.notifications_enabled ?? true,
      push: preferences?.push_notifications ?? true,
    },
    theme: preferences?.theme ?? 'system',
    timezone: preferences?.timezone ?? 'America/Sao_Paulo',
    voice: {
      enabled: preferences?.voice_commands_enabled ?? true,

      feedback: preferences?.voice_feedback ?? false,
    },
  };

  return settings;
}

/**
 * Hook para ações rápidas do Dashboard
 */
export function useDashboardActions() {
  const { createTransaction } = useFinancialTransactions();
  const { addEvent } = useFinancialEventMutations();
  const { createContact } = useContacts();
  const { createAccount } = useBankAccounts();

  const actions = {
    quickAccount: (data: unknown) => {
      // Implementar lógica para conta rápida
      return createAccount(data as Parameters<typeof createAccount>[0]);
    },
    quickContact: (data: unknown) => {
      // Implementar lógica para contato rápido
      return createContact(data as Parameters<typeof createContact>[0]);
    },
    quickEvent: (data: unknown) => {
      // Implementar lógica para evento rápido
      return addEvent(data as Parameters<typeof addEvent>[0]);
    },
    quickTransaction: (data: unknown) => {
      // Implementar lógica para transação rápida
      return createTransaction(data as Parameters<typeof createTransaction>[0]);
    },
  };

  return actions;
}

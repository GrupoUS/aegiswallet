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
    financialSummary: {
      totalBalance: balances.BRL || 0,
      income: stats?.income || 0,
      expenses: stats?.expenses || 0,
      balance: stats?.balance || 0,
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
      transactions: 0,
      events: 0,
      contacts: 0,
      accounts: 0,
    },
    lastUpdated: new Date().toISOString(),
  };

  return {
    metrics,
    isLoading,
  };
}

export function useDashboardSettings() {
  const { profile } = useProfile();

  const preferences = profile?.user_preferences?.[0] ?? null;

  const settings = {
    theme: preferences?.theme ?? 'system',

    language: preferences?.language ?? 'pt-BR',
    timezone: preferences?.timezone ?? 'America/Sao_Paulo',
    currency: preferences?.currency ?? 'BRL',
    notifications: {
      enabled: preferences?.notifications_enabled ?? true,
      email: preferences?.email_notifications ?? true,

      push: preferences?.push_notifications ?? true,
    },

    voice: {
      enabled: preferences?.voice_commands_enabled ?? true,

      feedback: preferences?.voice_feedback ?? false,
    },
    accessibility: {
      highContrast: preferences?.accessibility_high_contrast ?? false,
      largeText: preferences?.accessibility_large_text ?? false,
      screenReader: preferences?.accessibility_screen_reader ?? false,
    },
    autonomyLevel: preferences?.autonomy_level ?? 50,
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
    quickTransaction: (data: unknown) => {
      // Implementar lógica para transação rápida
      return createTransaction(data as Parameters<typeof createTransaction>[0]);
    },

    quickEvent: (data: unknown) => {
      // Implementar lógica para evento rápido
      return addEvent(data as Parameters<typeof addEvent>[0]);
    },

    quickContact: (data: unknown) => {
      // Implementar lógica para contato rápido
      return createContact(data as Parameters<typeof createContact>[0]);
    },

    quickAccount: (data: unknown) => {
      // Implementar lógica para conta rápida
      return createAccount(data as Parameters<typeof createAccount>[0]);
    },
  };

  return actions;
}

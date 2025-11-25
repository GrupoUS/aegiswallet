import { useBankAccounts, useBankAccountsStats, useTotalBalance } from '@/hooks/useBankAccounts';
import {
  useContacts,
  useContactsForTransfer,
  useContactsStats,
  useFavoriteContacts,
} from '@/hooks/useContacts';
import { useFinancialEvents, useFinancialEventMutations } from '@/hooks/useFinancialEvents';
import { useProfile, useUserStatus } from '@/hooks/useProfile';
import { useTransactions, useTransactionsStats } from '@/hooks/use-transactions';

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
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: stats, isLoading: statsLoading } = useTransactionsStats('month');

  // Dados do calendário
  const { events, loading: eventsLoading } = useFinancialEvents();

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
      recentTransactions: transactions.data?.slice(0, 5) || [],
      stats: stats.data,
      totalAccounts: accounts.length,
      totalBalance: balances.BRL || 0,
      totalTransactions: transactions.data?.length || 0,
    },

    // Eventos e lembretes
    events: {
      total: events.length,
      recentEvents: events.slice(0, 5),
    },

    // Contatos
    contacts: {
      favoriteContacts: favoriteContacts.slice(0, 5),
      favorites: favoriteContacts.length,
      total: contactStats.data?.totalContacts || 0,
      transferableContacts: transferContacts.slice(0, 5),
    },

    // Estatísticas combinadas
    stats: {
      bankStats: useBankAccountsStats(),
      contactStats,
    },
  };

  const isLoading =
    profileLoading ||
    accountsLoading ||
    balancesLoading ||
    transactions.isLoading ||
    stats.isLoading ||
    events.isLoading ||
    contactsLoading ||
    stats.isLoading ||
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
  const { stats } = useTransactionsStats('month');

  // Widget 2: Próximos Eventos
  const { events } = useFinancialEvents();

  // Widget 3: Contatos Favoritos
  const { favoriteContacts } = useFavoriteContacts();

  // Widget 4: Transações Recentes
  const { transactions } = useTransactions();

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
    recentEvents: {
      count: events.length,
      events: events.slice(0, 3),
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
      // Usar addEvent para criar transações (events financeiros)
      return addEvent(data as Parameters<typeof addEvent>[0]);
    },
  };

  return actions;
}

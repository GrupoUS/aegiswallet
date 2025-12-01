import { useTransactions, useTransactionsStats } from '@/hooks/use-transactions';
import { useBankAccounts, useBankAccountsStats, useTotalBalance } from '@/hooks/useBankAccounts';
import {
	useContacts,
	useContactsForTransfer,
	useContactsStats,
	useFavoriteContacts,
} from '@/hooks/useContacts';
import { useFinancialEventMutations, useFinancialEvents } from '@/hooks/useFinancialEvents';
import { useProfile, useUserStatus } from '@/hooks/useProfile';

import type { FinancialEvent } from '@/types/financial-events';

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
	const transactionsQuery = useTransactions();
	const statsQuery = useTransactionsStats('month');
	const transactions = transactionsQuery.data ?? [];
	const stats = statsQuery.data;

	// Dados do calendário
	const { events } = useFinancialEvents();

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
			recentTransactions: transactions.slice(0, 5) || [],
			stats,
			totalAccounts: accounts.length,
			totalBalance: balances.BRL || 0,
			totalTransactions: transactions.length || 0,
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
			total: contactStats?.totalContacts || 0,
			transferableContacts: transferContacts.slice(0, 5),
		},

		// Estatísticas combinadas
		stats: {
			bankStats: useBankAccountsStats(),
			contactStats,
		},
	};

	const isLoading =
		profileLoading || accountsLoading || balancesLoading || contactsLoading || contactStatsLoading;

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
	const statsQuery = useTransactionsStats('month');
	const stats = statsQuery.data;

	// Widget 2: Próximos Eventos
	const { events } = useFinancialEvents();

	// Widget 3: Contatos Favoritos
	const { favoriteContacts } = useFavoriteContacts();

	// Widget 4: Transações Recentes
	const transactionsQuery = useTransactions();
	const transactions = transactionsQuery.data ?? [];

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

	// Safe type narrowing - profile directly contains user_preferences
	const preferences = profile?.user_preferences?.[0];

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
	const { createAccount } = useBankAccounts();
	const { createContact } = useContacts();

	const actions = {
		quickAccount: async (data: Parameters<typeof createAccount>[0]) => {
			// Implementar lógica para conta rápida
			return createAccount(data);
		},
		quickContact: async (data: Parameters<typeof createContact>[0]) => {
			// Implementar lógica para contato rápido
			return createContact(data);
		},
		quickEvent: async (data: Omit<FinancialEvent, 'id'>) => {
			// Implementar lógica para evento rápido
			return addEvent(data);
		},
		quickTransaction: async (data: Omit<FinancialEvent, 'id'>) => {
			// Usar addEvent para criar transações (events financeiros)
			return addEvent(data);
		},
	};

	return actions;
}

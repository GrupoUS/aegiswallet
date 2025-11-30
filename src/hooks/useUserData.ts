/**
 * User Data Hooks - Clerk + Neon Integration
 *
 * React hooks for fetching user-scoped data with real-time updates
 * using TanStack Query and Clerk authentication.
 *
 * NOTE: Bank account hooks have been consolidated into @/hooks/useBankAccounts.ts
 * NOTE: Contact hooks have been consolidated into @/hooks/useContacts.ts
 */

import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useTransactions } from '@/hooks/use-transactions';
import { apiClient } from '@/lib/api-client';

// ========================================
// QUERY KEYS
// ========================================

export const userDataKeys = {
	all: ['userData'] as const,
	bankAccounts: () => [...userDataKeys.all, 'bankAccounts'] as const,
	bankAccount: (id: string) => [...userDataKeys.bankAccounts(), id] as const,
	transactions: (filters?: Record<string, unknown>) =>
		[...userDataKeys.all, 'transactions', filters] as const,
	transaction: (id: string) => [...userDataKeys.transactions(), id] as const,
	pixKeys: () => [...userDataKeys.all, 'pixKeys'] as const,
	pixTransactions: () => [...userDataKeys.all, 'pixTransactions'] as const,
	contacts: () => [...userDataKeys.all, 'contacts'] as const,
	boletos: (status?: string) =>
		[...userDataKeys.all, 'boletos', status] as const,
	consents: () => [...userDataKeys.all, 'consents'] as const,
	limits: () => [...userDataKeys.all, 'limits'] as const,
	summary: () => [...userDataKeys.all, 'summary'] as const,
};

// ========================================
// TRANSACTIONS HOOKS
// ========================================

/**
 * Fetch recent transactions (last 10)
 */
export function useRecentTransactions() {
	return useTransactions({ limit: 10 });
}

// ========================================
// PIX HOOKS
// ========================================

/**
 * Fetch user's PIX keys
 */
export function usePixKeys() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.pixKeys(),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown[] }>('/v1/pix/keys');
			return response.data;
		},
		enabled: isSignedIn,
	});
}

/**
 * Fetch user's PIX transactions
 */
export function usePixTransactions(limit?: number) {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.pixTransactions(),
		queryFn: async () => {
			const url = limit
				? `/v1/pix/transactions?limit=${limit}`
				: '/v1/pix/transactions';
			const response = await apiClient.get<{ data: unknown[] }>(url);
			return response.data;
		},
		enabled: isSignedIn,
		staleTime: 15 * 1000, // PIX needs more frequent updates
		refetchInterval: 30 * 1000,
	});
}

// ========================================
// BOLETOS HOOKS
// ========================================

/**
 * Fetch user's boletos
 */
export function useBoletos(
	status?: 'pending' | 'paid' | 'overdue' | 'cancelled',
) {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.boletos(status),
		queryFn: async () => {
			const url = status ? `/v1/boletos?status=${status}` : '/v1/boletos';
			const response = await apiClient.get<{ data: unknown[] }>(url);
			return response.data;
		},
		enabled: isSignedIn,
	});
}

// ========================================
// COMPLIANCE HOOKS
// ========================================

/**
 * Fetch user's LGPD consents
 */
export function useConsents() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.consents(),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown[] }>(
				'/v1/compliance/consents',
			);
			return response.data;
		},
		enabled: isSignedIn,
	});
}

/**
 * Fetch user's transaction limits
 */
export function useTransactionLimits() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.limits(),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown[] }>(
				'/v1/compliance/limits',
			);
			return response.data;
		},
		enabled: isSignedIn,
	});
}

// ========================================
// SUMMARY HOOKS
// ========================================

/**
 * Fetch user's financial summary
 */
export function useFinancialSummary() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.summary(),
		queryFn: async () => {
			const response = await apiClient.get<{
				totalBalance: number;
				accountCount: number;
				transactionCount: number;
				currency: string;
			}>('/v1/summary');
			return response;
		},
		enabled: isSignedIn,
		staleTime: 60 * 1000,
		refetchInterval: 60 * 1000,
	});
}

// ========================================
// REAL-TIME UPDATES
// ========================================

/**
 * Hook to invalidate all user data (useful after operations)
 */
export function useInvalidateUserData() {
	const queryClient = useQueryClient();

	return {
		invalidateAll: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.all });
		},
		invalidateBankAccounts: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.bankAccounts() });
		},
		invalidateTransactions: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.transactions() });
		},
		invalidatePix: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.pixKeys() });
			queryClient.invalidateQueries({
				queryKey: userDataKeys.pixTransactions(),
			});
		},
	};
}

/**
 * Hook to get current user info from Clerk
 */
export function useCurrentUser() {
	const { user, isLoaded, isSignedIn } = useUser();

	return {
		user: user
			? {
					id: user.id,
					email: user.emailAddresses[0]?.emailAddress,
					fullName: user.fullName,
					imageUrl: user.imageUrl,
				}
			: null,
		isLoaded,
		isSignedIn,
	};
}

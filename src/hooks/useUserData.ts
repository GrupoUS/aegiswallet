/**
 * User Data Hooks - Clerk + Neon Integration
 *
 * React hooks for fetching user-scoped data with real-time updates
 * using TanStack Query and Clerk authentication.
 */

import { useAuth, useUser } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	useCreateTransaction,
	useTransactions,
} from '@/hooks/use-transactions';
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
// BANK ACCOUNTS HOOKS
// ========================================

/**
 * Fetch user's bank accounts
 */
export function useBankAccounts() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.bankAccounts(),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown[] }>(
				'/v1/bank-accounts',
			);
			return response.data;
		},
		enabled: isSignedIn,
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 60 * 1000, // Refetch every minute for real-time feel
	});
}

/**
 * Fetch single bank account
 */
export function useBankAccount(accountId: string) {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.bankAccount(accountId),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown }>(
				`/v1/bank-accounts/${accountId}`,
			);
			return response.data;
		},
		enabled: isSignedIn && !!accountId,
	});
}

/**
 * Fetch total balance across all accounts
 */
export function useTotalBalance() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [...userDataKeys.bankAccounts(), 'total'],
		queryFn: async () => {
			const response = await apiClient.get<{ data: Record<string, number> }>(
				'/v1/bank-accounts/total-balance',
			);
			return response.data;
		},
		enabled: isSignedIn,
		staleTime: 30 * 1000,
		refetchInterval: 30 * 1000, // More frequent updates for balance
	});
}

/**
 * Create bank account mutation
 */
export function useCreateBankAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			institution_name: string;
			account_type: string;
			balance?: number;
			currency?: string;
			is_primary?: boolean;
			account_mask?: string;
		}) => {
			const response = await apiClient.post('/v1/bank-accounts', data);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.bankAccounts() });
		},
	});
}

/**
 * Update bank account mutation
 */
export function useUpdateBankAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Record<string, unknown>;
		}) => {
			const response = await apiClient.patch(`/v1/bank-accounts/${id}`, data);
			return response;
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.bankAccounts() });
			queryClient.invalidateQueries({ queryKey: userDataKeys.bankAccount(id) });
		},
	});
}

/**
 * Delete bank account mutation
 */
export function useDeleteBankAccount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await apiClient.delete(`/v1/bank-accounts/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.bankAccounts() });
		},
	});
}

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
// CONTACTS HOOKS
// ========================================

/**
 * Fetch user's contacts
 */
export function useContacts() {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: userDataKeys.contacts(),
		queryFn: async () => {
			const response = await apiClient.get<{ data: unknown[] }>('/v1/contacts');
			return response.data;
		},
		enabled: isSignedIn,
	});
}

/**
 * Create contact mutation
 */
export function useCreateContact() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			name: string;
			email?: string;
			phone?: string;
			pix_key?: string;
			pix_key_type?: string;
		}) => {
			const response = await apiClient.post('/v1/contacts', data);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userDataKeys.contacts() });
		},
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

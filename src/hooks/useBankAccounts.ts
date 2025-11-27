import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';

export interface BankAccount {
	id: string;
	user_id: string;
	institution_name: string;
	institution_id: string;
	account_type: string;
	account_mask: string;
	balance: number;
	currency: string;
	is_primary: boolean;
	is_active: boolean;
	created_at: string;
	updated_at?: string;
}

interface BankAccountApiResponse<T> {
	data: T;
	meta: {
		requestId: string;
		retrievedAt?: string;
		createdAt?: string;
		updatedAt?: string;
		deletedAt?: string;
	};
}

interface UseBankAccountsReturn {
	accounts: BankAccount[];
	isLoading: boolean;
	error: Error | null;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	isUpdatingBalance: boolean;
	createAccount: (input: {
		institution_name: string;
		account_type: 'checking' | 'savings' | 'investment' | 'cash';
		balance?: number;
		currency?: string;
		is_primary?: boolean;
		is_active?: boolean;
		account_mask?: string;
		institution_id?: string;
	}) => void;
	updateAccount: (input: {
		id: string;
		institution_name?: string;
		account_type?: 'checking' | 'savings' | 'investment' | 'cash';
		balance?: number;
		currency?: string;
		is_primary?: boolean;
		is_active?: boolean;
		account_mask?: string;
	}) => void;
	deleteAccount: (
		input: { id: string },
		options?: { onSuccess?: () => void; onError?: (error: Error) => void },
	) => void;
	deleteAccountAsync: (input: { id: string }) => Promise<string>;
	updateBalance: (input: { id: string; balance: number }) => void;
	refetch: () => void;
}

interface UseTotalBalanceReturn {
	balances: Record<string, number>;
	totalBRL: number;
	isLoading: boolean;
	error: Error | null;
}

interface UseBankAccountReturn {
	account: BankAccount | undefined;
	isLoading: boolean;
	error: Error | null;
}

interface UseBalanceHistoryReturn {
	history: Array<{ date: string; balance: number }>;
	isLoading: boolean;
	error: Error | null;
}

interface UseBankAccountsStatsReturn {
	accountsByCurrency: Record<string, number>;
	activeAccounts: number;
	primaryAccounts: number;
	totalAccounts: number;
	totalBalance: number;
}

/**
 * Hook para gerenciar contas bancárias
 */
export function useBankAccounts(): UseBankAccountsReturn {
	const queryClient = useQueryClient();

	const {
		data: accountsResponse,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['bank-accounts'],
		queryFn: async () => {
			const response =
				await apiClient.get<BankAccountApiResponse<BankAccount[]>>(
					'/v1/bank-accounts',
				);
			return response.data;
		},
	});

	const { mutate: createAccount, isPending: isCreating } = useMutation({
		mutationFn: async (input: {
			institution_name: string;
			account_type: 'checking' | 'savings' | 'investment' | 'cash';
			balance?: number;
			currency?: string;
			is_primary?: boolean;
			is_active?: boolean;
			account_mask?: string;
			institution_id?: string;
		}) => {
			const response = await apiClient.post<
				BankAccountApiResponse<BankAccount>
			>('/v1/bank-accounts', input);
			return response.data;
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao criar conta bancária');
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				['bank-accounts'],
				(old: BankAccount[] | undefined) => {
					if (!old) {
						return [data];
					}
					return [data, ...old];
				},
			);
			toast.success('Conta bancária criada com sucesso!');
		},
	});

	const { mutate: updateAccount, isPending: isUpdating } = useMutation({
		mutationFn: async (input: {
			id: string;
			institution_name?: string;
			account_type?: 'checking' | 'savings' | 'investment' | 'cash';
			balance?: number;
			currency?: string;
			is_primary?: boolean;
			is_active?: boolean;
			account_mask?: string;
		}) => {
			const { id, ...data } = input;
			const response = await apiClient.put<BankAccountApiResponse<BankAccount>>(
				`/v1/bank-accounts/${id}`,
				data,
			);
			return response.data;
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao atualizar conta bancária');
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				['bank-accounts'],
				(old: BankAccount[] | undefined) => {
					if (!old) {
						return old;
					}
					return old.map((account) =>
						account.id === data.id ? data : account,
					);
				},
			);
			toast.success('Conta bancária atualizada com sucesso!');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (input: { id: string }) => {
			await apiClient.delete(`/v1/bank-accounts/${input.id}`);
			return input.id;
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao remover conta bancária');
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
			toast.success('Conta bancária removida com sucesso!');
		},
	});

	const { mutate: updateBalance, isPending: isUpdatingBalance } = useMutation({
		mutationFn: async (input: { id: string; balance: number }) => {
			const response = await apiClient.patch<
				BankAccountApiResponse<BankAccount>
			>(`/v1/bank-accounts/${input.id}/balance`, { balance: input.balance });
			return response.data;
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao atualizar saldo');
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				['bank-accounts'],
				(old: BankAccount[] | undefined) => {
					if (!old) {
						return old;
					}
					return old.map((account) =>
						account.id === data.id ? data : account,
					);
				},
			);
			queryClient.invalidateQueries({
				queryKey: ['bank-accounts', 'total-balance'],
			});
			toast.success('Saldo atualizado com sucesso!');
		},
	});

	// Real-time subscription para contas bancárias
	useEffect(() => {
		if (!accountsResponse) {
			return;
		}

		const channel = supabase
			.channel('bank_accounts_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'bank_accounts',
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
					queryClient.invalidateQueries({
						queryKey: ['bank-accounts', 'total-balance'],
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [accountsResponse, queryClient]);

	return {
		accounts: accountsResponse || [],
		createAccount,
		deleteAccount: deleteMutation.mutate,
		deleteAccountAsync: deleteMutation.mutateAsync,
		error,
		isCreating,
		isDeleting: deleteMutation.isPending,
		isLoading,
		isUpdating,
		isUpdatingBalance,
		refetch,
		updateAccount,
		updateBalance,
	};
}

/**
 * Hook para obter saldo total
 */
export function useTotalBalance(): UseTotalBalanceReturn {
	const {
		data: balancesResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['bank-accounts', 'total-balance'],
		queryFn: async () => {
			const response = await apiClient.get<
				BankAccountApiResponse<Record<string, number>>
			>('/v1/bank-accounts/total-balance');
			return response.data;
		},
	});

	const balances = balancesResponse || {};

	return {
		balances,
		error,
		isLoading,
		totalBRL: balances.BRL || 0,
	};
}

/**
 * Hook para obter conta específica
 */
export function useBankAccount(accountId: string): UseBankAccountReturn {
	const {
		data: accountResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['bank-accounts', accountId],
		queryFn: async () => {
			const response = await apiClient.get<BankAccountApiResponse<BankAccount>>(
				`/v1/bank-accounts/${accountId}`,
			);
			return response.data;
		},
		enabled: !!accountId,
	});

	return {
		account: accountResponse,
		error,
		isLoading,
	};
}

/**
 * Hook para obter histórico de saldos
 */
export function useBalanceHistory(
	accountId: string,
	days: number = 30,
): UseBalanceHistoryReturn {
	const {
		data: historyResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['bank-accounts', accountId, 'history', days],
		queryFn: async () => {
			const response = await apiClient.get<
				BankAccountApiResponse<Array<{ date: string; balance: number }>>
			>(`/v1/bank-accounts/${accountId}/balance-history`, {
				params: { days },
			});
			return response.data;
		},
		enabled: !!accountId,
	});

	return {
		error,
		history: historyResponse || [],
		isLoading,
	};
}

/**
 * Hook para estatísticas das contas
 */
export function useBankAccountsStats(): UseBankAccountsStatsReturn {
	const { accounts } = useBankAccounts();

	const stats = {
		accountsByCurrency: accounts.reduce(
			(acc, account) => {
				const currency = account.currency || 'BRL';
				acc[currency] = (acc[currency] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		),
		activeAccounts: accounts.filter((account) => account.is_active).length,
		primaryAccounts: accounts.filter((account) => account.is_primary).length,
		totalAccounts: accounts.length,
		totalBalance: accounts.reduce(
			(sum, account) => sum + (Number(account.balance) || 0),
			0,
		),
	};

	return stats;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

// Updated interface to match the actual database schema
export interface Transaction {
	id: string;
	user_id: string;
	amount: number;
	transactionType: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status: 'cancelled' | 'failed' | 'pending' | 'posted';
	description: string;
	categoryId?: string;
	accountId?: string;
	created_at: string;
	transaction_date: string;
	posted_date?: string;
	paymentMethod?: string;
	merchantName?: string;
	tags?: string[];
	notes?: string;
	currency?: string;
}

interface TransactionStats {
	balance: number;
	expenses: number;
	income: number;
	period: string;
	transactionsCount: number;
}

interface UseTransactionsReturn {
	data: Transaction[] | undefined;
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

export function useTransactions(filters?: {
	limit?: number;
	offset?: number;
	categoryId?: string;
	accountId?: string;
	transactionType?: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	startDate?: string;
	endDate?: string;
	search?: string;
}): UseTransactionsReturn {
	const query = useQuery({
		queryKey: ['transactions', filters],
		queryFn: async () => {
			// apiClient already unwraps response.data, so we get Transaction[] directly
			const data = await apiClient.get<Transaction[]>('/v1/transactions', {
				params: filters,
			});
			return data;
		},
		retry: 2,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

type CreateTransactionInput = {
	amount: number;
	categoryId?: string;
	description?: string;
	accountId?: string;
	transactionType: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	paymentMethod?: string;
	merchantName?: string;
	notes?: string;
	tags?: string[];
	transactionDate?: string;
};

interface UseCreateTransactionReturn {
	mutate: (input: CreateTransactionInput) => void;
	mutateAsync: (input: CreateTransactionInput) => Promise<Transaction>;
	isPending: boolean;
	error: Error | null;
}

export function useCreateTransaction(): UseCreateTransactionReturn {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: CreateTransactionInput) => {
			// apiClient already unwraps response.data, so we get Transaction directly
			const data = await apiClient.post<Transaction>('/v1/transactions', input);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transactions'] });
		},
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		error: mutation.error,
	};
}

interface UseDeleteTransactionReturn {
	mutate: (
		input: { id: string },
		options?: { onSuccess?: () => void; onError?: (error: Error) => void },
	) => void;
	mutateAsync: (input: { id: string }) => Promise<string>;
	isPending: boolean;
	error: Error | null;
}

export function useDeleteTransaction(): UseDeleteTransactionReturn {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: { id: string }) => {
			await apiClient.delete(`/v1/transactions/${input.id}`);
			return input.id;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transactions'] });
		},
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		error: mutation.error,
	};
}

interface UseTransactionsStatsReturn {
	data: TransactionStats | undefined;
	isLoading: boolean;
	error: Error | null;
}

export function useTransactionsStats(
	period?: 'week' | 'month' | 'quarter' | 'year',
	accountId?: string,
): UseTransactionsStatsReturn {
	const query = useQuery({
		queryKey: ['transactions', 'stats', period, accountId],
		queryFn: async () => {
			// apiClient already unwraps response.data, so we get TransactionStats directly
			const data = await apiClient.get<TransactionStats>('/v1/transactions/statistics', {
				params: {
					period: period || 'month',
					accountId,
				},
			});
			return data;
		},
		retry: 2,
		staleTime: 1000 * 60 * 10, // 10 minutes for stats
	});

	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error,
	};
}

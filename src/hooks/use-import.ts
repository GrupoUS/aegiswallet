/**
 * Import Hook - React Query hooks for bank statement import operations
 *
 * Provides hooks for upload, status polling, and confirmation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { apiClient } from '@/lib/api-client';

// ========================================
// TYPES
// ========================================

export interface ImportSession {
	sessionId: string;
	status: 'PROCESSING' | 'REVIEW' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
	fileName: string;
	fileType: 'PDF' | 'CSV';
	bankDetected: string | null;
	transactionsExtracted: number | null;
	duplicatesFound: number | null;
	averageConfidence: string | null;
	processingTimeMs: number | null;
	errorMessage: string | null;
	transactions: ExtractedTransaction[];
	metadata: {
		processingSteps?: Array<{
			step: string;
			timestamp: string;
			success: boolean;
			error?: string;
		}>;
	};
}

export interface ExtractedTransaction {
	id: string;
	date: Date;
	description: string;
	amount: string;
	type: 'CREDIT' | 'DEBIT';
	balance: string | null;
	confidence: string;
	isPossibleDuplicate: boolean;
	duplicateReason: string | null;
	isSelected: boolean;
}

export interface UploadResponse {
	data: {
		sessionId: string;
		status: 'PROCESSING';
	};
	meta: {
		uploadedAt: string;
		requestId: string;
	};
}

export interface ConfirmResponse {
	data: {
		sessionId: string;
		transactionsCreated: number;
		transactionIds: string[];
		bankAccountId: string;
	};
	meta: {
		requestId: string;
		confirmedAt: string;
		processingTimeMs: number;
	};
}

// ========================================
// QUERY KEYS
// ========================================

export const importKeys = {
	all: ['import'] as const,
	sessions: () => [...importKeys.all, 'sessions'] as const,
	session: (sessionId: string) => [...importKeys.sessions(), sessionId] as const,
	health: () => [...importKeys.all, 'health'] as const,
};

// ========================================
// API FUNCTIONS
// ========================================

function uploadFile(file: File): Promise<UploadResponse> {
	// Use the upload method which properly handles FormData
	return apiClient.upload<UploadResponse>('/v1/import/upload', file);
}

async function getImportStatus(sessionId: string): Promise<ImportSession> {
	const response = await apiClient.get<{ data: ImportSession }>(`/v1/import/status/${sessionId}`);
	return response.data;
}

function confirmImport(params: {
	sessionId: string;
	selectedTransactionIds: string[];
	bankAccountId: string;
}): Promise<ConfirmResponse> {
	return apiClient.post<ConfirmResponse>('/v1/import/confirm', params);
}

async function updateTransactionSelection(params: {
	sessionId: string;
	transactionId: string;
	isSelected: boolean;
}): Promise<{ transactionId: string; isSelected: boolean }> {
	const response = await apiClient.patch<{ data: { transactionId: string; isSelected: boolean } }>(
		'/v1/import/confirm/selection',
		params,
	);
	return response.data;
}

async function cancelImport(sessionId: string): Promise<{ sessionId: string; status: string }> {
	const response = await apiClient.delete<{ data: { sessionId: string; status: string } }>(
		`/v1/import/confirm/${sessionId}`,
	);
	return response.data;
}

// ========================================
// HOOKS
// ========================================

/**
 * Hook for uploading a bank statement file
 */
export function useUploadImport() {
	const queryClient = useQueryClient();
	const [progress, setProgress] = useState(0);

	const mutation = useMutation({
		mutationFn: uploadFile,
		onMutate: () => {
			setProgress(0);
		},
		onSuccess: () => {
			// Start polling for status
			queryClient.invalidateQueries({ queryKey: importKeys.sessions() });
			setProgress(100);
		},
		onError: () => {
			setProgress(0);
		},
	});

	return {
		...mutation,
		progress,
	};
}

/**
 * Hook for getting import session status with polling
 */
export function useImportStatus(
	sessionId: string | null,
	options?: { enabled?: boolean; pollInterval?: number },
) {
	const { enabled = true, pollInterval = 2000 } = options ?? {};

	return useQuery({
		queryKey: importKeys.session(sessionId ?? ''),
		queryFn: () => {
			if (!sessionId) throw new Error('No session ID');
			return getImportStatus(sessionId);
		},
		enabled: enabled && !!sessionId,
		refetchInterval: (query) => {
			const data = query.state.data;
			// Stop polling when status is terminal
			if (data?.status && !['PROCESSING'].includes(data.status)) {
				return false;
			}
			return pollInterval;
		},
		staleTime: 1000,
	});
}

/**
 * Hook for confirming import and creating transactions
 */
export function useConfirmImport() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: confirmImport,
		onSuccess: () => {
			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: importKeys.sessions() });
			queryClient.invalidateQueries({ queryKey: ['transactions'] });
			queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
		},
	});
}

/**
 * Hook for updating transaction selection
 */
export function useUpdateTransactionSelection() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateTransactionSelection,
		onMutate: async ({ sessionId, transactionId, isSelected }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: importKeys.session(sessionId) });

			// Snapshot the previous value
			const previousSession = queryClient.getQueryData<ImportSession>(
				importKeys.session(sessionId),
			);

			// Optimistically update
			if (previousSession) {
				queryClient.setQueryData<ImportSession>(importKeys.session(sessionId), {
					...previousSession,
					transactions: previousSession.transactions.map((t) =>
						t.id === transactionId ? { ...t, isSelected } : t,
					),
				});
			}

			return { previousSession };
		},
		onError: (_err, { sessionId }, context) => {
			// Revert on error
			if (context?.previousSession) {
				queryClient.setQueryData(importKeys.session(sessionId), context.previousSession);
			}
		},
		onSettled: (_data, _err, { sessionId }) => {
			// Refetch after mutation settles
			queryClient.invalidateQueries({ queryKey: importKeys.session(sessionId) });
		},
	});
}

/**
 * Hook for cancelling an import session
 */
export function useCancelImport() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: cancelImport,
		onSuccess: (_data, sessionId) => {
			queryClient.invalidateQueries({ queryKey: importKeys.session(sessionId) });
			queryClient.invalidateQueries({ queryKey: importKeys.sessions() });
		},
	});
}

/**
 * Combined hook for managing the entire import flow
 */
export function useImportFlow() {
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);

	const upload = useUploadImport();
	const status = useImportStatus(currentSessionId);
	const confirm = useConfirmImport();
	const selectionMutation = useUpdateTransactionSelection();
	const cancel = useCancelImport();

	const startImport = useCallback(
		async (file: File) => {
			const result = await upload.mutateAsync(file);
			setCurrentSessionId(result.data.sessionId);
			return result;
		},
		[upload],
	);

	const selectBankAccount = useCallback((bankAccountId: string) => {
		setSelectedBankAccountId(bankAccountId);
	}, []);

	const toggleTransaction = useCallback(
		(transactionId: string, isSelected: boolean) => {
			if (!currentSessionId) return;
			return selectionMutation.mutate({
				sessionId: currentSessionId,
				transactionId,
				isSelected,
			});
		},
		[currentSessionId, selectionMutation],
	);

	const selectAllTransactions = useCallback(
		(select: boolean) => {
			const sessionTransactions = status.data?.transactions;
			if (!(currentSessionId && sessionTransactions)) return;

			// Update all transactions
			sessionTransactions.forEach((t) => {
				if (t.isSelected !== select) {
					selectionMutation.mutate({
						sessionId: currentSessionId,
						transactionId: t.id,
						isSelected: select,
					});
				}
			});
		},
		[currentSessionId, status.data?.transactions, selectionMutation],
	);

	const confirmSelectedTransactions = useCallback(async () => {
		const sessionTransactions = status.data?.transactions;
		if (!(currentSessionId && selectedBankAccountId && sessionTransactions)) {
			throw new Error('Selecione uma conta bancária antes de confirmar');
		}

		const selectedIds = sessionTransactions.filter((t) => t.isSelected).map((t) => t.id);

		if (selectedIds.length === 0) {
			throw new Error('Selecione pelo menos uma transação para importar');
		}

		return await confirm.mutateAsync({
			sessionId: currentSessionId,
			selectedTransactionIds: selectedIds,
			bankAccountId: selectedBankAccountId,
		});
	}, [currentSessionId, selectedBankAccountId, status.data?.transactions, confirm]);

	const cancelCurrentImport = useCallback(async () => {
		if (!currentSessionId) return;
		const result = await cancel.mutateAsync(currentSessionId);
		setCurrentSessionId(null);
		setSelectedBankAccountId(null);
		return result;
	}, [currentSessionId, cancel]);

	const resetImport = useCallback(() => {
		setCurrentSessionId(null);
		setSelectedBankAccountId(null);
	}, []);

	return {
		// State
		currentSessionId,
		selectedBankAccountId,
		session: status.data,
		isLoading: status.isLoading || upload.isPending,
		isProcessing: status.data?.status === 'PROCESSING',
		isReady: status.data?.status === 'REVIEW',
		isConfirmed: status.data?.status === 'CONFIRMED',
		isFailed: status.data?.status === 'FAILED',
		error: status.error ?? upload.error ?? confirm.error ?? cancel.error,

		// Actions
		startImport,
		selectBankAccount,
		toggleTransaction,
		selectAllTransactions,
		confirmSelectedTransactions,
		cancelCurrentImport,
		resetImport,

		// Mutation states
		isUploading: upload.isPending,
		isConfirming: confirm.isPending,
		isCancelling: cancel.isPending,
		uploadProgress: upload.progress,
	};
}

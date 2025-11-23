/**
 * Custom hooks for PIX operations
 * Integrates tRPC with Supabase Realtime
 */

import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trpc, trpcClient } from '@/lib/trpc';
import type { PixTransaction, PixTransactionType } from '@/types/pix';

interface PixTransactionsResponse {
  transactions: PixTransaction[];
  total: number;
  hasMore: boolean;
}

type PixTransactionRealtimePayload = Partial<PixTransaction> & {
  transaction_type?: PixTransactionType;
  recipient_name?: string;
  error_message?: string;
};

// =====================================================
// PIX Keys Hooks
// =====================================================

export function usePixKeys() {
  const utils = trpc.useUtils();

  const { data: keys, isLoading, error } = trpc.pix.getKeys.useQuery();
  const { mutate: createKey } = trpc.pix.createKey.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao cadastrar chave PIX');
    },
    onSuccess: () => {
      utils.pix.getKeys.invalidate();
      toast.success('Chave PIX cadastrada com sucesso!');
    },
  });

  const { mutate: updateKey } = trpc.pix.updateKey.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar chave PIX');
    },
    onSuccess: () => {
      utils.pix.getKeys.invalidate();
      toast.success('Chave PIX atualizada!');
    },
  });

  const { mutate: deleteKey } = trpc.pix.deleteKey.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover chave PIX');
    },
    onSuccess: () => {
      utils.pix.getKeys.invalidate();
      toast.success('Chave PIX removida!');
    },
  });

  // Realtime subscription for PIX keys
  useEffect(() => {
    if (!keys) {
      return;
    }

    const channel = supabase
      .channel('pix_keys_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pix_keys',
        },
        (_payload) => {
          utils.pix.getKeys.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [keys, utils]);

  return {
    createKey,
    deleteKey,
    error,
    isLoading,
    keys: keys || [],
    updateKey,
  };
}

export function usePixFavorites() {
  const { data: favorites, isLoading, error } = trpc.pix.getFavorites.useQuery();

  return {
    error,
    favorites: favorites || [],
    isLoading,
  };
}

// =====================================================
// PIX Transactions Hooks
// =====================================================

export function usePixTransactions(filters?: {
  type?: 'sent' | 'received' | 'scheduled';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const typeFilter = filters?.type;
  const statusFilter = filters?.status;
  const startDateFilter = filters?.startDate;
  const endDateFilter = filters?.endDate;
  const limit = filters?.limit ?? 50;
  const baseOffset = filters?.offset ?? 0;

  const queryKey = useMemo(
    () =>
      [
        'pix',
        'transactions',
        typeFilter ?? null,
        statusFilter ?? null,
        startDateFilter ?? null,
        endDateFilter ?? null,
        limit,
        baseOffset,
      ] as const,
    [typeFilter, statusFilter, startDateFilter, endDateFilter, limit, baseOffset]
  );

  const { data, isLoading, error, fetchNextPage, hasNextPage } = useInfiniteQuery<
    PixTransactionsResponse,
    Error,
    InfiniteData<PixTransactionsResponse, number>,
    typeof queryKey,
    number
  >({
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }

      const loadedCount = allPages.reduce<number>(
        (totalCount, page) => totalCount + page.transactions.length,
        0
      );

      return baseOffset + loadedCount;
    },
    initialPageParam: baseOffset,
    queryFn: async ({ pageParam = baseOffset }) =>
      trpcClient.pix.getTransactions.query({
        endDate: endDateFilter,
        limit,
        offset: pageParam,
        startDate: startDateFilter,
        status: statusFilter,
        type: typeFilter,
      }),
    queryKey,
  });

  const transactions = useMemo(
    () => data?.pages.flatMap((page) => page.transactions) ?? [],
    [data]
  );

  const invalidatePixTransactions = useCallback(() => {
    utils.pix.getTransactions.invalidate();
    queryClient.invalidateQueries({ queryKey: ['pix', 'transactions'] });
  }, [queryClient, utils]);

  const { mutate: createTransaction } = trpc.pix.createTransaction.useMutation({
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Erro ao realizar transferência PIX');
    },
    onSuccess: (transaction) => {
      invalidatePixTransactions();
      utils.pix.getStats.invalidate();

      if (transaction.type === 'scheduled') {
        toast.success('Transferência PIX agendada com sucesso!');
      } else {
        toast.success('Transferência PIX realizada com sucesso!');
      }
    },
  });

  // Realtime subscription for transactions
  useEffect(() => {
    const channel = supabase
      .channel('pix_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pix_transactions',
        },
        (payload) => {
          const transaction = payload.new as PixTransactionRealtimePayload;
          const transactionType = transaction.type ?? transaction.transaction_type;

          // Show notification for new received transactions
          if (payload.eventType === 'INSERT' && transactionType === 'received') {
            toast.success(`PIX recebido: R$ ${(transaction.amount ?? 0).toFixed(2)}`, {
              description:
                transaction.description ||
                `De: ${transaction.recipientName ?? transaction.recipient_name ?? 'Desconhecido'}`,
            });
          }

          // Invalidate queries to refetch data
          invalidatePixTransactions();
          utils.pix.getStats.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidatePixTransactions, utils.pix.getStats.invalidate]);

  return {
    createTransaction,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    total: data?.pages[0]?.total ?? 0,
    transactions,
  };
}

export function usePixTransaction(id: string) {
  const { data: transaction, isLoading, error } = trpc.pix.getTransaction.useQuery({ id });

  return {
    error,
    isLoading,
    transaction,
  };
}

export function usePixStats(period: '24h' | '7d' | '30d' | '1y' = '30d') {
  const { data: stats, isLoading, error } = trpc.pix.getStats.useQuery({ period });

  return {
    error,
    isLoading,
    stats: stats || {
      averageTransaction: 0,
      largestTransaction: 0,
      period,
      totalReceived: 0,
      totalSent: 0,
      transactionCount: 0,
    },
  };
}

// =====================================================
// PIX QR Codes Hooks
// =====================================================

export function usePixQRCodes() {
  const utils = trpc.useUtils();

  const { data: qrCodes, isLoading, error } = trpc.pix.getQRCodes.useQuery();

  const { mutate: generateQRCode, isPending: isGenerating } = trpc.pix.generateQRCode.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao gerar QR Code');
    },
    onSuccess: () => {
      utils.pix.getQRCodes.invalidate();
      toast.success('QR Code gerado com sucesso!');
    },
  });

  const { mutate: deactivateQRCode } = trpc.pix.deactivateQRCode.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Erro ao desativar QR Code');
    },
    onSuccess: () => {
      utils.pix.getQRCodes.invalidate();
      toast.success('QR Code desativado!');
    },
  });

  // Realtime subscription for QR codes
  useEffect(() => {
    if (!qrCodes) {
      return;
    }

    const channel = supabase
      .channel('pix_qr_codes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pix_qr_codes',
        },
        (_payload) => {
          utils.pix.getQRCodes.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrCodes, utils]);

  return {
    deactivateQRCode,
    error,
    generateQRCode,
    isGenerating,
    isLoading,
    qrCodes: qrCodes || [],
  };
}

// =====================================================
// Utility Hooks
// =====================================================

/**
 * Hook to monitor PIX transaction status
 */
export function usePixTransactionMonitor(transactionId?: string) {
  const { transaction, isLoading } = usePixTransaction(transactionId || '');
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    const channel = supabase
      .channel(`pix_transaction_${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          filter: `id=eq.${transactionId}`,
          schema: 'public',
          table: 'pix_transactions',
        },
        (payload) => {
          const updated = payload.new as PixTransactionRealtimePayload;

          // Notify user of status changes
          if (updated.status === 'completed') {
            toast.success('Transação PIX concluída!');
          } else if (updated.status === 'failed') {
            toast.error('Transação PIX falhou', {
              description: updated.errorMessage ?? updated.error_message ?? undefined,
            });
          }

          utils.pix.getTransaction.invalidate({ id: transactionId });
          utils.pix.getTransactions.invalidate();
          queryClient.invalidateQueries({ queryKey: ['pix', 'transactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, transactionId, utils]);

  return {
    isCompleted: transaction?.status === 'completed',
    isFailed: transaction?.status === 'failed',
    isLoading,
    isPending: transaction?.status === 'pending' || transaction?.status === 'processing',
    transaction,
  };
}

/**
 * Hook for PIX auto-refresh (polling)
 */
/**
 * Hook for PIX auto-refresh (polling) - Optimized to prevent memory leaks
 */
export function usePixAutoRefresh(interval: number = 30000) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only set up interval if interval is positive
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        // Refresh all PIX data periodically
        utils.pix.getTransactions.invalidate();
        utils.pix.getStats.invalidate();
        queryClient.invalidateQueries({ queryKey: ['pix', 'transactions'] });
      }, interval);
    }

    // Enhanced cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    interval,
    queryClient.invalidateQueries,
    utils.pix.getStats.invalidate, // Refresh all PIX data periodically
    utils.pix.getTransactions.invalidate,
  ]); // Only depend on interval, not utils or queryClient

  // Provide manual refresh capability
  const refresh = useCallback(() => {
    utils.pix.getTransactions.invalidate();
    utils.pix.getStats.invalidate();
    queryClient.invalidateQueries({ queryKey: ['pix', 'transactions'] });
  }, [utils, queryClient]);

  return { refresh };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trpc } from "@/lib/trpc";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "transfer" | "debit" | "credit" | "pix" | "boleto";
  status: "cancelled" | "failed" | "pending" | "posted";
  description?: string;
  category_id?: string;
  account_id?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface TransactionStats {
  balance: number;
  expenses: number;
  income: number;
  period: string;
  transactionsCount: number;
}

export function useTransactions(filters?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  accountId?: string;
  type?: "transfer" | "debit" | "credit" | "pix" | "boleto";
  status?: "cancelled" | "failed" | "pending" | "posted";
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { data, isLoading, error, refetch } = trpc.transactions.list.useQuery(
    filters || {},
  );

  const transactions = data || [];
  const total = transactions.length;

  const { mutate: createTransaction, isPending: isCreating } =
    trpc.transactions.create.useMutation({
      onError: (error: any) => {
        toast.error(error.message || "Erro ao criar transação");
      },
      onSuccess: () => {
        toast.success("Transação criada com sucesso!");
        refetch();
      },
    });

  const { mutate: updateTransaction, isPending: isUpdating } =
    trpc.transactions.update.useMutation({
      onError: (error: any) => {
        toast.error(error.message || "Erro ao atualizar transação");
      },
      onSuccess: () => {
        toast.success("Transação atualizada com sucesso!");
        refetch();
      },
    });

  const { mutate: deleteTransaction, isPending: isDeleting } =
    trpc.transactions.delete.useMutation({
      onError: (error: any) => {
        toast.error(error.message || "Erro ao remover transação");
      },
      onSuccess: () => {
        toast.success("Transação removida com sucesso!");
        refetch();
      },
    });

  // Real-time subscription for transactions
  useEffect(() => {
    if (!transactions.length) {
      return;
    }

    const channel = supabase
      .channel("transactions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        (_payload) => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactions.length, refetch]);

  return {
    transactions,
    total,
    error,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  };
}

export function useTransactionsStats(
  period?: "week" | "month" | "quarter" | "year",
  accountId?: string,
) {
  const { data, isLoading, error } = trpc.transactions.getStatistics.useQuery({
    period: period || "month",
    accountId,
  });

  return {
    stats: data,
    error,
    isLoading,
  };
}

export function useCreateTransaction() {
  const { mutate: createTransaction, isPending } =
    trpc.transactions.create.useMutation({
      onError: (error: any) => {
        toast.error(error.message || "Erro ao criar transação");
      },
      onSuccess: () => {
        toast.success("Transação criada com sucesso!");
      },
    });

  return {
    createTransaction,
    isPending,
  };
}

export function useDeleteTransaction() {
  const { mutate: deleteTransaction, isPending } =
    trpc.transactions.delete.useMutation({
      onError: (error: any) => {
        toast.error(error.message || "Erro ao remover transação");
      },
      onSuccess: () => {
        toast.success("Transação removida com sucesso!");
      },
    });

  return {
    deleteTransaction,
    isPending,
  };
}

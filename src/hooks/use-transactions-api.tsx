import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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

interface TransactionApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    retrievedAt?: string;
    createdAt?: string;
    deletedAt?: string;
    total?: number;
  };
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
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const response = await apiClient.get<
        TransactionApiResponse<Transaction[]>
      >("/v1/transactions", {
        params: filters,
      });
      return response.data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      amount: number;
      categoryId?: string;
      description?: string;
      fromAccountId: string;
      toAccountId?: string;
      type: "transfer" | "debit" | "credit" | "pix" | "boleto";
      status?: "cancelled" | "failed" | "pending" | "posted";
      metadata?: Record<string, unknown>;
    }) => {
      const response = await apiClient.post<
        TransactionApiResponse<Transaction>
      >("/v1/transactions", input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      await apiClient.delete(`/v1/transactions/${input.id}`);
      return input.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useTransactionsStats(
  period?: "week" | "month" | "quarter" | "year",
  accountId?: string,
) {
  return useQuery({
    queryKey: ["transactions", "stats", period, accountId],
    queryFn: async () => {
      const response = await apiClient.get<
        TransactionApiResponse<TransactionStats>
      >("/v1/transactions/statistics", {
        params: {
          period: period || "month",
          accountId,
        },
      });
      return response.data;
    },
  });
}

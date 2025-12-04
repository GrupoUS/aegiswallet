import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { PaymentHistoryResponse } from '@/types/billing';

interface UseBillingHistoryParams {
	limit?: number;
	offset?: number;
}

/**
 * Hook to get user payment history with pagination
 */
export function useBillingHistory({ limit = 10, offset = 0 }: UseBillingHistoryParams = {}) {
	return useQuery({
		queryKey: ['billing-history', { limit, offset }],
		queryFn: async () => {
			const response = await apiClient.get<PaymentHistoryResponse>('/v1/billing/payment-history', {
				params: { limit: limit.toString(), offset: offset.toString() },
			});
			return response;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: 1,
	});
}

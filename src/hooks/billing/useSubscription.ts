import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { SubscriptionResponse } from '@/types/billing';

/**
 * Hook to get current user subscription
 */
export function useSubscription() {
	return useQuery({
		queryKey: ['subscription'],
		queryFn: async () => {
			const response = await apiClient.get<{
				data: SubscriptionResponse;
				meta: { requestId: string };
			}>('/api/v1/billing/subscription');
			return response.data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: 1,
	});
}

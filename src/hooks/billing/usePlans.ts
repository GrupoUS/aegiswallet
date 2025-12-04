import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { PlansResponse } from '@/types/billing';

/**
 * Hook to get available subscription plans
 */
export function usePlans() {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const response = await apiClient.get<PlansResponse>('/v1/billing/plans');
			return response.plans;
		},
		staleTime: 1000 * 60 * 10, // 10 minutes - plans don't change often
	});
}

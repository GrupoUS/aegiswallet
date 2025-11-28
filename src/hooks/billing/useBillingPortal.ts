import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { PortalSessionResponse } from '@/types/billing';

interface PortalParams {
	returnUrl?: string;
}

/**
 * Hook to access Stripe customer portal
 */
export function useBillingPortal() {
	return useMutation({
		mutationFn: async (params: PortalParams = {}) => {
			const response = await apiClient.post<{
				data: PortalSessionResponse;
				meta: { requestId: string };
			}>('/api/v1/billing/portal', params);
			return response.data;
		},
		onSuccess: (data) => {
			// Redirect to Stripe portal
			if (data.portalUrl) {
				window.location.href = data.portalUrl;
			}
		},
	});
}

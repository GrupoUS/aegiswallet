import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { CheckoutSessionResponse } from '@/types/billing';

interface CheckoutParams {
	priceId: string;
	successUrl?: string;
	cancelUrl?: string;
}

/**
 * Hook to create Stripe checkout session
 */
export function useCheckout() {
	return useMutation({
		mutationFn: async (params: CheckoutParams) => {
			const response = await apiClient.post<{
				data: CheckoutSessionResponse;
				meta: { requestId: string };
			}>('/api/v1/billing/checkout', params);
			return response.data;
		},
		onSuccess: (data) => {
			// Redirect to Stripe checkout
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			}
		},
	});
}

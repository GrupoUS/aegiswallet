import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type {
	AddPaymentMethodRequest,
	PaymentMethod,
	PaymentMethodsResponse,
	UpdatePaymentMethodRequest,
} from '@/types/billing';

/**
 * Hook to get user payment methods
 */
export function usePaymentMethods() {
	return useQuery({
		queryKey: ['payment-methods'],
		queryFn: async () => {
			const response = await apiClient.get<PaymentMethodsResponse>('/v1/billing/payment-methods');
			return response;
		},
		staleTime: 1000 * 60 * 2, // 2 minutes
		retry: 1,
	});
}

/**
 * Hook to add a new payment method
 */
export function useAddPaymentMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: AddPaymentMethodRequest) => {
			const response = await apiClient.post<{ paymentMethod: PaymentMethod }>(
				'/v1/billing/payment-methods',
				data,
			);
			return response;
		},
		onSuccess: () => {
			// Invalidate payment methods query to refetch
			queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
		},
	});
}

/**
 * Hook to update a payment method (e.g., set as default)
 */
export function useUpdatePaymentMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			paymentMethodId,
			data,
		}: {
			paymentMethodId: string;
			data: UpdatePaymentMethodRequest;
		}) => {
			const response = await apiClient.put<{ paymentMethod: PaymentMethod }>(
				`/v1/billing/payment-methods/${paymentMethodId}`,
				data,
			);
			return response;
		},
		onSuccess: () => {
			// Invalidate payment methods query to refetch
			queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
		},
	});
}

/**
 * Hook to remove a payment method
 */
export function useRemovePaymentMethod() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (paymentMethodId: string) => {
			const response = await apiClient.delete<{ success: boolean }>(
				`/v1/billing/payment-methods/${paymentMethodId}`,
			);
			return response;
		},
		onSuccess: () => {
			// Invalidate payment methods query to refetch
			queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
		},
	});
}

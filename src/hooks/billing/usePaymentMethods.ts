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
			return apiClient.get<PaymentMethodsResponse>(
				'/api/v1/billing/payment-methods',
			);
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
			const response = await apiClient.post<{
				data: { paymentMethod: PaymentMethod };
				meta: { requestId: string };
			}>('/api/v1/billing/payment-methods', data);
			return response.data;
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
			const response = await apiClient.put<{
				data: { paymentMethod: PaymentMethod };
				meta: { requestId: string };
			}>(`/api/v1/billing/payment-methods/${paymentMethodId}`, data);
			return response.data;
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
			const response = await apiClient.delete<{
				data: { success: boolean };
				meta: { requestId: string };
			}>(`/api/v1/billing/payment-methods/${paymentMethodId}`);
			return response.data;
		},
		onSuccess: () => {
			// Invalidate payment methods query to refetch
			queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
		},
	});
}

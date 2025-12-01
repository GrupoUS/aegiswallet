import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';
import type { CheckoutSessionResponse } from '@/types/billing';

interface CheckoutParams {
	priceId: string;
	successUrl?: string;
	cancelUrl?: string;
}

/**
 * Hook to create Stripe checkout session with comprehensive error handling and loading states
 */
export function useCheckout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (params: CheckoutParams) => {
			const response = await apiClient.post<{
				data: CheckoutSessionResponse;
				meta: { requestId: string };
			}>('/api/v1/billing/checkout', params);
			return response.data;
		},
		onMutate: () => {
			// Show loading state
			toast.loading('Preparando checkout...');
		},
		onSuccess: (data) => {
			// Validate checkout URL exists before redirect
			if (!data.checkoutUrl) {
				toast.error('Erro no checkout: Não foi possível gerar a URL de pagamento. Tente novamente.');
				return;
			}

			// Invalidate user subscription to refresh after payment
			queryClient.invalidateQueries({ queryKey: ['subscription'] });

			toast.success('Redirecionando para pagamento seguro...');

			// Redirect to Stripe checkout
			window.location.href = data.checkoutUrl;
		},
		onError: (error: Error) => {
			// Comprehensive error handling with user-friendly messages
			const errorMessage = error.message || 'Erro desconhecido ao criar checkout';
			
			let message = 'Não foi possível processar sua solicitação.';

			if (errorMessage.includes('Usuário não encontrado')) {
				message = 'Usuário não autenticado. Faça login novamente para continuar.';
			} else if (errorMessage.includes('plano')) {
				message = 'Plano inválido ou não encontrado. Selecione outro plano.';
			} else if (errorMessage.includes('Stripe')) {
				message = 'Problema temporário com o sistema de pagamento. Tente novamente.';
			}

			toast.error(`Erro no checkout: ${message}`);
		},
		// Retry logic for temporary failures
		retry: (failureCount, error: Error) => {
			// Don't retry for authentication or validation errors
			if (error.message?.includes('Usuário não encontrado') || 
				error.message?.includes('plano') ||
				error.message?.includes('não encontrado')) {
				return false;
			}
			// Retry up to 2 times for network/server errors
			return failureCount < 2;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

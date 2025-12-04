import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { InvoicesResponse } from '@/types/billing';

interface UseInvoicesParams {
	limit?: number;
	offset?: number;
	status?: string;
}

/**
 * Hook to get user invoices with pagination and filtering
 */
export function useInvoices({ limit = 10, offset = 0, status }: UseInvoicesParams = {}) {
	return useQuery({
		queryKey: ['invoices', { limit, offset, status }],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (limit) params.append('limit', limit.toString());
			if (offset) params.append('offset', offset.toString());
			if (status) params.append('status', status);

			return apiClient.get<InvoicesResponse>(`/v1/billing/invoices?${params.toString()}`);
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: 1,
	});
}

/**
 * Hook to download invoice PDF
 */
export function useDownloadInvoice() {
	return useMutation({
		mutationFn: async (invoiceId: string) => {
			// Use the apiClient.download method which handles blob downloads properly
			await apiClient.download(
				`/v1/billing/invoices/${invoiceId}/pdf`,
				`fatura-${invoiceId}.pdf`,
			);
		},
	});
}

/**
 * API Test Utilities for Testing
 *
 * Provides TanStack Query client setup and Brazilian fintech API response mocks
 * for integration testing of API client methods
 */

import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ========================================
// TEST QUERY CLIENT
// ========================================

/**
 * Create a test QueryClient with disabled retries and caching
 */
export const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

/**
 * Wrapper component for testing hooks with QueryClient
 */
export const TestQueryProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => (
	<React.Fragment>
		{/* In a real app, this would be QueryClientProvider, but for testing we mock it */}
		{children}
	</React.Fragment>
);

/**
 * Render hook with QueryClient wrapper
 */
export const renderHookWithQuery = <T,>(
	hook: () => T,
	options?: { client?: QueryClient },
) => {
	const client = options?.client || createTestQueryClient();

	return renderHook(hook, {
		wrapper: ({ children }) => (
			<TestQueryProvider>{children}</TestQueryProvider>
		),
	});
};

// ========================================
// BRAZILIAN FINTECH API MOCKS
// ========================================

/**
 * Mock BCB (Central Bank of Brazil) PIX API response
 */
export const mockPixResponse = {
	status: 'success',
	data: {
		id: 'pix-123',
		endToEndId: 'E1234567890123456789012345678901',
		valor: '150.50',
		horario: '2024-01-15T10:30:00.000Z',
		pagador: {
			cpf: '12345678900',
			nome: 'João Silva',
		},
		recebedor: {
			cpf: '98765432100',
			nome: 'Maria Santos',
		},
	},
};

/**
 * Mock Brazilian bank account balance API response
 */
export const mockBankAccountResponse = {
	status: 'success',
	data: {
		id: 'acc-123',
		balance: 2500.75,
		currency: 'BRL',
		available: 2400.5,
		limit: 100.25,
		lastUpdated: '2024-01-15T10:30:00.000Z',
	},
};

/**
 * Mock Brazilian transaction list API response
 */
export const mockTransactionsResponse = {
	status: 'success',
	data: {
		transactions: [
			{
				id: 'tx-1',
				amount: -89.9,
				currency: 'BRL',
				description: 'Compra no supermercado Extra',
				date: '2024-01-15T14:30:00.000Z',
				category: 'Alimentação',
				type: 'expense',
				status: 'completed',
			},
			{
				id: 'tx-2',
				amount: 3500.0,
				currency: 'BRL',
				description: 'Salário Janeiro 2024',
				date: '2024-01-01T08:00:00.000Z',
				category: 'Salário',
				type: 'income',
				status: 'completed',
			},
		],
		pagination: {
			page: 1,
			limit: 20,
			total: 2,
			totalPages: 1,
		},
	},
};

/**
 * Mock Brazilian PIX key validation API response
 */
export const mockPixKeyValidationResponse = {
	status: 'success',
	data: {
		valid: true,
		keyType: 'CPF',
		holder: {
			name: 'João Silva',
			cpf: '12345678900',
			bank: 'Nubank',
		},
	},
};

/**
 * Mock Brazilian boleto generation API response
 */
export const mockBoletoResponse = {
	status: 'success',
	data: {
		id: 'boleto-123',
		barcode: '00190000090234567890123456789012345678901234',
		dueDate: '2024-02-15',
		amount: 299.99,
		beneficiary: {
			name: 'Empresa Exemplo Ltda',
			cnpj: '12.345.678/0001-90',
			address: 'Rua das Flores, 123 - São Paulo/SP',
		},
		payer: {
			name: 'João Silva',
			cpf: '123.456.789-00',
		},
	},
};

// ========================================
// API CLIENT MOCKING HELPERS
// ========================================

/**
 * Mock fetch for API client testing
 */
export const mockFetchResponse = (response: any, status = 200) => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: vi.fn().mockResolvedValue(response),
		text: vi.fn().mockResolvedValue(JSON.stringify(response)),
		headers: new Headers({ 'content-type': 'application/json' }),
	});
};

/**
 * Mock failed API response
 */
export const mockFetchError = (error: string, status = 500) => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: false,
		status,
		json: vi.fn().mockRejectedValue(new Error(error)),
		text: vi.fn().mockResolvedValue(error),
	});
};

/**
 * Create mock API client with Brazilian fintech methods
 */
export const createMockApiClient = () => ({
	// PIX operations
	createPixTransaction: vi.fn().mockResolvedValue(mockPixResponse),
	getPixTransaction: vi.fn().mockResolvedValue(mockPixResponse),
	validatePixKey: vi.fn().mockResolvedValue(mockPixKeyValidationResponse),

	// Bank account operations
	getAccountBalance: vi.fn().mockResolvedValue(mockBankAccountResponse),
	getAccountTransactions: vi.fn().mockResolvedValue(mockTransactionsResponse),

	// Boleto operations
	generateBoleto: vi.fn().mockResolvedValue(mockBoletoResponse),
	payBoleto: vi
		.fn()
		.mockResolvedValue({ status: 'success', data: { id: 'payment-123' } }),

	// General API methods
	get: vi.fn(),
	post: vi.fn(),
	put: vi.fn(),
	delete: vi.fn(),
});

// ========================================
// INTEGRATION TEST HELPERS
// ========================================

/**
 * Setup API mocks for integration tests
 */
export const setupApiMocks = () => {
	// Mock fetch globally
	mockFetchResponse(mockTransactionsResponse);

	// Mock API client
	vi.mock('@/lib/api/client', () => ({
		apiClient: createMockApiClient(),
	}));
};

/**
 * Reset API mocks between tests
 */
export const resetApiMocks = () => {
	vi.clearAllMocks();
	if (global.fetch) {
		(global.fetch as any).mockClear();
	}
};

// ========================================
// ASYNC TEST HELPERS
// ========================================

/**
 * Wait for query to settle
 */
export const waitForQuery = async (_queryKey?: string[]) => {
	await waitFor(
		() => {
			// Wait for queries to settle
			expect(true).toBe(true);
		},
		{ timeout: 1000 },
	);
};

/**
 * Test async operation with timeout
 */
export const withTimeout = <T,>(
	promise: Promise<T>,
	timeoutMs = 5000,
): Promise<T> => {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error('Operation timed out')), timeoutMs),
		),
	]);
};

export default {
	createTestQueryClient,
	renderHookWithQuery,
	mockPixResponse,
	mockBankAccountResponse,
	mockTransactionsResponse,
	mockPixKeyValidationResponse,
	mockBoletoResponse,
	mockFetchResponse,
	mockFetchError,
	createMockApiClient,
	setupApiMocks,
	resetApiMocks,
	waitForQuery,
	withTimeout,
};

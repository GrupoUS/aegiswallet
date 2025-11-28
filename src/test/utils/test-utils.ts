import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

// Cria um cliente Query para testes
export const createTestQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			mutations: {
				retry: false,
			},
			queries: {
				gcTime: 0,
				retry: false,
			},
		},
	});
};

// Wrapper customizado para testes com providers
export const AllTheProviders = ({
	children,
	queryClient,
}: {
	children?: ReactNode;
	queryClient?: QueryClient;
}) => {
	const testQueryClient = queryClient || createTestQueryClient();

	return React.createElement(
		QueryClientProvider,
		{ client: testQueryClient },
		children,
	);
};

// Custom render function
export const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
) => {
	const queryClient = createTestQueryClient();

	return render(ui, {
		wrapper: ({ children }) =>
			React.createElement(AllTheProviders, { children, queryClient }),
		...options,
	});
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mocks de dados comuns
export const mockUser = {
	autonomy_level: 50,
	email: 'test@example.com',
	id: 'test-user-id',
};

export const mockBalance = {
	available: 4500.0,
	pending: 500.0,
	total: 5000.0,
};

export const mockTransaction = {
	amount: -100.5,
	category: 'food',
	created_at: '2024-01-01T00:00:00Z',
	description: 'Test transaction',
	id: 'test-transaction-id',
	transaction_date: '2024-01-01T00:00:00Z',
	user_id: 'test-user-id',
};

export const mockBankAccount = {
	account_mask: '****1234',
	balance: 5000.0,
	id: 'test-account-id',
	institution_name: 'Test Bank',
	is_active: true,
	last_sync: '2024-01-01T00:00:00Z',
	user_id: 'test-user-id',
};

// Funções utilitárias para testes
export const waitForLoadingToFinish = () =>
	new Promise((resolve) => setTimeout(resolve, 0));

export const createMockEvent = (type: string) => {
	const event = new Event(type);
	Object.defineProperty(event, 'target', {
		value: { value: '' },
		writable: true,
	});
	return event;
};

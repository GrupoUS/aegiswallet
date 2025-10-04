import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RenderOptions, render } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Cria um cliente Query para testes
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Wrapper customizado para testes com providers
export const AllTheProviders = ({
  children,
  queryClient,
}: {
  children: ReactNode
  queryClient?: QueryClient
}) => {
  const testQueryClient = queryClient || createTestQueryClient()

  return React.createElement(QueryClientProvider, { client: testQueryClient }, children)
}

// Custom render function
export const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const queryClient = createTestQueryClient()

  return render(ui, {
    wrapper: ({ children }) => React.createElement(AllTheProviders, { queryClient }, children),
    ...options,
  })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Mocks de dados comuns
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  autonomy_level: 50,
}

export const mockBalance = {
  total: 5000.0,
  available: 4500.0,
  pending: 500.0,
}

export const mockTransaction = {
  id: 'test-transaction-id',
  user_id: 'test-user-id',
  amount: -100.5,
  description: 'Test transaction',
  category: 'food',
  transaction_date: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockBankAccount = {
  id: 'test-account-id',
  user_id: 'test-user-id',
  institution_name: 'Test Bank',
  account_mask: '****1234',
  balance: 5000.0,
  is_active: true,
  last_sync: '2024-01-01T00:00:00Z',
}

// Funções utilitárias para testes
export const waitForLoadingToFinish = () => new Promise((resolve) => setTimeout(resolve, 0))

export const createMockEvent = (type: string) => {
  const event = new Event(type)
  Object.defineProperty(event, 'target', {
    writable: true,
    value: { value: '' },
  })
  return event
}

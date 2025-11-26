/**
 * Application Providers Container
 * Organizes and manages all application-level providers in a clean hierarchy
 */

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoggerProvider } from '@/contexts/LoggerContext';

// Create a client instance for TanStack Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export interface AppProvidersProps {
  children: ReactNode;
  defaultConfig?: Partial<Record<string, unknown>>;
}

export function AppProviders({ children, defaultConfig: _defaultConfig = {} }: AppProvidersProps) {
  // Use the singleton client from client.ts to avoid multiple instances
  // The AuthProvider will use the singleton client internally
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="tweakcn" storageKey="aegiswallet-theme">
        <ErrorBoundary>
          <AccessibilityProvider>
            <LoggerProvider>
              <AuthProvider>
                {children}
                <Toaster richColors closeButton position="top-right" />
              </AuthProvider>
            </LoggerProvider>
          </AccessibilityProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;

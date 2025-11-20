/**
 * Application Providers Container
 * Organizes and manages all application-level providers in a clean hierarchy
 */

import type { ReactNode } from 'react';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoggerProvider } from '@/contexts/LoggerContext';

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aegiswallet-theme">
      <ErrorBoundary>
        <AccessibilityProvider>
          <LoggerProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LoggerProvider>
        </AccessibilityProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

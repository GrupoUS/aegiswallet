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
import { createDevSupabaseClient } from '@/integrations/supabase/config';

export interface AppProvidersProps {
  children: ReactNode;
  defaultConfig?: Partial<any>;
}

export function AppProviders({ children, defaultConfig = {} }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="tweakcn" storageKey="aegiswallet-theme">
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

export default AppProviders;

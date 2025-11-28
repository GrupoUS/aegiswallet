/**
 * Clerk Provider Wrapper
 *
 * Wraps the application with Clerk authentication provider
 * Configured for AegisWallet Brazilian market
 */

// Clerk integration is currently disabled - using Supabase auth instead
// import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
// import { ptBR } from '@clerk/localizations';
import type { ReactNode } from 'react';

// import { clerkAppearance, clerkPublishableKey, clerkUrls } from './client';

interface ClerkProviderProps {
	children: ReactNode;
}

/**
 * AegisWallet Clerk Provider
 *
 * NOTE: Clerk integration is currently disabled - using Supabase auth instead
 * This is a stub implementation to maintain API compatibility
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
	// Stub implementation - just render children
	return <>{children}</>;
}

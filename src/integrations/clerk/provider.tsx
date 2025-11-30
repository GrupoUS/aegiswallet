/**
 * Clerk Provider Wrapper
 *
 * Wraps the application with Clerk authentication provider
 * Configured for AegisWallet Brazilian market
 */

import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { ptBR } from '@clerk/localizations';
import type { ReactNode } from 'react';

import { clerkAppearance, clerkPublishableKey, clerkUrls } from './client';

interface ClerkProviderProps {
	children: ReactNode;
}

/**
 * AegisWallet Clerk Provider
 *
 * Provides authentication context for the entire application
 * Configured for Brazilian market with PT-BR localization
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
	// If no publishable key is configured, render children without Clerk
	// This allows the app to work in development without Clerk
	if (!clerkPublishableKey) {
		return <>{children}</>;
	}

	return (
		<BaseClerkProvider
			publishableKey={clerkPublishableKey}
			localization={ptBR}
			appearance={clerkAppearance}
			signInUrl={clerkUrls.signIn}
			signUpUrl={clerkUrls.signUp}
			afterSignInUrl={clerkUrls.afterSignIn}
			afterSignUpUrl={clerkUrls.afterSignUp}
			afterSignOutUrl={clerkUrls.afterSignOut}
		>
			{children}
		</BaseClerkProvider>
	);
}

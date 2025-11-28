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
 * - Configured with Brazilian Portuguese localization
 * - Custom appearance matching AegisWallet brand
 * - Proper redirect URLs for auth flows
 */
export function ClerkProvider({ children }: ClerkProviderProps) {
	return (
		<BaseClerkProvider
			publishableKey={clerkPublishableKey}
			localization={ptBR}
			appearance={clerkAppearance}
			signInUrl={clerkUrls.signIn}
			signUpUrl={clerkUrls.signUp}
			afterSignInUrl={clerkUrls.afterSignIn}
			afterSignUpUrl={clerkUrls.afterSignUp}
			signInFallbackRedirectUrl={clerkUrls.afterSignIn}
			signUpFallbackRedirectUrl={clerkUrls.afterSignUp}
		>
			{children}
		</BaseClerkProvider>
	);
}

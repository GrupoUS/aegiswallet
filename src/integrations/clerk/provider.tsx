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
	// If no publishable key is configured, show error in production or bypass in development
	if (!clerkPublishableKey) {
		// In production, show explicit error instead of failing silently
		if (import.meta.env.PROD) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
						<h1 className="mb-4 font-bold text-destructive text-xl">
							Erro de Configuracao
						</h1>
						<p className="text-destructive/80">
							Sistema de autenticacao nao configurado. Por favor, contate o
							suporte tecnico.
						</p>
						<p className="mt-4 font-mono text-destructive/60 text-xs">
							Codigo: CLERK_KEY_MISSING
						</p>
					</div>
				</div>
			);
		}
		// In development, allow app to work without Clerk
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

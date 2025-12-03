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
	// If no publishable key is configured, show error in production
	if (!clerkPublishableKey) {
		// In production, show explicit error instead of failing silently
		if (import.meta.env.PROD) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
						<h1 className="mb-4 font-bold text-destructive text-xl">
							Erro de Configuração - AegisWallet
						</h1>
						<p className="text-destructive/80 mb-4">
							O sistema de autenticação não está configurado corretamente.
						</p>
						<div className="space-y-2 text-left">
							<p className="text-destructive/60 text-sm">
								<strong>Possíveis causas:</strong>
							</p>
							<ul className="text-destructive/60 text-sm space-y-1">
								<li>• Variáveis de ambiente não configuradas</li>
								<li>• Chave do Clerk ausente no ambiente de produção</li>
								<li>• Configuração de deploy incorreta</li>
							</ul>
						</div>
						<p className="mt-4 font-mono text-destructive/60 text-xs">
							Código: CLERK_KEY_MISSING_PROD
						</p>
					</div>
				</div>
			);
		}
		return <>{children}</>;
	}

	return (
		<BaseClerkProvider
			publishableKey={clerkPublishableKey}
			localization={ptBR}
			appearance={clerkAppearance}
			signInUrl={clerkUrls.signIn}
			signUpUrl={clerkUrls.signUp}
			signInFallbackRedirectUrl={clerkUrls.afterSignIn}
			signUpFallbackRedirectUrl={clerkUrls.afterSignUp}
			afterSignOutUrl={clerkUrls.afterSignOut}
		>
			{children}
		</BaseClerkProvider>
	);
}

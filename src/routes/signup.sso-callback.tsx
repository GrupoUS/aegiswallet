/**
 * SSO Callback Route for Sign Up
 *
 * This route handles the OAuth callback after a user authenticates
 * with an external provider (Google, etc.) during the sign-up flow.
 *
 * Clerk requires this route when using `routing="path"` mode.
 */

import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup/sso-callback')({
	component: SignUpSSOCallbackComponent,
});

function SignUpSSOCallbackComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
			<div className="w-full max-w-md space-y-8 text-center">
				<div className="space-y-2">
					<h1 className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text font-bold text-5xl text-transparent tracking-tight">
						AegisWallet
					</h1>
					<p className="text-lg text-muted-foreground">Finalizando cadastro...</p>
				</div>

				<div className="flex flex-col items-center justify-center space-y-4">
					<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground text-sm">
						Aguarde enquanto completamos sua autenticação...
					</p>
				</div>

				{/* Clerk SSO callback handler */}
				<AuthenticateWithRedirectCallback
					signUpFallbackRedirectUrl="/dashboard"
					signInFallbackRedirectUrl="/dashboard"
				/>
			</div>
		</div>
	);
}

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Whitelist of allowed internal paths for redirect (security against open redirect)
const ALLOWED_REDIRECT_PATHS = [
	'/dashboard',
	'/saldo',
	'/calendario',
	'/contas',
	'/contas-bancarias',
	'/configuracoes',
	'/ai-chat',
	'/settings',
	'/',
];

function validateRedirectPath(path: string): string {
	// Must start with / and be in whitelist
	if (path.startsWith('/') && ALLOWED_REDIRECT_PATHS.includes(path)) {
		return path;
	}
	// Default to dashboard for any invalid or external paths
	return '/dashboard';
}

export const Route = createFileRoute('/login')({
	component: LoginComponent,
	validateSearch: (
		search: Record<string, unknown>,
	): { error?: string; redirect: string } => ({
		error: (search.error as string) || undefined,
		redirect: validateRedirectPath((search.redirect as string) || '/dashboard'),
	}),
});

function LoginComponent() {
	const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
	const { redirect: redirectPath, error: searchError } = Route.useSearch();
	const navigate = useNavigate();
	const [sessionError, setSessionError] = useState<string | null>(null);

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: redirectPath });
		}
	}, [isAuthenticated, navigate, redirectPath]);

	const handleSubmit = async (
		email: string,
		password: string,
		isSignUp: boolean,
	) => {
		setSessionError(null);

		const result = isSignUp
			? await signUp(email, password)
			: await signIn(email, password);

		if (!result.error && !isSignUp) {
			// Wait for session with retry logic
			let session = null;
			for (let attempt = 0; attempt < 3; attempt++) {
				const { data } = await supabase.auth.getSession();
				if (data.session) {
					session = data.session;
					break;
				}
				// Wait 500ms before retry
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			if (session) {
				navigate({ to: redirectPath });
			} else {
				setSessionError(
					'Sessão não estabelecida. Por favor, tente fazer login novamente.',
				);
			}
		}

		// Convert AuthError to expected format
		return {
			error: result.error ? { message: result.error.message } : undefined,
		};
	};

	const handleGoogleSignIn = async () => {
		await signInWithGoogle(redirectPath);
		// Navigation will be handled by AuthContext after successful sign in
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
			<div className="w-full max-w-md space-y-8">
				{/* AegisWallet Branding */}
				<div className="space-y-2 text-center">
					<h1 className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text font-bold text-5xl text-transparent tracking-tight">
						AegisWallet
					</h1>
					<p className="text-lg text-muted-foreground">
						Seu assistente financeiro inteligente
					</p>
				</div>

				{/* Error Message */}
				{(searchError || sessionError) && (
					<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
						<p className="font-medium text-sm">Erro de autenticação</p>
						<p className="text-sm">{searchError || sessionError}</p>
					</div>
				)}

				{/* Login Form */}
				<LoginForm
					onSubmit={handleSubmit}
					onGoogleSignIn={handleGoogleSignIn}
				/>

				{/* Footer */}
				<div className="text-center text-muted-foreground text-sm">
					<p>Protegido por criptografia de ponta a ponta</p>
					<p className="mt-1">🔒 Seus dados estão seguros</p>
				</div>
			</div>
		</div>
	);
}

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/login')({
	component: LoginComponent,
	validateSearch: (search: Record<string, unknown>) => ({
		error: (search.error as string) || undefined,
		redirect: (search.redirect as string) || '/dashboard',
	}),
});

function LoginComponent() {
	const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
	const { redirect: redirectPath, error: searchError } = Route.useSearch();
	const navigate = useNavigate();

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
		const result = isSignUp
			? await signUp(email, password)
			: await signIn(email, password);

		if (!result.error && !isSignUp) {
			// Navigate to redirect URL after successful login
			navigate({ to: redirectPath });
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
				{searchError && (
					<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
						<p className="font-medium text-sm">Erro de autenticação</p>
						<p className="text-sm">{searchError}</p>
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

/**
 * Auth Callback Route
 * Handles OAuth callback after successful authentication
 * Processes PKCE code exchange and redirects to appropriate page
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/lib/logging/secure-logger';

// Route tree needs regeneration to include this path
// Run `bun run dev` or TanStack Router generate command to update routeTree.gen.ts
export const Route = createFileRoute('/auth/callback')({
	component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
	const navigate = useNavigate();
	const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
		'processing',
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const params = new URLSearchParams(window.location.search);
				const code = params.get('code');
				const error = params.get('error');
				const errorDescription = params.get('error_description');

				// Handle OAuth errors
				if (error) {
					secureLogger.error('OAuth callback error', {
						error,
						errorDescription,
					});
					setStatus('error');
					setErrorMessage(errorDescription || error);
					return;
				}

				// Exchange code for session
				if (code) {
					secureLogger.info('Exchanging PKCE code for session');
					const { data, error: exchangeError } =
						await supabase.auth.exchangeCodeForSession(code);

					if (exchangeError) {
						secureLogger.error('PKCE exchange failed', {
							error: exchangeError.message,
						});
						setStatus('error');
						setErrorMessage(exchangeError.message);
						return;
					}

					if (data?.session) {
						secureLogger.authEvent('login_success', data.user?.id, {
							provider: 'oauth',
						});
						setStatus('success');

						// Get redirect path from session storage
						const redirectPath =
							sessionStorage.getItem('post_auth_redirect') || '/dashboard';
						sessionStorage.removeItem('post_auth_redirect');

						// Navigate to redirect path
						setTimeout(() => navigate({ to: redirectPath }), 500);
						return;
					}
				}

				// No code or error - check for existing session
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session) {
					setStatus('success');
					navigate({ to: '/dashboard' });
				} else {
					setStatus('error');
					setErrorMessage('Nenhum código de autenticação encontrado');
				}
			} catch (err) {
				secureLogger.error('Auth callback exception', {
					error: err instanceof Error ? err.message : 'Unknown error',
				});
				setStatus('error');
				setErrorMessage('Erro inesperado durante autenticação');
			}
		};

		handleCallback();
	}, [navigate]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
			{status === 'processing' && (
				<>
					<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Processando autenticação...</p>
				</>
			)}

			{status === 'success' && (
				<>
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<svg
							className="h-6 w-6 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Sucesso"
						>
							<title>Sucesso</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<p className="text-foreground">Login realizado com sucesso!</p>
					<p className="text-muted-foreground text-sm">Redirecionando...</p>
				</>
			)}

			{status === 'error' && (
				<div className="max-w-md text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-label="Erro"
						>
							<title>Erro</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h2 className="mb-2 font-semibold text-foreground text-lg">
						Erro de Autenticação
					</h2>
					<p className="mb-4 text-muted-foreground text-sm">{errorMessage}</p>
					<button
						type="button"
						onClick={() =>
							navigate({
								to: '/login',
								search: { error: undefined, redirect: '/dashboard' },
							})
						}
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
					>
						Voltar para Login
					</button>
				</div>
			)}
		</div>
	);
}

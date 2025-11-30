import { SignUp } from '@clerk/clerk-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/signup')({
	component: SignUpComponent,
});

function SignUpComponent() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated) {
			void navigate({ to: '/dashboard' });
		}
	}, [isAuthenticated, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text font-bold text-5xl text-transparent tracking-tight">
						AegisWallet
					</h1>
					<p className="text-lg text-muted-foreground">Crie sua conta gratuita</p>
				</div>

				<div className="flex justify-center">
					<SignUp routing="path" path="/signup" signInUrl="/login" forceRedirectUrl="/dashboard" />
				</div>

				<div className="text-center text-muted-foreground text-sm">
					<p>Protegido por criptografia de ponta a ponta</p>
					<p className="mt-1">🔒 Seus dados estão seguros</p>
				</div>
			</div>
		</div>
	);
}

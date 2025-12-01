/**
 * Política de Privacidade Redirect
 *
 * Redireciona para a página de privacidade principal.
 * Este arquivo existe para compatibilidade com links do Clerk.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/politica-de-privacidade')({
	beforeLoad: () => {
		throw redirect({ to: '/privacidade' });
	},
	component: () => null,
});

import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * @deprecated This route is deprecated. Bank accounts management has been consolidated into /saldo
 * The drawer can be opened from the /saldo page by clicking on the Total Balance card
 * or the accounts carousel
 */
export const Route = createFileRoute('/contas-bancarias')({
	beforeLoad: () => {
		// Redirect to /saldo with drawer param to auto-open bank accounts drawer
		throw redirect({
			to: '/saldo',
			search: { drawer: 'accounts' },
		});
	},
});

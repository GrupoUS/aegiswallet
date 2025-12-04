import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * @deprecated This route is deprecated. Bank accounts management has been consolidated into /saldo
 * The drawer can be opened from the /saldo page by clicking on the Total Balance card
 * or the accounts carousel
 */
export const Route = createFileRoute('/contas-bancarias')({
	beforeLoad: () => {
		// Redirect to /saldo - user can open drawer from there
		throw redirect({
			to: '/saldo',
		});
	},
});

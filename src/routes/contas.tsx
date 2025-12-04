import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * @deprecated This route is deprecated. Bills functionality has been consolidated into /saldo
 * Redirects to /saldo with the bills tab active
 */
export const Route = createFileRoute('/contas')({
	beforeLoad: () => {
		// Redirect to /saldo with bills tab (handled via state)
		throw redirect({
			to: '/saldo',
			search: { tab: 'bills' },
		});
	},
});

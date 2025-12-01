import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { BankAccountsListLoader } from '@/components/routes/contas-bancarias/BankAccountsListLoader';
import { RouteErrorBoundary } from '@/components/routes/RouteErrorBoundary';

export const Route = createFileRoute('/contas-bancarias')({
	component: lazy(() =>
		import('@/components/routes/contas-bancarias/ContasBancarias').then((m) => ({
			default: m.ContasBancarias,
		})),
	),
	pendingComponent: () => <BankAccountsListLoader />,
	errorComponent: RouteErrorBoundary,
});

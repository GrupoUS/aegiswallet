import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { BankAccountsListLoader } from '@/components/routes/contas-bancarias/BankAccountsListLoader';

export const Route = createFileRoute('/contas-bancarias')({
	component: lazy(() =>
		import('@/components/routes/contas-bancarias/ContasBancarias').then((m) => ({
			default: m.ContasBancarias,
		})),
	),
	pendingComponent: () => <BankAccountsListLoader />,
});

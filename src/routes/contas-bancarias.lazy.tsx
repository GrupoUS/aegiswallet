import { createLazyFileRoute } from '@tanstack/react-router';

import { ContasBancarias } from '@/components/routes/contas-bancarias/ContasBancarias';

export const Route = createLazyFileRoute('/contas-bancarias')({
	component: ContasBancarias,
});

import { createFileRoute } from '@tanstack/react-router';

import { BillingPage } from '@/routes/billing/index.lazy';

export const Route = createFileRoute('/billing')({
	component: BillingPage,
});

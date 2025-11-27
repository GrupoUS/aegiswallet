import { createLazyFileRoute } from '@tanstack/react-router';

import { CalendarioPage } from '@/components/routes/calendario/CalendarioPage';

export const Route = createLazyFileRoute('/calendario')({
	component: CalendarioPage,
});

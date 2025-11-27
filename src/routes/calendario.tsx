import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { CalendarLoader } from '@/components/routes/calendario/CalendarLoader';

export const Route = createFileRoute('/calendario')({
	component: lazy(() =>
		import('@/components/routes/calendario/CalendarioPage').then((m) => ({
			default: m.CalendarioPage,
		})),
	),
	pendingComponent: () => <CalendarLoader />,
});

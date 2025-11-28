import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { getHttpClient } from '@/db/client';
import { subscriptionPlans } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

const plansRouter = new Hono<AppEnv>();

plansRouter.get('/', async (c) => {
	const requestId = c.get('requestId');
	const db = getHttpClient();

	try {
		const plans = await db
			.select()
			.from(subscriptionPlans)
			.where(eq(subscriptionPlans.isActive, true))
			.orderBy(asc(subscriptionPlans.displayOrder));

		const formattedPlans = plans.map((plan) => ({
			...plan,
			priceFormatted: new Intl.NumberFormat('pt-BR', {
				style: 'currency',
				currency: plan.currency,
			}).format(plan.priceCents / 100),
		}));

		return c.json({
			data: { plans: formattedPlans },
			meta: { requestId },
		});
	} catch (error) {
		secureLogger.error('Failed to fetch plans', {
			error: error instanceof Error ? error.message : 'Unknown error',
			requestId,
		});
		return c.json({ error: 'Falha ao buscar planos' }, 500);
	}
});

export default plansRouter;

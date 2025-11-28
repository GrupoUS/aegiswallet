import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import { getHttpClient } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

type PlanLevel = 'free' | 'basic' | 'advanced';

const PLAN_LEVELS: Record<PlanLevel, number> = {
	free: 0,
	basic: 1,
	advanced: 2,
};

export const requirePlan = (minimumPlan: PlanLevel) => {
	return createMiddleware<AppEnv>(async (c, next) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		try {
			const db = getHttpClient();
			const [sub] = await db
				.select({
					planId: subscriptions.planId,
					status: subscriptions.status,
				})
				.from(subscriptions)
				.where(eq(subscriptions.userId, user.id))
				.limit(1);

			const currentPlanId = (sub?.planId || 'free') as PlanLevel;
			const currentPlanLevel = PLAN_LEVELS[currentPlanId] || 0;
			const requiredLevel = PLAN_LEVELS[minimumPlan];

			// Check if subscription is active (if not free)
			const isActive = sub?.status === 'active' || sub?.status === 'trialing';

			// If user is on a paid plan but it's not active, treat as free
			const effectivePlanLevel =
				currentPlanId !== 'free' && !isActive ? 0 : currentPlanLevel;

			if (effectivePlanLevel < requiredLevel) {
				secureLogger.warn('Access denied: Plan upgrade required', {
					userId: user.id,
					currentPlan: currentPlanId,
					requiredPlan: minimumPlan,
					requestId,
				});

				return c.json(
					{
						code: 'PLAN_UPGRADE_REQUIRED',
						error: 'Seu plano atual não permite acesso a este recurso',
						details: {
							currentPlan: currentPlanId,
							requiredPlan: minimumPlan,
							upgradeUrl: '/billing',
						},
					},
					403,
				);
			}

			await next();
		} catch (error) {
			secureLogger.error('Failed to check plan requirements', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Internal Server Error' }, 500);
		}
	});
};

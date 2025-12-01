import { Hono } from 'hono';

import { secureLogger } from '@/lib/logging/secure-logger';
import { canAccessAI, getAllowedModels, getPlanById } from '@/lib/stripe/config';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import { StripeSubscriptionService } from '@/services/stripe/subscription.service';

const subscriptionRouter = new Hono<AppEnv>();

subscriptionRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 30 }),
	async (c) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const subData = await StripeSubscriptionService.getSubscription(user.id);

			// Determine plan based on subData or default to free
			const plan = subData?.plan || getPlanById('free');
			const planId = plan?.id || 'free';
			const aiAccess = canAccessAI(planId);
			const models = getAllowedModels(planId);

			return c.json({
				data: {
					subscription: subData?.subscription || null,
					plan,
					canAccessAI: aiAccess,
					allowedModels: models,
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to get subscription', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao buscar assinatura' }, 500);
		}
	},
);

export default subscriptionRouter;

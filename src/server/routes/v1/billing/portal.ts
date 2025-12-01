import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import { StripeSubscriptionService } from '@/services/stripe/subscription.service';

const portalRouter = new Hono<AppEnv>();

const portalSchema = z.object({
	returnUrl: z.string().url().optional(),
});

portalRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 10 }),
	zValidator('json', portalSchema),
	async (c) => {
		const { user } = c.get('auth');
		const { returnUrl } = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const subData = await StripeSubscriptionService.getSubscription(user.id);

			if (!subData?.subscription?.stripeCustomerId) {
				return c.json({ error: 'Assinatura não encontrada' }, 400);
			}

			const result = await StripeSubscriptionService.createPortalSession(
				subData.subscription.stripeCustomerId,
				returnUrl,
			);

			secureLogger.info('Portal session created', { userId: user.id });

			return c.json({
				data: result,
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Portal creation failed', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao criar portal' }, 500);
		}
	},
);

export default portalRouter;

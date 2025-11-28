import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import {
	authMiddleware,
	userRateLimitMiddleware,
} from '@/server/middleware/auth';
import { StripeSubscriptionService } from '@/services/stripe/subscription.service';

const checkoutRouter = new Hono<AppEnv>();

const checkoutSchema = z.object({
	priceId: z.string().min(1),
	successUrl: z.string().url().optional(),
	cancelUrl: z.string().url().optional(),
});

checkoutRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 10 }),
	zValidator('json', checkoutSchema),
	async (c) => {
		const { user } = c.get('auth');
		const { priceId, successUrl, cancelUrl } = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const result = await StripeSubscriptionService.createCheckoutSession(
				user.id,
				priceId,
				successUrl,
				cancelUrl,
			);

			secureLogger.info('Checkout session created', {
				userId: user.id,
				priceId,
			});

			return c.json({
				data: result,
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Checkout creation failed', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao criar checkout' }, 500);
		}
	},
);

export default checkoutRouter;

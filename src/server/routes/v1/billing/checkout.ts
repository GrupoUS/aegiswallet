import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
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
	// More permissive rate limits for development and better UX
	userRateLimitMiddleware({ windowMs: 60000, max: 30 }),
	zValidator('json', checkoutSchema),
	async (c) => {
		const { user } = c.get('auth');
		const { priceId, successUrl, cancelUrl } = c.req.valid('json');
		const requestId = c.get('requestId');

		// Enhanced authentication validation
		if (!user?.id) {
			secureLogger.warn('Checkout request missing user authentication', { requestId });
			return c.json({ error: 'Usuário não autenticado' }, 401);
		}

		if (!user?.email) {
			secureLogger.warn('Checkout request missing user email', {
				requestId,
				userId: user.id,
			});
			return c.json({ error: 'Email do usuário não encontrado' }, 400);
		}

		try {
			// Extract request origin for dynamic URL generation
			const requestOrigin = c.req.header('origin') || c.req.header('referer')?.replace(/\/$/, '');

			const result = await StripeSubscriptionService.createCheckoutSession(
				user.id,
				priceId,
				successUrl,
				cancelUrl,
				requestOrigin,
			);

			secureLogger.info('Checkout session created successfully', {
				userId: user.id,
				priceId,
				requestOrigin,
				sessionId: result.sessionId,
			});

			return c.json({
				data: result,
				meta: { requestId },
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			secureLogger.error('Checkout creation failed', {
				userId: user.id,
				priceId,
				error: errorMessage,
				requestId,
			});

			// Provide more specific error messages
			if (errorMessage.includes('Usuário não encontrado')) {
				return c.json({ error: 'Usuário não encontrado' }, 404);
			}
			if (errorMessage.includes('plano') || errorMessage.includes('price')) {
				return c.json({ error: 'Plano inválido ou não encontrado' }, 400);
			}
			if (errorMessage.includes('Stripe')) {
				return c.json({ error: 'Serviço de pagamento temporariamente indisponível' }, 503);
			}

			return c.json({ error: 'Falha ao criar checkout' }, 500);
		}
	},
);

export default checkoutRouter;

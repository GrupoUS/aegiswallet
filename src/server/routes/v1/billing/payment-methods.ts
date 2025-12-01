import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import type { PaymentMethod } from '@/types/billing';

const paymentMethodsRouter = new Hono<AppEnv>();

const addPaymentMethodSchema = z.object({
	type: z.enum(['card', 'pix', 'bank_account']),
	isDefault: z.boolean().optional(),
	// Card fields
	cardNumber: z.string().optional(),
	expiryMonth: z.number().min(1).max(12).optional(),
	expiryYear: z.number().min(new Date().getFullYear()).optional(),
	cvc: z.string().optional(),
	// PIX fields
	pixKey: z.string().optional(),
	pixKeyType: z.enum(['cpf', 'cnpj', 'phone', 'email', 'random']).optional(),
	// Bank account fields
	bankCode: z.string().optional(),
	accountNumber: z.string().optional(),
	accountType: z.enum(['checking', 'savings']).optional(),
	accountHolderName: z.string().optional(),
	documentNumber: z.string().optional(),
});

const updatePaymentMethodSchema = z.object({
	isDefault: z.boolean(),
});

// GET /api/v1/billing/payment-methods - List payment methods
paymentMethodsRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 30 }),
	async (c) => {
		const { user } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe payment methods retrieval
			// For now, return mock data structure
			const paymentMethods: PaymentMethod[] = [];

			return c.json({
				data: {
					paymentMethods,
					hasMore: false,
					total: 0,
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to fetch payment methods', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao buscar métodos de pagamento' }, 500);
		}
	},
);

// POST /api/v1/billing/payment-methods - Add payment method
paymentMethodsRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 10 }),
	zValidator('json', addPaymentMethodSchema),
	async (c) => {
		const { user } = c.get('auth');
		const data = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe payment method creation
			// For now, return mock response
			secureLogger.info('Payment method addition requested', {
				userId: user.id,
				type: data.type,
				requestId,
			});

			return c.json({
				data: {
					paymentMethod: {
						id: 'pm_mock_id',
						type: data.type,
						isDefault: data.isDefault,
						createdAt: new Date().toISOString(),
					},
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to add payment method', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao adicionar método de pagamento' }, 500);
		}
	},
);

// PUT /api/v1/billing/payment-methods/:id - Update payment method
paymentMethodsRouter.put(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 20 }),
	zValidator('json', updatePaymentMethodSchema),
	async (c) => {
		const { user } = c.get('auth');
		const paymentMethodId = c.req.param('id');
		const data = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe payment method update
			secureLogger.info('Payment method update requested', {
				userId: user.id,
				paymentMethodId,
				data,
				requestId,
			});

			return c.json({
				data: {
					paymentMethod: {
						id: paymentMethodId,
						isDefault: data.isDefault,
					},
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to update payment method', {
				userId: user.id,
				paymentMethodId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao atualizar método de pagamento' }, 500);
		}
	},
);

// DELETE /api/v1/billing/payment-methods/:id - Remove payment method
paymentMethodsRouter.delete(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 10 }),
	async (c) => {
		const { user } = c.get('auth');
		const paymentMethodId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe payment method deletion
			secureLogger.info('Payment method deletion requested', {
				userId: user.id,
				paymentMethodId,
				requestId,
			});

			return c.json({
				data: { success: true },
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to remove payment method', {
				userId: user.id,
				paymentMethodId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao remover método de pagamento' }, 500);
		}
	},
);

export default paymentMethodsRouter;

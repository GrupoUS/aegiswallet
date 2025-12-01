import { zValidator } from '@hono/zod-validator';
import { desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { getHttpClient } from '@/db/client';
import { paymentHistory } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

const paymentHistoryRouter = new Hono<AppEnv>();

const historySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
});

paymentHistoryRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 30 }),
	zValidator('query', historySchema),
	async (c) => {
		const { user } = c.get('auth');
		const { limit, offset } = c.req.valid('query');
		const requestId = c.get('requestId');
		const db = getHttpClient();

		try {
			const payments = await db
				.select()
				.from(paymentHistory)
				.where(eq(paymentHistory.userId, user.id))
				.orderBy(desc(paymentHistory.createdAt))
				.limit(limit)
				.offset(offset);

			const [countResult] = await db
				.select({ count: sql<number>`count(*)` })
				.from(paymentHistory)
				.where(eq(paymentHistory.userId, user.id));

			return c.json({
				data: {
					payments,
					total: Number(countResult.count),
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to fetch payment history', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao buscar histórico de pagamentos' }, 500);
		}
	},
);

export default paymentHistoryRouter;

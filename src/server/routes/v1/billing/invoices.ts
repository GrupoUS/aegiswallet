import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import type { Invoice } from '@/types/billing';

const invoicesRouter = new Hono<AppEnv>();

const invoicesQuerySchema = z.object({
	limit: z.coerce.number().min(1).max(100).default(10),
	offset: z.coerce.number().min(0).default(0),
	status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']).optional(),
});

// GET /api/v1/billing/invoices - List invoices
invoicesRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 30 }),
	zValidator('query', invoicesQuerySchema),
	async (c) => {
		const { user } = c.get('auth');
		const { limit: _limit, offset: _offset, status: _status } = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe invoice retrieval
			// For now, return mock data structure
			const invoices: Invoice[] = [];

			const [countResult] = [{ count: 0 }]; // TODO: Implement count query

			return c.json({
				data: {
					invoices,
					total: Number(countResult?.count || 0),
					hasMore: false,
				},
				meta: { requestId },
			});
		} catch (error) {
			secureLogger.error('Failed to fetch invoices', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao buscar faturas' }, 500);
		}
	},
);

// GET /api/v1/billing/invoices/:id/pdf - Download invoice PDF
invoicesRouter.get(
	'/:id/pdf',
	authMiddleware,
	userRateLimitMiddleware({ windowMs: 60000, max: 10 }),
	async (c) => {
		const { user } = c.get('auth');
		const invoiceId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			// TODO: Implement Stripe invoice PDF download
			secureLogger.info('Invoice PDF download requested', {
				userId: user.id,
				invoiceId,
				requestId,
			});

			// For now, return a mock PDF
			const mockPdf = new Blob(['Mock PDF content'], {
				type: 'application/pdf',
			});

			return new Response(mockPdf, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="fatura-${invoiceId}.pdf"`,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to download invoice PDF', {
				userId: user.id,
				invoiceId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			return c.json({ error: 'Falha ao baixar fatura' }, 500);
		}
	},
);

export default invoicesRouter;

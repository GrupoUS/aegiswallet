/**
 * Agent Context API
 * Returns financial context summary for system prompt injection
 */

import { Hono } from 'hono';

import { FinancialContextService } from '@/features/ai-chat/agent/context/FinancialContextService';
import {
	buildAlertsBlock,
	buildFinancialContextBlock,
} from '@/features/ai-chat/agent/prompts/context-template';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware } from '@/server/middleware/auth';

const contextRouter = new Hono<AppEnv>();

/**
 * GET /api/v1/agent/context
 * Returns financial context summary for system prompt injection
 *
 * Query params:
 * - refresh: boolean - Force cache refresh
 *
 * Response:
 * - context: FinancialContext - Raw context data
 * - formatted: { financialBlock, alertsBlock } - Pre-formatted strings for prompt
 */
contextRouter.get('/', authMiddleware, async (c) => {
	const requestId = c.get('requestId');

	try {
		const { user } = c.get('auth');
		const userId = user.id;

		if (!userId) {
			return c.json(
				{
					code: 'UNAUTHORIZED',
					error: 'User not authenticated',
				},
				401,
			);
		}

		const forceRefresh = c.req.query('refresh') === 'true';

		const service = new FinancialContextService(userId);
		const context = await service.getContext(forceRefresh);

		secureLogger.info('Financial context retrieved', {
			forceRefresh,
			requestId,
			userId,
		});

		return c.json({
			context,
			formatted: {
				alertsBlock: buildAlertsBlock(context.pendingAlerts),
				financialBlock: buildFinancialContextBlock(context),
			},
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		secureLogger.error('Error fetching financial context', {
			error: error instanceof Error ? error.message : 'Unknown error',
			requestId,
		});

		return c.json(
			{
				code: 'CONTEXT_ERROR',
				error:
					error instanceof Error ? error.message : 'Failed to fetch context',
			},
			500,
		);
	}
});

export { contextRouter };
export default contextRouter;

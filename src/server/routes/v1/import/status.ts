/**
 * Status Router - Get import session status
 *
 * Endpoint: GET /api/v1/import/status/:sessionId
 */

import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { extractedTransactions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

// UUID regex pattern for validation
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Create status router
export const statusRouter = new Hono<AppEnv>();

/**
 * GET /api/v1/import/status/:sessionId
 *
 * Get the current status of an import session
 */
statusRouter.get('/:sessionId', async (c) => {
	const { user, db } = c.get('auth');
	const requestId = c.get('requestId');
	const sessionId = c.req.param('sessionId');

	try {
		// Validate session ID format
		const isValidUuid = sessionId && UUID_PATTERN.test(sessionId);
		if (!isValidUuid) {
			return c.json(
				{
					code: 'INVALID_SESSION_ID',
					error: 'ID de sessão inválido.',
				},
				400,
			);
		}

		// Fetch session
		const session = await db.query.importSessions.findFirst({
			where: (sessions, { eq: sessionEq, and }) =>
				and(sessionEq(sessions.id, sessionId), sessionEq(sessions.userId, user.id)),
		});

		if (!session) {
			return c.json(
				{
					code: 'SESSION_NOT_FOUND',
					error: 'Sessão de importação não encontrada.',
				},
				404,
			);
		}

		// If session is in REVIEW status, fetch transactions
		let transactions: Array<{
			id: string;
			date: Date;
			description: string;
			amount: string;
			type: 'CREDIT' | 'DEBIT';
			balance: string | null;
			confidence: string;
			isPossibleDuplicate: boolean;
			duplicateReason: string | null;
			isSelected: boolean;
		}> = [];

		if (session.status === 'REVIEW') {
			const extractedTxns = await db
				.select({
					id: extractedTransactions.id,
					date: extractedTransactions.date,
					description: extractedTransactions.description,
					amount: extractedTransactions.amount,
					type: extractedTransactions.type,
					balance: extractedTransactions.balance,
					confidence: extractedTransactions.confidence,
					isPossibleDuplicate: extractedTransactions.isPossibleDuplicate,
					duplicateReason: extractedTransactions.duplicateReason,
					isSelected: extractedTransactions.isSelected,
				})
				.from(extractedTransactions)
				.where(eq(extractedTransactions.sessionId, sessionId))
				.orderBy(extractedTransactions.date);

			transactions = extractedTxns.map((t) => ({
				...t,
				type: t.type as 'CREDIT' | 'DEBIT',
				isPossibleDuplicate: t.isPossibleDuplicate ?? false,
				isSelected: t.isSelected ?? true,
			}));
		}

		secureLogger.info('Import status retrieved', {
			component: 'import-status',
			action: 'get',
			requestId,
			sessionId,
			status: session.status,
			transactionCount: transactions.length,
		});

		return c.json({
			data: {
				sessionId: session.id,
				status: session.status,
				fileName: session.fileName,
				fileType: session.fileType,
				bankDetected: session.bankDetected,
				transactionsExtracted: session.transactionsExtracted,
				duplicatesFound: session.duplicatesFound,
				averageConfidence: session.averageConfidence,
				processingTimeMs: session.processingTimeMs,
				errorMessage: session.errorMessage,
				transactions,
				metadata: {
					processingSteps:
						(session.metadata as { processingSteps?: unknown[] })?.processingSteps ?? [],
				},
			},
			meta: {
				requestId,
				retrievedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Failed to get import status', {
			component: 'import-status',
			action: 'get',
			requestId,
			sessionId,
			error: errorMessage,
		});

		return c.json(
			{
				code: 'STATUS_FAILED',
				error: 'Erro ao consultar status. Tente novamente.',
			},
			500,
		);
	}
});

export { statusRouter as default };

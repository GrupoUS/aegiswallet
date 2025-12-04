/**
 * Confirm Router - Confirm import and create transactions
 *
 * Endpoint: POST /api/v1/import/confirm
 */

import { zValidator } from '@hono/zod-validator';
import { and, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { extractedTransactions, importSessions, transactions } from '@/db/schema';
import { deleteTemporaryFile } from '@/lib/import/storage/blob-storage';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

// Create confirm router
export const confirmRouter = new Hono<AppEnv>();

// Validation schema for confirm request
const confirmSchema = z.object({
	sessionId: z.string().uuid({ message: 'ID de sessão inválido' }),
	selectedTransactionIds: z.array(z.string().uuid()).min(1, {
		message: 'Selecione pelo menos uma transação para importar',
	}),
	bankAccountId: z.string().uuid({ message: 'ID da conta inválido' }),
});

/**
 * POST /api/v1/import/confirm
 *
 * Confirm selected transactions and create them in the transactions table
 */
confirmRouter.post('/', zValidator('json', confirmSchema), async (c) => {
	const { user, db } = c.get('auth');
	const requestId = c.get('requestId');
	const { sessionId, selectedTransactionIds, bankAccountId } = c.req.valid('json');
	const startTime = Date.now();

	try {
		// Verify session exists and belongs to user
		const session = await db.query.importSessions.findFirst({
			where: (sessions, { eq: sessionEq, and: sessionAnd }) =>
				sessionAnd(sessionEq(sessions.id, sessionId), sessionEq(sessions.userId, user.id)),
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

		// Verify session is in REVIEW status
		if (session.status !== 'REVIEW') {
			return c.json(
				{
					code: 'INVALID_SESSION_STATUS',
					error: `Sessão não está em status de revisão. Status atual: ${session.status}`,
				},
				400,
			);
		}

		// Verify bank account exists and belongs to user
		const bankAccount = await db.query.bankAccounts.findFirst({
			where: (accounts, { eq: accEq, and: accAnd }) =>
				accAnd(accEq(accounts.id, bankAccountId), accEq(accounts.userId, user.id)),
		});

		if (!bankAccount) {
			return c.json(
				{
					code: 'BANK_ACCOUNT_NOT_FOUND',
					error: 'Conta bancária não encontrada.',
				},
				404,
			);
		}

		// Fetch selected transactions
		const selectedTxns = await db
			.select()
			.from(extractedTransactions)
			.where(
				and(
					eq(extractedTransactions.sessionId, sessionId),
					inArray(extractedTransactions.id, selectedTransactionIds),
				),
			);

		if (selectedTxns.length === 0) {
			return c.json(
				{
					code: 'NO_TRANSACTIONS_SELECTED',
					error: 'Nenhuma transação válida selecionada.',
				},
				400,
			);
		}

		if (selectedTxns.length !== selectedTransactionIds.length) {
			secureLogger.warn('Some selected transactions not found', {
				component: 'import-confirm',
				action: 'validate',
				requestId,
				sessionId,
				requested: selectedTransactionIds.length,
				found: selectedTxns.length,
			});
		}

		// Create transactions
		const transactionsToCreate = selectedTxns.map((t) => ({
			id: crypto.randomUUID(),
			userId: user.id,
			accountId: bankAccountId,
			transactionDate: t.date,
			description: t.description,
			amount: t.amount,
			transactionType: t.type,
			category: 'OUTROS' as const, // Default category - can be improved with AI categorization later
			externalSource: 'IMPORT' as const,
			metadata: {
				importSessionId: sessionId,
				extractedTransactionId: t.id,
				confidence: t.confidence,
				rawText: t.rawText,
			},
		}));

		// Insert transactions with deduplication handling
		// Uses onConflictDoNothing to silently skip duplicate transactions
		// This works with the idx_transactions_import_dedup unique index
		const insertResult = await db
			.insert(transactions)
			.values(transactionsToCreate)
			.onConflictDoNothing();

		// Note: If some transactions were duplicates, the count might differ
		// from selectedTxns.length, but we still mark the session as confirmed
		const actualInserted =
			(insertResult as unknown as { rowCount?: number }).rowCount ?? selectedTxns.length;

		// Update session status with actual number of inserted transactions
		await db
			.update(importSessions)
			.set({
				status: 'CONFIRMED',
				transactionsImported: actualInserted,
			})
			.where(eq(importSessions.id, sessionId));

		// Cleanup: Delete extracted transactions after successful confirmation
		// This maintains the "temporary" design - they are no longer needed
		await db.delete(extractedTransactions).where(eq(extractedTransactions.sessionId, sessionId));

		// Cleanup: Delete the source file from blob storage
		if (session.fileUrl) {
			try {
				await deleteTemporaryFile(session.fileUrl);
				secureLogger.info('Source file deleted after confirmation', {
					component: 'import-confirm',
					action: 'cleanup',
					requestId,
					sessionId,
				});
			} catch (cleanupError) {
				// Log but don't fail - cleanup is best-effort
				secureLogger.warn('Failed to delete source file', {
					component: 'import-confirm',
					action: 'cleanup',
					requestId,
					sessionId,
					error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
				});
			}
		}

		const processingTime = Date.now() - startTime;

		// Log if some transactions were skipped due to deduplication
		if (actualInserted < selectedTxns.length) {
			secureLogger.info('Some transactions skipped due to deduplication', {
				component: 'import-confirm',
				action: 'confirm',
				requestId,
				sessionId,
				requested: selectedTxns.length,
				actualInserted,
				skipped: selectedTxns.length - actualInserted,
			});
		}

		secureLogger.info('Import confirmed', {
			component: 'import-confirm',
			action: 'confirm',
			requestId,
			sessionId,
			transactionsCreated: actualInserted,
			bankAccountId,
			processingTimeMs: processingTime,
		});

		return c.json({
			data: {
				sessionId,
				transactionsCreated: actualInserted,
				transactionIds: transactionsToCreate.map((t) => t.id),
				bankAccountId,
			},
			meta: {
				requestId,
				confirmedAt: new Date().toISOString(),
				processingTimeMs: processingTime,
			},
		});
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Import confirm failed', {
			component: 'import-confirm',
			action: 'confirm',
			requestId,
			sessionId,
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		return c.json(
			{
				code: 'CONFIRM_FAILED',
				error: 'Erro ao confirmar importação. Tente novamente.',
			},
			500,
		);
	}
});

/**
 * PATCH /api/v1/import/confirm/selection
 *
 * Update transaction selection (select/deselect individual transactions)
 */
const updateSelectionSchema = z.object({
	sessionId: z.string().uuid({ message: 'ID de sessão inválido' }),
	transactionId: z.string().uuid({ message: 'ID de transação inválido' }),
	isSelected: z.boolean(),
});

confirmRouter.patch('/selection', zValidator('json', updateSelectionSchema), async (c) => {
	const { user, db } = c.get('auth');
	const requestId = c.get('requestId');
	const { sessionId, transactionId, isSelected } = c.req.valid('json');

	try {
		// Verify session exists and belongs to user
		const session = await db.query.importSessions.findFirst({
			where: (sessions, { eq: sessionEq, and: sessionAnd }) =>
				sessionAnd(sessionEq(sessions.id, sessionId), sessionEq(sessions.userId, user.id)),
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

		if (session.status !== 'REVIEW') {
			return c.json(
				{
					code: 'INVALID_SESSION_STATUS',
					error: 'Sessão não está em status de revisão.',
				},
				400,
			);
		}

		// Update transaction selection
		const result = await db
			.update(extractedTransactions)
			.set({ isSelected })
			.where(
				and(
					eq(extractedTransactions.id, transactionId),
					eq(extractedTransactions.sessionId, sessionId),
				),
			);

		// Check if transaction was found (PostgreSQL returns affected rows)
		const affectedRows = (result as unknown as { rowCount?: number }).rowCount ?? 1;
		if (affectedRows === 0) {
			return c.json(
				{
					code: 'TRANSACTION_NOT_FOUND',
					error: 'Transação não encontrada na sessão.',
				},
				404,
			);
		}

		secureLogger.info('Transaction selection updated', {
			component: 'import-confirm',
			action: 'update-selection',
			requestId,
			sessionId,
			transactionId,
			isSelected,
		});

		return c.json({
			data: {
				transactionId,
				isSelected,
			},
			meta: {
				requestId,
				updatedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Failed to update selection', {
			component: 'import-confirm',
			action: 'update-selection',
			requestId,
			sessionId,
			transactionId,
			error: errorMessage,
		});

		return c.json(
			{
				code: 'UPDATE_FAILED',
				error: 'Erro ao atualizar seleção. Tente novamente.',
			},
			500,
		);
	}
});

/**
 * DELETE /api/v1/import/confirm/:sessionId
 *
 * Cancel import session and delete extracted transactions
 */
confirmRouter.delete('/:sessionId', async (c) => {
	const { user, db } = c.get('auth');
	const requestId = c.get('requestId');
	const sessionId = c.req.param('sessionId');

	try {
		// Validate session ID
		const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const isValidUuid = sessionId && uuidPattern.test(sessionId);
		if (!isValidUuid) {
			return c.json(
				{
					code: 'INVALID_SESSION_ID',
					error: 'ID de sessão inválido.',
				},
				400,
			);
		}

		// Verify session exists and belongs to user
		const session = await db.query.importSessions.findFirst({
			where: (sessions, { eq: sessionEq, and: sessionAnd }) =>
				sessionAnd(sessionEq(sessions.id, sessionId), sessionEq(sessions.userId, user.id)),
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

		// Cannot cancel confirmed or already cancelled sessions
		if (session.status === 'CONFIRMED' || session.status === 'CANCELLED') {
			return c.json(
				{
					code: 'INVALID_SESSION_STATUS',
					error: `Sessão já foi ${session.status === 'CONFIRMED' ? 'confirmada' : 'cancelada'}.`,
				},
				400,
			);
		}

		// Delete extracted transactions
		await db.delete(extractedTransactions).where(eq(extractedTransactions.sessionId, sessionId));

		// Update session status
		await db
			.update(importSessions)
			.set({ status: 'CANCELLED' })
			.where(eq(importSessions.id, sessionId));

		// Cleanup: Delete the source file from blob storage
		if (session.fileUrl) {
			try {
				await deleteTemporaryFile(session.fileUrl);
				secureLogger.info('Source file deleted after cancellation', {
					component: 'import-confirm',
					action: 'cleanup',
					requestId,
					sessionId,
				});
			} catch (cleanupError) {
				// Log but don't fail - cleanup is best-effort
				secureLogger.warn('Failed to delete source file on cancellation', {
					component: 'import-confirm',
					action: 'cleanup',
					requestId,
					sessionId,
					error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
				});
			}
		}

		secureLogger.info('Import cancelled', {
			component: 'import-confirm',
			action: 'cancel',
			requestId,
			sessionId,
		});

		return c.json({
			data: {
				sessionId,
				status: 'CANCELLED',
			},
			meta: {
				requestId,
				cancelledAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Failed to cancel import', {
			component: 'import-confirm',
			action: 'cancel',
			requestId,
			sessionId,
			error: errorMessage,
		});

		return c.json(
			{
				code: 'CANCEL_FAILED',
				error: 'Erro ao cancelar importação. Tente novamente.',
			},
			500,
		);
	}
});

export { confirmRouter as default };

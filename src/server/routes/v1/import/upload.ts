/**
 * Upload Router - Handle file upload for import
 *
 * Endpoint: POST /api/v1/import/upload
 */

import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { extractedTransactions, importSessions } from '@/db/schema';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/import/constants/bank-patterns';
import {
	detectBankFromCSV,
	extractDataFromCSV,
	formatCSVForProcessing,
} from '@/lib/import/extractors/csv-extractor';
import { detectBankFromPDF, extractTextFromPDF } from '@/lib/import/extractors/pdf-extractor';
import { detectBankCombined } from '@/lib/import/processors/bank-detector';
import {
	isGeminiConfigured,
	processExtractWithGemini,
} from '@/lib/import/processors/gemini-processor';
import { isBlobConfigured, uploadTemporaryFile } from '@/lib/import/storage/blob-storage';
import { checkForDuplicates } from '@/lib/import/validators/duplicate-checker';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv, DbClient } from '@/server/hono-types';
import { userRateLimitMiddleware } from '@/server/middleware/auth';

// Create upload router
export const uploadRouter = new Hono<AppEnv>();

// Apply stricter rate limiting for uploads
uploadRouter.use(
	'*',
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 10,
		message: 'Limite de uploads atingido. Aguarde um minuto antes de tentar novamente.',
	}),
);

/**
 * POST /api/v1/import/upload
 *
 * Upload a bank statement file for processing
 */
uploadRouter.post('/', async (c) => {
	const { user, db } = c.get('auth');
	const requestId = c.get('requestId');
	const startTime = Date.now();

	try {
		// Check if Gemini is configured
		if (!isGeminiConfigured()) {
			secureLogger.error('Gemini API not configured', {
				component: 'import-upload',
				action: 'check-config',
				requestId,
			});
			return c.json(
				{
					code: 'SERVICE_UNAVAILABLE',
					error: 'Serviço de processamento não disponível. Contate o suporte.',
				},
				503,
			);
		}

		// Parse multipart form data
		const formData = await c.req.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return c.json(
				{
					code: 'INVALID_REQUEST',
					error: 'Nenhum arquivo enviado.',
				},
				400,
			);
		}

		// Validate file type
		const mimeType = file.type;
		if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
			return c.json(
				{
					code: 'INVALID_FILE_TYPE',
					error: 'Tipo de arquivo não suportado. Envie um PDF ou CSV.',
				},
				400,
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return c.json(
				{
					code: 'FILE_TOO_LARGE',
					error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
				},
				413,
			);
		}

		// Validate file is not empty
		if (file.size === 0) {
			return c.json(
				{
					code: 'EMPTY_FILE',
					error: 'O arquivo está vazio.',
				},
				400,
			);
		}

		// Determine file type
		const fileType: 'PDF' | 'CSV' = mimeType === 'application/pdf' ? 'PDF' : 'CSV';

		// Generate session ID
		const sessionId = crypto.randomUUID();

		secureLogger.info('Import upload started', {
			component: 'import-upload',
			action: 'start',
			requestId,
			sessionId,
			fileName: file.name,
			fileType,
			fileSize: file.size,
			userId: user.id,
		});

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to temporary storage if configured
		let fileUrl: string | null = null;
		if (isBlobConfigured()) {
			try {
				const uploadResult = await uploadTemporaryFile(
					buffer,
					file.name,
					mimeType,
					user.id,
					sessionId,
				);
				fileUrl = uploadResult.url;
			} catch (uploadError) {
				secureLogger.warn('Blob upload failed, continuing without storage', {
					component: 'import-upload',
					action: 'blob-upload',
					requestId,
					error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
				});
			}
		}

		// Create import session record
		await db.insert(importSessions).values({
			id: sessionId,
			userId: user.id,
			fileName: file.name,
			fileType,
			fileSize: file.size,
			fileUrl,
			status: 'PROCESSING',
			metadata: {
				processingSteps: [
					{
						step: 'upload',
						timestamp: new Date().toISOString(),
						success: true,
					},
				],
			},
		});

		// Return immediately with session ID
		const response = c.json(
			{
				data: {
					sessionId,
					status: 'PROCESSING',
				},
				meta: {
					uploadedAt: new Date().toISOString(),
					requestId,
				},
			},
			202, // Accepted
		);

		// Process asynchronously (don't block response)
		processImportAsync(sessionId, buffer, fileType, file.name, user.id, db).catch((error) => {
			secureLogger.error('Async processing failed', {
				component: 'import-upload',
				action: 'async-process',
				sessionId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		});

		return response;
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Import upload failed', {
			component: 'import-upload',
			action: 'upload',
			requestId,
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		return c.json(
			{
				code: 'UPLOAD_FAILED',
				error: 'Erro ao processar upload. Tente novamente.',
			},
			500,
		);
	}
});

/**
 * Process import asynchronously
 */
async function processImportAsync(
	sessionId: string,
	buffer: Buffer,
	fileType: 'PDF' | 'CSV',
	fileName: string,
	userId: string,
	db: DbClient,
): Promise<void> {
	const startTime = Date.now();
	const updateProcessingStep = async (step: string, success: boolean, error?: string) => {
		try {
			const currentSession = await db.query.importSessions.findFirst({
				where: (sessions, { eq: sessionEq }) => sessionEq(sessions.id, sessionId),
			});

			const currentSteps =
				(
					currentSession?.metadata as {
						processingSteps?: Array<{
							step: string;
							timestamp: string;
							success: boolean;
							error?: string;
						}>;
					}
				)?.processingSteps || [];

			await db
				.update(importSessions)
				.set({
					metadata: {
						...((currentSession?.metadata as object) || {}),
						processingSteps: [
							...currentSteps,
							{
								step,
								timestamp: new Date().toISOString(),
								success,
								error,
							},
						],
					},
				})
				.where(eq(importSessions.id, sessionId));
		} catch {
			// Ignore metadata update errors
		}
	};

	try {
		secureLogger.info('Starting async import processing', {
			component: 'import-processor',
			action: 'start',
			sessionId,
			fileType,
		});

		// Step 1: Extract text from file
		let extractedText: string;
		let bankHint: string | null = null;

		if (fileType === 'PDF') {
			const pdfResult = await extractTextFromPDF(buffer);
			extractedText = pdfResult.text;

			const bankDetection = detectBankFromPDF(extractedText);
			bankHint = bankDetection.bank;
		} else {
			const csvResult = await extractDataFromCSV(buffer);
			const bankDetection = detectBankFromCSV(csvResult.headers, csvResult.rows);
			bankHint = bankDetection.bank;

			// Format CSV data for Gemini processing
			extractedText = formatCSVForProcessing(csvResult.rows, bankDetection.columnMapping);
		}

		await updateProcessingStep('extraction', true);

		// Step 2: Detect bank (combined method)
		const bankResult = detectBankCombined(extractedText, fileName, fileType);
		const detectedBank = bankResult.bank || bankHint;

		await db
			.update(importSessions)
			.set({ bankDetected: detectedBank })
			.where(eq(importSessions.id, sessionId));

		await updateProcessingStep('bank-detection', true);

		// Step 3: Process with Gemini
		const geminiResult = await processExtractWithGemini(
			extractedText,
			fileType,
			detectedBank || undefined,
		);

		await updateProcessingStep('ai-extraction', true);

		// Step 4: Check for duplicates
		const transactionsForCheck = geminiResult.transactions.map((t, index) => ({
			id: `temp-${index}`,
			date: new Date(t.date),
			description: t.description,
			amount: t.amount,
			type: t.type,
		}));

		const duplicateResults = await checkForDuplicates(transactionsForCheck, userId, db);

		await updateProcessingStep('duplicate-check', true);

		// Step 5: Save extracted transactions
		const transactionsToInsert = geminiResult.transactions.map((t, index) => {
			const duplicateResult = duplicateResults.duplicateResults.find(
				(d) => d.extractedId === `temp-${index}`,
			);

			const isPossibleDuplicate = duplicateResult?.isPossibleDuplicate ?? false;

			return {
				id: crypto.randomUUID(),
				sessionId,
				date: new Date(t.date),
				description: t.description,
				amount: String(t.amount),
				type: t.type,
				balance: t.balance ? String(t.balance) : null,
				rawText: t.rawText,
				confidence: String(t.confidence),
				lineNumber: t.lineNumber ?? null,
				isPossibleDuplicate,
				duplicateReason: duplicateResult?.duplicateReason ?? null,
				duplicateTransactionId: duplicateResult?.existingTransactionId ?? null,
				isSelected: !isPossibleDuplicate,
			};
		});

		if (transactionsToInsert.length > 0) {
			await db.insert(extractedTransactions).values(transactionsToInsert);
		}

		await updateProcessingStep('save-transactions', true);

		// Step 6: Calculate statistics and update session
		const processingTime = Date.now() - startTime;
		const avgConfidence =
			geminiResult.transactions.reduce((sum, t) => sum + t.confidence, 0) /
			(geminiResult.transactions.length || 1);

		await db
			.update(importSessions)
			.set({
				status: 'REVIEW',
				transactionsExtracted: geminiResult.transactions.length,
				duplicatesFound: duplicateResults.duplicatesFound,
				averageConfidence: String(avgConfidence.toFixed(2)),
				processingTimeMs: processingTime,
				metadata: {
					...(await getSessionMetadata(sessionId, db)),
					geminiResponse: geminiResult.metadata,
				},
			})
			.where(eq(importSessions.id, sessionId));

		secureLogger.info('Import processing completed', {
			component: 'import-processor',
			action: 'complete',
			sessionId,
			transactionsExtracted: geminiResult.transactions.length,
			duplicatesFound: duplicateResults.duplicatesFound,
			processingTimeMs: processingTime,
		});
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Import processing failed', {
			component: 'import-processor',
			action: 'process',
			sessionId,
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		// Update session with failure
		await db
			.update(importSessions)
			.set({
				status: 'FAILED',
				errorMessage,
				processingTimeMs: processingTime,
			})
			.where(eq(importSessions.id, sessionId));

		await updateProcessingStep('processing', false, errorMessage);
	}
}

/**
 * Get current session metadata
 */
async function getSessionMetadata(sessionId: string, db: DbClient) {
	const session = await db.query.importSessions.findFirst({
		where: (sessions, { eq: sessionEq }) => sessionEq(sessions.id, sessionId),
	});
	return (session?.metadata as object) || {};
}

export { uploadRouter as default };

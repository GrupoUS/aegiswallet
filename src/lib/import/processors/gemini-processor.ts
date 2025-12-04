/**
 * Gemini Processor - AI-powered bank statement extraction
 *
 * Uses Google Gemini Flash Lite for intelligent transaction extraction
 * from bank statement text (PDF or CSV)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import {
	type GeminiExtractionResponse,
	geminiExtractionResponseSchema,
} from '@/lib/import/validators/transaction-schema';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// CONFIGURATION
// ========================================

const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff in ms
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ========================================
// EXTRACTION PROMPT
// ========================================

const EXTRACTION_PROMPT = `Você é um especialista em extrair transações de extratos bancários brasileiros.

Analise o texto do extrato abaixo e extraia TODAS as transações no formato JSON.

REGRAS IMPORTANTES:
1. Datas no formato brasileiro (DD/MM/YYYY ou DD MMM YYYY) devem ser convertidas para ISO 8601 (YYYY-MM-DD)
2. Valores com vírgula como decimal (1.234,56) devem virar número (1234.56)
3. Débitos (saídas) são NEGATIVOS, créditos (entradas) são POSITIVOS
4. O campo "type" deve ser "DEBIT" para valores negativos e "CREDIT" para valores positivos
5. Inclua confidence (0-1) baseado na clareza da extração:
   - 1.0: Dados perfeitamente claros e estruturados
   - 0.8-0.9: Dados claros com mínima interpretação necessária
   - 0.6-0.8: Alguma ambiguidade mas interpretação razoável
   - <0.6: Dados muito ambíguos ou incompletos
6. Preserve a descrição original sem modificações (apenas remova espaços extras)
7. Se houver saldo após transação, inclua no campo "balance"
8. Inclua o número da linha original no campo "lineNumber" quando possível

FORMATO DE SAÍDA OBRIGATÓRIO:
{
  "bank": "Nome do Banco (se identificável)",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Descrição original da transação",
      "amount": 150.00,
      "type": "CREDIT",
      "balance": 1500.00,
      "confidence": 0.95,
      "rawText": "Texto original da linha",
      "lineNumber": 5
    }
  ],
  "metadata": {
    "extractionDate": "YYYY-MM-DD",
    "totalFound": 10,
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "warnings": ["Algum aviso se necessário"]
  }
}

DICAS PARA IDENTIFICAÇÃO DE TRANSAÇÕES:
- PIX: "PIX", "Pix Enviado", "Pix Recebido", "Transferência Pix"
- TED: "TED", "Transferência Eletrônica"
- DOC: "DOC"
- Pagamentos: "Pagamento", "Pgto", "Boleto"
- Compras: "Compra", "Compra no débito", "Cartão de débito"
- Tarifas: "Tarifa", "Taxa", "IOF", "Anuidade"
- Salário: "Salário", "Crédito Salário", "Folha de Pagamento"

EXTRATO PARA ANÁLISE:
---
{TEXT}
---

Responda APENAS com JSON válido, sem markdown, sem explicações, sem código de formatação.`;

// ========================================
// GEMINI CLIENT
// ========================================

/**
 * Get Gemini API client instance
 */
function getGeminiClient(): GoogleGenerativeAI {
	const apiKey = process.env.VITE_GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
	}

	return new GoogleGenerativeAI(apiKey);
}

// ========================================
// MAIN PROCESSING FUNCTION
// ========================================

/**
 * Process bank statement text with Gemini AI
 *
 * @param text - Extracted text from bank statement
 * @param fileType - Source file type (PDF or CSV)
 * @param bankHint - Optional hint about detected bank
 * @returns Structured extraction response
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: AI processing requires retry logic, error handling, and response parsing
export async function processExtractWithGemini(
	text: string,
	fileType: 'PDF' | 'CSV',
	bankHint?: string,
): Promise<GeminiExtractionResponse> {
	const startTime = Date.now();
	let lastError: Error | null = null;

	secureLogger.info('Starting Gemini extraction', {
		component: 'gemini-processor',
		action: 'process',
		fileType,
		bankHint,
		textLength: text.length,
	});

	// Prepare prompt with text
	let prompt = EXTRACTION_PROMPT.replace('{TEXT}', text);

	// Add bank hint if available
	if (bankHint) {
		prompt = `DICA: O extrato parece ser do banco "${bankHint}". Use os padrões específicos deste banco se conhecidos.\n\n${prompt}`;
	}

	// Add file type hint
	if (fileType === 'CSV') {
		prompt = `CONTEXTO: Este texto foi extraído de um arquivo CSV, então os dados devem estar mais estruturados.\n\n${prompt}`;
	}

	// Retry loop with exponential backoff
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			const result = await executeGeminiRequest(prompt);

			const processingTime = Date.now() - startTime;

			secureLogger.info('Gemini extraction completed', {
				component: 'gemini-processor',
				action: 'process',
				attempt: attempt + 1,
				transactionsFound: result.transactions.length,
				processingTimeMs: processingTime,
			});

			// Add warning if average confidence is low
			const avgConfidence =
				result.transactions.reduce((sum, t) => sum + t.confidence, 0) /
				(result.transactions.length || 1);

			if (avgConfidence < 0.7 && result.transactions.length > 0) {
				result.metadata = {
					...result.metadata,
					warnings: [
						...(result.metadata?.warnings || []),
						`Confiança média baixa (${(avgConfidence * 100).toFixed(1)}%). Revise as transações com atenção.`,
					],
				};
			}

			return result;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error('Unknown error');

			secureLogger.warn('Gemini extraction attempt failed', {
				component: 'gemini-processor',
				action: 'process',
				attempt: attempt + 1,
				error: lastError.message,
			});

			// Don't retry on validation errors
			if (lastError.message.includes('Invalid response format')) {
				break;
			}

			// Wait before retry (if not last attempt)
			if (attempt < MAX_RETRIES - 1) {
				await sleep(RETRY_DELAYS[attempt]);
			}
		}
	}

	const processingTime = Date.now() - startTime;

	secureLogger.error('Gemini extraction failed after all retries', {
		component: 'gemini-processor',
		action: 'process',
		error: lastError?.message,
		processingTimeMs: processingTime,
	});

	// Return user-friendly error messages
	const errorMessage = lastError?.message || 'Unknown error';

	if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
		throw new Error(
			'Limite de requisições atingido. Por favor, aguarde alguns minutos e tente novamente.',
		);
	}

	if (errorMessage.includes('timeout')) {
		throw new Error(
			'O processamento demorou muito. Tente com um arquivo menor ou tente novamente.',
		);
	}

	if (errorMessage.includes('Invalid response')) {
		throw new Error(
			'Não foi possível interpretar as transações do extrato. O formato pode não ser suportado.',
		);
	}

	throw new Error(`Erro ao processar extrato: ${errorMessage}`);
}

// ========================================
// GEMINI REQUEST EXECUTION
// ========================================

/**
 * Execute a single Gemini API request with timeout
 */
async function executeGeminiRequest(prompt: string): Promise<GeminiExtractionResponse> {
	const client = getGeminiClient();
	const model = client.getGenerativeModel({
		model: GEMINI_MODEL,
		generationConfig: {
			temperature: 0.1, // Low temperature for consistent extraction
			topP: 0.8,
			maxOutputTokens: 8192,
		},
	});

	// Create abort controller for timeout
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

	try {
		const result = await model.generateContent(prompt);
		clearTimeout(timeoutId);

		const response = result.response;
		const responseText = response.text();

		// Parse and validate response
		return parseGeminiResponse(responseText);
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('Request timeout');
		}

		throw error;
	}
}

// ========================================
// RESPONSE PARSING
// ========================================

/**
 * Parse and validate Gemini response JSON
 */
function parseGeminiResponse(responseText: string): GeminiExtractionResponse {
	// Clean response text (remove markdown code blocks if present)
	let cleanedText = responseText.trim();

	// Remove markdown code blocks
	if (cleanedText.startsWith('```json')) {
		cleanedText = cleanedText.slice(7);
	} else if (cleanedText.startsWith('```')) {
		cleanedText = cleanedText.slice(3);
	}

	if (cleanedText.endsWith('```')) {
		cleanedText = cleanedText.slice(0, -3);
	}

	cleanedText = cleanedText.trim();

	// Parse JSON
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleanedText);
	} catch {
		secureLogger.error('Failed to parse Gemini response as JSON', {
			component: 'gemini-processor',
			action: 'parse',
			responseLength: responseText.length,
		});
		throw new Error('Invalid response format: not valid JSON');
	}

	// Validate with Zod schema
	const validation = geminiExtractionResponseSchema.safeParse(parsed);

	if (!validation.success) {
		secureLogger.error('Gemini response failed validation', {
			component: 'gemini-processor',
			action: 'validate',
			errors: validation.error.issues.map((i) => `${String(i.path.join('.'))}: ${i.message}`),
		});
		throw new Error('Invalid response format: validation failed');
	}

	return validation.data;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Estimate processing time based on text length
 *
 * @param textLength - Length of text to process
 * @returns Estimated time in seconds
 */
export function estimateProcessingTime(textLength: number): number {
	// Rough estimate: ~100 chars per second plus base overhead
	const baseTime = 5; // 5 seconds base
	const charRate = 100; // chars per second
	return Math.ceil(baseTime + textLength / charRate);
}

/**
 * Check if Gemini API is available
 */
export function isGeminiConfigured(): boolean {
	return Boolean(process.env.VITE_GEMINI_API_KEY);
}

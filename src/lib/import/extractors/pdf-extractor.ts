/**
 * PDF Extractor - Extract text and data from PDF bank statements
 *
 * Uses pdf-parse library for text extraction with robust error handling
 */

import pdf from 'pdf-parse';

import { type BankPattern, SUPPORTED_BANKS } from '@/lib/import/constants/bank-patterns';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface PDFExtractionResult {
	/** Extracted text content */
	text: string;
	/** Number of pages in PDF */
	pages: number;
	/** PDF metadata */
	metadata: PDFMetadata;
	/** Text lines split for easier parsing */
	lines: string[];
}

export interface PDFMetadata {
	title?: string;
	author?: string;
	creator?: string;
	creationDate?: string;
	modificationDate?: string;
	producer?: string;
}

export interface BankDetectionResult {
	/** Detected bank name or null if not detected */
	bank: string | null;
	/** Confidence score (0-1) */
	confidence: number;
	/** Bank pattern configuration if detected */
	pattern: BankPattern | null;
}

// ========================================
// PDF TEXT EXTRACTION
// ========================================

/**
 * Extract text content from a PDF buffer
 *
 * @param buffer - PDF file as Buffer
 * @returns Extracted text, page count, and metadata
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
	const startTime = Date.now();

	try {
		secureLogger.info('Starting PDF extraction', {
			component: 'pdf-extractor',
			action: 'extract',
			bufferSize: buffer.length,
		});

		// Validate buffer
		if (!buffer || buffer.length === 0) {
			throw new Error('Empty PDF buffer provided');
		}

		// Check PDF magic bytes
		const pdfHeader = buffer.subarray(0, 5).toString('ascii');
		if (pdfHeader !== '%PDF-') {
			throw new Error('Invalid PDF format: missing PDF header');
		}

		// Extract text using pdf-parse
		const data = await pdf(buffer, {
			// Preserve text positioning for table structure
			pagerender: undefined,
		});

		const processingTime = Date.now() - startTime;

		// Clean and prepare text
		const cleanedText = cleanPDFText(data.text);
		const lines = cleanedText.split('\n').filter((line) => line.trim().length > 0);

		secureLogger.info('PDF extraction completed', {
			component: 'pdf-extractor',
			action: 'extract',
			pages: data.numpages,
			textLength: cleanedText.length,
			linesCount: lines.length,
			processingTimeMs: processingTime,
		});

		return {
			text: cleanedText,
			pages: data.numpages,
			metadata: {
				title: data.info?.Title,
				author: data.info?.Author,
				creator: data.info?.Creator,
				creationDate: data.info?.CreationDate,
				modificationDate: data.info?.ModDate,
				producer: data.info?.Producer,
			},
			lines,
		};
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('PDF extraction failed', {
			component: 'pdf-extractor',
			action: 'extract',
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		// Provide user-friendly error messages
		if (errorMessage.includes('password')) {
			throw new Error(
				'O PDF está protegido por senha. Por favor, remova a proteção e tente novamente.',
			);
		}

		if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupt')) {
			throw new Error('O arquivo PDF está corrompido ou inválido. Por favor, verifique o arquivo.');
		}

		if (errorMessage.includes('Empty')) {
			throw new Error('O arquivo PDF está vazio.');
		}

		throw new Error(`Erro ao processar PDF: ${errorMessage}`);
	}
}

// ========================================
// BANK DETECTION
// ========================================

/**
 * Detect bank from extracted PDF text
 *
 * @param text - Extracted PDF text
 * @returns Detection result with bank name and confidence
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Bank detection requires multiple pattern checks
export function detectBankFromPDF(text: string): BankDetectionResult {
	const normalizedText = text.toLowerCase();
	const firstChunk = normalizedText.substring(0, 2000); // Focus on header area

	let bestMatch: { bank: BankPattern; score: number } | null = null;

	for (const bank of SUPPORTED_BANKS) {
		let score = 0;
		let keywordsFound = 0;

		for (const keyword of bank.keywords) {
			const keywordLower = keyword.toLowerCase();

			// Check in first chunk (header area) - higher weight
			if (firstChunk.includes(keywordLower)) {
				score += 3;
				keywordsFound++;
			}
			// Check in full text - lower weight
			else if (normalizedText.includes(keywordLower)) {
				score += 1;
				keywordsFound++;
			}
		}

		// Check header patterns
		for (const pattern of bank.headerPatterns) {
			if (firstChunk.includes(pattern.toLowerCase())) {
				score += 2;
			}
		}

		// Bonus for multiple keywords found
		if (keywordsFound >= 2) {
			score += keywordsFound;
		}

		if (score > 0 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { bank, score };
		}
	}

	if (!bestMatch) {
		secureLogger.info('No bank detected from PDF', {
			component: 'pdf-extractor',
			action: 'detect-bank',
		});
		return { bank: null, confidence: 0, pattern: null };
	}

	// Calculate confidence based on score
	// Max possible score is roughly: (keywords * 3) + (patterns * 2) + bonus
	const maxPossibleScore =
		bestMatch.bank.keywords.length * 3 + bestMatch.bank.headerPatterns.length * 2 + 5;
	const confidence = Math.min(bestMatch.score / maxPossibleScore, 1);

	secureLogger.info('Bank detected from PDF', {
		component: 'pdf-extractor',
		action: 'detect-bank',
		bank: bestMatch.bank.name,
		confidence,
	});

	return {
		bank: bestMatch.bank.name,
		confidence,
		pattern: bestMatch.bank,
	};
}

// ========================================
// TEXT CLEANING
// ========================================

/**
 * Clean extracted PDF text for better parsing
 *
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanPDFText(text: string): string {
	return (
		text
			// Normalize line endings
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
			// Remove excessive whitespace within lines
			.replace(/[ \t]+/g, ' ')
			// Remove page numbers and headers that repeat
			.replace(/página\s+\d+\s+de\s+\d+/gi, '')
			.replace(/page\s+\d+\s+of\s+\d+/gi, '')
			// Preserve monetary values formatting
			.replace(/R\s*\$\s*/g, 'R$ ')
			// Remove multiple consecutive empty lines
			.replace(/\n{3,}/g, '\n\n')
			// Trim lines
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
			// Final trim
			.trim()
	);
}

/**
 * Extract transaction-like lines from PDF text
 * Useful for pre-filtering before AI processing
 *
 * @param text - Cleaned PDF text
 * @returns Lines that look like transactions
 */
export function extractTransactionLines(text: string): string[] {
	const lines = text.split('\n');
	const transactionLines: string[] = [];

	// Patterns that indicate a transaction line
	const datePatterns = [
		/\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
		/\d{2}\/\d{2}\/\d{2}/, // DD/MM/YY
		/\d{2}\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i, // DD MMM
		/\d{2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // DD MMM (EN)
	];

	const amountPattern = /R?\$?\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip empty or very short lines
		if (trimmedLine.length < 10) continue;

		// Check if line has a date pattern
		const hasDate = datePatterns.some((pattern) => pattern.test(trimmedLine));

		// Check if line has an amount
		const hasAmount = amountPattern.test(trimmedLine);

		// Transaction lines typically have both date and amount
		if (hasDate && hasAmount) {
			transactionLines.push(trimmedLine);
		}
	}

	return transactionLines;
}

/**
 * Get a preview of the PDF content (first N lines)
 *
 * @param text - Extracted text
 * @param maxLines - Maximum number of lines to return
 * @returns Preview text
 */
export function getPDFPreview(text: string, maxLines = 50): string {
	const lines = text.split('\n').filter((l) => l.trim());
	return lines.slice(0, maxLines).join('\n');
}

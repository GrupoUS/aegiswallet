/**
 * CSV Extractor - Extract and parse data from CSV bank statements
 *
 * Uses papaparse library for robust CSV parsing with auto-detection
 */

import Papa from 'papaparse';

import { type BankPattern, SUPPORTED_BANKS } from '@/lib/import/constants/bank-patterns';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface CSVExtractionResult {
	/** Parsed rows as key-value objects */
	rows: Record<string, string>[];
	/** Column headers */
	headers: string[];
	/** Detected encoding */
	encoding: string;
	/** Detected delimiter */
	delimiter: string;
	/** Total row count (excluding header) */
	rowCount: number;
}

export interface CSVColumnMapping {
	date: string | null;
	description: string | null;
	amount: string | null;
	balance: string | null;
	type: string | null;
}

export interface CSVBankDetectionResult {
	/** Detected bank name or null */
	bank: string | null;
	/** Bank pattern configuration if detected */
	pattern: BankPattern | null;
	/** Mapped columns */
	columnMapping: CSVColumnMapping;
}

// ========================================
// CSV EXTRACTION
// ========================================

/**
 * Extract and parse data from a CSV buffer
 *
 * @param buffer - CSV file as Buffer
 * @returns Parsed CSV data with headers and rows
 */
export async function extractDataFromCSV(buffer: Buffer): Promise<CSVExtractionResult> {
	const startTime = Date.now();

	try {
		secureLogger.info('Starting CSV extraction', {
			component: 'csv-extractor',
			action: 'extract',
			bufferSize: buffer.length,
		});

		// Validate buffer
		if (!buffer || buffer.length === 0) {
			throw new Error('Empty CSV buffer provided');
		}

		// Try UTF-8 first, then fall back to ISO-8859-1 (Latin-1)
		let text: string;
		let encoding = 'UTF-8';

		try {
			text = buffer.toString('utf-8');
			// Check for replacement characters that indicate encoding issues
			if (text.includes('\uFFFD')) {
				throw new Error('UTF-8 decoding issues detected');
			}
		} catch {
			text = buffer.toString('latin1');
			encoding = 'ISO-8859-1';
		}

		// Parse CSV using PapaParse
		const parseResult = Papa.parse<Record<string, string>>(text, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false, // Keep everything as strings for now
			transformHeader: (header: string) => header.trim(),
			delimitersToGuess: [',', ';', '\t', '|'],
		});

		if (parseResult.errors.length > 0) {
			const criticalErrors = parseResult.errors.filter(
				(e: { type: string }) => e.type === 'Quotes' || e.type === 'FieldMismatch',
			);
			if (criticalErrors.length > 0) {
				secureLogger.warn('CSV parsing warnings', {
					component: 'csv-extractor',
					action: 'extract',
					errorCount: criticalErrors.length,
				});
			}
		}

		const rows = parseResult.data;
		const headers = parseResult.meta.fields || [];
		const delimiter = parseResult.meta.delimiter || ',';

		// Validate structure
		if (headers.length < 2) {
			throw new Error('CSV must have at least 2 columns');
		}

		if (rows.length === 0) {
			throw new Error('CSV has no data rows');
		}

		const processingTime = Date.now() - startTime;

		secureLogger.info('CSV extraction completed', {
			component: 'csv-extractor',
			action: 'extract',
			rowCount: rows.length,
			columnCount: headers.length,
			encoding,
			delimiter,
			processingTimeMs: processingTime,
		});

		return {
			rows,
			headers,
			encoding,
			delimiter,
			rowCount: rows.length,
		};
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('CSV extraction failed', {
			component: 'csv-extractor',
			action: 'extract',
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		throw new Error(`Erro ao processar CSV: ${errorMessage}`);
	}
}

// ========================================
// BANK DETECTION FROM CSV
// ========================================

/**
 * Detect bank from CSV headers and content
 *
 * @param headers - CSV column headers
 * @param rows - First few rows of data for content analysis
 * @returns Detection result with bank and column mapping
 */
export function detectBankFromCSV(
	headers: string[],
	rows: Record<string, string>[] = [],
): CSVBankDetectionResult {
	const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
	const headerString = normalizedHeaders.join(' ');

	// Also check first few rows for bank keywords
	const sampleContent = rows
		.slice(0, 5)
		.map((row) => Object.values(row).join(' '))
		.join(' ')
		.toLowerCase();

	let bestMatch: { bank: BankPattern; score: number } | null = null;

	for (const bank of SUPPORTED_BANKS) {
		let score = 0;

		// Check bank keywords in headers and content
		for (const keyword of bank.keywords) {
			const keywordLower = keyword.toLowerCase();
			if (headerString.includes(keywordLower)) {
				score += 3;
			}
			if (sampleContent.includes(keywordLower)) {
				score += 2;
			}
		}

		// Check CSV column mapping matches
		if (bank.csvColumnMappings) {
			const mappings = bank.csvColumnMappings;
			const allMappings = [
				...mappings.date,
				...mappings.description,
				...mappings.amount,
				...(mappings.balance || []),
			];

			for (const mapping of allMappings) {
				if (normalizedHeaders.includes(mapping.toLowerCase())) {
					score += 2;
				}
			}
		}

		if (score > 0 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { bank, score };
		}
	}

	// Get column mapping
	const columnMapping = mapCSVColumns(headers, bestMatch?.bank || null);

	if (!bestMatch) {
		secureLogger.info('No bank detected from CSV', {
			component: 'csv-extractor',
			action: 'detect-bank',
		});
		return { bank: null, pattern: null, columnMapping };
	}

	secureLogger.info('Bank detected from CSV', {
		component: 'csv-extractor',
		action: 'detect-bank',
		bank: bestMatch.bank.name,
	});

	return {
		bank: bestMatch.bank.name,
		pattern: bestMatch.bank,
		columnMapping,
	};
}

// ========================================
// COLUMN MAPPING
// ========================================

/**
 * Map CSV columns to standard field names
 *
 * @param headers - CSV column headers
 * @param bankPattern - Optional bank pattern for specific mappings
 * @returns Mapped column names
 */
export function mapCSVColumns(
	headers: string[],
	bankPattern: BankPattern | null,
): CSVColumnMapping {
	const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

	// Default mapping patterns (used if no bank-specific mapping)
	const defaultMappings = {
		date: ['data', 'date', 'dt', 'data mov', 'data movimento', 'data da transação', 'dt.mov'],
		description: [
			'descrição',
			'descricao',
			'description',
			'histórico',
			'historico',
			'lançamento',
			'lancamento',
			'título',
			'titulo',
			'detalhes',
		],
		amount: ['valor', 'value', 'amount', 'valor (r$)', 'valor r$', 'débito/crédito', 'monto'],
		balance: ['saldo', 'balance', 'saldo disponível', 'saldo final', 'saldo (r$)'],
		type: ['tipo', 'type', 'd/c', 'natureza', 'entrada/saída'],
	};

	// Use bank-specific mappings if available
	const mappings = bankPattern?.csvColumnMappings || defaultMappings;

	const result: CSVColumnMapping = {
		date: null,
		description: null,
		amount: null,
		balance: null,
		type: null,
	};

	// Find matches for each field
	for (const [field, patterns] of Object.entries(mappings)) {
		for (const pattern of patterns) {
			const patternLower = pattern.toLowerCase();
			const matchIndex = normalizedHeaders.findIndex(
				(h) => h === patternLower || h.includes(patternLower),
			);

			if (matchIndex !== -1) {
				result[field as keyof CSVColumnMapping] = headers[matchIndex];
				break;
			}
		}
	}

	// Fuzzy matching fallback for date and amount (required fields)
	if (!result.date) {
		const dateIdx = normalizedHeaders.findIndex(
			(h) => h.includes('data') || h.includes('date') || h.includes('dt'),
		);
		if (dateIdx !== -1) result.date = headers[dateIdx];
	}

	if (!result.amount) {
		const amountIdx = normalizedHeaders.findIndex(
			(h) => h.includes('valor') || h.includes('value') || h.includes('amount'),
		);
		if (amountIdx !== -1) result.amount = headers[amountIdx];
	}

	if (!result.description) {
		const descIdx = normalizedHeaders.findIndex(
			(h) => h.includes('desc') || h.includes('hist') || h.includes('lanc') || h.includes('titulo'),
		);
		if (descIdx !== -1) result.description = headers[descIdx];
	}

	return result;
}

/**
 * Extract transaction data from a CSV row using column mapping
 *
 * @param row - CSV row data
 * @param mapping - Column mapping
 * @returns Extracted transaction data or null if invalid
 */
export function extractTransactionFromRow(
	row: Record<string, string>,
	mapping: CSVColumnMapping,
): {
	date: string | null;
	description: string | null;
	amount: string | null;
	balance: string | null;
	type: string | null;
	rawText: string;
} | null {
	if (!(mapping.date && mapping.amount)) {
		return null;
	}

	const date = row[mapping.date]?.trim() || null;
	const amount = row[mapping.amount]?.trim() || null;
	const description = mapping.description ? row[mapping.description]?.trim() || null : null;
	const balance = mapping.balance ? row[mapping.balance]?.trim() || null : null;
	const type = mapping.type ? row[mapping.type]?.trim() || null : null;

	// Skip rows without essential data
	if (!(date && amount)) {
		return null;
	}

	return {
		date,
		description,
		amount,
		balance,
		type,
		rawText: Object.values(row).join(' | '),
	};
}

/**
 * Convert CSV rows to a format suitable for Gemini processing
 *
 * @param rows - Parsed CSV rows
 * @param mapping - Column mapping
 * @returns Formatted text for AI processing
 */
export function formatCSVForProcessing(
	rows: Record<string, string>[],
	mapping: CSVColumnMapping,
): string {
	const lines: string[] = [];

	for (let i = 0; i < rows.length; i++) {
		const extracted = extractTransactionFromRow(rows[i], mapping);
		if (extracted) {
			lines.push(`Linha ${i + 1}: ${extracted.rawText}`);
		}
	}

	return lines.join('\n');
}

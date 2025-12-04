/**
 * Bank Detector - Automatic bank identification from statements
 *
 * Detects Brazilian banks from text content and file names
 */

import { type BankPattern, SUPPORTED_BANKS } from '@/lib/import/constants/bank-patterns';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface BankDetectionResult {
	/** Detected bank name or null */
	bank: string | null;
	/** Confidence score (0-1) */
	confidence: number;
	/** Bank pattern configuration if detected */
	pattern: BankPattern | null;
	/** Detection source */
	source: 'content' | 'filename' | 'unknown';
}

// ========================================
// MAIN DETECTION FUNCTION
// ========================================

/**
 * Detect bank from text content
 *
 * @param text - Text content from statement (PDF or CSV)
 * @param source - Source type for logging
 * @returns Detection result with bank, confidence, and pattern
 */
export function detectBank(text: string, source: 'PDF' | 'CSV'): BankDetectionResult {
	const normalizedText = text.toLowerCase();
	const headerArea = normalizedText.substring(0, 3000); // Focus on header area

	const scores: Array<{
		bank: BankPattern;
		score: number;
		keywordsFound: number;
	}> = [];

	for (const bank of SUPPORTED_BANKS) {
		let score = 0;
		let keywordsFound = 0;

		// Score keywords
		for (const keyword of bank.keywords) {
			const keywordLower = keyword.toLowerCase();

			// Header area match (higher weight)
			if (headerArea.includes(keywordLower)) {
				score += 5;
				keywordsFound++;
			}
			// Full text match (lower weight)
			else if (normalizedText.includes(keywordLower)) {
				score += 2;
				keywordsFound++;
			}
		}

		// Score header patterns
		for (const pattern of bank.headerPatterns) {
			if (headerArea.includes(pattern.toLowerCase())) {
				score += 3;
			}
		}

		// Bonus for multiple keyword matches
		if (keywordsFound >= 2) {
			score += keywordsFound * 2;
		}

		if (score > 0) {
			scores.push({ bank, score, keywordsFound });
		}
	}

	// Sort by score descending
	scores.sort((a, b) => b.score - a.score);

	if (scores.length === 0) {
		secureLogger.info('No bank detected from content', {
			component: 'bank-detector',
			action: 'detect',
			source,
		});
		return {
			bank: null,
			confidence: 0,
			pattern: null,
			source: 'unknown',
		};
	}

	const bestMatch = scores[0];

	// Calculate confidence
	// Max theoretical score depends on keywords and patterns count
	const maxScore =
		bestMatch.bank.keywords.length * 5 +
		bestMatch.bank.headerPatterns.length * 3 +
		bestMatch.bank.keywords.length * 2;
	const confidence = Math.min(bestMatch.score / maxScore, 0.99);

	// If confidence is too low, consider it unreliable
	if (confidence < 0.3) {
		secureLogger.info('Bank detection confidence too low', {
			component: 'bank-detector',
			action: 'detect',
			source,
			bank: bestMatch.bank.name,
			confidence,
		});
		return {
			bank: null,
			confidence,
			pattern: null,
			source: 'unknown',
		};
	}

	secureLogger.info('Bank detected', {
		component: 'bank-detector',
		action: 'detect',
		source,
		bank: bestMatch.bank.name,
		confidence,
		keywordsFound: bestMatch.keywordsFound,
	});

	return {
		bank: bestMatch.bank.name,
		confidence,
		pattern: bestMatch.bank,
		source: 'content',
	};
}

// ========================================
// BANK CONFIG LOOKUP
// ========================================

/**
 * Get bank configuration by name
 *
 * @param bankName - Bank name (case-insensitive)
 * @returns Bank pattern or null
 */
export function getBankConfig(bankName: string): BankPattern | null {
	const normalized = bankName.toLowerCase().trim();

	for (const bank of SUPPORTED_BANKS) {
		if (bank.name.toLowerCase() === normalized) {
			return bank;
		}

		// Also check if any keyword matches exactly
		for (const keyword of bank.keywords) {
			if (keyword.toLowerCase() === normalized) {
				return bank;
			}
		}
	}

	return null;
}

// ========================================
// FILENAME DETECTION
// ========================================

/**
 * Suggest bank from filename
 *
 * @param fileName - Original file name
 * @returns Bank name or null
 */
export function suggestBankFromFilename(fileName: string): string | null {
	const normalizedName = fileName.toLowerCase();

	for (const bank of SUPPORTED_BANKS) {
		for (const keyword of bank.keywords) {
			const keywordLower = keyword.toLowerCase();

			// Check if keyword appears in filename
			// Use word boundaries to avoid false matches
			const wordPattern = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`);
			if (wordPattern.test(normalizedName)) {
				secureLogger.debug('Bank suggested from filename', {
					component: 'bank-detector',
					action: 'suggest-from-filename',
					bank: bank.name,
					fileName,
				});
				return bank.name;
			}
		}
	}

	return null;
}

// ========================================
// COMBINED DETECTION
// ========================================

/**
 * Detect bank using multiple signals
 *
 * @param text - Text content
 * @param fileName - Original file name
 * @param source - Source type
 * @returns Combined detection result
 */
export function detectBankCombined(
	text: string,
	fileName: string,
	source: 'PDF' | 'CSV',
): BankDetectionResult {
	// Try content detection first (most reliable)
	const contentResult = detectBank(text, source);

	if (contentResult.bank && contentResult.confidence >= 0.5) {
		return contentResult;
	}

	// Fall back to filename detection
	const filenameBank = suggestBankFromFilename(fileName);

	if (filenameBank) {
		const pattern = getBankConfig(filenameBank);
		return {
			bank: filenameBank,
			confidence: 0.4, // Lower confidence for filename-only detection
			pattern,
			source: 'filename',
		};
	}

	// Return content result even if low confidence (might help user)
	if (contentResult.bank) {
		return contentResult;
	}

	return {
		bank: null,
		confidence: 0,
		pattern: null,
		source: 'unknown',
	};
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get list of supported bank names
 */
export function getSupportedBankNames(): string[] {
	return SUPPORTED_BANKS.map((bank) => bank.name);
}

/**
 * Check if a bank is supported
 */
export function isBankSupported(bankName: string): boolean {
	return getBankConfig(bankName) !== null;
}

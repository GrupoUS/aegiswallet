/**
 * Date Validation Utilities
 *
 * Provides safe date parsing and validation for Brazilian locale
 * Handles invalid dates gracefully without throwing errors
 */

/**
 * Safely parse a date string, returning null for invalid dates
 * instead of throwing an error
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
	if (!dateString) return null;

	const date = new Date(dateString);

	// Check if date is valid
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	// Check for reasonable date range (not too old or too far in future)
	const now = new Date();
	const minDate = new Date('2000-01-01');
	const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years in future

	if (date < minDate || date > maxDate) {
		return null;
	}

	return date;
}

/**
 * Validates if a date string is in a valid format
 * Accepts common Brazilian formats: DD/MM/YYYY, YYYY-MM-DD, etc.
 */
export function isValidDateString(dateString: string): boolean {
	if (!dateString) return false;

	// Common Brazilian date formats
	const patterns = [
		/^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
		/^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, // ISO 8601
	];

	return patterns.some((pattern) => pattern.test(dateString));
}

/**
 * Format a date safely, returning a fallback string for invalid dates
 */
export function safeFormatDate(
	date: Date | null | undefined,
	_format: string,
	fallback = 'Data inválida',
): string {
	if (!date || Number.isNaN(date.getTime())) {
		return fallback;
	}

	try {
		// Use Intl.DateTimeFormat for Brazilian locale
		return new Intl.DateTimeFormat('pt-BR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).format(date);
	} catch {
		return fallback;
	}
}

/**
 * Get start of day in Brazilian timezone
 */
export function getStartOfDay(date: Date): Date {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	return start;
}

/**
 * Get end of day in Brazilian timezone
 */
export function getEndOfDay(date: Date): Date {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date | null, endDate: Date | null): boolean {
	if (startDate && date < startDate) return false;
	if (endDate && date > endDate) return false;
	return true;
}

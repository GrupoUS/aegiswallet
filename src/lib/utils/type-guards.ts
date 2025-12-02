/**
 * Type Guards Utility for AegisWallet
 *
 * LGPD Compliance: These type guards ensure type safety and prevent runtime errors
 * that could expose sensitive financial or personal data.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

/**
 * Generic type guard for non-null values
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

/**
 * Type guard for valid numbers (financial amounts)
 */
export function isValidAmount(value: unknown): value is number {
	return typeof value === 'number' && !Number.isNaN(value) && value >= 0;
}

/**
 * Type guard for valid dates
 */
export function isValidDate(value: unknown): value is Date {
	return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for calendar events
 */
export function isValidCalendarEvent(event: unknown): event is {
	title: string;
	start: Date;
	end: Date;
	[key: string]: unknown;
} {
	return !!(
		event &&
		typeof event === 'object' &&
		'title' in event &&
		typeof event.title === 'string' &&
		'start' in event &&
		event.start instanceof Date &&
		'end' in event &&
		event.end instanceof Date
	);
}

/**
 * Type guard for financial voice parameters
 */
export function isValidFinancialVoiceParameters(params: unknown): params is {
	amount?: number;
	recipient?: string;
	category?: string;
	date?: Date;
	[key: string]: unknown;
} {
	return (
		typeof params === 'object' &&
		params !== null &&
		(!('amount' in params) || typeof params.amount === 'number') &&
		(!('recipient' in params) || typeof params.recipient === 'string') &&
		(!('category' in params) || typeof params.category === 'string') &&
		(!('date' in params) || params.date instanceof Date)
	);
}

/**
 * Type guard for calendar voice parameters
 */
export function isValidCalendarVoiceParameters(params: unknown): params is {
	title?: string;
	date?: Date;
	duration?: number;
	location?: string;
	[key: string]: unknown;
} {
	return (
		typeof params === 'object' &&
		params !== null &&
		(!('title' in params) || typeof params.title === 'string') &&
		(!('date' in params) || params.date instanceof Date) &&
		(!('duration' in params) || typeof params.duration === 'number') &&
		(!('location' in params) || typeof params.location === 'string')
	);
}

/**
 * Type guard for strings with minimum length
 */
export function isValidString(value: unknown, minLength = 1): value is string {
	return typeof value === 'string' && value.length >= minLength;
}

/**
 * Type guard for email validation
 */
export function isValidEmail(email: unknown): email is string {
	if (typeof email !== 'string') return false;

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Type guard for Brazilian CPF validation
 */
export function isValidCPF(cpf: unknown): cpf is string {
	if (typeof cpf !== 'string') return false;

	// Remove non-digit characters for validation
	const cleanCPF = cpf.replace(/\D/g, '');

	// CPF must have exactly 11 digits
	if (cleanCPF.length !== 11) return false;

	// All digits must be the same (CPF validation rule)
	const digits = cleanCPF.split('');
	if (digits.length !== 11) return false;

	const firstDigit = digits[0];
	const allSame = digits.every((digit) => digit === firstDigit);

	return allSame;
}

/**
 * Type guard for Brazilian phone number validation
 */
export function isValidBrazilianPhone(phone: unknown): phone is string {
	if (typeof phone !== 'string') return false;

	// Remove common formatting characters
	const cleanPhone = phone.replace(/\D/g, '');

	// Brazilian mobile numbers should have 11 digits (with DDD) or 10 digits (landline)
	if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;

	// Must be all digits
	return /^\d+$/.test(cleanPhone);
}

/**
 * Type guard for API responses
 */
export function isValidApiResponse<T>(
	response: unknown,
): response is { data: T; success: boolean } {
	return (
		typeof response === 'object' &&
		response !== null &&
		'data' in response &&
		'success' in response &&
		typeof response.success === 'boolean'
	);
}

/**
 * Type guard for user objects
 */
export function isValidUser(user: unknown): user is { id: string; email: string; name: string } {
	return (
		typeof user === 'object' &&
		user !== null &&
		'id' in user &&
		typeof user.id === 'string' &&
		'email' in user &&
		typeof user.email === 'string' &&
		'name' in user &&
		typeof user.name === 'string'
	);
}

/**
 * Safe type assertion with fallback
 */
export function safeTypeAssertion<T>(
	value: unknown,
	fallback: T,
	validator: (value: unknown) => value is T,
): T {
	if (validator(value)) {
		return value as T;
	}
	return fallback;
}

/**
 * Type guard for chart items
 */
export function isValidChartItem(item: unknown): item is { date: string | Date; balance: number } {
	return (
		typeof item === 'object' &&
		item !== null &&
		'date' in item &&
		'balance' in item &&
		(typeof (item as any).date === 'string' || (item as any).date instanceof Date) &&
		typeof (item as any).balance === 'number'
	);
}

/**
 * Safe property access with fallback
 */
export function safePropertyAccess<T extends Record<string, unknown>, K extends keyof T>(
	obj: T | null | undefined,
	key: K,
	fallback: T[K],
): T[K] {
	if (obj && obj !== null && key in obj) {
		return obj[key];
	}
	return fallback;
}

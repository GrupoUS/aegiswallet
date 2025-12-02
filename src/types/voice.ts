/**
 * Voice Command Type Definitions for AegisWallet
 *
 * LGPD Compliance: These types ensure type safety for voice processing
 * and prevent accidental exposure of sensitive user data.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

/**
 * Financial voice command parameters
 */
export interface FinancialVoiceParameters {
	amount?: number;
	recipient?: string;
	category?: string;
	date?: Date;
	description?: string;
}

/**
 * Calendar voice command parameters
 */
export interface CalendarVoiceParameters {
	title?: string;
	date?: Date;
	duration?: number;
	location?: string;
	description?: string;
}

/**
 * Generic voice command interface
 */
export interface VoiceCommand<T = Record<string, unknown>> {
	intent: string;
	parameters?: T;
	confidence: number;
	timestamp: Date;
}

/**
 * Voice response interface
 */
export interface VoiceResponse {
	text: string;
	audioUrl?: string;
	success: boolean;
	errorMessage?: string;
}

/**
 * Voice recognition result interface
 */
export interface VoiceRecognitionResult {
	command: VoiceCommand;
	confidence: number;
	alternatives?: VoiceCommand[];
	processingTime: number;
}

/**
 * Type guard for voice command validation
 */
export function isValidVoiceCommand<T>(command: unknown): command is VoiceCommand<T> {
	return (
		typeof command === 'object' &&
		command !== null &&
		'intent' in command &&
		typeof command.intent === 'string' &&
		'confidence' in command &&
		typeof command.confidence === 'number' &&
		'timestamp' in command &&
		command.timestamp instanceof Date
	);
}

/**
 * Type guard for financial voice parameters
 */
export function isValidFinancialVoiceParameters(params: unknown): params is FinancialVoiceParameters {
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
export function isValidCalendarVoiceParameters(params: unknown): params is CalendarVoiceParameters {
	return (
		typeof params === 'object' &&
		params !== null &&
		(!('title' in params) || typeof params.title === 'string') &&
		(!('date' in params) || params.date instanceof Date) &&
		(!('duration' in params) || typeof params.duration === 'number') &&
		(!('location' in params) || typeof params.location === 'string')
	);
}

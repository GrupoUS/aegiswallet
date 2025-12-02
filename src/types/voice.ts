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
export function isValidFinancialVoiceParameters(
	params: unknown,
): params is FinancialVoiceParameters {
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

// ============================================================================
// Voice Error Types (CRITICAL SECURITY RESTORED)
// ============================================================================

/**
 * Voice error codes for structured error handling
 */
export type VoiceErrorCode =
	| 'MICROPHONE_DENIED'
	| 'MICROPHONE_NOT_FOUND'
	| 'NETWORK_ERROR'
	| 'SPEECH_NOT_SUPPORTED'
	| 'RECOGNITION_TIMEOUT'
	| 'AUDIO_QUALITY_LOW'
	| 'CONFIDENCE_LOW'
	| 'INPUT_VALIDATION_FAILED'
	| 'LGPD_CONSENT_REQUIRED'
	| 'RATE_LIMIT_EXCEEDED'
	| 'UNKNOWN_ERROR';

/**
 * Voice error interface for structured error handling
 */
export interface VoiceError {
	code: VoiceErrorCode;
	message: string;
	isRetryable: boolean;
	suggestion?: string;
	timestamp: Date;
	context?: {
		command?: string;
		confidence?: number;
		audioQuality?: number;
	};
}

// ============================================================================
// Input Validation and Sanitization (SECURITY)
// ============================================================================

/**
 * Enhanced financial voice parameters with security validation
 */
export interface SecureFinancialVoiceParameters {
	amount?: number;
	recipient?: string;
	category?: string;
	date?: Date;
	description?: string;
	// Security constraints
	maxAmount?: number;
	currency?: string; // Default: BRL
	requiresConfirmation?: boolean;
}

/**
 * LGPD consent types for voice data processing
 */
export interface LGPDConsent {
	dataProcessing: boolean;
	voiceStorage: boolean;
	thirdPartySharing: boolean;
	timestamp: Date;
	ipAddress: string;
	userAgent: string;
}

/**
 * Voice command with enhanced security and LGPD compliance
 */
export interface SecureVoiceCommand<T = Record<string, unknown>> {
	intent: string;
	parameters?: T;
	confidence: number;
	timestamp: Date;
	// Security fields
	sessionId: string;
	userId?: string;
	lgpdConsent?: LGPDConsent;
	rateLimitInfo?: {
		attempts: number;
		windowMs: number;
		maxAttempts: number;
	};
}

/**
 * Voice response with security context
 */
export interface SecureVoiceResponse extends VoiceResponse {
	// Security fields
	sessionId: string;
	errorCode?: VoiceErrorCode;
	securityContext?: {
		inputSanitized: boolean;
		lgpdCompliant: boolean;
		rateLimited: boolean;
	};
}

// ============================================================================
// Security Validation Functions
// ============================================================================

/**
 * Validate and sanitize voice command input
 */
export function validateVoiceInput(input: string): {
	isValid: boolean;
	sanitized?: string;
	error?: VoiceError;
} {
	if (!input || typeof input !== 'string') {
		return {
			isValid: false,
			error: {
				code: 'INPUT_VALIDATION_FAILED',
				message: 'Invalid input: input must be a non-empty string',
				isRetryable: true,
				suggestion: 'Por favor, fale claramente',
				timestamp: new Date(),
			},
		};
	}

	// Remove potential injection attempts
	const sanitized = input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
		.trim()
		.substring(0, 500); // Limit input length

	if (!sanitized || sanitized.length < 2) {
		return {
			isValid: false,
			error: {
				code: 'INPUT_VALIDATION_FAILED',
				message: 'Input too short after sanitization',
				isRetryable: true,
				suggestion: 'Por favor, forneça um comando mais completo',
				timestamp: new Date(),
			},
		};
	}

	return { isValid: true, sanitized };
}

/**
 * Validate financial amount with BCB limits
 */
export function validateFinancialAmount(amount: number): { isValid: boolean; error?: VoiceError } {
	const TRANSACTION_LIMIT = 5000; // R$ 5.000 per transaction limit

	if (Number.isNaN(amount) || amount <= 0) {
		return {
			isValid: false,
			error: {
				code: 'INPUT_VALIDATION_FAILED',
				message: 'Amount must be a positive number',
				isRetryable: true,
				suggestion: 'Por favor, informe um valor válido',
				timestamp: new Date(),
			},
		};
	}

	if (amount > TRANSACTION_LIMIT) {
		return {
			isValid: false,
			error: {
				code: 'INPUT_VALIDATION_FAILED',
				message: `Amount exceeds per-transaction limit of R$ ${TRANSACTION_LIMIT.toLocaleString('pt-BR')}`,
				isRetryable: true,
				suggestion: `Por favor, informe um valor até R$ ${TRANSACTION_LIMIT.toLocaleString('pt-BR')}`,
				timestamp: new Date(),
			},
		};
	}

	return { isValid: true };
}

/**
 * Enhanced type guard for secure financial voice parameters
 */
export function isValidSecureFinancialVoiceParameters(
	params: unknown,
): params is SecureFinancialVoiceParameters {
	if (typeof params !== 'object' || params === null) return false;

	const p = params as Record<string, unknown>;

	// Amount validation with limits
	if ('amount' in p && typeof p.amount === 'number') {
		const amountValidation = validateFinancialAmount(p.amount);
		if (!amountValidation.isValid) return false;
	}

	// Required field validation
	if ('recipient' in p && typeof p.recipient === 'string') {
		if (p.recipient.length < 3 || p.recipient.length > 100) return false;
		// Basic CPF/CNPJ validation for Brazilian recipients
		if (
			!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(
				p.recipient.replace(/\D/g, ''),
			)
		) {
			return false; // Invalid CPF/CNPJ format
		}
	}

	return true;
}

// ============================================================================
// Brazilian Regional Support & Accessibility (RESTORED)
// ============================================================================

/**
 * Brazilian Portuguese regional types for accessibility
 */
export type BrazilianRegion =
	| 'pt-BR' // Padrão brasileiro
	| 'pt-BR-SP' // São Paulo
	| 'pt-BR-RJ' // Rio de Janeiro
	| 'pt-BR-NE' // Nordeste
	| 'pt-BR-SUL'; // Sul

/**
 * Regional accent configuration for accessibility
 */
export interface RegionalAccent {
	region: BrazilianRegion;
	name: string;
	characteristics: string[];
	commonPhrases: string[];
	accessibilityFeatures: {
		supported: boolean;
		noiseTolerance: number;
		confidenceThreshold: number;
	};
}

/**
 * Audio configuration for accessibility compliance (WCAG 2.1 AA+)
 */
export interface AudioConfig {
	sampleRate: number;
	channels: number;
	bitDepth: number;
	format: 'webm' | 'wav' | 'mp3' | 'ogg';
	// Accessibility features
	noiseReduction: boolean;
	automaticGainControl: boolean;
	echoCancellation: boolean;
}

/**
 * Noise detection for users with speech impairments
 */
export interface NoiseDetectionResult {
	hasNoise: boolean;
	noiseLevel: number; // 0-1
	noiseType: 'background' | 'white' | 'pink' | 'impulse';
	recommendedAction: 'proceed' | 'retry' | 'adjust';
	accessibilityImpact: 'none' | 'moderate' | 'severe';
}

/**
 * Performance metrics with accessibility tracking
 */
export interface VoicePerformanceMetrics {
	totalRecognitions: number;
	successfulRecognitions: number;
	averageResponseTime: number;
	averageConfidence: number;
	fallbackUsage: number;
	successRate: number;
	fallbackRate: number;
	regionalAccuracy: Record<BrazilianRegion, number>;
	// Accessibility metrics
	accessibilitySuccessRate: number;
	disabledUserSuccessRate: number;
	voiceImpairmentAccommodation: number;
}

/**
 * Performance thresholds with accessibility considerations
 */
export interface PerformanceThresholds {
	maxResponseTime: number; // milliseconds
	minConfidence: number; // 0-1
	minSuccessRate: number; // 0-1
	maxFallbackRate: number; // 0-1
	// Accessibility thresholds
	accessibilityMinSuccessRate: number;
	voiceImpairmentMinAccuracy: number;
	regionalMinAccuracy: number;
}

/**
 * Voice configuration with Brazilian compliance and accessibility
 */
export interface VoiceConfig {
	language: string;
	region: BrazilianRegion;
	confidenceThreshold: number;
	enableFallback: boolean;
	enableContinuousRecognition: boolean;
	performanceThresholds: PerformanceThresholds;
	audioConfig: AudioConfig;
	// Accessibility & Brazilian features
	enableRegionalAccommodation: boolean;
	enableAccessibilityMode: boolean;
	lgpdCompliant: boolean;
}

/**
 * Essential voice commands with Brazilian Portuguese examples
 */
export const ESSENTIAL_VOICE_COMMANDS = [
	{
		command: 'saldo',
		examples: ['qual o meu saldo', 'quanto tenho na conta', 'ver saldo'],
		intent: 'balance_query' as const,
		keywords: ['saldo', 'tenho', 'conta', 'disponível'],
		regionalVariants: {
			'pt-BR-SP': ['qual meu saldo', 'quanto tenho'],
			'pt-BR-RJ': ['meu saldo', 'quanto grana'],
			'pt-BR-NE': ['meu saldo', 'quanto tenho'],
			'pt-BR-SUL': ['qual o saldo', 'quanto tenho na conta'],
		},
	},
	{
		command: 'transferir',
		examples: ['transferir dinheiro', 'fazer pix', 'enviar valor'],
		intent: 'transfer_query' as const,
		keywords: ['transferir', 'pix', 'enviar', 'mandar'],
		regionalVariants: {
			'pt-BR-SP': ['fazer pix', 'manda grana'],
			'pt-BR-RJ': ['manda dinheiro', 'faz pix'],
			'pt-BR-NE': ['manda valor', 'transfere'],
			'pt-BR-SUL': ['transferir', 'enviar'],
		},
	},
	{
		command: 'pagar',
		examples: ['pagar conta', 'fazer pagamento', 'pagar boleto'],
		intent: 'payment_query' as const,
		keywords: ['pagar', 'conta', 'boleto', 'fatura'],
		regionalVariants: {
			'pt-BR-SP': ['paga conta', 'faz pagamento'],
			'pt-BR-RJ': ['paga boleto', 'faz o pagamento'],
			'pt-BR-NE': ['paga a conta', 'faz pagamento'],
			'pt-BR-SUL': ['pagar conta', 'realizar pagamento'],
		},
	},
	{
		command: 'extrato',
		examples: ['ver extrato', 'movimentações', 'consultar extrato'],
		intent: 'statement_query' as const,
		keywords: ['extrato', 'movimentações', 'lançamentos', 'consultar'],
		regionalVariants: {
			'pt-BR-SP': ['meu extrato', 'ver movimentações'],
			'pt-BR-RJ': ['extrato', 'meus lançamentos'],
			'pt-BR-NE': ['ver extrato', 'movimentações'],
			'pt-BR-SUL': ['consultar extrato', 'lançamentos'],
		},
	},
	{
		command: 'investir',
		examples: ['investir dinheiro', 'aplicações', 'rendimentos'],
		intent: 'investment_query' as const,
		keywords: ['investir', 'aplicar', 'aplicações', 'rendimento'],
		regionalVariants: {
			'pt-BR-SP': ['aplicar dinheiro', 'meus investimentos'],
			'pt-BR-RJ': ['investir', 'minhas aplicações'],
			'pt-BR-NE': ['aplicar', 'rendimentos'],
			'pt-BR-SUL': ['investir', 'aplicações financeiras'],
		},
	},
	{
		command: 'ajuda',
		examples: ['o que posso fazer', 'ajuda', 'comandos disponíveis'],
		intent: 'help_query' as const,
		keywords: ['ajuda', 'comandos', 'posso fazer', 'disponível'],
		regionalVariants: {
			'pt-BR-SP': ['me ajuda', 'o que faz'],
			'pt-BR-RJ': ['ajuda aí', 'comandos'],
			'pt-BR-NE': ['ajuda', 'o que posso falar'],
			'pt-BR-SUL': ['ajuda', 'funcionalidades'],
		},
	},
] as const;

/**
 * Default voice configuration with Brazilian compliance and accessibility
 */
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
	audioConfig: {
		bitDepth: 16,
		channels: 1,
		format: 'webm',
		sampleRate: 16000,
		noiseReduction: true,
		automaticGainControl: true,
		echoCancellation: true,
	},
	confidenceThreshold: 0.85,
	enableContinuousRecognition: false,
	enableFallback: true,
	language: 'pt-BR',
	region: 'pt-BR',
	performanceThresholds: {
		maxResponseTime: 1000, // 1 second
		minConfidence: 0.85,
		minSuccessRate: 0.95,
		maxFallbackRate: 0.1,
		accessibilityMinSuccessRate: 0.9,
		voiceImpairmentMinAccuracy: 0.8,
		regionalMinAccuracy: 0.85,
	},
	enableRegionalAccommodation: true,
	enableAccessibilityMode: true,
	lgpdCompliant: true,
};

// ============================================================================
// Speech Recognition Types (RESTORED for Accessibility)
// ============================================================================

/**
 * Speech recognition event types for accessibility
 */
export interface SpeechRecognitionEvent {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

export interface SpeechRecognitionResultList {
	length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
	isFinal: boolean;
	length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

export interface SpeechRecognitionErrorEvent {
	error: string;
	message: string;
	errorCode?: number;
}

// ============================================================================
// Browser API Extensions (TypeScript Augmentation)
// ============================================================================

declare global {
	interface Window {
		speechRecognition: SpeechRecognitionConstructor;
		webkitSpeechRecognition: SpeechRecognitionConstructor;
	}
}

/**
 * Speech recognition constructor interface
 */
export interface SpeechRecognitionConstructor {
	new (): SpeechRecognitionInstance;
}

/**
 * Speech recognition instance interface
 */
export interface SpeechRecognitionInstance {
	grammars: SpeechGrammarList;
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	serviceURI: string;

	start(): void;
	stop(): void;
	abort(): void;

	onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onsoundstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onspeechstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onspeechend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onsoundend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onaudioend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
	onnomatch: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
	onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
	onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

/**
 * Speech grammar list interface
 */
export interface SpeechGrammarList {
	length: number;
	item(index: number): SpeechGrammar;
	[index: number]: SpeechGrammar;
	addFromString(string: string, weight?: number): void;
	addFromURI(src: string, weight?: number): void;
}

/**
 * Speech grammar interface
 */
export interface SpeechGrammar {
	src: string;
	weight: number;
}

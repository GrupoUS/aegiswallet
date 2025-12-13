/**
 * AI SDK Compatibility Types
 *
 * Provides missing type definitions for AI components
 * that were available in newer SDK versions
 */

// ========================================
// MISSING TYPE DEFINITIONS
// ========================================

/**
 * Tool UI Part - represents a tool invocation in the UI
 */
export interface ToolUIPart {
	type: 'tool';
	toolInvocationId: string;
	toolName: string;
	args: Record<string, unknown>;
	result?: unknown;
	state: 'call' | 'result' | 'error' | 'input-streaming' | 'output-available' | 'input-available';
	error?: unknown;
	input?: string;
	output?: unknown;
	errorText?: string;
}

/**
 * File UI Part - represents a file in the UI
 */
export interface FileUIPart {
	type: 'file';
	data: string | ArrayBuffer;
	mimeType: string;
	mediaType?: string;
	filename?: string;
	url?: string;
}

/**
 * UI Message - represents a chat message
 */
export interface UIMessage {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	parts?: (ToolUIPart | FileUIPart)[];
	createdAt?: Date;
	input?: string;
	output?: string;
	errorText?: string;
}

/**
 * Generated Image - represents an AI-generated image
 */
export interface ExperimentalGeneratedImage {
	url: string;
	width: number;
	height: number;
	mimeType: string;
	base64?: string;
	uint8Array?: Uint8Array;
	mediaType?: string;
}

/**
 * Default Chat Transport - interface for chat transport
 */
export interface DefaultChatTransport {
	send: (messages: UIMessage[]) => Promise<void>;
	subscribe: (callback: (message: UIMessage) => void) => void;
}

/**
 * Image Props - interface for image properties
 */
export interface ImageProps {
	url: string;
	base64?: string;
	uint8Array?: Uint8Array;
	mediaType?: string;
	width?: number;
	height?: number;
}

// ========================================
// LANGUAGE MODEL USAGE COMPATIBILITY
// ========================================

/**
 * Compatible Language Model Usage
 * Handles different usage property names across SDK versions
 */
export interface CompatibleLanguageModelUsage {
	promptTokens?: number;
	inputTokens?: number;
	completionTokens?: number;
	outputTokens?: number;
	reasoningTokens?: number;
	cachedInputTokens?: number;
	totalTokens?: number;
}

/**
 * Maps language model usage between different SDK versions
 */
export function mapLanguageModelUsage(
	usage: Record<string, number | undefined>,
): CompatibleLanguageModelUsage {
	return {
		promptTokens: usage.promptTokens || usage.inputTokens || 0,
		inputTokens: usage.inputTokens || usage.promptTokens || 0,
		completionTokens: usage.completionTokens || usage.outputTokens || 0,
		outputTokens: usage.outputTokens || usage.completionTokens || 0,
		reasoningTokens: usage.reasoningTokens || 0,
		cachedInputTokens: usage.cachedInputTokens || 0,
		totalTokens: usage.totalTokens || 0,
	};
}

// ========================================
// BRAZILIAN FINANCIAL VALIDATION
// ========================================

export const brazilianSchemas = {
	pixKey: {
		validate: (key: string) => key.length === 36 && /^[0-9a-f-]+$/.test(key),
		error: 'Chave PIX inválida - deve ter 36 caracteres hexadecimais',
	},

	cnpj: {
		validate: (cnpj: string) => /^\d{14}$/.test(cnpj),
		error: 'CNPJ inválido - deve ter 14 dígitos numéricos',
	},

	cpf: {
		validate: (cpf: string) => /^\d{11}$/.test(cpf),
		error: 'CPF inválido - deve ter 11 dígitos numéricos',
	},

	pixAmount: {
		validate: (amount: number) => amount > 0 && amount <= 5000,
		error: 'Valor PIX inválido - deve ser positivo e máximo R$ 5.000,00',
	},
};

export const errorMessages = {
	pixLimitExceeded: (amount: number) =>
		`Valor R$ ${amount.toFixed(2)} excede o limite diário de PIX (R$ 5.000,00) estabelecido pelo BCB`,

	invalidPixKey: (key: string) =>
		`Chave PIX "${key}" é inválida. Verifique o formato e tente novamente.`,

	lgpdRequired: (operation: string) =>
		`Operação "${operation}" requer consentimento explícito conforme LGPD`,

	authenticationRequired: () =>
		'Esta operação requer autenticação adicional por medida de segurança',
};

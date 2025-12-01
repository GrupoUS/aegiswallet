import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useState } from 'react';

import { logger } from '@/lib/logging/logger';

// AI Error Types for Brazilian compliance
interface AIStreamError {
	code:
		| 'NETWORK_ERROR'
		| 'AUTH_ERROR'
		| 'RATE_LIMIT'
		| 'INVALID_INPUT'
		| 'SERVICE_UNAVAILABLE'
		| 'UNKNOWN_ERROR';
	message: string;
	portugueseMessage: string;
	details?: Record<string, unknown>;
	timestamp: string;
	userId?: string;
}

interface AIErrorContext {
	userId?: string;
	provider?: string;
	tier?: string;
	sessionId?: string;
}

// Type guard for AI errors
function isAIError(error: unknown): error is AIStreamError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		'message' in error &&
		'portugueseMessage' in error &&
		'timestamp' in error
	);
}

// Create typed AI error with Brazilian Portuguese messages
function createAIError(
	code: AIStreamError['code'],
	originalError: unknown,
	context?: AIErrorContext,
): AIStreamError {
	const timestamp = new Date().toISOString();

	const errorMessages = {
		NETWORK_ERROR: {
			message: 'Network connection failed',
			portugueseMessage: 'Falha na conexão de rede',
		},
		AUTH_ERROR: {
			message: 'Authentication failed',
			portugueseMessage: 'Falha na autenticação',
		},
		RATE_LIMIT: {
			message: 'Rate limit exceeded',
			portugueseMessage: 'Limite de taxa excedido',
		},
		INVALID_INPUT: {
			message: 'Invalid input provided',
			portugueseMessage: 'Entrada inválida fornecida',
		},
		SERVICE_UNAVAILABLE: {
			message: 'AI service temporarily unavailable',
			portugueseMessage: 'Serviço de IA temporariamente indisponível',
		},
		UNKNOWN_ERROR: {
			message: 'Unknown AI service error',
			portugueseMessage: 'Erro desconhecido no serviço de IA',
		},
	};

	const messages = errorMessages[code] || errorMessages.UNKNOWN_ERROR;

	return {
		code,
		message: messages.message,
		portugueseMessage: messages.portugueseMessage,
		details: {
			originalError: originalError instanceof Error ? originalError.message : String(originalError),
			context,
		},
		timestamp,
		userId: context?.userId,
	};
}

interface UseAIChatOptions {
	provider?: 'openai' | 'anthropic' | 'google';
	tier?: 'default' | 'fast';
}

export function useAIChat(options: UseAIChatOptions = {}) {
	const [provider, setProvider] = useState(options.provider ?? 'google');
	const [tier, setTier] = useState(options.tier ?? 'default');

	const chat = useChat({
		transport: new DefaultChatTransport({
			api: '/api/v1/ai/chat',
			body: () => ({
				provider,
				tier,
			}),
		}),
		onError: (error: unknown) => {
			// Type-safe error handling with Brazilian compliance
			const aiError = isAIError(error)
				? error
				: createAIError('UNKNOWN_ERROR', error, {
						provider,
						tier,
					});

			// Log with LGPD-compliant structured logging
			logger.error('AI Chat Error', {
				code: aiError.code,
				message: aiError.message,
				portugueseMessage: aiError.portugueseMessage,
				timestamp: aiError.timestamp,
				userId: aiError.userId,
				provider,
				tier,
				// Redact sensitive details for compliance
				details: aiError.details ? { ...aiError.details, originalError: '[REDACTED]' } : undefined,
			});

			// Could emit error event for UI handling
			// emitAIError(aiError);
		},
	});

	const switchProvider = useCallback((newProvider: 'openai' | 'anthropic' | 'google') => {
		setProvider(newProvider);
	}, []);

	const switchTier = useCallback((newTier: 'default' | 'fast') => {
		setTier(newTier);
	}, []);

	return {
		...chat,
		provider,
		tier,
		switchProvider,
		switchTier,
	};
}

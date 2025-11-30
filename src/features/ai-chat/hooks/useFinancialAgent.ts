import { useMemo } from 'react';

import { createFinancialAgentFromEnv } from '../agent';
import type { ChatBackend, ModelInfo } from '../domain/ChatBackend';
import type {
	ChatMessage,
	ChatRequestOptions,
	ChatStreamChunk,
} from '../domain/types';
import {
	type UseChatControllerOptions,
	type UseChatControllerReturn,
	useChatController,
} from './useChatController';

/**
 * Noop backend for when agent is unavailable
 * Returns an error message explaining why the agent is disabled
 */
class NoopChatBackend implements ChatBackend {
	private errorMessage: string;

	constructor(errorMessage: string) {
		this.errorMessage = errorMessage;
	}

	async *send(
		_messages: ChatMessage[],
		_options?: ChatRequestOptions,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		yield {
			type: 'error',
			payload: {
				code: 'AGENT_UNAVAILABLE',
				message: this.errorMessage,
			},
		};
		yield { type: 'done', payload: null };
	}

	abort(): void {
		// No-op
	}

	getModelInfo(): ModelInfo {
		return {
			id: 'noop',
			name: 'Unavailable',
			provider: 'none',
			capabilities: {
				streaming: false,
				multimodal: false,
				tools: false,
				reasoning: false,
			},
		};
	}
}

export interface UseFinancialAgentOptions
	extends Omit<UseChatControllerOptions, never> {
	/** Clerk user ID */
	userId: string;
	/** Optional model override */
	model?: string;
	/** Whether the agent is enabled (default: true) */
	enabled?: boolean;
}

/**
 * Hook for using the Financial Agent in React components
 *
 * Wraps useChatController with Financial Agent backend configuration
 *
 * @example
 * ```tsx
 * const { user } = useUser(); // from Clerk
 * const {
 *   messages,
 *   sendMessage,
 *   isStreaming,
 * } = useFinancialAgent({
 *   userId: user.id,
 *   enableReasoningView: false,
 * });
 * ```
 */
export function useFinancialAgent(
	options: UseFinancialAgentOptions,
): UseChatControllerReturn {
	const { userId, model, enabled = true, ...chatOptions } = options;

	// Create backend or noop fallback - always returns a valid ChatBackend
	const backend = useMemo((): ChatBackend => {
		if (!enabled) {
			return new NoopChatBackend('O agente financeiro está desativado.');
		}
		if (!userId) {
			return new NoopChatBackend('Usuário não autenticado.');
		}
		try {
			return createFinancialAgentFromEnv(userId, model);
		} catch {
			// Agent creation failed - likely missing API key
			return new NoopChatBackend(
				'Agente financeiro indisponível - chave da API não configurada.',
			);
		}
	}, [userId, model, enabled]);

	// Use the chat controller with the agent backend (always called unconditionally)
	return useChatController(backend, {
		...chatOptions,
		systemPrompt: undefined, // Agent has its own system prompt
	});
}

/**
 * Check if Financial Agent is available
 */
export function isFinancialAgentAvailable(): boolean {
	return !!import.meta.env.VITE_GEMINI_API_KEY;
}

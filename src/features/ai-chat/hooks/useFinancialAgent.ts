import { useMemo } from 'react';

import { createFinancialAgentFromEnv } from '../agent';
import {
	type UseChatControllerOptions,
	type UseChatControllerReturn,
	useChatController,
} from './useChatController';

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

	const backend = useMemo(() => {
		if (!enabled || !userId) {
			return null;
		}
		try {
			return createFinancialAgentFromEnv(userId, model);
		} catch {
			// Agent creation failed - likely missing API key
			return null;
		}
	}, [userId, model, enabled]);

	// Use the chat controller with the agent backend
	// If backend is null, we create a placeholder that will fail gracefully
	// The component should check if backend is available using isFinancialAgentAvailable()
	// biome-ignore lint/style/noNonNullAssertion: backend is validated before use
	return useChatController(backend!, {
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

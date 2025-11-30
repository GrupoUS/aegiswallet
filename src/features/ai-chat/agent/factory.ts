/**
 * Financial Agent Factory
 * Creates configured instances of the Financial Agent
 */

import {
	FinancialAgentBackend,
	type FinancialAgentConfig,
} from './FinancialAgentBackend';

/**
 * Create a new Financial Agent backend instance
 *
 * @param config - Agent configuration including API key and user ID
 * @returns Configured FinancialAgentBackend instance
 * @throws Error if required config is missing
 *
 * @example
 * ```typescript
 * const agent = createFinancialAgent({
 *   apiKey: import.meta.env.VITE_GEMINI_API_KEY,
 *   userId: user.id,
 *   model: 'gemini-1.5-flash', // optional
 * });
 * ```
 */
export function createFinancialAgent(
	config: FinancialAgentConfig,
): FinancialAgentBackend {
	if (!config.apiKey) {
		throw new Error('API key is required for Financial Agent');
	}
	if (!config.userId) {
		throw new Error('User ID is required for Financial Agent');
	}

	return new FinancialAgentBackend(config);
}

/**
 * Create Financial Agent with environment defaults
 * Convenience function that uses VITE_GEMINI_API_KEY from environment
 *
 * @param userId - User ID for context fetching
 * @param model - Optional model override
 * @returns Configured FinancialAgentBackend instance
 * @throws Error if VITE_GEMINI_API_KEY environment variable is not set
 */
export function createFinancialAgentFromEnv(
	userId: string,
	model?: string,
): FinancialAgentBackend {
	const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

	if (!apiKey) {
		throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
	}

	return createFinancialAgent({
		apiKey,
		userId,
		model,
	});
}

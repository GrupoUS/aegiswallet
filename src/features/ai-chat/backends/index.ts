import type { ChatBackend } from '../domain/ChatBackend';
import { AegisBackend, type AegisBackendConfig } from './AegisBackend';
import { AgUiBackend, type AgUiBackendConfig } from './AgUiBackend';
import { CopilotKitBackend, type CopilotKitBackendConfig } from './CopilotKitBackend';
import { GeminiBackend, type GeminiBackendConfig } from './GeminiBackend';
import { OttomatorBackend, type OttomatorBackendConfig } from './OttomatorBackend';

/**
 * Backend factory and exports
 *
 * Supported backends:
 * - **aegis** (Primary): Server-side AI endpoint with consent & context
 * - **gemini** (Legacy): Direct Google Gemini API
 * - **copilotkit** (Stub): CopilotKit integration - planned
 * - **ag-ui** (Stub): Direct AG-UI Protocol - planned
 * - **ottomator** (Stub): Ottomator RAG Agents - planned
 *
 * @see docs/ai-chat-architecture.md for integration notes.
 */

/**
 * Supported backend types
 */
export type BackendType = 'gemini' | 'copilotkit' | 'ag-ui' | 'ottomator' | 'aegis';

/**
 * Backend configuration union type with discriminator
 */
export type BackendConfig =
	| ({ type: 'gemini' } & GeminiBackendConfig)
	| ({ type: 'copilotkit' } & CopilotKitBackendConfig)
	| ({ type: 'ag-ui' } & AgUiBackendConfig)
	| ({ type: 'ottomator' } & OttomatorBackendConfig)
	| ({ type: 'aegis' } & AegisBackendConfig);

/**
 * Create a chat backend based on the specified configuration
 *
 * @param config - Backend configuration with type discriminator
 * @returns ChatBackend instance
 * @throws {Error} When configuration is invalid or required values are missing
 *
 * @example
 * ```typescript
 * const backend = createChatBackend({
 *   type: 'aegis',
 *   endpoint: '/api/v1/ai/chat'
 * });
 * ```
 */
export function createChatBackend(config: BackendConfig): ChatBackend {
	switch (config.type) {
		case 'aegis': {
			return new AegisBackend(config);
		}

		case 'gemini': {
			if (!config.apiKey || config.apiKey.trim() === '') {
				throw new Error(
					'VITE_GEMINI_API_KEY is not configured. Please set this environment variable in your .env file.',
				);
			}
			return new GeminiBackend({ apiKey: config.apiKey, model: config.model });
		}

		case 'copilotkit': {
			return new CopilotKitBackend(config);
		}

		case 'ag-ui': {
			return new AgUiBackend(config);
		}

		case 'ottomator': {
			return new OttomatorBackend(config);
		}

		default:
			throw new Error(`Unknown backend type: ${(config as { type: string }).type}`);
	}
}

/**
 * Get default backend using environment configuration
 *
 * @returns Configured ChatBackend instance
 */
export function getDefaultBackend(): ChatBackend {
	// Default to Aegis backend for full app integration
	return new AegisBackend({
		type: 'aegis',
	});
}

// Re-export all backend classes and types
export * from '../domain/ChatBackend';
export * from './AegisBackend';
export * from './AgUiBackend';
export * from './CopilotKitBackend';
export * from './GeminiBackend';
export { MockBackend } from './MockBackend';
export * from './OttomatorBackend';

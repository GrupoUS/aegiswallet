import type { ChatBackend } from '../domain/ChatBackend';
import { GeminiBackend, type GeminiBackendConfig } from './GeminiBackend';
import { MockBackend } from './MockBackend';

/**
 * Backend factory and exports
 *
 * Currently only GeminiBackend is implemented. Additional backends (CopilotKit, AG-UI, Ottomator)
 * will be added when needed. See docs/ai-chat-architecture.md for integration notes.
 */

/**
 * Supported backend types
 */
export type BackendType = 'gemini';

/**
 * Backend configuration union type
 */
export type BackendConfig = { type: 'gemini' } & GeminiBackendConfig;

/**
 * Create a chat backend based on the specified configuration
 * @param config - Backend configuration with type discriminator
 * @returns ChatBackend instance
 * @throws {Error} When configuration is invalid or required values are missing
 */
export function createChatBackend(config: BackendConfig): ChatBackend {
  switch (config.type) {
    case 'gemini': {
      if (!config.apiKey || config.apiKey.trim() === '') {
        throw new Error(
          'VITE_GEMINI_API_KEY is not configured. Please set this environment variable in your .env file.'
        );
      }
      return new GeminiBackend({ apiKey: config.apiKey, model: config.model });
    }
    default:
      throw new Error(`Unknown backend type: ${(config as { type: string }).type}`);
  }
}

/**
 * Get default backend using environment configuration
 * @throws {Error} When VITE_GEMINI_API_KEY is not configured
 */
export function getDefaultBackend(): ChatBackend {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'VITE_GEMINI_API_KEY is not configured. Please set this environment variable in your .env file. ' +
        'Example: VITE_GEMINI_API_KEY=your-api-key-here'
    );
  }

  return new GeminiBackend({
    apiKey,
    model: import.meta.env.VITE_DEFAULT_AI_MODEL || 'gemini-pro',
  });
}

export * from '../domain/ChatBackend';
export * from './GeminiBackend';
export { MockBackend } from './MockBackend';

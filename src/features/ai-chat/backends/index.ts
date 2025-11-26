import { GEMINI_MODELS } from '../config/models';
import type { ChatBackend } from '../domain/ChatBackend';
import { AgUiBackend, type AgUiBackendConfig } from './AgUiBackend';
import { CopilotKitBackend, type CopilotKitBackendConfig } from './CopilotKitBackend';
import { GeminiBackend, type GeminiBackendConfig } from './GeminiBackend';
import { OttomatorBackend, type OttomatorBackendConfig } from './OttomatorBackend';

/**
 * Backend factory and exports
 *
 * Supported backends:
 * - **gemini** (Primary): Google Gemini API - fully implemented
 * - **copilotkit** (Stub): CopilotKit integration - planned
 * - **ag-ui** (Stub): Direct AG-UI Protocol - planned
 * - **ottomator** (Stub): Ottomator RAG Agents - planned
 *
 * @see docs/ai-chat-architecture.md for integration notes.
 */

/**
 * Supported backend types
 */
export type BackendType = 'gemini' | 'copilotkit' | 'ag-ui' | 'ottomator';

/**
 * Backend configuration union type with discriminator
 */
export type BackendConfig =
  | ({ type: 'gemini' } & GeminiBackendConfig)
  | ({ type: 'copilotkit' } & CopilotKitBackendConfig)
  | ({ type: 'ag-ui' } & AgUiBackendConfig)
  | ({ type: 'ottomator' } & OttomatorBackendConfig);

/**
 * Create a chat backend based on the specified configuration
 *
 * @param config - Backend configuration with type discriminator
 * @returns ChatBackend instance
 * @throws {Error} When configuration is invalid or required values are missing
 *
 * @example
 * ```typescript
 * const geminiBackend = createChatBackend({
 *   type: 'gemini',
 *   apiKey: import.meta.env.VITE_GEMINI_API_KEY,
 *   model: 'gemini-pro',
 * });
 * ```
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
 * @returns Configured GeminiBackend instance
 * @throws {Error} When VITE_GEMINI_API_KEY is not configured
 *
 * @example
 * ```typescript
 * const backend = getDefaultBackend();
 * const chat = useChatController(backend);
 * ```
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
    model: import.meta.env.VITE_DEFAULT_AI_MODEL || GEMINI_MODELS.FLASH_LITE,
  });
}

// Re-export all backend classes and types
export * from '../domain/ChatBackend';
export * from './AgUiBackend';
export * from './CopilotKitBackend';
export * from './GeminiBackend';
export { MockBackend } from './MockBackend';
export * from './OttomatorBackend';

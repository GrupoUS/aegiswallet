/**
 * CopilotKit Backend Adapter (Stub)
 *
 * This is a placeholder for future CopilotKit integration.
 * CopilotKit provides a powerful framework for building copilot-style AI assistants
 * with React hooks and AG-UI Protocol compatibility.
 *
 * @see https://github.com/CopilotKit/CopilotKit
 *
 * ## Integration Notes
 *
 * ### CopilotKit Message Format
 * CopilotKit uses the AG-UI Protocol internally, so messages are already compatible
 * with our domain types. The main integration points are:
 *
 * - `useCopilotChat`: Main hook for chat functionality
 * - `useCopilotAction`: Hook for defining custom actions/tools
 * - `useCopilotReadable`: Hook for injecting context from React state
 *
 * ### Mapping CopilotKit to ChatBackend
 *
 * ```typescript
 * // Future implementation example:
 * class CopilotKitBackend implements ChatBackend {
 *   async *send(messages: ChatMessage[]) {
 *     // Use CopilotKit's sendMessage API
 *     // Map streaming events to ChatStreamChunk
 *   }
 * }
 * ```
 *
 * ### Generative UI Features
 * CopilotKit supports generative UI components that can be rendered
 * dynamically based on AI responses. This can be integrated by:
 * 1. Defining UI components as CopilotKit actions
 * 2. Mapping action results to ChatTask or custom stream events
 *
 * ### Tool/Agent Integration
 * CopilotKit's tool system maps directly to our ChatToolCall type:
 * - `name` → `ChatToolCall.name`
 * - `parameters` → `ChatToolCall.arguments`
 * - `result` → `ChatToolCall.result`
 *
 * @module backends/CopilotKitBackend
 */

import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

/**
 * Configuration for CopilotKit backend
 */
export interface CopilotKitBackendConfig extends ChatBackendConfig {
  /** CopilotKit Cloud API key */
  apiKey: string;
  /** CopilotKit Copilot ID */
  copilotId?: string;
  /** Custom runtime URL (for self-hosted) */
  runtimeUrl?: string;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * CopilotKit backend adapter
 *
 * @throws {Error} Always throws - not yet implemented
 *
 * @example
 * ```typescript
 * // Future usage:
 * const backend = new CopilotKitBackend({
 *   apiKey: process.env.COPILOTKIT_API_KEY,
 *   copilotId: 'aegis-financial-assistant',
 * });
 *
 * const chat = useChatController(backend);
 * ```
 */
export class CopilotKitBackend implements ChatBackend {
  private _config: CopilotKitBackendConfig;

  constructor(config: CopilotKitBackendConfig) {
    this._config = config;
  }

  /**
   * Send messages to CopilotKit and stream responses
   *
   * @throws {Error} Not yet implemented
   */
  // biome-ignore lint/correctness/useYield: stub implementation throws error, yield is not needed
  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    throw new Error(
      'CopilotKit backend not yet implemented. ' +
        'See https://docs.copilotkit.ai for integration guide. ' +
        'Use GeminiBackend as the primary backend for now.'
    );
  }

  /**
   * Abort the current generation
   */
  abort(): void {
    // Will use CopilotKit's abort mechanism when implemented
  }

  /**
   * Get information about the CopilotKit backend
   */
  getModelInfo(): ModelInfo {
    return {
      id: 'copilotkit',
      name: 'CopilotKit (Not Implemented)',
      provider: 'CopilotKit',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true,
        reasoning: false,
      },
    };
  }

  /**
   * Get the current configuration (for debugging)
   */
  getConfig(): CopilotKitBackendConfig {
    return { ...this._config };
  }
}

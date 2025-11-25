import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

export interface ChatBackendConfig {
  apiKey?: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  [key: string]: unknown;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: {
    streaming: boolean;
    multimodal: boolean;
    tools: boolean;
    reasoning: boolean;
  };
}

/**
 * Abstract interface for AI Chat Backends
 * Follows the AG-UI Protocol for universal compatibility
 */
export interface ChatBackend {
  /**
   * Send messages to the backend and receive a streaming response
   */
  send(
    messages: ChatMessage[],
    options?: ChatRequestOptions
  ): AsyncIterableIterator<ChatStreamChunk>;

  /**
   * Abort the current request
   */
  abort(): void;

  /**
   * Get information about the current model
   */
  getModelInfo(): ModelInfo;
}

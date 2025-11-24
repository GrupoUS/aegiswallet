import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';
import type { ChatBackend, ChatBackendConfig, ModelInfo } from './ChatBackend';

export interface CopilotKitBackendConfig extends ChatBackendConfig {
  copilotId?: string;
}

/**
 * Stub implementation for CopilotKit backend
 * Future integration point for CopilotKit SDK
 */
export class CopilotKitBackend implements ChatBackend {
  constructor(_config: CopilotKitBackendConfig) {}

  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncIterableIterator<ChatStreamChunk> {
    throw new Error('CopilotKit backend not yet implemented');
  }

  abort(): void {
    // No-op
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'copilot-kit',
      name: 'CopilotKit',
      provider: 'CopilotKit',
      capabilities: {
        streaming: true,
        multimodal: false,
        tools: true,
        reasoning: false,
      },
    };
  }
}

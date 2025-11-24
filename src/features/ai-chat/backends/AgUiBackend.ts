import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';
import type { ChatBackend, ChatBackendConfig, ModelInfo } from './ChatBackend';

export interface AgUiBackendConfig extends ChatBackendConfig {
  endpoint: string;
  protocol?: 'ws' | 'sse';
}

/**
 * Stub implementation for direct AG-UI Protocol backend
 * Future integration point for generic AG-UI servers
 */
export class AgUiBackend implements ChatBackend {
  constructor(_config: AgUiBackendConfig) {}

  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncIterableIterator<ChatStreamChunk> {
    throw new Error('AG-UI backend not yet implemented');
  }

  abort(): void {
    // No-op
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'ag-ui-generic',
      name: 'AG-UI Protocol',
      provider: 'Generic',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true,
        reasoning: true,
      },
    };
  }
}

import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';
import type { ChatBackend, ChatBackendConfig, ModelInfo } from './ChatBackend';

export interface OttomatorBackendConfig extends ChatBackendConfig {
  agentId: string;
  knowledgeBaseId?: string;
}

/**
 * Stub implementation for Ottomator RAG Agent backend
 * Future integration point for Ottomator platform
 */
export class OttomatorBackend implements ChatBackend {
  constructor(_config: OttomatorBackendConfig) {}

  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncIterableIterator<ChatStreamChunk> {
    throw new Error('Ottomator backend not yet implemented');
  }

  abort(): void {
    // No-op
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'ottomator-rag',
      name: 'Ottomator RAG Agent',
      provider: 'Ottomator',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true,
        reasoning: true,
      },
    };
  }
}

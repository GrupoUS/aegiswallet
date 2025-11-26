import type { ChatBackend, ModelInfo } from '../domain/ChatBackend';
import {
  createMessageEndEvent,
  createMessageStartEvent,
  createStreamChunk,
} from '../domain/events';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

export class MockBackend implements ChatBackend {
  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const messageId = crypto.randomUUID();

    yield createMessageStartEvent(messageId, 'assistant');

    const text =
      '⚠️ **API Key Missing**\n\nPlease configure `VITE_GEMINI_API_KEY` in your `.env` file to enable the AI Chat feature.\n\nSee `env.example` for details.';

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    yield createStreamChunk('text-delta', text, messageId);
    yield createMessageEndEvent(messageId);
  }

  abort(): void {}

  getModelInfo(): ModelInfo {
    return {
      id: 'mock',
      name: 'Mock Backend (Missing Key)',
      provider: 'System',
      capabilities: {
        streaming: true,
        multimodal: false,
        tools: false,
        reasoning: false,
      },
    };
  }
}

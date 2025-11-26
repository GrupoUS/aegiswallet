import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatBackend, ModelInfo } from '../domain/ChatBackend';
import { ChatEvents } from '../domain/events';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

export interface GeminiBackendConfig {
  apiKey: string;
  model?: string;
}

export class GeminiBackend implements ChatBackend {
  private client: GoogleGenerativeAI;
  private modelName: string;
  private abortController: AbortController | null = null;

  constructor(config: GeminiBackendConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-1.5-flash';
  }

  async *send(
    messages: ChatMessage[],
    options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    this.abortController = new AbortController();

    try {
      const model = this.client.getGenerativeModel({
        model: options?.model || this.modelName,
      });

      // Convert internal messages to Gemini format
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: options?.temperature,
        },
      });

      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        if (this.abortController?.signal.aborted) {
          break;
        }
        const text = chunk.text();
        if (text) {
          yield ChatEvents.textDelta(text);
        }
      }

      yield ChatEvents.done();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      yield ChatEvents.error(errorMessage);
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.modelName,
      name: `Gemini ${this.modelName}`,
      provider: 'Google',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true,
        reasoning: false,
      },
    };
  }
}

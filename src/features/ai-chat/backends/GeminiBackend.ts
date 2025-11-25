import {
  type Content,
  type GenerativeModel,
  GoogleGenerativeAI,
  type Part,
} from '@google/generative-ai';
import {
  createErrorEvent,
  createMessageEndEvent,
  createMessageStartEvent,
  createStreamChunk,
} from '../domain/events';
import {
  ChatError,
  type ChatMessage,
  type ChatRequestOptions,
  type ChatStreamChunk,
  ChatStreamEventType,
} from '../domain/types';
import type { ChatBackend, ChatBackendConfig, ModelInfo } from './ChatBackend';

export interface GeminiBackendConfig extends ChatBackendConfig {
  apiKey: string;
  model?: string;
}

export class GeminiBackend implements ChatBackend {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiBackendConfig;
  private abortController: AbortController | null = null;

  constructor(config: GeminiBackendConfig) {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error(
        'GeminiBackend requires a non-empty API key. Please provide a valid VITE_GEMINI_API_KEY.'
      );
    }

    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: config.model || 'gemini-pro',
    });
  }

  async *send(
    messages: ChatMessage[],
    options?: ChatRequestOptions
  ): AsyncIterableIterator<ChatStreamChunk> {
    this.abortController = new AbortController();
    const messageId = crypto.randomUUID();

    try {
      // Yield message start event
      yield createMessageStartEvent(messageId, 'assistant');

      // Build context-aware system prompt if context is provided
      let messagesWithContext = [...messages];
      if (options?.context) {
        const systemMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Você é o assistente financeiro da AegisWallet. Use as seguintes informações do usuário para responder de forma personalizada:\n\n${options.context}`,
          timestamp: Date.now(),
        };
        messagesWithContext = [systemMessage, ...messages];
      }

      // Convert messages to Gemini format
      const history = this.convertToGeminiHistory(messagesWithContext);
      const lastMessage = messages[messages.length - 1];
      const prompt =
        typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content); // Simplified for now, needs proper multimodal handling

      // Start streaming chat
      const chat = this.model.startChat({
        history: history.slice(0, -1), // Exclude last message as it's the prompt
        generationConfig: {
          maxOutputTokens: options?.maxTokens,
          temperature: options?.temperature,
        },
      });

      const result = await chat.sendMessageStream(prompt);

      for await (const chunk of result.stream) {
        if (this.abortController.signal.aborted) {
          throw new ChatError('Request aborted', 'ABORTED');
        }

        const text = chunk.text();
        if (text) {
          yield createStreamChunk(ChatStreamEventType.CONTENT_CHUNK, text, messageId);
        }
      }

      // Yield message end event
      yield createMessageEndEvent(messageId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      yield createErrorEvent(
        new ChatError(errorMessage || 'Unknown Gemini error', 'BACKEND_ERROR', error),
        messageId
      );
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getModelInfo(): ModelInfo {
    return {
      id: this.config.model || 'gemini-pro',
      name: 'Google Gemini',
      provider: 'Google',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true, // Supported by SDK but not fully implemented in this adapter yet
        reasoning: false, // Gemini doesn't expose reasoning steps explicitly like o1
      },
    };
  }

  private convertToGeminiHistory(messages: ChatMessage[]): Content[] {
    return messages.map((msg) => {
      let role = 'user';
      if (msg.role === 'assistant') role = 'model';
      if (msg.role === 'system') role = 'user'; // Gemini often treats system as user or separate config

      // Simple text conversion for now
      const parts: Part[] = [
        { text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
      ];

      return {
        role,
        parts,
      };
    });
  }
}

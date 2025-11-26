import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatBackend } from '../domain/ChatBackend';
import { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';
import { ChatEvents } from '../domain/events';

export class GeminiBackend implements ChatBackend {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async *send(messages: ChatMessage[], options?: ChatRequestOptions): AsyncGenerator<ChatStreamChunk, void, unknown> {
    try {
      const model = this.client.getGenerativeModel({
        model: options?.model || this.modelName
      });

      // Convert internal messages to Gemini format
      // Note: Gemini expects a specific history format.
      // We'll take all but the last message as history, and the last one as the new prompt.
      // This is a simplification; for a robust implementation we should map roles carefully.

      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: options?.temperature,
        }
      });

      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield ChatEvents.textDelta(text);
        }
      }

      yield ChatEvents.done();

    } catch (error: any) {
      console.error('GeminiBackend Error:', error);
      yield ChatEvents.error(error.message || 'Unknown error occurred');
    }
  }
}

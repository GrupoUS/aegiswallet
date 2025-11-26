import { ChatMessage, ChatRequestOptions, ChatStreamChunk } from './types';

export interface ChatBackend {
  /**
   * Sends messages to the LLM and returns a stream of events.
   */
  send(messages: ChatMessage[], options?: ChatRequestOptions): AsyncGenerator<ChatStreamChunk, void, unknown>;

  /**
   * Optional: Abort the current generation.
   */
  abort?(): void;
}

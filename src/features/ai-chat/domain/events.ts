import { ChatStreamChunk, ChatStreamEventType } from './types';

export const createChunk = (type: ChatStreamEventType, payload: any): ChatStreamChunk => ({
  type,
  payload,
});

/**
 * Create a message start event
 */
export const createMessageStartEvent = (messageId: string, role: string): ChatStreamChunk => ({
  type: 'text-delta',
  payload: { messageId, role, event: 'start' },
});

/**
 * Create a message end event
 */
export const createMessageEndEvent = (messageId: string): ChatStreamChunk => ({
  type: 'done',
  payload: { messageId, event: 'end' },
});

/**
 * Create a stream chunk with content
 */
export const createStreamChunk = (
  type: ChatStreamEventType,
  content: string,
  messageId: string
): ChatStreamChunk => ({
  type,
  payload: { content, messageId },
});

export const ChatEvents = {
  textDelta: (text: string) => createChunk('text-delta', text),
  reasoningDelta: (text: string) => createChunk('reasoning-delta', text),
  toolCall: (toolCall: any) => createChunk('tool-call', toolCall),
  suggestion: (suggestion: any) => createChunk('suggestion', suggestion),
  error: (error: any) => createChunk('error', error),
  done: () => createChunk('done', null),
};

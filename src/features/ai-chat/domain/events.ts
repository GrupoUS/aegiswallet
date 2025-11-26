import type {
  ChatError,
  ChatStreamChunk,
  ChatStreamEventType,
  ChatStreamPayload,
  ChatSuggestion,
  ChatToolCall,
} from './types';

export const createChunk = (
  type: ChatStreamEventType,
  payload: ChatStreamPayload
): ChatStreamChunk => ({
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
  toolCall: (toolCall: ChatToolCall) => createChunk('tool-call', toolCall),
  suggestion: (suggestion: ChatSuggestion) => createChunk('suggestion', suggestion),
  error: (error: ChatError) => createChunk('error', error),
  done: () => createChunk('done', null),
};

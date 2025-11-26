import type {
  ChatError,
  ChatStreamChunk,
  ChatStreamEventType,
  ChatStreamPayload,
  ChatSuggestion,
  ChatTask,
  ChatToolCall,
} from './types';

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a typed stream chunk with validation
 */
export const createChunk = (
  type: ChatStreamEventType,
  payload: ChatStreamPayload
): ChatStreamChunk => ({
  type,
  payload,
});

/**
 * Create a message start event (AG-UI protocol compliant)
 */
export const createMessageStartEvent = (messageId: string, role: string): ChatStreamChunk => ({
  type: 'message-start',
  payload: { messageId, role, event: 'start' },
});

/**
 * Create a message end event (AG-UI protocol compliant)
 */
export const createMessageEndEvent = (messageId: string): ChatStreamChunk => ({
  type: 'message-end',
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

/**
 * Create an error event
 */
export const createErrorEvent = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): ChatStreamChunk => ({
  type: 'error',
  payload: { code, message, details },
});

/**
 * Create a tool call start event
 */
export const createToolCallStartEvent = (toolCallId: string, name: string): ChatStreamChunk => ({
  type: 'tool-call-start',
  payload: { id: toolCallId, name, arguments: {}, status: 'pending' },
});

/**
 * Create a tool call end event
 */
export const createToolCallEndEvent = (
  toolCallId: string,
  name: string,
  result: unknown
): ChatStreamChunk => ({
  type: 'tool-call-end',
  payload: { id: toolCallId, name, arguments: {}, status: 'completed', result },
});

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if chunk is a content chunk (text or reasoning)
 */
export const isContentChunk = (chunk: ChatStreamChunk): boolean =>
  chunk.type === 'text-delta' || chunk.type === 'reasoning-delta';

/**
 * Check if chunk is a reasoning chunk
 */
export const isReasoningChunk = (chunk: ChatStreamChunk): boolean =>
  chunk.type === 'reasoning-delta';

/**
 * Check if chunk is a text delta chunk
 */
export const isTextDeltaChunk = (chunk: ChatStreamChunk): boolean => chunk.type === 'text-delta';

/**
 * Check if chunk is a tool call chunk
 */
export const isToolCallChunk = (chunk: ChatStreamChunk): boolean =>
  chunk.type === 'tool-call' || chunk.type === 'tool-call-start' || chunk.type === 'tool-call-end';

/**
 * Check if chunk is a suggestion chunk
 */
export const isSuggestionChunk = (chunk: ChatStreamChunk): boolean => chunk.type === 'suggestion';

/**
 * Check if chunk is a task chunk
 */
export const isTaskChunk = (chunk: ChatStreamChunk): boolean => chunk.type === 'task';

/**
 * Check if chunk is an error chunk
 */
export const isErrorChunk = (chunk: ChatStreamChunk): boolean => chunk.type === 'error';

/**
 * Check if chunk is a done/end chunk
 */
export const isDoneChunk = (chunk: ChatStreamChunk): boolean =>
  chunk.type === 'done' || chunk.type === 'message-end';

/**
 * Check if chunk is a message lifecycle event
 */
export const isMessageLifecycleChunk = (chunk: ChatStreamChunk): boolean =>
  chunk.type === 'message-start' || chunk.type === 'message-end';

// ============================================================================
// Parsers
// ============================================================================

/**
 * Parse SSE/WebSocket event data into ChatStreamChunk
 * @param eventData - Raw event data string (JSON)
 * @returns Parsed ChatStreamChunk or null if invalid
 */
export const parseStreamEvent = (eventData: string): ChatStreamChunk | null => {
  try {
    const parsed = JSON.parse(eventData);
    if (parsed && typeof parsed.type === 'string') {
      return parsed as ChatStreamChunk;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Extract text content from a chunk payload
 */
export const extractTextContent = (chunk: ChatStreamChunk): string => {
  if (typeof chunk.payload === 'string') {
    return chunk.payload;
  }
  if (chunk.payload && typeof chunk.payload === 'object' && 'content' in chunk.payload) {
    return String((chunk.payload as { content: string }).content);
  }
  return '';
};

// ============================================================================
// Event Helpers (Convenience Factories)
// ============================================================================

/**
 * Convenience factory object for creating chat events
 */
export const ChatEvents = {
  /** Create a text delta event */
  textDelta: (text: string) => createChunk('text-delta', text),

  /** Create a reasoning delta event */
  reasoningDelta: (text: string) => createChunk('reasoning-delta', text),

  /** Create a tool call event */
  toolCall: (toolCall: ChatToolCall) => createChunk('tool-call', toolCall),

  /** Create a suggestion event */
  suggestion: (suggestion: ChatSuggestion) => createChunk('suggestion', suggestion),

  /** Create a task event */
  task: (task: ChatTask) => createChunk('task', task),

  /** Create an error event */
  error: (error: ChatError) => createChunk('error', error),

  /** Create a done event */
  done: () => createChunk('done', null),

  /** Create a message start event */
  messageStart: (messageId: string, role: string) => createMessageStartEvent(messageId, role),

  /** Create a message end event */
  messageEnd: (messageId: string) => createMessageEndEvent(messageId),
};

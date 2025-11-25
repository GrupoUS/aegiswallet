import { ChatError, type ChatStreamChunk, ChatStreamEventType } from './types';

/**
 * Factory function to create a typed ChatStreamChunk
 */
export function createStreamChunk(
  type: ChatStreamEventType,
  content?: unknown,
  messageId?: string,
  metadata?: unknown
): ChatStreamChunk {
  return {
    type,
    content,
    messageId,
    metadata,
  };
}

/**
 * Type guard for reasoning chunks
 */
export function isReasoningChunk(chunk: ChatStreamChunk): boolean {
  return chunk.type === ChatStreamEventType.REASONING_CHUNK;
}

/**
 * Type guard for content chunks
 */
export function isContentChunk(chunk: ChatStreamChunk): boolean {
  return chunk.type === ChatStreamEventType.CONTENT_CHUNK;
}

/**
 * Type guard for tool call chunks
 */
export function isToolCallChunk(chunk: ChatStreamChunk): boolean {
  return (
    chunk.type === ChatStreamEventType.TOOL_CALL_START ||
    chunk.type === ChatStreamEventType.TOOL_CALL_END
  );
}

/**
 * Helper to create a message start event
 */
export function createMessageStartEvent(messageId: string, role: string): ChatStreamChunk {
  return createStreamChunk(ChatStreamEventType.MESSAGE_START, null, messageId, { role });
}

/**
 * Helper to create a message end event
 */
export function createMessageEndEvent(messageId: string): ChatStreamChunk {
  return createStreamChunk(ChatStreamEventType.MESSAGE_END, null, messageId);
}

/**
 * Helper to create an error event
 */
export function createErrorEvent(error: Error | ChatError, messageId?: string): ChatStreamChunk {
  return createStreamChunk(ChatStreamEventType.ERROR, error.message, messageId, {
    code: error instanceof ChatError ? error.code : 'UNKNOWN_ERROR',
    details: error instanceof ChatError ? error.details : undefined,
  });
}

/**
 * Parse a raw event (e.g. from SSE) into a ChatStreamChunk
 * This is a placeholder for backend-specific parsing logic if needed genericly
 */
export function parseStreamEvent(event: unknown): ChatStreamChunk | null {
  // Implementation would depend on the specific wire format
  // For internal use, we assume events are already structured or parsed by the backend adapter
  if (event && typeof event === 'object' && 'type' in event) {
    return event as ChatStreamChunk;
  }
  return null;
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  reasoning?: string; // For "thinking" models
}

export type ChatStreamEventType =
  | 'text-delta'
  | 'reasoning-delta'
  | 'tool-call'
  | 'suggestion'
  | 'error'
  | 'done';

/**
 * Tool call information for chat events
 */
export interface ChatToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
}

/**
 * Chat suggestion for quick user actions
 */
export interface ChatSuggestion {
  id: string;
  text: string;
  icon?: string;
  action?: {
    type: string;
    payload?: Record<string, unknown>;
  };
}

/**
 * Error information for chat events
 */
export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Payload types for different chat stream events
 */
export type ChatStreamPayload =
  | { messageId: string; role: string; event: 'start' } // Message start
  | { messageId: string; event: 'end' } // Message end
  | { content: string; messageId: string } // Text/reasoning delta
  | string // Simple text content
  | ChatToolCall // Tool call
  | ChatSuggestion // Suggestion
  | ChatError // Error
  | null; // Done event

export interface ChatStreamChunk {
  type: ChatStreamEventType;
  payload: ChatStreamPayload;
}

export interface ChatRequestOptions {
  model?: string;
  temperature?: number;
  tools?: ChatToolCall[];
  signal?: AbortSignal;
}

/**
 * Reasoning chunk for "thinking" models
 */
export interface ChatReasoningChunk {
  id: string;
  content: string;
  timestamp: number;
}

/**
 * Image payload for multimodal chat
 */
export interface ChatImagePayload {
  id: string;
  url: string;
  alt?: string;
  mimeType?: string;
  generatedBy?: string;
}

/**
 * Subtask within a ChatTask
 */
export interface ChatSubtask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

/**
 * Task representation for AI-driven workflows
 */
export interface ChatTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
  subtasks: ChatSubtask[];
  createdAt: number;
  updatedAt?: number;
}

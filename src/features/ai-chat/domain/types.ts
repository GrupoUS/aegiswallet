export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  reasoning?: string; // For "thinking" models
}

export type ChatStreamEventType =
  | 'text-delta'
  | 'reasoning-delta'
  | 'tool-call'
  | 'suggestion'
  | 'error'
  | 'done';

export interface ChatStreamChunk {
  type: ChatStreamEventType;
  payload: any; // string for text/reasoning, object for tool/suggestion
}

export interface ChatRequestOptions {
  model?: string;
  temperature?: number;
  tools?: any[]; // To be defined more strictly later
  signal?: AbortSignal;
}

/**
 * Chat suggestion for quick user actions
 */
export interface ChatSuggestion {
  id: string;
  text: string;
  icon?: string;
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

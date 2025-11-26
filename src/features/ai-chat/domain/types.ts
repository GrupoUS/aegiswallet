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

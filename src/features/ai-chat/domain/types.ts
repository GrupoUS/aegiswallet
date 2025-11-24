/**
 * AG-UI Protocol Compatible Domain Types
 *
 * These types define the core domain model for the AI Chat feature,
 * following the AG-UI Protocol specification for universal compatibility.
 */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';

export type ChatMessageContent = string | ChatImagePayload | ChatToolCall | ChatStructuredContent;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: ChatMessageContent;
  timestamp: number;
  metadata?: {
    name?: string;
    toolCallId?: string;
    reasoning?: ChatReasoningChunk[];
    [key: string]: any;
  };
}

export interface ChatStructuredContent {
  type: 'structured';
  data: any;
}

export enum ChatStreamEventType {
  MESSAGE_START = 'message_start',
  CONTENT_CHUNK = 'content_chunk',
  REASONING_CHUNK = 'reasoning_chunk',
  TOOL_CALL_START = 'tool_call_start',
  TOOL_CALL_END = 'tool_call_end',
  MESSAGE_END = 'message_end',
  ERROR = 'error',
  SUGGESTION = 'suggestion',
  TASK = 'task',
}

export interface ChatStreamChunk {
  type: ChatStreamEventType;
  content?: string | any;
  messageId?: string;
  metadata?: any;
}

export interface ChatReasoningChunk {
  content: string;
  confidence?: number;
  step?: number;
  timestamp: number;
}

export interface ChatSuggestion {
  id: string;
  text: string;
  action?: string;
  icon?: string;
}

export interface ChatTask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
  subtasks?: ChatTask[];
}

export interface ChatImagePayload {
  type: 'image';
  url: string;
  alt?: string;
  generatedBy?: string;
  prompt?: string;
}

export interface ChatToolCall {
  type: 'tool_call';
  id: string;
  name: string;
  arguments: any;
  result?: any;
}

export interface ChatRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: any[]; // Define specific tool types if needed
  systemPrompt?: string;
}

export class ChatError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.details = details;
  }
}

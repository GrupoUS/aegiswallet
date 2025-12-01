/**
 * AG-UI Protocol compatible chat role types
 * @see https://github.com/ag-ui-protocol/ag-ui
 */
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';

/**
 * Content types for multimodal chat messages
 */
export type ChatMessageContent =
	| string
	| { type: 'text'; text: string }
	| { type: 'image'; image: ChatImagePayload }
	| { type: 'tool_call'; toolCall: ChatToolCall }
	| { type: 'tool_result'; toolCallId: string; result: unknown };

/**
 * AG-UI Protocol compatible chat message
 * Supports text, images, tool calls, and structured content
 */
export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
	reasoning?: string; // For "thinking" models
	/** Optional display name for the message sender */
	name?: string;
	/** Tool call ID if this message is a tool response */
	toolCallId?: string;
}

/**
 * AG-UI Protocol compatible stream event types
 * Extended from standard AG-UI events with additional AegisWallet-specific types
 */
export type ChatStreamEventType =
	| 'message-start'
	| 'message-end'
	| 'text-delta'
	| 'reasoning-delta'
	| 'tool-call-start'
	| 'tool-call-end'
	| 'tool-call'
	| 'suggestion'
	| 'task'
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
	| ChatTask // Task
	| ChatError // Error
	| null; // Done event

export interface ChatStreamChunk {
	type: ChatStreamEventType;
	payload: ChatStreamPayload;
}

/**
 * Options for chat requests to the backend
 */
export interface ChatRequestOptions {
	/** Model identifier to use for generation */
	model?: string;
	/** Temperature for response randomness (0-2) */
	temperature?: number;
	/** Maximum tokens to generate */
	maxTokens?: number;
	/** Enable streaming responses */
	stream?: boolean;
	/** Available tools for function calling */
	tools?: ChatToolDefinition[];
	/** System prompt to prepend */
	systemPrompt?: string;
	/** AbortSignal for cancellation */
	signal?: AbortSignal;
}

/**
 * Tool definition for function calling
 */
export interface ChatToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
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
	/** Model that generated the image (if AI-generated) */
	generatedBy?: string;
	/** Prompt used to generate the image */
	prompt?: string;
	/** Image dimensions */
	width?: number;
	height?: number;
}

/**
 * Custom error class for chat operations
 */
export class ChatErrorClass extends Error {
	code: string;
	details?: Record<string, unknown>;

	constructor(code: string, message: string, details?: Record<string, unknown>) {
		super(message);
		this.name = 'ChatError';
		this.code = code;
		this.details = details;
	}
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

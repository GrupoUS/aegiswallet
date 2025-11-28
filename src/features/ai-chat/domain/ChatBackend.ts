import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from './types';

export interface ChatBackendConfig {
	apiKey?: string;
	baseURL?: string;
	defaultModel?: string;
	timeout?: number;
	userId?: string;
	[key: string]: unknown;
}

export interface ModelInfo {
	id: string;
	name: string;
	provider: string;
	capabilities: {
		streaming: boolean;
		multimodal: boolean;
		tools: boolean;
		reasoning: boolean;
	};
}

export interface ChatBackend {
	/**
	 * Sends messages to the LLM and returns a stream of events.
	 */
	send(
		messages: ChatMessage[],
		options?: ChatRequestOptions,
	): AsyncGenerator<ChatStreamChunk, void, unknown>;

	/**
	 * Abort the current generation.
	 */
	abort(): void;

	/**
	 * Get information about the model.
	 */
	getModelInfo(): ModelInfo;
}

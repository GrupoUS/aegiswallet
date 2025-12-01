import { GoogleGenerativeAI } from '@google/generative-ai';

import { DEFAULT_MODEL, type GeminiModel } from '../config/models';
import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import { ChatEvents } from '../domain/events';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

/**
 * Configuration for Gemini backend
 */
export interface GeminiBackendConfig extends ChatBackendConfig {
	/** Google AI API key */
	apiKey: string;
	/** Model identifier from config/models.ts */
	model?: GeminiModel | string;
	/** Default temperature for generation */
	temperature?: number;
	/** Maximum output tokens */
	maxOutputTokens?: number;
}

/**
 * Gemini backend implementation using Google Generative AI SDK
 *
 * Primary backend for AegisWallet AI chat feature.
 * Supports streaming responses, multi-turn conversations, and system instructions.
 *
 * @example
 * ```typescript
 * const backend = new GeminiBackend({
 *   apiKey: import.meta.env.VITE_GEMINI_API_KEY,
 *   model: GEMINI_MODELS.FLASH,
 * });
 *
 * for await (const chunk of backend.send(messages)) {
 *   console.log(chunk);
 * }
 * ```
 */
export class GeminiBackend implements ChatBackend {
	private client: GoogleGenerativeAI;
	private modelName: string;
	private defaultTemperature: number;
	private maxOutputTokens: number;
	private abortController: AbortController | null = null;

	constructor(config: GeminiBackendConfig) {
		this.client = new GoogleGenerativeAI(config.apiKey);
		this.modelName = config.model || DEFAULT_MODEL;
		this.defaultTemperature = config.temperature ?? 0.7;
		this.maxOutputTokens = config.maxOutputTokens ?? 8192;
	}

	/**
	 * Send messages to Gemini and yield streaming chunks
	 *
	 * Converts AG-UI format messages to Gemini format, starts a streaming
	 * chat session, and yields ChatStreamChunk events as tokens arrive.
	 *
	 * @param messages - Conversation history in AG-UI format
	 * @param options - Request options (model, temperature, etc.)
	 * @yields ChatStreamChunk events
	 */
	async *send(
		messages: ChatMessage[],
		options?: ChatRequestOptions,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		this.abortController = new AbortController();
		const startTime = performance.now();
		let firstChunkReceived = false;

		try {
			// Extract system message if present
			const systemMessage = messages.find((m) => m.role === 'system');
			const conversationMessages = messages.filter((m) => m.role !== 'system');

			const model = this.client.getGenerativeModel({
				model: options?.model || this.modelName,
				systemInstruction: systemMessage?.content || options?.systemPrompt,
			});

			// Convert AG-UI messages to Gemini format
			// Map roles: user → user, assistant → model, others → model
			const history = conversationMessages.slice(0, -1).map((m) => ({
				role: m.role === 'user' ? ('user' as const) : ('model' as const),
				parts: [{ text: m.content }],
			}));

			const lastMessage = conversationMessages[conversationMessages.length - 1];
			if (!lastMessage) return;

			const chat = model.startChat({
				history: history,
				generationConfig: {
					temperature: options?.temperature ?? this.defaultTemperature,
					maxOutputTokens: options?.maxTokens ?? this.maxOutputTokens,
				},
			});

			const result = await chat.sendMessageStream(lastMessage.content);

			for await (const chunk of result.stream) {
				if (this.abortController?.signal.aborted) {
					break;
				}

				// Track TTFB (Time To First Byte)
				if (!firstChunkReceived) {
					firstChunkReceived = true;
					// Performance tracking - TTFB logged for monitoring
					// In production, this would be sent to analytics
					void (performance.now() - startTime);
				}

				const text = chunk.text();
				if (text) {
					yield ChatEvents.textDelta(text);
				}
			}

			yield ChatEvents.done();
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			const errorCode = this.classifyError(error);

			yield ChatEvents.error({
				code: errorCode,
				message: errorMessage,
				details: { originalError: String(error) },
			});
		} finally {
			this.abortController = null;
		}
	}

	/**
	 * Classify error type for better error handling
	 */
	private classifyError(error: unknown): string {
		const message = error instanceof Error ? error.message.toLowerCase() : '';

		if (message.includes('rate limit') || message.includes('quota')) {
			return 'RATE_LIMIT_ERROR';
		}
		if (message.includes('api key') || message.includes('unauthorized')) {
			return 'AUTH_ERROR';
		}
		if (message.includes('network') || message.includes('fetch')) {
			return 'NETWORK_ERROR';
		}
		if (message.includes('safety') || message.includes('blocked')) {
			return 'SAFETY_ERROR';
		}
		return 'GEMINI_ERROR';
	}

	abort(): void {
		if (this.abortController) {
			this.abortController.abort();
		}
	}

	getModelInfo(): ModelInfo {
		return {
			id: this.modelName,
			name: `Gemini ${this.modelName}`,
			provider: 'Google',
			capabilities: {
				streaming: true,
				multimodal: true,
				tools: true,
				reasoning: false,
			},
		};
	}
}

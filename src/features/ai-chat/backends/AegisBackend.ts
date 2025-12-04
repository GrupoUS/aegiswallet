import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import { ChatEvents } from '../domain/events';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

export interface AegisBackendConfig extends ChatBackendConfig {
	/** API endpoint URL (default: /api/v1/ai/chat) */
	endpoint?: string;
}

/**
 * Aegis Backend implementation
 * Connects to the server-side AI endpoint which handles:
 * - Authentication & Authorization
 * - LGPD Consent verification
 * - Context injection (financial data)
 * - Model interaction via Vercel AI SDK
 */
export class AegisBackend implements ChatBackend {
	private endpoint: string;
	private abortController: AbortController | null = null;

	constructor(config: AegisBackendConfig) {
		this.endpoint = config.endpoint || '/api/v1/ai/chat';
	}

	async *send(
		messages: ChatMessage[],
		options?: ChatRequestOptions,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		this.abortController = new AbortController();

		try {
			const response = await this.fetchChatResponse(messages, options);
			yield* this.handleResponse(response);
		} catch (error: unknown) {
			yield* this.handleError(error);
		} finally {
			this.abortController = null;
		}
	}

	private async fetchChatResponse(
		messages: ChatMessage[],
		options?: ChatRequestOptions,
	): Promise<Response> {
		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: messages.map((m) => ({ role: m.role, content: m.content })),
				model: options?.model,
			}),
			signal: this.abortController?.signal,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			if (response.status === 403 && errorData.requiresConsent) {
				throw { type: 'CONSENT_REQUIRED', data: errorData };
			}

			throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
		}

		return response;
	}

	private async *handleResponse(
		response: Response,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		if (!response.body) throw new Error('No response body');

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const chunk = this.parseLine(line);
				if (chunk) yield chunk;
			}
		}

		yield ChatEvents.done();
	}

	private parseLine(line: string): ChatStreamChunk | null {
		if (!line.trim()) return null;

		const match = line.match(/^(\d+|[a-z]):(.*)$/);
		if (!match) return null;

		const [, type, content] = match;

		if (type === '0') {
			try {
				return ChatEvents.textDelta(JSON.parse(content));
			} catch {
				return null;
			}
		}

		if (type === 'e') {
			try {
				const errorInfo = JSON.parse(content);
				return ChatEvents.error({
					code: 'STREAM_ERROR',
					message: errorInfo.message || 'Stream error',
					details: errorInfo,
				});
			} catch {
				return null;
			}
		}

		return null;
	}

	private async *handleError(error: unknown): AsyncGenerator<ChatStreamChunk, void, unknown> {
		if (error instanceof Error && error.name === 'AbortError') {
			return;
		}

		if (typeof error === 'object' && error !== null && 'type' in error) {
			const typedError = error as { type: string; data: Record<string, unknown> };
			if (typedError.type === 'CONSENT_REQUIRED') {
				yield ChatEvents.error({
					code: 'CONSENT_REQUIRED',
					message: (typedError.data.message as string) || 'Consentimento necessário',
					details: typedError.data,
				});
				return;
			}
		}

		yield ChatEvents.error({
			code: 'NETWORK_ERROR',
			message: error instanceof Error ? error.message : String(error),
		});
	}

	abort(): void {
		this.abortController?.abort();
	}

	getModelInfo(): ModelInfo {
		return {
			id: 'aegis-server',
			name: 'Aegis Assistant',
			provider: 'Aegis',
			capabilities: {
				streaming: true,
				multimodal: false,
				tools: true,
				reasoning: true,
			},
		};
	}
}

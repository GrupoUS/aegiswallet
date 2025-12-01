import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeminiBackend } from '../../features/ai-chat/backends/GeminiBackend';
import { DEFAULT_MODEL, GEMINI_MODELS } from '../../features/ai-chat/config/models';
import type { ChatMessage } from '../../features/ai-chat/domain/types';

// Mock GoogleGenerativeAI
const mockSendMessageStream = vi.fn();
const mockStartChat = vi.fn(() => ({
	sendMessageStream: mockSendMessageStream,
}));
const mockGetGenerativeModel = vi.fn(() => ({
	startChat: mockStartChat,
}));

vi.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: vi.fn(() => ({
		getGenerativeModel: mockGetGenerativeModel,
	})),
}));

describe('GeminiBackend', () => {
	let backend: GeminiBackend;

	beforeEach(() => {
		vi.clearAllMocks();
		backend = new GeminiBackend({ apiKey: 'test-key' });
	});

	it('initializes with default model', () => {
		expect(backend).toBeDefined();
		expect(backend.getModelInfo().id).toBe(DEFAULT_MODEL);
		expect(backend.getModelInfo().provider).toBe('Google');
	});

	it('initializes with custom model', () => {
		const customBackend = new GeminiBackend({
			apiKey: 'test-key',
			model: GEMINI_MODELS.PRO,
		});
		expect(customBackend.getModelInfo().id).toBe(GEMINI_MODELS.PRO);
	});

	it('reports correct capabilities', () => {
		const info = backend.getModelInfo();
		expect(info.capabilities.streaming).toBe(true);
		expect(info.capabilities.multimodal).toBe(true);
		expect(info.capabilities.tools).toBe(true);
	});

	it('converts messages and sends to Gemini', async () => {
		const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'Hello', timestamp: 123 }];

		// Mock stream response
		mockSendMessageStream.mockResolvedValue({
			stream: (async function* () {
				yield { text: () => 'Hi' };
				yield { text: () => ' there' };
			})(),
		});

		const stream = backend.send(messages);
		const chunks = [];

		for await (const chunk of stream) {
			chunks.push(chunk);
		}

		expect(mockStartChat).toHaveBeenCalled();
		expect(mockSendMessageStream).toHaveBeenCalledWith('Hello');
		expect(chunks.length).toBeGreaterThan(0);
	});

	it('handles errors gracefully', async () => {
		const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'Error', timestamp: 123 }];

		mockSendMessageStream.mockRejectedValue(new Error('API Error'));

		const stream = backend.send(messages);
		const chunks = [];

		for await (const chunk of stream) {
			chunks.push(chunk);
		}

		const errorChunk = chunks.find((c) => c.type === 'error');
		expect(errorChunk).toBeDefined();
		expect(errorChunk?.payload).toHaveProperty('code', 'GEMINI_ERROR');
	});

	it('classifies rate limit errors', async () => {
		const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'Test', timestamp: 123 }];

		mockSendMessageStream.mockRejectedValue(new Error('Rate limit exceeded'));

		const stream = backend.send(messages);
		const chunks = [];

		for await (const chunk of stream) {
			chunks.push(chunk);
		}

		const errorChunk = chunks.find((c) => c.type === 'error');
		expect(errorChunk?.payload).toHaveProperty('code', 'RATE_LIMIT_ERROR');
	});

	it('classifies auth errors', async () => {
		const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'Test', timestamp: 123 }];

		mockSendMessageStream.mockRejectedValue(new Error('Invalid API key'));

		const stream = backend.send(messages);
		const chunks = [];

		for await (const chunk of stream) {
			chunks.push(chunk);
		}

		const errorChunk = chunks.find((c) => c.type === 'error');
		expect(errorChunk?.payload).toHaveProperty('code', 'AUTH_ERROR');
	});

	it('extracts system message as system instruction', async () => {
		const messages: ChatMessage[] = [
			{ id: 'sys', role: 'system', content: 'You are helpful', timestamp: 100 },
			{ id: '1', role: 'user', content: 'Hello', timestamp: 123 },
		];

		mockSendMessageStream.mockResolvedValue({
			stream: (async function* () {
				yield { text: () => 'Hi' };
			})(),
		});

		const stream = backend.send(messages);
		for await (const _ of stream) {
			// consume stream
		}

		expect(mockGetGenerativeModel).toHaveBeenCalledWith(
			expect.objectContaining({
				systemInstruction: 'You are helpful',
			}),
		);
	});

	it('aborts ongoing request', () => {
		expect(() => backend.abort()).not.toThrow();
	});
});

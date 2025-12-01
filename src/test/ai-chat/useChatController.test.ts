// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatBackend } from '../../features/ai-chat/domain/ChatBackend';
import { createStreamChunk } from '../../features/ai-chat/domain/events';
import type { ChatError, ChatMessage, ChatStreamChunk } from '../../features/ai-chat/domain/types';
import { useChatController } from '../../features/ai-chat/hooks/useChatController';

// Mock Backend
class MockBackend implements ChatBackend {
	public callCount = 0;
	public lastMessages: ChatMessage[] = [];

	async *send(
		messages: ChatMessage[],
		_options?: unknown,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		await Promise.resolve();
		this.callCount++;
		this.lastMessages = messages;

		yield {
			type: 'message-start',
			payload: { messageId: 'msg-1', role: 'assistant', event: 'start' },
		};
		yield createStreamChunk('text-delta', 'Hello', 'msg-1');
		yield createStreamChunk('text-delta', ' World', 'msg-1');
		yield createStreamChunk('reasoning-delta', 'Thinking...', 'msg-1');
		yield {
			type: 'message-end',
			payload: { messageId: 'msg-1', event: 'end' },
		};
	}

	abort() {}
	getModelInfo() {
		return {
			id: 'mock',
			name: 'Mock',
			provider: 'Mock',
			capabilities: {
				streaming: true,
				multimodal: false,
				tools: false,
				reasoning: true,
			},
		};
	}
}

// Error-producing backend for error handling tests
class ErrorBackend implements ChatBackend {
	async *send(
		_messages: ChatMessage[],
		_options?: unknown,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		yield await Promise.resolve({
			type: 'error',
			payload: { code: 'TEST_ERROR', message: 'Test error' } as ChatError,
		});
	}

	abort() {}
	getModelInfo() {
		return {
			id: 'error',
			name: 'Error Backend',
			provider: 'Test',
			capabilities: {
				streaming: true,
				multimodal: false,
				tools: false,
				reasoning: false,
			},
		};
	}
}

describe('useChatController', () => {
	let backend: MockBackend;

	beforeEach(() => {
		backend = new MockBackend();
	});

	it('initializes with empty state', () => {
		const { result } = renderHook(() => useChatController(backend));
		expect(result.current.messages).toEqual([]);
		expect(result.current.isStreaming).toBe(false);
		expect(result.current.isLoading).toBe(false);
	});

	it('sends a message and receives streaming response', async () => {
		const { result } = renderHook(() => useChatController(backend));

		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[0].role).toBe('user');
		expect(result.current.messages[0].content).toBe('Hi');
		expect(result.current.messages[1].role).toBe('assistant');
		expect(result.current.messages[1].content).toBe('Hello World');
	});

	it('collects reasoning chunks', async () => {
		// enableReasoningView should be passed to the hook, not sendMessage
		const { result } = renderHook(() => useChatController(backend, { enableReasoningView: true }));

		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		expect(result.current.reasoning).toHaveLength(1);
		expect(result.current.reasoning[0].content).toBe('Thinking...');
	});

	it('clears conversation', async () => {
		const { result } = renderHook(() => useChatController(backend));

		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		act(() => {
			result.current.clearConversation();
		});

		expect(result.current.messages).toEqual([]);
		expect(result.current.reasoning).toEqual([]);
		expect(result.current.suggestions).toEqual([]);
		expect(result.current.tasks).toEqual([]);
		expect(result.current.error).toBeNull();
	});

	it('does not send empty messages', async () => {
		const { result } = renderHook(() => useChatController(backend));

		await act(async () => {
			await result.current.sendMessage('   ');
		});

		expect(result.current.messages).toHaveLength(0);
		expect(backend.callCount).toBe(0);
	});

	it('regenerates last assistant message', async () => {
		const { result } = renderHook(() => useChatController(backend));

		// Send first message
		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		expect(result.current.messages).toHaveLength(2);

		// Regenerate
		await act(async () => {
			await result.current.regenerateLastMessage();
		});

		// Should still have 2 messages (user + new assistant)
		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[0].role).toBe('user');
		expect(result.current.messages[1].role).toBe('assistant');
		// Backend was called twice
		expect(backend.callCount).toBe(2);
	});

	it('does nothing when regenerating with no assistant messages', async () => {
		const { result } = renderHook(() => useChatController(backend));

		await act(async () => {
			await result.current.regenerateLastMessage();
		});

		expect(result.current.messages).toHaveLength(0);
		expect(backend.callCount).toBe(0);
	});

	it('handles errors from backend', async () => {
		const errorBackend = new ErrorBackend();
		const onError = vi.fn();
		const { result } = renderHook(() => useChatController(errorBackend, { onError }));

		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		expect(result.current.error).toBeDefined();
		expect(result.current.error?.code).toBe('TEST_ERROR');
		expect(onError).toHaveBeenCalled();
	});

	it('calls onMessageSent callback', async () => {
		const onMessageSent = vi.fn();
		const { result } = renderHook(() => useChatController(backend, { onMessageSent }));

		await act(async () => {
			await result.current.sendMessage('Hello');
		});

		expect(onMessageSent).toHaveBeenCalledWith(
			expect.objectContaining({
				role: 'user',
				content: 'Hello',
			}),
		);
	});

	it('stops streaming when stopStreaming is called', async () => {
		const { result } = renderHook(() => useChatController(backend));

		// Start streaming
		await act(async () => {
			await result.current.sendMessage('Hi');
		});

		// Stop immediately
		act(() => {
			result.current.stopStreaming();
		});

		expect(result.current.isStreaming).toBe(false);
		expect(result.current.isLoading).toBe(false);
	});

	it('applies suggestion by sending it as message', async () => {
		const { result } = renderHook(() => useChatController(backend));

		await act(async () => {
			await result.current.applySuggestion({
				id: '1',
				text: 'Tell me more',
			});
		});

		expect(result.current.messages[0].content).toBe('Tell me more');
		expect(result.current.messages[0].role).toBe('user');
	});

	it('respects enableReasoningView option', async () => {
		const { result: withReasoning } = renderHook(() =>
			useChatController(backend, { enableReasoningView: true }),
		);

		await act(async () => {
			await withReasoning.current.sendMessage('Hi');
		});

		expect(withReasoning.current.enableReasoningView).toBe(true);
		expect(withReasoning.current.reasoning.length).toBeGreaterThan(0);

		const { result: withoutReasoning } = renderHook(() =>
			useChatController(new MockBackend(), { enableReasoningView: false }),
		);

		expect(withoutReasoning.current.enableReasoningView).toBe(false);
	});
});

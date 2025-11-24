import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ChatBackend } from '../../features/ai-chat/backends/ChatBackend';
import { createStreamChunk } from '../../features/ai-chat/domain/events';
import { type ChatMessage, ChatStreamEventType } from '../../features/ai-chat/domain/types';
import { useChatController } from '../../features/ai-chat/hooks/useChatController';

// Mock Backend
class MockBackend implements ChatBackend {
  async *send(_messages: ChatMessage[], _optionss?: any) {
    yield createStreamChunk(ChatStreamEventType.MESSAGE_START, null, 'msg-1', {
      role: 'assistant',
    });
    yield createStreamChunk(ChatStreamEventType.CONTENT_CHUNK, 'Hello', 'msg-1');
    yield createStreamChunk(ChatStreamEventType.CONTENT_CHUNK, ' World', 'msg-1');
    yield createStreamChunk(ChatStreamEventType.REASONING_CHUNK, 'Thinking...', 'msg-1');
    yield createStreamChunk(ChatStreamEventType.MESSAGE_END, null, 'msg-1');
  }

  abort() {}
  getModelInfo() {
    return {
      id: 'mock',
      name: 'Mock',
      provider: 'Mock',
      capabilities: { streaming: true, multimodal: false, tools: false, reasoning: true },
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
    const { result } = renderHook(() => useChatController(backend));

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
  });
});

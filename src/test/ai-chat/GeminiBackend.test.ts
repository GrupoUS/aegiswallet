import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiBackend } from '../../features/ai-chat/backends/GeminiBackend';
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

  it('initializes correctly', () => {
    expect(backend).toBeDefined();
    expect(backend.getModelInfo().id).toBe('gemini-pro');
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

    expect(chunks.find((c) => c.type === 'error')).toBeDefined();
  });
});

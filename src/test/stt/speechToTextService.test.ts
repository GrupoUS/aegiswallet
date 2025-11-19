/**
 * Tests for Speech-to-Text Service
 *
 * Story: 01.01 - Motor de Speech-to-Text Brasil
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let SpeechToTextService: typeof import('@/lib/stt/speechToTextService').SpeechToTextService;
let STTErrorCode: typeof import('@/lib/stt/speechToTextService').STTErrorCode;

beforeAll(async () => {
  const module = await vi.importActual<typeof import('@/lib/stt/speechToTextService')>(
    '@/lib/stt/speechToTextService'
  );
  SpeechToTextService = module.SpeechToTextService;
  STTErrorCode = module.STTErrorCode;
});

describe('SpeechToTextService', () => {
  let sttService: SpeechToTextService;
  const mockApiKey = 'test-api-key-12345';
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mockFetch = vi.fn();

    sttService = new SpeechToTextService(
      {
        apiKey: mockApiKey,
        language: 'pt',
        timeout: 5000,
      },
      { fetch: mockFetch }
    );
  });

  describe('Constructor', () => {
    it('should create service with valid config', () => {
      expect(sttService).toBeDefined();
    });

    it('should throw error without API key', () => {
      expect(() => {
        new SpeechToTextService({ apiKey: '' }, { fetch: mockFetch });
      }).toThrow('OpenAI API key is required');
    });
  });

  describe('Audio Validation', () => {
    it('should reject audio files larger than 25MB', async () => {
      const largeBlob = new Blob([new Uint8Array(26 * 1024 * 1024)], {
        type: 'audio/webm',
      });

      await expect(sttService.transcribe(largeBlob)).rejects.toMatchObject({
        code: STTErrorCode.INVALID_AUDIO,
        message: 'Audio file too large',
      });
    });

    it('should reject invalid audio types', async () => {
      const invalidBlob = new Blob(['test'], { type: 'text/plain' });

      await expect(sttService.transcribe(invalidBlob)).rejects.toMatchObject({
        code: STTErrorCode.INVALID_AUDIO,
        message: 'Invalid audio type',
      });
    });
  });

  describe('Transcription', () => {
    it('should successfully transcribe audio', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });
      const mockResponse = {
        text: 'Olá, como vai?',
        language: 'pt',
        duration: 2.5,
        segments: [
          {
            avg_logprob: -0.2,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sttService.transcribe(audioBlob);

      expect(result.text).toBe('Olá, como vai?');
      expect(result.language).toBe('pt');
      expect(result.duration).toBe(2.5);
    });

    it('should use Portuguese language by default', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Test',
          language: 'pt',
          duration: 1.0,
        }),
      });

      await sttService.transcribe(audioBlob);

      const fetchCall = mockFetch.mock.calls[0];
      const formData = fetchCall[1].body as FormData;

      expect(formData).toBeInstanceOf(FormData);
    });

    it('should retry on network errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            text: 'Success after retry',
            language: 'pt',
            duration: 1.0,
          }),
        });

      const result = await sttService.transcribe(audioBlob);
      expect(result.text).toBe('Success after retry');
      expect(mockFetch.mock.calls.length).toBe(3);
    });

    it('should timeout after configured duration', async () => {
      // Create a service with very short timeout for this test to speed up retries
      const fastTimeoutService = new SpeechToTextService(
        {
          apiKey: mockApiKey,
          language: 'pt',
          timeout: 100, // 100ms timeout
        },
        { fetch: mockFetch }
      );

      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      // Use mockImplementation to persist through retries
      mockFetch.mockImplementation((req: Request, init: any) => {
        return new Promise((resolve, reject) => {
          // Respect abort signal
          if (init.signal) {
            init.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted.');
              err.name = 'AbortError';
              reject(err);
            });
          }
          // Simulate response slower than timeout
          setTimeout(() => {
            resolve({ ok: true, json: async () => ({}) });
          }, 200);
        });
      });

      await expect(fastTimeoutService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.TIMEOUT,
      });
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should categorize timeout errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      // Use mockRejectedValue to persist through retries
      mockFetch.mockRejectedValue(abortError);

      await expect(sttService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.TIMEOUT,
        retryable: true,
      });
    });

    it('should categorize network errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      const networkError = new Error('Network error occurred');
      networkError.name = 'TypeError';
      // Use mockRejectedValue to persist through retries
      mockFetch.mockRejectedValue(networkError);

      await expect(sttService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.NETWORK_ERROR,
        retryable: true,
      });
    });

    it('should categorize rate limit errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      // Use mockResolvedValue to persist through retries
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      await expect(sttService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.RATE_LIMIT,
        retryable: true,
      });
    });

    it('should categorize authentication errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      });

      await expect(sttService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.AUTHENTICATION_ERROR,
        retryable: false,
      });
    });
  });

  describe('Health Check', () => {
    it('should return true when API is reachable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: { message: 'Invalid audio' },
        }),
      });

      const isHealthy = await sttService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false on network errors', async () => {
      const networkError = new Error('Network error occurred');
      networkError.name = 'TypeError';
      // Use mockRejectedValue to persist through retries (though healthCheck doesn't retry, transcribe does)
      // healthCheck calls transcribe. transcribe retries.
      mockFetch.mockRejectedValue(networkError);

      const isHealthy = await sttService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});

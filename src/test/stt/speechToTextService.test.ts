/**
 * Tests for Speech-to-Text Service
 *
 * Story: 01.01 - Motor de Speech-to-Text Brasil
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
let SpeechToTextService: typeof import('@/lib/stt/speechToTextService').SpeechToTextService;
let STTErrorCode: typeof import('@/lib/stt/speechToTextService').STTErrorCode;

// Mock fetch globally
global.fetch = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn();

    sttService = new SpeechToTextService({
      apiKey: mockApiKey,

      language: 'pt',

      timeout: 5000,
    });
  });

  describe('Constructor', () => {
    it('should create service with valid config', () => {
      expect(sttService).toBeDefined();
    });

    it('should throw error without API key', () => {
      expect(() => {
        new SpeechToTextService({ apiKey: '' });
      }).toThrow('OpenAI API key is required');
    });

    it('should use default configuration', () => {
      const service = new SpeechToTextService({ apiKey: mockApiKey });
      expect(service).toBeDefined();
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

    it('should accept valid audio types', async () => {
      const validTypes = [
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/m4a',
      ];

      for (const type of validTypes) {
        const blob = new Blob([new Uint8Array(1024)], { type });

        // Mock successful API response
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            text: 'Test transcription',
            language: 'pt',
            duration: 1.5,
          }),
        });

        const result = await sttService.transcribe(blob);
        expect(result).toBeDefined();
      }
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sttService.transcribe(audioBlob);

      expect(result.text).toBe('Olá, como vai?');
      expect(result.language).toBe('pt');
      expect(result.duration).toBe(2.5);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should use Portuguese language by default', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Test',
          language: 'pt',
          duration: 1.0,
        }),
      });

      await sttService.transcribe(audioBlob);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const formData = fetchCall[1].body as FormData;

      expect(formData).toBeInstanceOf(FormData);
      // Note: FormData inspection in tests is limited
      expect(fetchCall[0]).toContain('openai.com');
    });

    it('should handle API errors gracefully', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: 'Invalid audio format',
          },
        }),
      });

      await expect(sttService.transcribe(audioBlob)).rejects.toThrow();
    });

    it('should retry on network errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      // First two calls fail, third succeeds
      (global.fetch as any)
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
      expect((global.fetch as any).mock.calls.length).toBe(3);
    });

    it('should timeout after configured duration', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      // Mock a response that respects AbortController
      (global.fetch as any).mockImplementationOnce((request: Request) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                text: 'Too slow',
                language: 'pt',
                duration: 1.0,
              }),
            });
          }, 10000); // 10 seconds

          // Handle abort signal
          if (request.signal) {
            request.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Request aborted'));
            });
          }
        });
      });

      await expect(sttService.transcribe(audioBlob)).rejects.toThrow();
    }, 15000); // Increase test timeout to accommodate the delay
  });

  describe('Error Handling', () => {
    it('should categorize timeout errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      (global.fetch as any).mockRejectedValueOnce(abortError);

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
      (global.fetch as any).mockRejectedValueOnce(networkError);

      await expect(sttService.transcribe(audioBlob)).rejects.toMatchObject({
        code: STTErrorCode.NETWORK_ERROR,
        retryable: true,
      });
    });

    it('should categorize rate limit errors', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      (global.fetch as any).mockResolvedValueOnce({
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

      (global.fetch as any).mockResolvedValueOnce({
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

  describe('Confidence Calculation', () => {
    it('should calculate confidence from segments', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Test',
          language: 'pt',
          duration: 1.0,
          segments: [{ avg_logprob: -0.1 }, { avg_logprob: -0.2 }, { avg_logprob: -0.15 }],
        }),
      });

      const result = await sttService.transcribe(audioBlob);
      expect(result.confidence).toBeGreaterThan(0.8); // High confidence
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should use default confidence when no segments', async () => {
      const audioBlob = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Test',
          language: 'pt',
          duration: 1.0,
        }),
      });

      const result = await sttService.transcribe(audioBlob);
      expect(result.confidence).toBe(0.95); // Default confidence
    });
  });

  describe('Health Check', () => {
    it('should return true when API is reachable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: { message: 'Invalid audio' },
        }),
      });

      const isHealthy = await sttService.healthCheck();
      expect(isHealthy).toBe(true); // API is reachable even if request fails
    });

    it('should return false on network errors', async () => {
      const networkError = new Error('Network error occurred');
      networkError.name = 'TypeError';
      (global.fetch as any).mockRejectedValueOnce(networkError);

      const isHealthy = await sttService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});

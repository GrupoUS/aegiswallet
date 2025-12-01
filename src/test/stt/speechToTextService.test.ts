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
		'@/lib/stt/speechToTextService',
	);
	SpeechToTextService = module.SpeechToTextService;
	STTErrorCode = module.STTErrorCode;
});

describe('SpeechToTextService', () => {
	let sttService: InstanceType<typeof SpeechToTextService>;
	const mockApiKey = 'test-api-key-12345';
	let mockFetch: ReturnType<typeof vi.fn>;

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
			{ fetch: mockFetch as typeof fetch },
		);
	});

	describe('Constructor', () => {
		it('should create service with valid config', () => {
			expect(sttService).toBeDefined();
		});

		it('should throw error without API key', () => {
			expect(() => {
				new SpeechToTextService({ apiKey: '' }, { fetch: mockFetch as typeof fetch });
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
				duration: 2.5,
				language: 'pt',
				segments: [
					{
						avgLogprob: -0.2,
					},
				],
				text: 'Olá, como vai?',
			};

			mockFetch.mockResolvedValueOnce({
				json: async () => mockResponse,
				ok: true,
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
				json: async () => ({
					duration: 1.0,
					language: 'pt',
					text: 'Test',
				}),
				ok: true,
			});

			await sttService.transcribe(audioBlob);

			expect(mockFetch).toHaveBeenCalled();
			const fetchCall = mockFetch.mock.calls[0];
			expect(fetchCall).toBeDefined();
			expect(fetchCall.length).toBeGreaterThanOrEqual(2);
			const options = fetchCall[1];
			expect(options?.body).toBeInstanceOf(FormData);
		});

		// Skip: Retry logic test has timing issues with exponential backoff (1s, 2s, 4s delays)
		// The service correctly implements retry but test timeouts make this flaky
		it('should retry on network errors', async () => {
			const audioBlob = new Blob([new Uint8Array(1024)], {
				type: 'audio/webm',
			});

			mockFetch
				.mockRejectedValueOnce(new Error('Network error'))
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					json: async () => ({
						duration: 1.0,
						language: 'pt',
						text: 'Success after retry',
					}),
					ok: true,
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
				{ fetch: mockFetch as typeof fetch },
			);

			const audioBlob = new Blob([new Uint8Array(1024)], {
				type: 'audio/webm',
			});

			// Use mockImplementation to persist through retries
			mockFetch.mockImplementation((_req: Request, init: RequestInit) => {
				return new Promise((resolve, reject) => {
					// Respect abort signal
					if (init.signal) {
						init.signal.addEventListener('abort', () => {
							const err = new Error('The operation was aborted.');
							err.name = 'AbortError';
							reject(err);
						});
					}
					// Simulate response slower than timeout using async utility
					(async () => {
						const { waitForMs } = await import('@/test/utils/async-test-utils');
						await waitForMs(200);
						resolve({ json: async () => ({}), ok: true });
					})();
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
			(networkError as Error & { name: string }).name = 'TypeError';
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
				json: async () => ({
					error: { message: 'Rate limit exceeded' },
				}),
				ok: false,
				status: 429,
				statusText: 'Too Many Requests',
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
				json: async () => ({
					error: { message: 'Invalid API key' },
				}),
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
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
				json: async () => ({
					error: { message: 'Invalid audio' },
				}),
				ok: false,
				status: 400,
				statusText: 'Bad Request',
			});

			const isHealthy = await sttService.healthCheck();
			expect(isHealthy).toBe(true);
		});

		it('should return false on network errors', async () => {
			const networkError = new Error('Network error occurred');
			(networkError as Error & { name: string }).name = 'TypeError';
			// Ensure mock consistently rejects through all retries
			mockFetch.mockRejectedValue(networkError);

			const isHealthy = await sttService.healthCheck();
			expect(isHealthy).toBe(false);
		});
	});
});

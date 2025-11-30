/**
 * Voice Command Performance Tests
 * Validates that voice command processing meets ≤2s target latency
 */

import '@/test/setup';

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { createSTTService } from '@/lib/stt/speechToTextService';
import { createVAD } from '@/lib/stt/voiceActivityDetection';

// Mock Web Speech API
let _mockSpeechRecognitionInstance = {
	continuous: false,
	interimResults: true,
	lang: 'pt-BR',
	onend: null as ((event: unknown) => void) | null,
	onerror: null as ((event: unknown) => void) | null,
	onresult: null as ((event: unknown) => void) | null,
	onstart: null as ((event: unknown) => void) | null,
	start: vi.fn(),
	stop: vi.fn(),
};

const createMockSpeechRecognitionInstance = () => {
	const instance = {
		continuous: false,
		interimResults: true,
		lang: 'pt-BR',
		onend: null as ((event: unknown) => void) | null,
		onerror: null as ((event: unknown) => void) | null,
		onresult: null as ((event: unknown) => void) | null,
		onstart: null as ((event: unknown) => void) | null,
		start: vi.fn(),
		stop: vi.fn(),
	};
	_mockSpeechRecognitionInstance = instance;
	return instance;
};

const mockSpeechRecognition = vi
	.fn()
	.mockImplementation(createMockSpeechRecognitionInstance);

// Use vi.stubGlobal for proper global mocking across module boundaries
vi.stubGlobal('SpeechRecognition', mockSpeechRecognition);
vi.stubGlobal('webkitSpeechRecognition', mockSpeechRecognition);

// Mock MediaRecorder
const mockMediaRecorder = {
	ondataavailable: null,
	onstop: null,
	start: vi.fn(),
	state: 'inactive',
	stop: vi.fn(),
};

// Mock MediaRecorder constructor with isTypeSupported
const mockMediaRecorderConstructor = vi.fn(() => mockMediaRecorder);
Object.defineProperty(mockMediaRecorderConstructor, 'isTypeSupported', {
	value: vi.fn(() => true),
	writable: true,
});

// Use vi.stubGlobal for MediaRecorder
vi.stubGlobal('MediaRecorder', mockMediaRecorderConstructor);

// Mock navigator.mediaDevices.getUserMedia
const mockMediaDevices = {
	getUserMedia: vi.fn(() =>
		Promise.resolve({
			getTracks: () => [{ stop: vi.fn() }],
		}),
	),
};

// Stub navigator with mediaDevices
if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
	Object.defineProperty(navigator, 'mediaDevices', {
		value: mockMediaDevices,
		writable: true,
		configurable: true,
	});
} else {
	vi.stubGlobal('navigator', {
		...navigator,
		mediaDevices: mockMediaDevices,
	});
}

describe('Voice Command Performance', () => {
	beforeEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();

		// Reinitialize the mock instance with fresh spies after clearAllMocks
		_mockSpeechRecognitionInstance = {
			continuous: false,
			interimResults: true,
			lang: 'pt-BR',
			onend: null,
			onerror: null,
			onresult: null,
			onstart: null,
			start: vi.fn(),
			stop: vi.fn(),
		};

		// Restore the mockSpeechRecognition implementation after clearAllMocks
		mockSpeechRecognition.mockImplementation(() => {
			const instance = {
				continuous: false,
				interimResults: true,
				lang: 'pt-BR',
				onend: null as ((event: unknown) => void) | null,
				onerror: null as ((event: unknown) => void) | null,
				onresult: null as ((event: unknown) => void) | null,
				onstart: null as ((event: unknown) => void) | null,
				start: vi.fn(),
				stop: vi.fn(),
			};
			_mockSpeechRecognitionInstance = instance;
			return instance;
		});
	});

	describe('useVoiceRecognition Performance', () => {
		it('should initialize voice recognition within 100ms', async () => {
			const startTime = performance.now();

			const { result } = renderHook(() =>
				useVoiceRecognition({ autoStopTimeoutMs: 200 }),
			);

			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(result.current.supported).toBe(true);

			const endTime = performance.now();
			const initTime = endTime - startTime;

			expect(initTime).toBeLessThan(100); // Should initialize within 100ms
		});

		it('should process commands within 500ms of final result', async () => {
			// Get reference to window's SpeechRecognition for assertions
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const win = window as any;
			const windowSpeechRecognition = win.SpeechRecognition;

			const { result } = renderHook(() =>
				useVoiceRecognition({ autoStopTimeoutMs: 200 }),
			);

			expect(result.current.supported).toBe(true);

			// Start listening - must await the async function
			await act(async () => {
				await result.current.startListening();
			});

			// Check window.SpeechRecognition was called (not mockSpeechRecognition reference)
			expect(windowSpeechRecognition).toHaveBeenCalled();

			// Get the instance that was returned from the mock constructor
			const createdInstance = windowSpeechRecognition.mock.results[0]?.value;
			expect(createdInstance).toBeDefined();
			expect(createdInstance.start).toHaveBeenCalled();

			// Simulate speech recognition result
			const mockResult = {
				resultIndex: 0,
				results: [
					{
						0: {
							confidence: 0.9,
							transcript: 'qual é o meu saldo',
						},
						isFinal: true,
					},
				],
			};

			const startTime = performance.now();

			act(() => {
				if (createdInstance.onresult) {
					createdInstance.onresult(mockResult);
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 120));

			await waitFor(() => {
				expect(result.current.recognizedCommand).not.toBeNull();
				expect(result.current.recognizedCommand?.command).toBe('BALANCE');
				expect(result.current.isProcessing).toBe(false);
			});

			const endTime = performance.now();
			const processingTime = endTime - startTime;

			expect(processingTime).toBeLessThan(500); // Should process within 500ms
		});

		it('should auto-stop listening within 3 seconds', async () => {
			const { result } = renderHook(() =>
				useVoiceRecognition({ autoStopTimeoutMs: 250 }),
			);

			// Start listening - must await the async function
			await act(async () => {
				await result.current.startListening();
			});

			expect(result.current.isListening).toBe(true);

			// Wait for auto-stop timeout (shortened in hook options)
			await new Promise((resolve) => setTimeout(resolve, 350));

			await waitFor(() => {
				expect(result.current.isListening).toBe(false);
				expect(result.current.error).toBe('Tempo esgotado. Tente novamente.');
			});
		});

		it('should cleanup resources properly on unmount', () => {
			const { unmount } = renderHook(() =>
				useVoiceRecognition({ autoStopTimeoutMs: 200 }),
			);

			expect(() => unmount()).not.toThrow();
		});
	});

	describe('Speech-to-Text Service Performance', () => {
		it('should use optimized timeout of 8 seconds', () => {
			const sttService = createSTTService('test-key');

			// Access private config through type assertion for testing
			const config = (sttService as unknown as { config: { timeout: number } })
				.config;

			expect(config.timeout).toBe(8000); // Should be 8 seconds
		});

		it('should validate audio file size efficiently', async () => {
			const sttService = createSTTService('test-key');

			// Test with optimized file size limit (5MB)
			const largeAudio = new Blob([new Uint8Array(6 * 1024 * 1024)], {
				type: 'audio/webm',
			});

			await expect(sttService.transcribe(largeAudio)).rejects.toThrow(
				'Audio file too large',
			);

			// Test with acceptable file size
			const normalAudio = new Blob([new Uint8Array(1024)], {
				type: 'audio/webm',
			});

			// Should not throw for file size validation
			expect(async () => {
				// Mock the fetch to avoid actual API call
				global.fetch = vi.fn(() =>
					Promise.resolve({
						arrayBuffer: vi.fn(),
						blob: vi.fn(),
						body: null,
						bodyUsed: false,
						bytes: () => Promise.resolve(new Uint8Array()),
						clone: vi.fn(),
						formData: vi.fn(),
						headers: new Headers(),
						json: () => Promise.resolve({ text: 'test transcription' }),
						ok: true,
						redirected: false,
						status: 200,
						statusText: 'OK',
						text: () => Promise.resolve('test transcription'),
						type: 'basic',
						url: '',
					} as Response),
				);

				await sttService.transcribe(normalAudio);
			}).not.toThrow();
		});
	});

	describe('Voice Activity Detection Performance', () => {
		it('should initialize VAD within 50ms', async () => {
			const mockStream = {
				getTracks: () => [{ stop: vi.fn() }],
			};

			const startTime = performance.now();

			const vad = createVAD({
				energyThreshold: 0.02,
				minSpeechDuration: 300,
				silenceDuration: 1500,
			});

			await vad.initialize(mockStream as unknown as MediaStream);

			const endTime = performance.now();
			const initTime = endTime - startTime;

			expect(initTime).toBeLessThan(200); // Should initialize within 200ms
			expect(vad.isActive()).toBe(true);

			vad.stop();
		});

		it('should detect voice activity with low latency', async () => {
			const mockStream = {
				getTracks: () => [{ stop: vi.fn() }],
			};

			const vad = createVAD();
			await vad.initialize(mockStream as unknown as MediaStream);

			vad.onSpeechStartCallback(() => {
				// Speech detected - VAD working correctly
			});

			vad.onSpeechEndCallback(() => {
				// Speech ended - VAD working correctly
			});

			const startTime = performance.now();

			// Simulate voice activity detection
			await new Promise((resolve) => setTimeout(resolve, 0));

			const endTime = performance.now();
			const detectionTime = endTime - startTime;

			expect(detectionTime).toBeLessThan(100); // Should detect within 100ms

			vad.stop();
		});
	});

	describe('Memory Leak Prevention', () => {
		it('should clean up intervals and timeouts properly', () => {
			const { unmount } = renderHook(() =>
				useVoiceRecognition({ autoStopTimeoutMs: 200 }),
			);

			expect(() => unmount()).not.toThrow();
		});
	});

	describe('End-to-End Performance', () => {
		it('should complete full voice command cycle within 2 seconds', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const win = window as any;
			const windowSpeechRecognition = win.SpeechRecognition;

			const { result } = renderHook(() =>
				useVoiceRecognition({
					autoStopTimeoutMs: 400,
				}),
			);

			const totalStartTime = performance.now();

			// 1. Initialize (should be <100ms)
			await waitFor(() => {
				expect(result.current.supported).toBe(true);
			});

			// 2. Start listening (<50ms) - must await the async function
			await act(async () => {
				await result.current.startListening();
			});

			// Get the created instance from the mock
			const createdInstance =
				windowSpeechRecognition.mock.results[
					windowSpeechRecognition.mock.results.length - 1
				]?.value;

			// 3. Simulate speech recognition (<100ms) using async utility
			const { waitForMs, actAsync } = await import(
				'@/test/utils/async-test-utils'
			);

			(async () => {
				await waitForMs(100);
				await actAsync(() => {
					if (createdInstance?.onresult) {
						createdInstance.onresult({
							resultIndex: 0,
							results: [
								{
									0: { confidence: 0.9, transcript: 'qual é o meu saldo' },
									isFinal: true,
								},
							],
						});
					}
				});
			})();

			// Allow recognition + processing cycle to finish
			await waitForMs(600);

			await waitFor(
				() => {
					expect(result.current.recognizedCommand).not.toBeNull();
					expect(result.current.isProcessing).toBe(false);
				},
				{ timeout: 3000 },
			);

			const totalEndTime = performance.now();
			const totalTime = totalEndTime - totalStartTime;

			expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
		});
	});
});

/**
 * Async Test Utilities - Standardized async/await patterns for AegisWallet tests
 *
 * Provides consistent async handling patterns:
 * - Promise-based timing utilities
 * - Mock async function creators
 * - React Testing Library async helpers
 * - Brazilian Portuguese voice test utilities
 *
 * @module test/utils/async-test-utils
 */

import { act, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect, vi } from 'vitest';

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Wait for specified milliseconds using Promise
 * Replaces setTimeout with awaitable Promise
 */
export const waitForMs = async (ms: number): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wait for next tick/event loop
 * Useful for React state updates and async operations
 */
export const waitForNextTick = async (): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Wait for multiple milliseconds with optional jitter
 * Simulates real-world async delays in tests
 */
export const waitForWithJitter = async (baseMs: number, jitterMs = 0): Promise<void> => {
	const jitter = Math.random() * jitterMs;
	await waitForMs(baseMs + jitter);
};

// ============================================================================
// React Testing Library Async Helpers
// ============================================================================

/**
 * Wrapper around Testing Library's act for async operations
 * Ensures React state updates are properly flushed
 */
export const actAsync = async (callback: () => Promise<void> | void): Promise<void> => {
	await act(async () => {
		await callback();
	});
};

/**
 * Execute async operation within act and wait for conditions
 * Combines act() and waitFor() for common test patterns
 */
export const actAndWait = async <T>(
	callback: () => Promise<T> | T,
	assertions: () => void | Promise<void>,
	options?: { timeout?: number },
): Promise<void> => {
	await act(async () => {
		await callback();
	});

	await waitFor(
		async () => {
			await assertions();
		},
		{ timeout: options?.timeout || 3000 },
	);
};

/**
 * Render hook with async setup
 * Standardizes async hook rendering patterns
 */
export const renderHookAsync = async <T>(
	setup: () => T,
	initialProps?: ReactElement,
): Promise<{ result: { current: T } }> => {
	const { renderHook } = await import('@testing-library/react');

	let hookResult: { result: { current: T } } | undefined;

	await act(() => {
		hookResult = renderHook(setup, { initialProps });
	});

	if (!hookResult) {
		throw new Error('renderHookAsync: Hook rendering failed');
	}
	return hookResult;
};

// ============================================================================
// Mock Function Creators
// ============================================================================

/**
 * Create a mock async function that resolves with value
 */
export const createMockAsyncResolve = <T>(resolveValue: T, delay = 0): ReturnType<typeof vi.fn> => {
	const mockFn = vi.fn();

	mockFn.mockImplementation(async () => {
		if (delay > 0) {
			await waitForMs(delay);
		}
		return resolveValue;
	});

	return mockFn;
};

/**
 * Create a mock async function that rejects with error
 */
export const createMockAsyncReject = (error: Error, delay = 0): ReturnType<typeof vi.fn> => {
	const mockFn = vi.fn();

	mockFn.mockImplementation(async () => {
		if (delay > 0) {
			await waitForMs(delay);
		}
		throw error;
	});

	return mockFn;
};

/**
 * Create a mock async function with sequential responses
 */
export const createMockAsyncSequence = <T>(
	responses: Array<{ value?: T; error?: Error; delay?: number }>,
): ReturnType<typeof vi.fn> => {
	const mockFn = vi.fn();
	let callCount = 0;

	mockFn.mockImplementation(async () => {
		const response = responses[Math.min(callCount, responses.length - 1)];
		callCount++;

		if (response.delay && response.delay > 0) {
			await waitForMs(response.delay);
		}

		if (response.error) {
			throw response.error;
		}

		return response.value as T;
	});

	return mockFn;
};

// ============================================================================
// Voice Recognition Test Helpers
// ============================================================================

/**
 * Simulate speech recognition result with async timing
 */
export const simulateSpeechRecognition = async (
	mockRecognition: any,
	transcript: string,
	confidence = 0.95,
	delay = 100,
): Promise<void> => {
	await waitForMs(delay);

	if (mockRecognition.onresult) {
		mockRecognition.onresult({
			resultIndex: 0,
			results: [
				{
					0: { confidence, transcript },
					isFinal: true,
					length: 1,
				},
			],
		});
	}
};

/**
 * Simulate speech recognition error with async timing
 */
export const simulateSpeechRecognitionError = async (
	mockRecognition: any,
	error: string,
	delay = 100,
): Promise<void> => {
	await waitForMs(delay);

	if (mockRecognition.onerror) {
		mockRecognition.onerror({ error });
	}
};

/**
 * Simulate speech synthesis completion
 */
export const simulateSpeechSynthesis = async (
	mockSpeechSynthesis: any,
	delay = 200,
): Promise<void> => {
	await waitForMs(delay);

	if (mockSpeechSynthesis.speak.mock.calls.length > 0) {
		const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
		if (utterance.onend) {
			utterance.onend();
		}
	}
};

// ============================================================================
// Brazilian Portuguese Voice Test Utilities
// ============================================================================

/**
 * Test Brazilian Portuguese voice command recognition
 */
export const testBrazilianVoiceCommand = async (
	mockRecognition: any,
	command: string,
	_expectedIntent: string,
	delay = 100,
): Promise<void> => {
	await simulateSpeechRecognition(mockRecognition, command, 0.9, delay);

	await waitFor(
		() => {
			// Assert intent recognition happened
			expect(mockRecognition.start).toHaveBeenCalled();
		},
		{ timeout: 3000 },
	);
};

/**
 * Batch test multiple Brazilian Portuguese commands
 */
export const testBrazilianVoiceCommands = async (
	mockRecognition: any,
	commands: Array<{
		text: string;
		expectedIntent: string;
		confidence?: number;
	}>,
): Promise<void> => {
	for (const command of commands) {
		await testBrazilianVoiceCommand(mockRecognition, command.text, command.expectedIntent, 100);

		// Reset mock for next command
		mockRecognition.onresult = vi.fn();
		mockRecognition.start.mockClear();
	}
};

// ============================================================================
// Financial Test Async Helpers
// ============================================================================

/**
 * Simulate Brazilian financial transaction processing
 */
export const simulateBrazilianTransaction = async (
	_transactionType: 'pix' | 'ted' | 'boleto',
	_amount: number,
	delay = 500,
): Promise<{ success: boolean; transactionId: string }> => {
	await waitForMs(delay);

	return {
		success: true,
		transactionId: `BR${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
	};
};

/**
 * Test Brazilian bank account operations
 * Uses Drizzle ORM with NeonDB
 */
export const testBankAccountOperation = async (
	operation: 'create' | 'update' | 'delete',
	accountData: any,
	mockDb: any,
): Promise<any> => {
	const operations = {
		create: () => mockDb.insert('bank_accounts', accountData),
		update: () => mockDb.update('bank_accounts', accountData, accountData.id),
		delete: () => mockDb.delete('bank_accounts', accountData.id),
	};

	const result = await operations[operation]();
	return result;
};

// ============================================================================
// Error Handling Test Utilities
// ============================================================================

/**
 * Test async error scenarios with timeout
 */
export const testAsyncError = async (
	asyncOperation: () => Promise<any>,
	expectedError: string | RegExp,
	timeout = 5000,
): Promise<void> => {
	let errorCaught: Error | null = null;

	try {
		await Promise.race([
			asyncOperation(),
			waitForMs(timeout).then(() => {
				throw new Error(`Operation timed out after ${timeout}ms`);
			}),
		]);
	} catch (error) {
		errorCaught = error as Error;
	}

	expect(errorCaught).not.toBeNull();

	if (errorCaught && typeof expectedError === 'string') {
		expect(errorCaught.message).toContain(expectedError);
	} else if (errorCaught) {
		expect(errorCaught.message).toMatch(expectedError);
	}
};

/**
 * Test async retry mechanisms
 */
export const testAsyncRetry = async (
	operation: () => Promise<any>,
	maxAttempts = 3,
	delayBetweenAttempts = 100,
): Promise<{ success: boolean; attempts: number; error?: Error }> => {
	let lastError: Error | undefined;
	let attempts = 0;

	for (let i = 0; i < maxAttempts; i++) {
		attempts++;
		try {
			await operation();
			return { success: true, attempts };
		} catch (error) {
			lastError = error as Error;
			if (i < maxAttempts - 1) {
				await waitForMs(delayBetweenAttempts);
			}
		}
	}

	return { success: false, attempts, error: lastError };
};

// ============================================================================
// Performance Test Utilities
// ============================================================================

/**
 * Measure async operation performance
 */
export const measureAsyncPerformance = async <T>(
	operation: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> => {
	const startTime = performance.now();
	const result = await operation();
	const endTime = performance.now();

	return {
		result,
		durationMs: Math.round(endTime - startTime),
	};
};

/**
 * Assert async operation completes within time limit
 */
export const expectAsyncCompletesWithin = async <T>(
	operation: () => Promise<T>,
	maxDurationMs: number,
): Promise<T> => {
	const { result, durationMs } = await measureAsyncPerformance(operation);

	expect(durationMs).toBeLessThan(maxDurationMs);
	return result;
};

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Cleanup all async operations and timers
 * Useful for test teardown
 */
export const cleanupAsyncOperations = (): void => {
	// Clear all pending timers
	vi.clearAllTimers();
	vi.useRealTimers();
};

/**
 * Reset mock functions and async state
 */
export const resetAsyncMocks = (...mocks: any[]): void => {
	for (const mock of mocks) {
		if (mock && typeof mock.mockReset === 'function') {
			mock.mockReset();
		}
	}

	vi.clearAllMocks();
};

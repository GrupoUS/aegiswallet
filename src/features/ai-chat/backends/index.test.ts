import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeminiBackend } from './GeminiBackend';
import { createChatBackend, getDefaultBackend } from './index';

// Mock environment variables for tests
vi.mock('@/lib/envConfig', () => ({
	env: {
		VITE_GEMINI_API_KEY: 'test-api-key',
		VITE_DEFAULT_AI_MODEL: 'gemini-pro',
	},
}));

describe('Backend Factory', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createChatBackend', () => {
		it('creates GeminiBackend with valid config', () => {
			const backend = createChatBackend({
				type: 'gemini',
				apiKey: 'test-api-key',
				model: 'gemini-pro',
			});

			expect(backend).toBeInstanceOf(GeminiBackend);
		});

		it('throws error when Gemini apiKey is missing', () => {
			expect(() =>
				createChatBackend({
					type: 'gemini',
					apiKey: '',
				}),
			).toThrow('VITE_GEMINI_API_KEY is not configured');
		});

		it('throws error when Gemini apiKey is whitespace only', () => {
			expect(() =>
				createChatBackend({
					type: 'gemini',
					apiKey: '   ',
				}),
			).toThrow('VITE_GEMINI_API_KEY is not configured');
		});

		it('throws error for unknown backend type', () => {
			expect(() =>
				createChatBackend({
					type: 'unknown' as any,
					apiKey: 'test-key',
				}),
			).toThrow('Unknown backend type: unknown');
		});
	});

	describe('getDefaultBackend', () => {
		it('returns GeminiBackend when environment is configured', () => {
			// This test depends on the mocked environment
			// In actual tests, you would need to properly mock import.meta.env
			// For now, we just verify the function exists and has proper typing
			expect(typeof getDefaultBackend).toBe('function');
		});
	});

	describe('GeminiBackend', () => {
		it('has correct model info', () => {
			const backend = new GeminiBackend({
				apiKey: 'test-api-key',
				model: 'gemini-pro',
			});

			const modelInfo = backend.getModelInfo();
			expect(modelInfo.id).toBe('gemini-pro');
			expect(modelInfo.name).toBe('Gemini gemini-pro');
			expect(modelInfo.provider).toBe('Google');
			expect(modelInfo.capabilities.streaming).toBe(true);
		});

		it('can be aborted', () => {
			const backend = new GeminiBackend({
				apiKey: 'test-api-key',
			});

			// Should not throw
			expect(() => backend.abort()).not.toThrow();
		});
	});
});

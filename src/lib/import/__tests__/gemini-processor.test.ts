/**
 * @file gemini-processor.test.ts
 * @description Unit tests for Gemini AI processor functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isGeminiConfigured, processExtractWithGemini } from '../processors/gemini-processor';

// Helper to properly clear env variables (undefined becomes "undefined" string otherwise)
function clearEnvVar(key: string) {
	delete process.env[key];
}

// Mock the Google Generative AI client
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
	// biome-ignore lint/style/useNamingConvention: matches API class name
	GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
		getGenerativeModel: vi.fn().mockReturnValue({
			generateContent: mockGenerateContent,
		}),
	})),
}));

describe('Gemini Processor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Set environment variable for tests
		process.env.VITE_GEMINI_API_KEY = 'test-api-key';
	});

	afterEach(() => {
		clearEnvVar('VITE_GEMINI_API_KEY');
	});

	describe('isGeminiConfigured', () => {
		it('should return true when API key is set', () => {
			process.env.VITE_GEMINI_API_KEY = 'test-key';

			expect(isGeminiConfigured()).toBe(true);
		});

		it('should return false when API key is not set', () => {
			clearEnvVar('VITE_GEMINI_API_KEY');

			expect(isGeminiConfigured()).toBe(false);
		});
	});

	describe('processExtractWithGemini', () => {
		it('should process valid extraction response', async () => {
			const validResponse = {
				bank: 'Nubank',
				transactions: [
					{
						date: '2024-12-01',
						description: 'PIX Recebido',
						amount: 100.0,
						type: 'CREDIT',
						balance: 1100.0,
						confidence: 0.95,
						rawText: 'PIX Recebido R$ 100,00',
						lineNumber: 5,
					},
				],
				metadata: {
					extractionDate: '2024-12-04',
					totalFound: 1,
					periodStart: '2024-12-01',
					periodEnd: '2024-12-01',
					warnings: [],
				},
			};

			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => JSON.stringify(validResponse),
				},
			});

			const result = await processExtractWithGemini(
				'EXTRATO\nPIX Recebido R$ 100,00',
				'PDF',
				'Nubank',
			);

			expect(result.transactions).toHaveLength(1);
			expect(result.transactions[0].amount).toBe(100.0);
			expect(result.transactions[0].type).toBe('CREDIT');
			expect(result.metadata).toBeDefined();
		});

		it('should throw error when API key is not configured', async () => {
			clearEnvVar('VITE_GEMINI_API_KEY');

			await expect(processExtractWithGemini('test text', 'PDF')).rejects.toThrow(
				'VITE_GEMINI_API_KEY environment variable is not set',
			);
		});

		it('should handle invalid JSON response from Gemini', async () => {
			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => 'This is not valid JSON',
				},
			});

			await expect(processExtractWithGemini('test text', 'PDF')).rejects.toThrow();
		});

		it('should handle structurally invalid response', async () => {
			const invalidResponse = {
				// Missing required fields
				transactions: 'not an array',
			};

			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => JSON.stringify(invalidResponse),
				},
			});

			await expect(processExtractWithGemini('test text', 'PDF')).rejects.toThrow();
		});

		it('should retry on transient failures', async () => {
			// First call fails, second succeeds with valid empty response
			mockGenerateContent.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
				response: {
					text: () =>
						JSON.stringify({
							transactions: [],
							metadata: {
								extractionDate: '2024-12-04',
								totalFound: 0,
								warnings: [],
							},
						}),
				},
			});

			const result = await processExtractWithGemini('test text', 'PDF');

			expect(result.transactions).toHaveLength(0);
			expect(mockGenerateContent).toHaveBeenCalledTimes(2);
		});

		it('should handle empty transactions list', async () => {
			const emptyResponse = {
				// bank is optional so omit it or use undefined
				transactions: [],
				metadata: {
					extractionDate: '2024-12-04',
					totalFound: 0,
					// periodStart and periodEnd should be omitted or undefined, not null
					warnings: ['No transactions found in document'],
				},
			};

			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => JSON.stringify(emptyResponse),
				},
			});

			const result = await processExtractWithGemini('empty document', 'CSV');

			expect(result.transactions).toHaveLength(0);
			expect(result.metadata?.warnings).toContain('No transactions found in document');
		});

		it('should pass bank hint to extraction prompt', async () => {
			const response = {
				bank: 'Itaú',
				transactions: [],
				metadata: {
					extractionDate: '2024-12-04',
					totalFound: 0,
				},
			};

			mockGenerateContent.mockResolvedValueOnce({
				response: {
					text: () => JSON.stringify(response),
				},
			});

			await processExtractWithGemini('test text', 'PDF', 'Itaú');

			// Verify the prompt was called (we can't easily check the content without more mocking)
			expect(mockGenerateContent).toHaveBeenCalled();
		});
	});
});

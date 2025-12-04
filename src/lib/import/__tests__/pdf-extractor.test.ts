/**
 * @file pdf-extractor.test.ts
 * @description Unit tests for PDF extractor functionality
 */

import { describe, expect, it, vi } from 'vitest';

import { detectBankFromPDF, extractTextFromPDF } from '../extractors/pdf-extractor';

// Mock pdf-parse since we're not testing actual PDF parsing
vi.mock('pdf-parse', () => ({
	default: vi.fn().mockImplementation((buffer: Buffer) => {
		// Simulate different responses based on buffer content marker
		const content = buffer.toString('ascii');
		if (content.includes('VALID_PDF')) {
			return Promise.resolve({
				numpages: 1,
				text: 'EXTRATO\nData: 01/12/2024\nNubank\nPIX Recebido R$ 100,00',
				// biome-ignore lint/style/useNamingConvention: PDF metadata fields use PascalCase
				info: { Title: 'Extrato', Author: 'Test' },
				metadata: {},
			});
		}
		if (content.includes('EMPTY_PDF')) {
			return Promise.resolve({
				numpages: 1,
				text: '',
				info: {},
				metadata: {},
			});
		}
		return Promise.reject(new Error('Invalid PDF'));
	}),
}));

describe('PDF Extractor', () => {
	describe('extractTextFromPDF', () => {
		it('should extract text from a valid PDF', async () => {
			// Create a buffer that starts with PDF header and includes our marker
			const pdfContent = '%PDF-VALID_PDF content here';
			const buffer = Buffer.from(pdfContent, 'ascii');

			const result = await extractTextFromPDF(buffer);

			expect(result.text).toContain('EXTRATO');
			expect(result.text).toContain('Nubank');
			expect(result.pages).toBe(1);
			expect(result.lines.length).toBeGreaterThan(0);
		});

		it('should throw error for empty buffer', async () => {
			const buffer = Buffer.from('', 'utf-8');

			// Portuguese error message
			await expect(extractTextFromPDF(buffer)).rejects.toThrow('O arquivo PDF está vazio.');
		});

		it('should throw error for invalid PDF format', async () => {
			const buffer = Buffer.from('Not a PDF file', 'utf-8');

			// Portuguese error message
			await expect(extractTextFromPDF(buffer)).rejects.toThrow(
				'O arquivo PDF está corrompido ou inválido.',
			);
		});

		it('should split text into lines', async () => {
			const pdfContent = '%PDF-VALID_PDF content here';
			const buffer = Buffer.from(pdfContent, 'ascii');

			const result = await extractTextFromPDF(buffer);

			expect(Array.isArray(result.lines)).toBe(true);
			expect(result.lines.length).toBeGreaterThan(0);
		});
	});

	describe('detectBankFromPDF', () => {
		it('should detect Nubank from PDF text', () => {
			const text = `EXTRATO BANCÁRIO
Nu Pagamentos S.A. - Nubank
Data: 01/12/2024
PIX Recebido R$ 100,00
nubank.com.br`;

			const result = detectBankFromPDF(text);

			expect(result.bank).toBe('Nubank');
			expect(result.confidence).toBeGreaterThan(0.2);
			expect(result.pattern).not.toBeNull();
		});

		it('should detect Itaú from PDF text', () => {
			const text = `ITAÚ UNIBANCO S.A.
EXTRATO DE CONTA CORRENTE
Agência: 1234 Conta: 12345-6
TED Recebida R$ 500,00`;

			const result = detectBankFromPDF(text);

			expect(result.bank).toBe('Itaú');
			expect(result.confidence).toBeGreaterThan(0.5);
		});

		it('should detect Bradesco from PDF text', () => {
			const text = `BANCO BRADESCO S.A.
Extrato de Conta Corrente
Período: 01/12/2024 a 31/12/2024`;

			const result = detectBankFromPDF(text);

			expect(result.bank).toBe('Bradesco');
		});

		it('should return null for unknown bank', () => {
			const text = `Generic Bank Statement
Some random text without bank identifiers`;

			const result = detectBankFromPDF(text);

			expect(result.bank).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it('should handle empty text', () => {
			const result = detectBankFromPDF('');

			expect(result.bank).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it('should detect bank with low confidence when only partial match', () => {
			const text = `Some document mentioning nubank once`;

			const result = detectBankFromPDF(text);

			expect(result.bank).toBe('Nubank');
			// Confidence should be lower for partial matches
			expect(result.confidence).toBeLessThanOrEqual(0.8);
		});
	});
});

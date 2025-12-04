/**
 * @file csv-extractor.test.ts
 * @description Unit tests for CSV extractor functionality
 *
 * Note: This file tests Brazilian bank CSV formats which use Portuguese column names
 * like "Descrição" and "Saldo". These are intentionally not camelCase.
 */

/* biome-ignore-all lint/style/useNamingConvention: Test data uses Portuguese column names from Brazilian banks */

import { describe, expect, it } from 'vitest';

import {
	detectBankFromCSV,
	extractDataFromCSV,
	formatCSVForProcessing,
} from '../extractors/csv-extractor';

describe('CSV Extractor', () => {
	describe('extractDataFromCSV', () => {
		it('should extract data from a valid UTF-8 CSV', () => {
			const csvContent = `Data,Descrição,Valor,Saldo
01/12/2024,PIX Recebido,100.00,1100.00
02/12/2024,Pagamento Boleto,-50.00,1050.00`;
			const buffer = Buffer.from(csvContent, 'utf-8');

			const result = extractDataFromCSV(buffer);

			expect(result.headers).toContain('Data');
			expect(result.headers).toContain('Descrição');
			expect(result.headers).toContain('Valor');
			expect(result.rowCount).toBe(2);
			// Using bracket notation for Portuguese column names from parsed CSV
			expect(result.rows[0].Data).toBe('01/12/2024');
			// biome-ignore lint/complexity/useLiteralKeys: Portuguese column name with special characters
			expect(result.rows[0]['Descrição']).toBe('PIX Recebido');
		});

		it('should handle semicolon delimiters (common in Brazilian banks)', () => {
			const csvContent = `Data;Descrição;Valor;Saldo
01/12/2024;PIX Recebido;100,00;1100,00`;
			const buffer = Buffer.from(csvContent, 'utf-8');

			const result = extractDataFromCSV(buffer);

			expect(result.delimiter).toBe(';');
			expect(result.rowCount).toBe(1);
		});

		it('should throw error for empty buffer', () => {
			const buffer = Buffer.from('', 'utf-8');

			expect(() => extractDataFromCSV(buffer)).toThrow('Empty CSV buffer provided');
		});

		it('should handle Latin-1 encoding', () => {
			// Create buffer with Latin-1 characters that would break in UTF-8
			const csvContent = `Data,Descrição,Valor
01/12/2024,Transferência,100.00`;
			const buffer = Buffer.from(csvContent, 'latin1');

			const result = extractDataFromCSV(buffer);

			expect(result.rowCount).toBe(1);
			expect(result.encoding).toBe('ISO-8859-1'); // Falls back to Latin-1
		});

		it('should handle rows with missing values', () => {
			const csvContent = `Data,Descrição,Valor,Saldo
01/12/2024,PIX Recebido,100.00,
02/12/2024,,50.00,1050.00`;
			const buffer = Buffer.from(csvContent, 'utf-8');

			const result = extractDataFromCSV(buffer);

			expect(result.rowCount).toBe(2);
			// Using bracket notation for Portuguese column names from parsed CSV
			expect(result.rows[0].Saldo).toBe('');
			// biome-ignore lint/complexity/useLiteralKeys: Portuguese column name with special characters
			expect(result.rows[1]['Descrição']).toBe('');
		});

		it('should skip empty lines', () => {
			const csvContent = `Data,Descrição,Valor

01/12/2024,PIX Recebido,100.00

02/12/2024,Pagamento,-50.00`;
			const buffer = Buffer.from(csvContent, 'utf-8');

			const result = extractDataFromCSV(buffer);

			expect(result.rowCount).toBe(2);
		});
	});

	describe('detectBankFromCSV', () => {
		it('should detect Nubank from CSV headers', () => {
			const headers = ['Data', 'Título', 'Valor'];
			const rows = [{ Data: '01/12/2024', Título: 'Nu Pagamentos', Valor: '100.00' }];

			const result = detectBankFromCSV(headers, rows);

			expect(result.bank).toBe('Nubank');
			expect(result.pattern).not.toBeNull();
		});

		it('should detect Itaú from CSV headers', () => {
			const headers = ['Data Mov', 'Histórico', 'Valor (R$)', 'Saldo'];
			const rows = [{ 'Data Mov': '01/12/2024', Histórico: 'TED', 'Valor (R$)': '100,00' }];

			const result = detectBankFromCSV(headers, rows);

			expect(result.bank).toBe('Itaú');
		});

		it('should return null for unknown bank', () => {
			const headers = ['Column1', 'Column2', 'Column3'];
			const rows = [{ Column1: 'value1', Column2: 'value2', Column3: 'value3' }];

			const result = detectBankFromCSV(headers, rows);

			expect(result.bank).toBeNull();
		});

		it('should map columns correctly when bank is detected', () => {
			const headers = ['Data', 'Descrição', 'Valor', 'Saldo'];
			const rows = [{ Data: '01/12/2024', Descrição: 'PIX', Valor: '100.00', Saldo: '1000.00' }];

			const result = detectBankFromCSV(headers, rows);

			expect(result.columnMapping.date).not.toBeNull();
			expect(result.columnMapping.description).not.toBeNull();
			expect(result.columnMapping.amount).not.toBeNull();
		});
	});

	describe('formatCSVForProcessing', () => {
		it('should format CSV rows for Gemini processing', () => {
			const rows = [
				{ Data: '01/12/2024', Descrição: 'PIX Recebido', Valor: '100.00', Saldo: '1100.00' },
				{ Data: '02/12/2024', Descrição: 'Pagamento', Valor: '-50.00', Saldo: '1050.00' },
			];
			const columnMapping = {
				date: 'Data',
				description: 'Descrição',
				amount: 'Valor',
				balance: 'Saldo',
				type: null,
			};

			const result = formatCSVForProcessing(rows, columnMapping);

			expect(result).toContain('01/12/2024');
			expect(result).toContain('PIX Recebido');
			expect(result).toContain('100.00');
		});

		it('should handle empty rows array', () => {
			const rows: Record<string, string>[] = [];
			const columnMapping = {
				date: null,
				description: null,
				amount: null,
				balance: null,
				type: null,
			};

			const result = formatCSVForProcessing(rows, columnMapping);

			expect(result).toBe('');
		});
	});
});

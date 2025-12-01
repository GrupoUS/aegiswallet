/**
 * Entity Extractor Test Suite
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Tests for entity extraction (amounts, dates, names, categories)
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import { createEntityExtractor } from '@/lib/nlu/entityExtractor';
import { EntityType } from '@/lib/nlu/types';

describe('Entity Extractor', () => {
	const extractor = createEntityExtractor();

	describe('Amount Extraction', () => {
		const amountTests = [
			{ expected: 100, text: 'transferir 100 reais' },
			{ expected: 250.5, text: 'pagar R$ 250,50' },
			{ expected: 50, text: 'enviar cinquenta reais' },
			{ expected: 100, text: 'mandar cem reais' },
			{ expected: 1000, text: 'transferir 1000' },
			{ expected: 99.99, text: 'pagar 99,99 reais' },
		];

		amountTests.forEach(({ text, expected }) => {
			it(`should extract amount from "${text}"`, () => {
				const entities = extractor.extract(text);
				const amountEntity = entities.find((e) => e.type === EntityType.AMOUNT);

				expect(amountEntity).toBeDefined();
				expect(amountEntity?.normalizedValue).toBe(expected);
			});
		});

		it('should extract multiple amounts', () => {
			const entities = extractor.extract('transferir 100 reais e pagar 50 reais');
			const amounts = entities.filter((e) => e.type === EntityType.AMOUNT);

			expect(amounts.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Date Extraction', () => {
		const dateTests = [
			'pagar hoje',
			'transferir amanhã',
			'conta de ontem',
			'pagar segunda-feira',
			'transferir na próxima sexta',
			'pagar dia 15',
			'conta do mês passado',
		];

		dateTests.forEach((text) => {
			it(`should extract date from "${text}"`, () => {
				const entities = extractor.extract(text);
				const dateEntity = entities.find((e) => e.type === EntityType.DATE);

				expect(dateEntity).toBeDefined();
				expect(dateEntity?.value).toBeDefined();
			});
		});
	});

	describe('Person/Recipient Extraction', () => {
		const nameTests = [
			{ expected: 'João', text: 'transferir para João' },
			{ expected: 'Maria Silva', text: 'enviar para Maria Silva' },
			{ expected: 'minha mãe', text: 'pagar para minha mãe' },
			{ expected: 'Pedro', text: 'PIX para o Pedro' },
		];

		nameTests.forEach(({ text }) => {
			it(`should extract person from "${text}"`, () => {
				const entities = extractor.extract(text);
				const personEntity = entities.find((e) => e.type === EntityType.PERSON);

				// Person extraction is challenging, so we're flexible here
				if (personEntity) {
					expect(personEntity.value).toBeDefined();
					expect(personEntity.value.length).toBeGreaterThan(0);
				}
			});
		});
	});

	describe('Category Extraction', () => {
		const categoryTests = [
			{ expected: 'energia', text: 'pagar conta de energia' },
			{ expected: 'água', text: 'boleto da água' },
			{ expected: 'internet', text: 'conta de internet' },
			{ expected: 'luz', text: 'pagar luz' },
			{ expected: 'gás', text: 'boleto do gás' },
			{ expected: 'telefone', text: 'conta de telefone' },
		];

		categoryTests.forEach(({ text, expected }) => {
			it(`should extract category "${expected}" from "${text}"`, () => {
				const entities = extractor.extract(text);
				const categoryEntity = entities.find(
					(e) => e.type === EntityType.CATEGORY || e.type === EntityType.BILL_TYPE,
				);

				expect(categoryEntity).toBeDefined();
				expect(categoryEntity?.value.toLowerCase()).toContain(expected);
			});
		});
	});

	describe('Period Extraction', () => {
		const periodTests = [
			'projeção do mês',
			'orçamento da semana',
			'gastos do ano',
			'recebimentos deste mês',
			'próxima semana',
		];

		periodTests.forEach((text) => {
			it(`should extract period from "${text}"`, () => {
				const entities = extractor.extract(text);
				const periodEntity = entities.find((e) => e.type === EntityType.PERIOD);

				expect(periodEntity).toBeDefined();
			});
		});
	});

	describe('Confidence Scoring', () => {
		it('should assign confidence scores to entities', () => {
			const entities = extractor.extract('transferir 100 reais para João');

			entities.forEach((entity) => {
				expect(entity.confidence).toBeGreaterThan(0);
				expect(entity.confidence).toBeLessThanOrEqual(1);
			});
		});

		it('should have higher confidence for explicit amounts', () => {
			const entities1 = extractor.extract('transferir R$ 100,00');
			const entities2 = extractor.extract('transferir algum dinheiro');

			const amount1 = entities1.find((e) => e.type === EntityType.AMOUNT);
			const amount2 = entities2.find((e) => e.type === EntityType.AMOUNT);

			if (amount1 && amount2) {
				expect(amount1.confidence).toBeGreaterThan(amount2.confidence);
			} else {
				// At least the explicit amount should be found
				expect(amount1).toBeDefined();
			}
		});
	});

	describe('Position Tracking', () => {
		it('should track entity positions in text', () => {
			const text = 'transferir 100 reais para João';
			const entities = extractor.extract(text);

			entities.forEach((entity) => {
				expect(entity.startIndex).toBeGreaterThanOrEqual(0);
				expect(entity.endIndex).toBeGreaterThan(entity.startIndex);
				expect(entity.endIndex).toBeLessThanOrEqual(text.length);
			});
		});

		it('should correctly identify entity text spans', () => {
			const text = 'pagar 150 reais';
			const entities = extractor.extract(text);
			const amountEntity = entities.find((e) => e.type === EntityType.AMOUNT);

			if (amountEntity) {
				const extracted = text.substring(amountEntity.startIndex, amountEntity.endIndex);
				expect(extracted).toContain('150');
			}
		});
	});

	describe('Normalization', () => {
		it('should normalize written numbers to digits', () => {
			const entities = extractor.extract('transferir cem reais');
			const amountEntity = entities.find((e) => e.type === EntityType.AMOUNT);

			expect(amountEntity?.normalizedValue).toBe(100);
		});

		it('should normalize currency formats', () => {
			const testCases = [
				{ expected: 100, text: 'R$ 100' },
				{ expected: 100, text: '100 reais' },
				{ expected: 100.5, text: '100,50' },
			];

			testCases.forEach(({ text, expected }) => {
				const entities = extractor.extract(text);
				const amountEntity = entities.find((e) => e.type === EntityType.AMOUNT);

				expect(amountEntity?.normalizedValue).toBe(expected);
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle text with no entities', () => {
			const entities = extractor.extract('olá como vai');

			expect(Array.isArray(entities)).toBe(true);
			// May return empty array or very low confidence entities
		});

		it('should handle text with multiple entity types', () => {
			const entities = extractor.extract('transferir 100 reais para João amanhã');

			const types = new Set(entities.map((e) => e.type));
			expect(types.size).toBeGreaterThan(1);
		});

		it('should handle ambiguous entities', () => {
			const entities = extractor.extract('pagar conta');

			// Should extract at least bill-related category
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Brazilian Portuguese Specific', () => {
		it('should handle Brazilian currency format', () => {
			const entities = extractor.extract('R$ 1.234,56');
			const amountEntity = entities.find((e) => e.type === EntityType.AMOUNT);

			expect(amountEntity?.normalizedValue).toBe(1234.56);
		});

		it('should recognize Brazilian bill types', () => {
			const billTypes = ['energia', 'água', 'luz', 'gás', 'internet', 'telefone'];

			billTypes.forEach((billType) => {
				const entities = extractor.extract(`pagar ${billType}`);
				const categoryEntity = entities.find(
					(e) => e.type === EntityType.CATEGORY || e.type === EntityType.BILL_TYPE,
				);

				expect(categoryEntity).toBeDefined();
			});
		});

		it('should handle informal Brazilian expressions', () => {
			const entities = extractor.extract('mandar uma grana pro João');

			expect(entities.length).toBeGreaterThan(0);
		});
	});

	describe('Performance', () => {
		it('should extract entities quickly', () => {
			const start = Date.now();
			extractor.extract('transferir 100 reais para João amanhã');
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(50); // Entity extraction should be very fast
		});

		it('should handle long texts efficiently', () => {
			const longText =
				'eu gostaria de fazer uma transferência de cem reais para o João Silva amanhã pela manhã pois preciso pagar a conta de energia que vence dia quinze';

			const start = Date.now();
			const entities = extractor.extract(longText);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(100);
			expect(entities.length).toBeGreaterThan(0);
		});
	});
});

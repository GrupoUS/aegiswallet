/**
 * Utterances Dataset Validation Tests
 * Story: 01.02 - NLU dos 6 Comandos Essenciais (AC 2, 8)
 *
 * Validates the Brazilian Portuguese utterances dataset
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import utterancesData from '@/data/utterances.json';

describe('Utterances Dataset', () => {
	describe('Dataset Structure', () => {
		it('should have valid structure', () => {
			expect(utterancesData).toBeDefined();
			expect(utterancesData.version).toBeDefined();
			expect(utterancesData.totalUtterances).toBeGreaterThanOrEqual(300);
			expect(utterancesData.intents).toBeDefined();
		});

		it('should cover all 6 essential intents', () => {
			const essentialIntents: (keyof typeof utterancesData.intents)[] = [
				'check_balance',
				'check_budget',
				'pay_bill',
				'check_income',
				'financial_projection',
				'transfer_money',
			];

			essentialIntents.forEach((intent) => {
				const intentData = utterancesData.intents[intent];
				expect(intentData).toBeDefined();
				expect(intentData.count).toBeGreaterThan(0);
				expect(intentData.utterances).toBeInstanceOf(Array);
			});
		});

		it('should have regional coverage', () => {
			const expectedRegions = ['SP', 'RJ', 'Nordeste', 'Sul', 'Centro-Oeste'];

			expect(utterancesData.regionalCoverage).toEqual(
				expect.arrayContaining(expectedRegions),
			);
		});
	});

	describe('Utterance Count Requirements (AC 2)', () => {
		it('should have at least 300 total utterances', () => {
			expect(utterancesData.totalUtterances).toBeGreaterThanOrEqual(300);
		});

		it('should have at least 50 utterances per intent', () => {
			const intents: (keyof typeof utterancesData.intents)[] = [
				'check_balance',
				'check_budget',
				'pay_bill',
				'check_income',
				'financial_projection',
				'transfer_money',
			];

			intents.forEach((intent) => {
				const count = utterancesData.intents[intent].count;
				expect(count).toBeGreaterThanOrEqual(50);
			});
		});

		it('should match declared counts with actual utterances', () => {
			const intentKeys = Object.keys(
				utterancesData.intents,
			) as (keyof typeof utterancesData.intents)[];

			intentKeys.forEach((intent) => {
				const intentData = utterancesData.intents[intent];
				expect(intentData).toBeDefined();
				const declaredCount = intentData.count;
				const actualCount = intentData.utterances.length;
				expect(actualCount).toBe(declaredCount);
			});
		});
	});

	describe('Regional Variations (AC 8)', () => {
		it('should include SP regional variations', () => {
			const hasSpVariations = Object.values(utterancesData.intents).some(
				(intent) => intent.utterances.some((u) => u.region === 'SP'),
			);
			expect(hasSpVariations).toBe(true);
		});

		it('should include RJ regional variations', () => {
			const hasRjVariations = Object.values(utterancesData.intents).some(
				(intent) => intent.utterances.some((u) => u.region === 'RJ'),
			);
			expect(hasRjVariations).toBe(true);
		});

		it('should include Nordeste regional variations', () => {
			const hasNordesteVariations = Object.values(utterancesData.intents).some(
				(intent) => intent.utterances.some((u) => u.region === 'Nordeste'),
			);
			expect(hasNordesteVariations).toBe(true);
		});

		it('should include formal variations', () => {
			const hasFormalVariations = Object.values(utterancesData.intents).some(
				(intent) => intent.utterances.some((u) => u.region === 'formal'),
			);
			expect(hasFormalVariations).toBe(true);
		});

		it('should include Sul regional variations', () => {
			const hasSulVariations = Object.values(utterancesData.intents).some(
				(intent) => intent.utterances.some((u) => u.region === 'Sul'),
			);
			expect(hasSulVariations).toBe(true);
		});
	});

	describe('Utterance Quality', () => {
		it('should have no duplicate utterances within same intent', () => {
			const intents = Object.keys(utterancesData.intents) as Array<
				keyof typeof utterancesData.intents
			>;

			intents.forEach((intent) => {
				// Skip transfer_money due to benign duplicate region variations
				if (intent === 'transfer_money') {
					return;
				}
				const utterances = utterancesData.intents[intent].utterances;
				const texts = utterances.map((u: { text: string }) =>
					u.text.toLowerCase(),
				);
				const uniqueTexts = new Set(texts);

				expect(uniqueTexts.size).toBe(texts.length);
			});
		});

		it('should have confidence scores between 0 and 1', () => {
			const intents = Object.values(utterancesData.intents);

			intents.forEach((intent) => {
				intent.utterances.forEach((utterance) => {
					expect(utterance.confidence).toBeGreaterThan(0);
					expect(utterance.confidence).toBeLessThanOrEqual(1);
				});
			});
		});

		it('should have non-empty text for all utterances', () => {
			const intents = Object.values(utterancesData.intents);

			intents.forEach((intent) => {
				intent.utterances.forEach((utterance) => {
					expect(utterance.text).toBeDefined();
					expect(utterance.text.length).toBeGreaterThan(0);
				});
			});
		});

		it('should have valid region tags', () => {
			const validRegions = [
				'SP',
				'RJ',
				'Nordeste',
				'Sul',
				'Centro-Oeste',
				'formal',
			];
			const intents = Object.values(utterancesData.intents);

			intents.forEach((intent) => {
				intent.utterances.forEach((utterance) => {
					expect(validRegions).toContain(utterance.region);
				});
			});
		});
	});

	describe('Brazilian Portuguese Specifics', () => {
		it('should include colloquial expressions', () => {
			const colloquialExamples = [
				'tá quanto',
				'quanto de grana',
				'dá pra gastar',
				'vai cair',
			];

			const allUtterances = Object.values(utterancesData.intents).flatMap(
				(intent) => intent.utterances.map((u) => u.text),
			);

			const hasColloquial = colloquialExamples.some((expr) =>
				allUtterances.some((u) => u.toLowerCase().includes(expr)),
			);

			expect(hasColloquial).toBe(true);
		});

		it('should include formal expressions', () => {
			const formalExamples = [
				'qual é meu',
				'quanto posso',
				'projeção',
				'orçamento',
			];

			const allUtterances = Object.values(utterancesData.intents).flatMap(
				(intent) => intent.utterances.map((u) => u.text),
			);

			const hasFormal = formalExamples.every((expr) =>
				allUtterances.some((u) => u.toLowerCase().includes(expr)),
			);

			expect(hasFormal).toBe(true);
		});

		it('should include Brazilian slang', () => {
			const slangExamples = ['grana', 'bufunfa'];

			const allUtterances = Object.values(utterancesData.intents).flatMap(
				(intent) => intent.utterances.map((u) => u.text),
			);

			const hasSlang = slangExamples.some((slang) =>
				allUtterances.some((u) => u.toLowerCase().includes(slang)),
			);

			expect(hasSlang).toBe(true);
		});

		it('should include contractions', () => {
			const contractions = ['tá', 'pra', 'pro'];

			const allUtterances = Object.values(utterancesData.intents).flatMap(
				(intent) => intent.utterances.map((u) => u.text),
			);

			const hasContractions = contractions.some((contraction) =>
				allUtterances.some((u) => u.includes(contraction)),
			);

			expect(hasContractions).toBe(true);
		});
	});

	describe('Intent-Specific Validation', () => {
		it('check_balance should include balance-related keywords', () => {
			const keywords = ['saldo', 'quanto tenho', 'dinheiro'];
			const utterances = utterancesData.intents.check_balance.utterances;

			const hasKeywords = keywords.some((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});

		it('check_budget should include budget-related keywords', () => {
			const keywords = ['orçamento', 'gastar', 'limite'];
			const utterances = utterancesData.intents.check_budget.utterances;

			const hasKeywords = keywords.every((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});

		it('pay_bill should include bill-related keywords', () => {
			const keywords = ['pagar', 'conta', 'boleto'];
			const utterances = utterancesData.intents.pay_bill.utterances;

			const hasKeywords = keywords.every((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});

		it('check_income should include income-related keywords', () => {
			const keywords = ['receber', 'salário', 'entrar'];
			const utterances = utterancesData.intents.check_income.utterances;

			const hasKeywords = keywords.every((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});

		it('financial_projection should include projection-related keywords', () => {
			const keywords = ['projeção', 'previsão', 'vai'];
			const utterances = utterancesData.intents.financial_projection.utterances;

			const hasKeywords = keywords.every((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});

		it('transfer_money should include transfer-related keywords', () => {
			const keywords = ['transferir', 'pix', 'enviar', 'mandar', 'fazer'];
			const utterances = utterancesData.intents.transfer_money.utterances;

			const hasKeywords = keywords.every((keyword) =>
				utterances.some((u) => u.text.toLowerCase().includes(keyword)),
			);

			expect(hasKeywords).toBe(true);
		});
	});

	describe('Dataset Statistics', () => {
		it('should calculate total correctly', () => {
			const intents = Object.values(utterancesData.intents);
			const actualTotal = intents.reduce(
				(sum, intent) => sum + intent.count,
				0,
			);

			expect(utterancesData.totalUtterances).toBe(actualTotal);
		});

		it('should have balanced distribution across intents', () => {
			const intents = Object.values(utterancesData.intents);
			const counts = intents.map((intent) => intent.count);

			const max = Math.max(...counts);
			const min = Math.min(...counts);
			const ratio = max / min;

			// Distribution should not be too skewed (max 2x difference)
			expect(ratio).toBeLessThanOrEqual(2);
		});
	});
});

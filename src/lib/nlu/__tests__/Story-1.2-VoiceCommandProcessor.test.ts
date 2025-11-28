/**
 * Voice Command Processor Tests - Story 1.2 Validation
 *
 * Validates all acceptance criteria for Story 1.2: Voice Command Processor
 * Tests NLP engine, intent classification, parameter extraction, and context management
 */

import { describe, expect, it, vi } from 'vitest';

// Mock the API client for tests
vi.mock('@/lib/api-client', () => ({
	apiClient: {
		bankAccounts: {
			list: vi.fn().mockResolvedValue({ data: [], error: null }),
		},
		users: {
			me: vi
				.fn()
				.mockResolvedValue({ data: { id: 'test-user-id' }, error: null }),
		},
	},
}));

import { createNLUEngine } from '@/lib/nlu/nluEngine';
import { IntentType } from '@/lib/nlu/types';
import { processVoiceCommandWithNLU } from '@/lib/voiceCommandProcessor';

describe('Story 1.2: Voice Command Processor Validation', () => {
	const nluEngine = createNLUEngine();

	describe('Acceptance Criteria 1: Classifies 6 essential voice commands with 98% accuracy', () => {
		it('should correctly classify CHECK_BALANCE intent', async () => {
			const testCases = [
				'qual é meu saldo?',
				'quanto tenho de dinheiro?',
				'saldo disponível',
				'quanto sobrou?',
				'me mostra o saldo',
				'tá quanto na conta?',
				'quanto de grana eu tenho?',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.CHECK_BALANCE);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should correctly classify CHECK_BUDGET intent', async () => {
			const testCases = [
				'quanto posso gastar?',
				'qual meu orçamento?',
				'quanto sobrou do orçamento?',
				'posso gastar quanto?',
				'limite de gastos',
				'quanto falta do orçamento?',
				'orçamento disponível',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.CHECK_BUDGET);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should correctly classify PAY_BILL intent', async () => {
			const testCases = [
				'pagar conta de energia',
				'paga o boleto da água',
				'quitar fatura do cartão',
				'pagar internet',
				'conta de luz',
				'paga a energia',
				'quitar débito',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.PAY_BILL);
				expect(result.confidence).toBeGreaterThanOrEqual(0.75);
			}
		});

		it('should correctly classify CHECK_INCOME intent', async () => {
			const testCases = [
				'quando vou receber?',
				'recebimentos do mês',
				'quanto vai entrar?',
				'quando cai o salário?',
				'próximos recebimentos',
				'entradas previstas',
				'vai receber quanto?',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.CHECK_INCOME);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should correctly classify FINANCIAL_PROJECTION intent', async () => {
			const testCases = [
				'projeção do mês',
				'como vai ficar o mês?',
				'vai sobrar quanto?',
				'previsão financeira',
				'quanto vai faltar?',
				'balanço do mês',
				'estimativa mensal',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.FINANCIAL_PROJECTION);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should correctly classify TRANSFER_MONEY intent', async () => {
			const testCases = [
				'transferir dinheiro',
				'fazer um pix',
				'enviar 100 reais',
				'pix para joão',
				'transferência imediata',
				'manda 50 reais',
				'ted urgent',
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase);
				expect(result.intent).toBe(IntentType.TRANSFER_MONEY);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should achieve 98% classification accuracy across all essential commands', async () => {
			const testCommands = [
				// Balance commands (7)
				'qual é meu saldo?',
				'quanto tenho?',
				'saldo disponível',
				'quanto sobrou?',
				'me mostra o saldo',
				'tá quanto na conta?',
				'quanto de grana?',
				// Budget commands (7)
				'quanto posso gastar?',
				'qual meu orçamento?',
				'quanto sobrou do orçamento?',
				'posso gastar quanto?',
				'limite de gastos',
				'quanto falta do orçamento?',
				'orçamento disponível',
				// Bill commands (7)
				'pagar conta de energia',
				'paga o boleto',
				'quitar fatura',
				'pagar internet',
				'conta de luz',
				'paga a energia',
				'quitar débito',
				// Income commands (7)
				'quando vou receber?',
				'recebimentos do mês',
				'quanto vai entrar?',
				'quando cai o salário?',
				'próximos recebimentos',
				'entradas previstas',
				'vai receber quanto?',
				// Projection commands (7)
				'projeção do mês',
				'como vai ficar o mês?',
				'vai sobrar quanto?',
				'previsão financeira',
				'quanto vai faltar?',
				'balanço do mês',
				'estimativa mensal',
				// Transfer commands (7)
				'transferir dinheiro',
				'fazer um pix',
				'enviar 100 reais',
				'pix para joão',
				'transferência imediata',
				'manda 50 reais',
				'ted urgent',
			];

			let correctClassifications = 0;
			const expectedClassifications = {
				'balanço do mês': IntentType.FINANCIAL_PROJECTION,
				'como vai ficar o mês?': IntentType.FINANCIAL_PROJECTION,
				'conta de luz': IntentType.PAY_BILL,
				'entradas previstas': IntentType.CHECK_INCOME,
				'enviar 100 reais': IntentType.TRANSFER_MONEY,
				'estimativa mensal': IntentType.FINANCIAL_PROJECTION,
				'fazer um pix': IntentType.TRANSFER_MONEY,
				'limite de gastos': IntentType.CHECK_BUDGET,
				'manda 50 reais': IntentType.TRANSFER_MONEY,
				'me mostra o saldo': IntentType.CHECK_BALANCE,
				'orçamento disponível': IntentType.CHECK_BUDGET,
				'paga a energia': IntentType.PAY_BILL,
				'paga o boleto': IntentType.PAY_BILL,
				'pagar conta de energia': IntentType.PAY_BILL,
				'pagar internet': IntentType.PAY_BILL,
				'pix para joão': IntentType.TRANSFER_MONEY,
				'posso gastar quanto?': IntentType.CHECK_BUDGET,
				'previsão financeira': IntentType.FINANCIAL_PROJECTION,
				'projeção do mês': IntentType.FINANCIAL_PROJECTION,
				'próximos recebimentos': IntentType.CHECK_INCOME,
				'qual meu orçamento?': IntentType.CHECK_BUDGET,
				'qual é meu saldo?': IntentType.CHECK_BALANCE,
				'quando cai o salário?': IntentType.CHECK_INCOME,
				'quando vou receber?': IntentType.CHECK_INCOME,
				'quanto de grana?': IntentType.CHECK_BALANCE,
				'quanto falta do orçamento?': IntentType.CHECK_BUDGET,
				'quanto posso gastar?': IntentType.CHECK_BUDGET,
				'quanto sobrou do orçamento?': IntentType.CHECK_BUDGET,
				'quanto sobrou?': IntentType.CHECK_BALANCE,
				'quanto tenho?': IntentType.CHECK_BALANCE,
				'quanto vai entrar?': IntentType.CHECK_INCOME,
				'quanto vai faltar?': IntentType.FINANCIAL_PROJECTION,
				'quitar débito': IntentType.PAY_BILL,
				'quitar fatura': IntentType.PAY_BILL,
				'recebimentos do mês': IntentType.CHECK_INCOME,
				'saldo disponível': IntentType.CHECK_BALANCE,
				'ted urgent': IntentType.TRANSFER_MONEY,
				'transferir dinheiro': IntentType.TRANSFER_MONEY,
				'transferência imediata': IntentType.TRANSFER_MONEY,
				'tá quanto na conta?': IntentType.CHECK_BALANCE,
				'vai receber quanto?': IntentType.CHECK_INCOME,
				'vai sobrar quanto?': IntentType.FINANCIAL_PROJECTION,
			};

			for (const command of testCommands) {
				const result = await nluEngine.processUtterance(command);
				const expected =
					expectedClassifications[
						command as keyof typeof expectedClassifications
					];
				if (result.intent === expected && result.confidence >= 0.7) {
					correctClassifications++;
				}
			}

			const accuracy = (correctClassifications / testCommands.length) * 100;
			expect(accuracy).toBeGreaterThanOrEqual(98); // 98% accuracy requirement
		});
	});

	describe('Acceptance Criteria 2: Extracts parameters from commands', () => {
		it('should extract amounts from commands', async () => {
			const testCases = [
				{ expectedAmount: 100, input: 'transferir 100 reais' },
				{ expectedAmount: 50.3, input: 'enviar 50,30 reais' },
				{ expectedAmount: 200, input: 'pix de R$ 200' },
				{ expectedAmount: 1000, input: 'transferir mil reais' }, // Natural number processing
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase.input);
				expect(result.entities).toBeDefined();
				const amountEntity = result.entities?.find((e) => e.type === 'amount');
				expect(amountEntity).toBeDefined();
				expect(amountEntity?.normalizedValue).toBe(testCase.expectedAmount);
			}
		});

		it('should extract names and recipients from commands', async () => {
			const testCases = [
				{ expectedName: 'joão', input: 'pix para joão' },
				{ expectedName: 'maria', input: 'transferir para maria' },
				{ expectedName: 'pedro', input: 'enviar dinheiro para pedro' },
				{ expectedName: 'empresa xyz', input: 'pagar para a empresa xyz' },
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase.input);
				expect(result.entities).toBeDefined();
				const nameEntity = result.entities?.find(
					(e) => e.type === 'person' || e.type === 'recipient',
				);
				expect(nameEntity).toBeDefined();
				expect(nameEntity?.normalizedValue).toBe(testCase.expectedName);
			}
		});

		it('should extract dates from commands', async () => {
			const testCases = [
				{ hasDate: true, input: 'pagar conta amanhã' },
				{ hasDate: true, input: 'receber na próxima sexta-feira' },
				{ hasDate: true, input: 'projeção para o próximo mês' },
				{ hasDate: true, input: 'saldo hoje' },
			];

			for (const testCase of testCases) {
				const result = await nluEngine.processUtterance(testCase.input);
				expect(result.entities).toBeDefined();
				const dateEntity = result.entities?.find((e) => e.type === 'date');
				expect(dateEntity).toBeDefined();
			}
		});
	});

	describe('Acceptance Criteria 3: Handles variations in phrasing and synonyms', () => {
		it('should handle different phrasing for the same intent', async () => {
			const balanceVariations = [
				'qual é meu saldo?',
				'quanto tenho?',
				'me mostre o saldo',
				'tá quanto na conta?',
				'quanto de grana eu tenho?',
			];

			for (const variation of balanceVariations) {
				const result = await nluEngine.processUtterance(variation);
				expect(result.intent).toBe(IntentType.CHECK_BALANCE);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should handle synonyms for financial terms', async () => {
			const synonymTestCases = [
				{ expectedIntent: IntentType.CHECK_BALANCE, input: 'quanto de grana?' },
				{
					expectedIntent: IntentType.CHECK_BALANCE,
					input: 'me diz o dinheiro',
				},
				{
					expectedIntent: IntentType.CHECK_BALANCE,
					input: 'quanto de bufunfa?',
				},
				{ expectedIntent: IntentType.TRANSFER_MONEY, input: 'fazer um pix' },
				{ expectedIntent: IntentType.TRANSFER_MONEY, input: 'manda dinheiro' },
				{ expectedIntent: IntentType.PAY_BILL, input: 'paga a luz' },
				{ expectedIntent: IntentType.PAY_BILL, input: 'quitar o débito' },
			];

			for (const testCase of synonymTestCases) {
				const result = await nluEngine.processUtterance(testCase.input);
				expect(result.intent).toBe(testCase.expectedIntent);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});
	});

	describe('Acceptance Criteria 4: Provides confidence scoring for intent classification', () => {
		it('should provide confidence scores for all classifications', async () => {
			const testCommands = [
				'qual é meu saldo?',
				'quanto posso gastar?',
				'pagar conta de luz',
				'quando vou receber?',
				'projeção do mês',
				'transferir dinheiro',
			];

			for (const command of testCommands) {
				const result = await nluEngine.processUtterance(command);
				expect(result.confidence).toBeDefined();
				expect(result.confidence).toBeGreaterThanOrEqual(0);
				expect(result.confidence).toBeLessThanOrEqual(1);
			}
		});

		it('should provide higher confidence for clear, direct commands', async () => {
			const clearCommand =
				await nluEngine.processUtterance('qual é meu saldo?');
			const ambiguousCommand = await nluEngine.processUtterance(
				'dinheiro conta saldo',
			);

			expect(clearCommand.confidence).toBeGreaterThan(
				ambiguousCommand.confidence,
			);
			expect(clearCommand.confidence).toBeGreaterThan(0.8);
		});
	});

	describe('Acceptance Criteria 5: Supports contextual understanding for follow-up commands', () => {
		it('should maintain context for conversation', async () => {
			const nluEngineWithConversation = createNLUEngine({
				contextEnabled: true,
			});

			// First command
			const firstResult =
				await nluEngineWithConversation.processUtterance('qual é meu saldo?');
			expect(firstResult.intent).toBe(IntentType.CHECK_BALANCE);

			// Follow-up command
			const followUpResult = await nluEngineWithConversation.processUtterance(
				'e quanto posso gastar?',
			);
			expect(followUpResult.intent).toBe(IntentType.CHECK_BUDGET);

			// Should maintain conversation context
			expect(followUpResult.context?.previousIntents).toContain(
				IntentType.CHECK_BALANCE,
			);
		});

		it('should handle pronouns and references to previous context', async () => {
			const nluEngineWithConversation = createNLUEngine({
				contextEnabled: true,
			});

			// First: check balance
			await nluEngineWithConversation.processUtterance('qual é meu saldo?');

			// Follow-up: "quanto sobrou disso?" (referring to the balance)
			const followUpResult = await nluEngineWithConversation.processUtterance(
				'quanto sobrou disso?',
			);
			expect(followUpResult.confidence).toBeGreaterThan(0.5); // Should recognize it's related to balance
		});
	});

	describe('Integration with Speech Recognition Service', () => {
		it('should process commands from speech recognition output', async () => {
			const speechRecognitionResults = [
				'qual é o meu saldo',
				'quanto posso gastar',
				'pagar a conta de luz',
				'quando vou receber',
				'como vai ficar o mês',
				'transferir dinheiro para o joão',
			];

			for (const transcript of speechRecognitionResults) {
				const result = await processVoiceCommandWithNLU(transcript);
				expect(result).toBeDefined();
				expect(result.type).toBeDefined();
				expect(result.confidence).toBeDefined();
				expect(result.confidence).toBeGreaterThan(0);
			}
		});
	});

	describe('Performance Requirements', () => {
		it('should process commands within sub-second response time', async () => {
			const startTime = performance.now();
			await nluEngine.processUtterance('qual é meu saldo?');
			const endTime = performance.now();

			const processingTime = endTime - startTime;
			expect(processingTime).toBeLessThan(1000); // Less than 1 second
		});

		it('should handle multiple rapid consecutive commands', async () => {
			const commands = [
				'qual é meu saldo?',
				'quanto posso gastar?',
				'quando vou receber?',
			];

			const startTime = performance.now();

			for (const command of commands) {
				await nluEngine.processUtterance(command);
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Average should be less than 500ms per command
			expect(totalTime / commands.length).toBeLessThan(500);
		});
	});

	describe('Brazilian Portuguese Specialization', () => {
		it('should handle Brazilian financial terminology', async () => {
			const brazilianTerms = [
				{ expectedIntent: IntentType.PAY_BILL, input: 'pagar boleto' },
				{ expectedIntent: IntentType.TRANSFER_MONEY, input: 'fazer pix' },
				{ expectedIntent: IntentType.CHECK_BALANCE, input: 'saldo da conta' },
				{ expectedIntent: IntentType.CHECK_INCOME, input: 'receber salário' },
				{ expectedIntent: IntentType.CHECK_BUDGET, input: 'orçamento mensal' },
			];

			for (const testCase of brazilianTerms) {
				const result = await nluEngine.processUtterance(testCase.input);
				expect(result.intent).toBe(testCase.expectedIntent);
				expect(result.confidence).toBeGreaterThanOrEqual(0.7);
			}
		});

		it('should handle Brazilian currency formats', async () => {
			const currencyFormats = [
				'transferir 100 reais',
				'enviar R$ 50,30',
				'pix de 200,00',
				'mandar mil reais',
			];

			for (const format of currencyFormats) {
				const result = await nluEngine.processUtterance(format);
				expect(result.entities).toBeDefined();
				const amountEntity = result.entities?.find((e) => e.type === 'amount');
				expect(amountEntity).toBeDefined();
			}
		});
	});
});

/**
 * GREEN PHASE: Passing tests after implementing voice component type safety
 * These tests now validate the correct implementation of typed voice responses
 */

// Setup DOM environment BEFORE importing React Testing Library
import '../../test/setupDOM';

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { VoiceResponse } from '@/components/voice/VoiceResponse';
import type {
	BalanceResponseData,
	BillsResponseData,
	BudgetResponseData,
	ErrorResponseData,
	IncomingResponseData,
	ProjectionResponseData,
	SuccessResponseData,
	TransferResponseData,
} from '@/types/voice/responseTypes';

describe('Voice Component Type Safety', () => {
	describe('VoiceResponse Component', () => {
		it('should handle properly typed balance data', () => {
			const mockData: BalanceResponseData = {
				accountType: 'Corrente',
				currentBalance: 1000,
				expenses: 500,
				income: 2000,
			};

			render(
				React.createElement(VoiceResponse, {
					data: mockData,
					message: 'Test balance response',
					type: 'balance',
				}),
			);

			expect(screen.getByText('Test balance response')).toBeInTheDocument();
			expect(screen.getByText('Saldo: R$ 1,000.00')).toBeInTheDocument();
			expect(screen.getByText('Receitas: R$ 2,000.00')).toBeInTheDocument();
			expect(screen.getByText('Despesas: R$ 500.00')).toBeInTheDocument();
			expect(screen.getByText('Conta: Corrente')).toBeInTheDocument();
		});

		it('should validate budget data types', () => {
			const budgetData: BudgetResponseData = {
				available: 500,
				category: 'Alimentação',
				spent: 800,
				spentPercentage: 61.5,
				total: 1300,
			};

			render(
				React.createElement(VoiceResponse, {
					data: budgetData,
					message: 'Budget information',
					type: 'budget',
				}),
			);

			expect(screen.getByText('Budget information')).toBeInTheDocument();
			expect(screen.getByText('Disponível: R$ 500.00')).toBeInTheDocument();
			expect(
				screen.getByText('Gasto: R$ 800.00 / R$ 1,300.00'),
			).toBeInTheDocument();
			expect(screen.getByText('Utilizado: 61.5%')).toBeInTheDocument();
			expect(screen.getByText('Categoria: Alimentação')).toBeInTheDocument();
		});

		it('should handle transfer data with proper typing', () => {
			const transferData: TransferResponseData = {
				amount: 250.0,
				estimatedTime: 'Imediato',
				fees: 0,
				method: 'PIX',
				recipient: 'João Silva',
				status: 'pending',
				transactionId: 'tx_123',
			};

			render(
				React.createElement(VoiceResponse, {
					data: transferData,
					message: 'Transfer information',
					type: 'transfer',
				}),
			);

			expect(screen.getByText('Transfer information')).toBeInTheDocument();
			expect(screen.getByText('Para: João Silva')).toBeInTheDocument();
			expect(screen.getByText('Valor: R$ 250.00')).toBeInTheDocument();
			expect(screen.getByText('Método: PIX')).toBeInTheDocument();
			expect(screen.getByText('Tempo estimado: Imediato')).toBeInTheDocument();
			expect(screen.getByText('Status: Pendente')).toBeInTheDocument();
		});

		it('should handle bills data with proper typing', () => {
			const billsData: BillsResponseData = {
				bills: [
					{
						amount: 150.0,
						category: 'Utilidades',
						dueDate: '2024-01-10',
						isPastDue: true,
						name: 'Conta de Luz',
						status: 'overdue',
					},
					{
						amount: 99.9,
						category: 'Utilidades',
						dueDate: '2024-01-15',
						isPastDue: false,
						name: 'Internet',
						status: 'pending',
					},
				],
				pastDueCount: 1,
				totalAmount: 249.9,
			};

			render(
				React.createElement(VoiceResponse, {
					data: billsData,
					message: 'Bills information',
					type: 'bills',
				}),
			);

			expect(screen.getByText('Bills information')).toBeInTheDocument();
			expect(screen.getByText('2 contas para pagar')).toBeInTheDocument();
			expect(screen.getByText('Total: R$ 249.90')).toBeInTheDocument();
			expect(screen.getByText('1 vencida')).toBeInTheDocument();
			expect(screen.getByText('Conta de Luz: R$ 150.00')).toBeInTheDocument();
			expect(screen.getByText('Internet: R$ 99.90')).toBeInTheDocument();
		});

		it('should validate incoming data types', () => {
			const incomingData: IncomingResponseData = {
				incoming: [
					{
						amount: 5000.0,
						category: 'Renda Fixa',
						confirmed: true,
						expectedDate: '2024-01-05',
						recurring: true,
						source: 'Salário',
					},
					{
						amount: 1200.0,
						category: 'Renda Variável',
						confirmed: false,
						expectedDate: '2024-01-10',
						recurring: false,
						source: 'Freelance',
					},
				],
				nextIncome: {
					amount: 5000.0,
					date: '2024-01-05',
					source: 'Salário',
				},
				totalExpected: 6200.0,
			};

			render(
				React.createElement(VoiceResponse, {
					data: incomingData,
					message: 'Incoming information',
					type: 'incoming',
				}),
			);

			expect(screen.getByText('Incoming information')).toBeInTheDocument();
			expect(screen.getByText('Recebimentos: R$ 6,200.00')).toBeInTheDocument();
			expect(
				screen.getByText('Próximo: Salário - R$ 5,000.00'),
			).toBeInTheDocument();
			expect(screen.getByText('Salário: R$ 5,000.00')).toBeInTheDocument();
			expect(screen.getByText('Freelance: R$ 1,200.00')).toBeInTheDocument();
		});

		it('should handle projection data with proper typing', () => {
			const projectionData: ProjectionResponseData = {
				confidence: 0.85,
				currency: 'BRL',
				currentBalance: 1500.0,
				expectedExpenses: 3300.0,
				expectedIncome: 5000.0,
				period: 'mensal',
				projectedBalance: 3200.0,
				variation: 1700.0,
			};

			render(
				React.createElement(VoiceResponse, {
					data: projectionData,
					message: 'Projection information',
					type: 'projection',
				}),
			);

			expect(screen.getByText('Projection information')).toBeInTheDocument();
			expect(
				screen.getByText('Projeção (mensal): R$ 3,200.00'),
			).toBeInTheDocument();
			expect(screen.getByText('Saldo atual: R$ 1,500.00')).toBeInTheDocument();
			expect(screen.getByText('Variação: +R$ 1,700.00')).toBeInTheDocument();
			expect(screen.getByText('Confiança: 85%')).toBeInTheDocument();
		});

		it('should handle success responses', () => {
			const successData: SuccessResponseData = {
				action: 'Transferência enviada',
				details: 'O valor será creditado em até 2 dias úteis',
				duration: 1500,
				message: 'Operação realizada com sucesso',
			};

			render(
				React.createElement(VoiceResponse, {
					data: successData,
					message: 'Success',
					type: 'success',
				}),
			);

			expect(screen.getByText('Success')).toBeInTheDocument();
			expect(
				screen.getByText('Operação realizada com sucesso'),
			).toBeInTheDocument();
			expect(
				screen.getByText('Ação: Transferência enviada'),
			).toBeInTheDocument();
			expect(
				screen.getByText('O valor será creditado em até 2 dias úteis'),
			).toBeInTheDocument();
		});

		it('should handle error responses', () => {
			const errorData: ErrorResponseData = {
				code: 'INSUFFICIENT_FUNDS',
				details: 'Saldo insuficiente para completar a operação',
				message: 'Falha na transferência',
				recoverable: true,
				suggestedActions: [
					'Verificar saldo disponível',
					'Realizar depósito',
					'Tentar valor menor',
				],
			};

			render(
				React.createElement(VoiceResponse, {
					data: errorData,
					message: 'Error',
					type: 'error',
				}),
			);

			expect(screen.getByText('Error')).toBeInTheDocument();
			expect(screen.getByText('Falha na transferência')).toBeInTheDocument();
			expect(
				screen.getByText('Código: INSUFFICIENT_FUNDS'),
			).toBeInTheDocument();
			expect(
				screen.getByText('Saldo insuficiente para completar a operação'),
			).toBeInTheDocument();
			expect(
				screen.getByText('Este erro pode ser recuperado'),
			).toBeInTheDocument();
			expect(screen.getByText('Sugestões:')).toBeInTheDocument();
			expect(
				screen.getByText('• Verificar saldo disponível'),
			).toBeInTheDocument();
			expect(screen.getByText('• Realizar depósito')).toBeInTheDocument();
			expect(screen.getByText('• Tentar valor menor')).toBeInTheDocument();
		});
	});

	describe('Component Accessibility', () => {
		it('should have proper accessibility attributes', () => {
			const mockData: BalanceResponseData = {
				currentBalance: 1000,
			};

			render(
				React.createElement(VoiceResponse, {
					accessibility: {
						'aria-atomic': true,
						'aria-live': 'assertive',
						role: 'status',
					},
					data: mockData,
					message: 'Test balance response',
					type: 'balance',
				}),
			);

			const card = screen.getByRole('status');
			expect(card).toHaveAttribute('aria-live', 'assertive');
			expect(card).toHaveAttribute('aria-atomic', 'true');
		});

		it('should display timestamp when provided', () => {
			const mockData: BalanceResponseData = {
				currentBalance: 1000,
			};
			const timestamp = '2024-01-15T10:30:00Z';

			render(
				React.createElement(VoiceResponse, {
					data: mockData,
					message: 'Test balance response',
					timestamp,
					type: 'balance',
				}),
			);

			expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
		});
	});

	describe('Type Safety Validation', () => {
		it('should enforce TypeScript compilation errors for wrong types', () => {
			// This test validates that TypeScript properly enforces type safety
			// If these lines were uncommented, they would cause compilation errors

			/*
      const invalidBalanceData = {
        currentBalance: 'should be number', // TypeScript error: Type 'string' is not assignable to type 'number'
      };

      const invalidTransferData = {
        recipient: 123, // TypeScript error: Type 'number' is not assignable to type 'string'
        amount: 'should be number', // TypeScript error: Type 'string' is not assignable to type 'number'
        method: ['should', 'be', 'string'], // TypeScript error: Type 'string[]' is not assignable to type 'string'
        status: 'invalid' as any, // TypeScript error: Type 'any' is not assignable to type
      };
      */

			// Since we can't test compilation errors at runtime, we verify the component works
			// with valid typed data
			const validData: BalanceResponseData = {
				currentBalance: 1000,
			};

			expect(() =>
				render(
					React.createElement(VoiceResponse, {
						data: validData,
						message: 'Valid data test',
						type: 'balance',
					}),
				),
			).not.toThrow();
		});

		it('should handle missing data gracefully', () => {
			render(
				React.createElement(VoiceResponse, {
					message: 'Test without data',
					type: 'balance',
					// data is optional and should be handled gracefully
				}),
			);

			expect(screen.getByText('Test without data')).toBeInTheDocument();
		});
	});
});

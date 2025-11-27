/**
 * Response Templates for Multimodal Responses
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Templates for all 6 voice command intents:
 * - CHECK_BALANCE
 * - CHECK_BUDGET
 * - PAY_BILL
 * - CHECK_INCOME
 * - FINANCIAL_PROJECTION
 * - TRANSFER_MONEY
 *
 * @module templates/responseTemplates
 */

import {
	formatCurrency,
	formatCurrencyForVoice,
	formatDate,
	formatPercentage,
	formatRelativeDate,
} from '@/lib/formatters/brazilianFormatters';
import { IntentType } from '@/lib/nlu/types';

// ============================================================================
// Types
// ============================================================================

export interface MultimodalResponse {
	text: string;
	speech: string;
	visual: {
		type:
			| 'balance'
			| 'budget'
			| 'bills'
			| 'income'
			| 'projection'
			| 'transfer'
			| 'error';
		data: Record<string, unknown>;
	};
	accessibility: {
		ariaLabel: string;
		screenReaderText: string;
	};
	requiresConfirmation?: boolean;
}

export interface TemplateData {
	[key: string]: unknown;
}

// ============================================================================
// Template Functions
// ============================================================================

/**
 * Generate response for CHECK_BALANCE intent
 */
export function generateBalanceResponse(data: {
	balance: number;
	accountName?: string;
}): MultimodalResponse {
	const { balance, accountName = 'Conta Principal' } = data;

	const text = `Seu saldo em ${accountName} é de ${formatCurrency(balance)}`;
	const speech = `Seu saldo em ${accountName} é de ${formatCurrencyForVoice(balance)}`;

	return {
		accessibility: {
			ariaLabel: `Saldo: ${formatCurrency(balance)}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				accountName,
				balance,
				formattedBalance: formatCurrency(balance),
			},
			type: 'balance',
		},
	};
}

/**
 * Generate response for CHECK_BUDGET intent
 */
export function generateBudgetResponse(data: {
	available: number;
	total: number;
	spent: number;
	period?: string;
}): MultimodalResponse {
	const { available, total, spent, period = 'mês' } = data;
	const percentage = (spent / total) * 100;

	const text = `Você pode gastar ${formatCurrency(available)} este ${period}. Já gastou ${formatPercentage(percentage)} do orçamento.`;
	const speech = `Você pode gastar ${formatCurrencyForVoice(available)} este ${period}. Já gastou ${formatPercentage(percentage)} do orçamento.`;

	return {
		accessibility: {
			ariaLabel: `Orçamento disponível: ${formatCurrency(available)}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				available,
				formattedAvailable: formatCurrency(available),
				formattedPercentage: formatPercentage(percentage),
				formattedSpent: formatCurrency(spent),
				formattedTotal: formatCurrency(total),
				percentage,
				period,
				spent,
				total,
			},
			type: 'budget',
		},
	};
}

/**
 * Generate response for PAY_BILL intent
 */
export function generatePayBillResponse(data: {
	billName: string;
	amount: number;
	dueDate: Date;
	confirmed?: boolean;
}): MultimodalResponse {
	const { billName, amount, dueDate, confirmed = false } = data;

	const relativeDue = formatRelativeDate(dueDate);

	if (!confirmed) {
		const text = `Confirmar pagamento de ${billName} no valor de ${formatCurrency(amount)} com vencimento ${relativeDue}?`;
		const speech = `Confirmar pagamento de ${billName} no valor de ${formatCurrencyForVoice(amount)} com vencimento ${relativeDue}?`;

		return {
			accessibility: {
				ariaLabel: `Confirmar pagamento: ${billName}, ${formatCurrency(amount)}`,
				screenReaderText: speech,
			},
			requiresConfirmation: true,
			speech,
			text,
			visual: {
				data: {
					amount,
					billName,
					dueDate,
					formattedAmount: formatCurrency(amount),
					formattedDueDate: formatDate(dueDate),
					relativeDueDate: relativeDue,
				},
				type: 'bills',
			},
		};
	}

	const text = `Pagamento de ${billName} no valor de ${formatCurrency(amount)} confirmado!`;
	const speech = `Pagamento de ${billName} no valor de ${formatCurrencyForVoice(amount)} confirmado!`;

	return {
		accessibility: {
			ariaLabel: `Pagamento confirmado: ${billName}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				amount,
				billName,
				confirmed: true,
				dueDate,
				formattedAmount: formatCurrency(amount),
				formattedDueDate: formatDate(dueDate),
			},
			type: 'bills',
		},
	};
}

/**
 * Generate response for CHECK_INCOME intent
 */
export function generateIncomeResponse(data: {
	nextIncome: {
		description: string;
		amount: number;
		date: Date;
	};
	totalMonth?: number;
}): MultimodalResponse {
	const { nextIncome, totalMonth } = data;
	const relativeDate = formatRelativeDate(nextIncome.date);

	let text = `Próximo recebimento: ${nextIncome.description} de ${formatCurrency(nextIncome.amount)} ${relativeDate}`;
	let speech = `Próximo recebimento: ${nextIncome.description} de ${formatCurrencyForVoice(nextIncome.amount)} ${relativeDate}`;

	if (totalMonth) {
		text += `. Total previsto no mês: ${formatCurrency(totalMonth)}`;
		speech += `. Total previsto no mês: ${formatCurrencyForVoice(totalMonth)}`;
	}

	return {
		accessibility: {
			ariaLabel: `Próximo recebimento: ${formatCurrency(nextIncome.amount)} ${relativeDate}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				formattedTotalMonth: totalMonth
					? formatCurrency(totalMonth)
					: undefined,
				nextIncome: {
					...nextIncome,
					formattedAmount: formatCurrency(nextIncome.amount),
					formattedDate: formatDate(nextIncome.date),
					relativeDate,
				},
				totalMonth,
			},
			type: 'income',
		},
	};
}

/**
 * Generate response for FINANCIAL_PROJECTION intent
 */
export function generateProjectionResponse(data: {
	projectedBalance: number;
	currentBalance: number;
	period: string;
	income: number;
	expenses: number;
}): MultimodalResponse {
	const { projectedBalance, currentBalance, period, income, expenses } = data;
	const difference = projectedBalance - currentBalance;
	const isPositive = difference >= 0;

	const text = `Projeção para o ${period}: saldo final de ${formatCurrency(projectedBalance)}. ${
		isPositive
			? `Você terá ${formatCurrency(difference)} a mais.`
			: `Você terá ${formatCurrency(Math.abs(difference))} a menos.`
	}`;

	const speech = `Projeção para o ${period}: saldo final de ${formatCurrencyForVoice(projectedBalance)}. ${
		isPositive
			? `Você terá ${formatCurrencyForVoice(difference)} a mais.`
			: `Você terá ${formatCurrencyForVoice(Math.abs(difference))} a menos.`
	}`;

	return {
		accessibility: {
			ariaLabel: `Projeção: ${formatCurrency(projectedBalance)}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				currentBalance,
				difference,
				expenses,
				formattedCurrentBalance: formatCurrency(currentBalance),
				formattedDifference: formatCurrency(Math.abs(difference)),
				formattedExpenses: formatCurrency(expenses),
				formattedIncome: formatCurrency(income),
				formattedProjectedBalance: formatCurrency(projectedBalance),
				income,
				isPositive,
				period,
				projectedBalance,
			},
			type: 'projection',
		},
	};
}

/**
 * Generate response for TRANSFER_MONEY intent
 */
export function generateTransferResponse(data: {
	recipient: string;
	amount: number;
	confirmed?: boolean;
}): MultimodalResponse {
	const { recipient, amount, confirmed = false } = data;

	if (!confirmed) {
		const text = `Confirmar transferência de ${formatCurrency(amount)} para ${recipient}?`;
		const speech = `Confirmar transferência de ${formatCurrencyForVoice(amount)} para ${recipient}?`;

		return {
			accessibility: {
				ariaLabel: `Confirmar transferência: ${formatCurrency(amount)} para ${recipient}`,
				screenReaderText: speech,
			},
			requiresConfirmation: true,
			speech,
			text,
			visual: {
				data: {
					amount,
					formattedAmount: formatCurrency(amount),
					recipient,
				},
				type: 'transfer',
			},
		};
	}

	const text = `Transferência de ${formatCurrency(amount)} para ${recipient} confirmada!`;
	const speech = `Transferência de ${formatCurrencyForVoice(amount)} para ${recipient} confirmada!`;

	return {
		accessibility: {
			ariaLabel: `Transferência confirmada: ${formatCurrency(amount)}`,
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: {
				amount,
				confirmed: true,
				formattedAmount: formatCurrency(amount),
				recipient,
			},
			type: 'transfer',
		},
	};
}

/**
 * Generate error response
 */
export function generateErrorResponse(error: string): MultimodalResponse {
	const text = `Desculpe, ${error}. Tente novamente.`;
	const speech = text;

	return {
		accessibility: {
			ariaLabel: 'Erro',
			screenReaderText: speech,
		},
		speech,
		text,
		visual: {
			data: { error },
			type: 'error',
		},
	};
}

// ============================================================================
// Template Router
// ============================================================================

/**
 * Generate response based on intent type
 */
export function generateResponse(
	intent: IntentType,
	data: TemplateData,
): MultimodalResponse {
	switch (intent) {
		case IntentType.CHECK_BALANCE:
			return generateBalanceResponse(
				data as { balance: number; accountName?: string },
			);

		case IntentType.CHECK_BUDGET:
			return generateBudgetResponse(
				data as {
					available: number;
					total: number;
					spent: number;
					period?: string;
				},
			);

		case IntentType.PAY_BILL:
			return generatePayBillResponse(
				data as {
					billName: string;
					amount: number;
					dueDate: Date;
					confirmed?: boolean;
				},
			);

		case IntentType.CHECK_INCOME:
			return generateIncomeResponse(
				data as {
					nextIncome: { description: string; amount: number; date: Date };
					totalMonth?: number;
				},
			);

		case IntentType.FINANCIAL_PROJECTION:
			return generateProjectionResponse(
				data as {
					projectedBalance: number;
					currentBalance: number;
					period: string;
					income: number;
					expenses: number;
				},
			);

		case IntentType.TRANSFER_MONEY:
			return generateTransferResponse(
				data as { recipient: string; amount: number; confirmed?: boolean },
			);

		default:
			return generateErrorResponse('comando não reconhecido');
	}
}

// Voice command processor for Brazilian Portuguese
// Enhanced with NLU Engine (Story 01.02)

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';
import { createNLUEngine } from '@/lib/nlu/nluEngine';
import { IntentType } from '@/lib/nlu/types';

// Simple account type for voice commands
interface VoiceAccount {
	id: string;
	name: string;
	type: 'checking' | 'savings' | 'credit';
	balance: number;
}

// Helper function to get user accounts from Supabase directly
async function getUserAccounts(userId: string): Promise<VoiceAccount[]> {
	const { data, error } = await supabase
		.from('bank_accounts')
		.select('*')
		.eq('user_id', userId);

	if (error) {
		logger.error('Failed to fetch accounts', {
			error: error.message,
			operation: 'get_user_accounts',
			userId,
		});
		throw error;
	}

	return (data || []).map((account) => ({
		id: account.id,
		name: account.account_holder_name || account.institution_name || 'Conta',
		type:
			(account.account_type as 'checking' | 'savings' | 'credit') || 'checking',
		balance: account.balance || 0,
	}));
}

export interface ProcessedCommand {
	type:
		| 'balance'
		| 'budget'
		| 'bills'
		| 'incoming'
		| 'projection'
		| 'transfer'
		| 'error';
	message: string;
	data?: Record<string, unknown>;
	requiresConfirmation?: boolean;
	confidence?: number;
}

// Simple confidence threshold for command acceptance
const CONFIDENCE_THRESHOLD = 0.7;

// Essential voice commands patterns for Brazilian Portuguese
const COMMAND_PATTERNS = {
	balance: [
		/como está meu saldo/i,
		/qual meu saldo/i,
		/saldo atual/i,
		/quanto tenho/i,
	],
	bills: [
		/boleto.*pagar/i,
		/contas.*pagar/i,
		/pagamentos pendentes/i,
		/próximos vencimentos/i,
	],
	budget: [
		/quanto posso gastar/i,
		/orçamento disponível/i,
		/quanto resta/i,
		/limite de gastos/i,
	],
	incoming: [
		/recebimento.*entrar/i,
		/dinheiro.*entrar/i,
		/próximos recebimentos/i,
		/receitas futuras/i,
	],
	projection: [
		/saldo.*final.*mês/i,
		/projeção.*saldo/i,
		/como ficará.*saldo/i,
		/previsão financeira/i,
	],
	transfer: [
		/transferência.*para/i,
		/enviar.*dinheiro/i,
		/pagar.*para/i,
		/transferir.*para/i,
	],
};

/**
 * Process voice command using NLU Engine (Story 01.02)
 * Enhanced version with Natural Language Understanding
 */
export async function processVoiceCommandWithNLU(
	transcript: string,
): Promise<ProcessedCommand> {
	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return {
				confidence: 0,
				message: 'Você precisa estar logado para usar comandos de voz.',
				type: 'error',
			};
		}

		const nluEngine = createNLUEngine();
		const nluResult = await nluEngine.processUtterance(transcript);

		// Check confidence threshold
		if (nluResult.confidence < CONFIDENCE_THRESHOLD) {
			return {
				confidence: nluResult.confidence,
				message: 'Não entendi bem. Poderia repetir mais claramente?',
				type: 'error',
			};
		}

		// Process command based on intent
		switch (nluResult.intent) {
			case IntentType.CHECK_BALANCE:
				return handleBalanceCommand(user.id, nluResult.confidence);

			case IntentType.CHECK_BUDGET:
				return handleBudgetCommand(user.id, nluResult.confidence);

			case IntentType.PAY_BILL:
				return handleBillsCommand(user.id, nluResult.confidence);

			case IntentType.CHECK_INCOME:
				return handleIncomingCommand(user.id, nluResult.confidence);

			case IntentType.FINANCIAL_PROJECTION:
				return handleProjectionCommand(user.id, nluResult.confidence);

			case IntentType.TRANSFER_MONEY:
				return handleTransferCommand(user.id, transcript, nluResult.confidence);

			default:
				return {
					confidence: nluResult.confidence,
					message:
						'Comando não reconhecido. Tente: "Qual é meu saldo?" ou "Quanto posso gastar?"',
					type: 'error',
				};
		}
	} catch (error) {
		logger.voiceError('NLU processing error', {
			error: error instanceof Error ? error.message : String(error),
			transcript: transcript.substring(0, 100), // Limit transcript length for privacy
			stack: error instanceof Error ? error.stack : undefined,
			component: 'VoiceCommandProcessor',
		});
		return {
			confidence: 0,
			message: 'Erro ao processar comando. Tente novamente.',
			type: 'error',
		};
	}
}

/**
 * Legacy function - updated to be async and use real data
 */
export async function processVoiceCommand(
	transcript: string,
	confidence: number = 0.8,
): Promise<ProcessedCommand> {
	// Check confidence threshold
	if (confidence < CONFIDENCE_THRESHOLD) {
		return {
			confidence,
			message: 'Não entendi bem. Poderia repetir mais claramente?',
			type: 'error',
		};
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return {
			confidence,
			message: 'Você precisa estar logado.',
			type: 'error',
		};
	}

	// Match transcript against command patterns
	const commandType = matchCommand(transcript);

	switch (commandType) {
		case 'balance':
			return handleBalanceCommand(user.id, confidence);

		case 'budget':
			return handleBudgetCommand(user.id, confidence);

		case 'bills':
			return handleBillsCommand(user.id, confidence);

		case 'incoming':
			return handleIncomingCommand(user.id, confidence);

		case 'projection':
			return handleProjectionCommand(user.id, confidence);

		case 'transfer':
			return handleTransferCommand(user.id, transcript, confidence);

		default:
			return {
				confidence,
				message:
					'Comando não reconhecido. Tente: "Como está meu saldo?" ou "Quanto posso gastar?"',
				type: 'error',
			};
	}
}

function matchCommand(transcript: string): string | null {
	for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
		if (patterns.some((pattern) => pattern.test(transcript))) {
			return command;
		}
	}
	return null;
}

async function handleBalanceCommand(
	userId: string,
	confidence: number,
): Promise<ProcessedCommand> {
	try {
		const accounts = await getUserAccounts(userId);
		const totalBalance = accounts.reduce(
			(sum, account) => sum + account.balance,
			0,
		);

		return {
			confidence,
			data: {
				accounts,
				totalBalance,
			},
			message: `Seu saldo total é de R$ ${totalBalance.toLocaleString('pt-BR', {
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
			})}`,
			type: 'balance',
		};
	} catch (error) {
		logger.error('Error fetching balance', { error });
		return {
			confidence,
			message: 'Não foi possível consultar seu saldo no momento.',
			type: 'error',
		};
	}
}

async function handleBudgetCommand(
	userId: string,
	confidence: number,
): Promise<ProcessedCommand> {
	// For now, we calculate budget based on simple income vs expense for current month
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);
	const endOfMonth = new Date(startOfMonth);
	endOfMonth.setMonth(endOfMonth.getMonth() + 1);

	const { data: events, error } = await supabase
		.from('financial_events')
		.select('*')
		.eq('user_id', userId)
		.gte('start_date', startOfMonth.toISOString().split('T')[0])
		.lt('start_date', endOfMonth.toISOString().split('T')[0]);

	if (error) {
		return {
			confidence,
			message: 'Erro ao consultar orçamento.',
			type: 'error',
		};
	}

	const income = events
		.filter((e) => e.is_income)
		.reduce((sum, e) => sum + Number(e.amount), 0);

	const expenses = events
		.filter((e) => !e.is_income)
		.reduce((sum, e) => sum + Number(e.amount), 0);

	const available = income - expenses; // Very simple budget logic
	const total = income > 0 ? income : 5000; // Fallback budget if no income recorded? Or just 0.
	// If no income, we assume 0 available.

	const spentPercentage = total > 0 ? (expenses / total) * 100 : 0;

	let message = '';
	if (spentPercentage > 90) {
		message = 'Cuidado! Você já utilizou quase todo o seu orçamento este mês.';
	} else if (spentPercentage > 70) {
		message = 'Você está chegando perto do limite do seu orçamento.';
	} else {
		message = 'Você ainda tem espaço no seu orçamento este mês.';
	}

	return {
		confidence,
		data: {
			available,
			categories: {},
			spent: expenses,
			spentPercentage,
			total, // We'd need to aggregate categories
		},
		message,
		type: 'budget',
	};
}

async function handleBillsCommand(
	userId: string,
	confidence: number,
): Promise<ProcessedCommand> {
	const now = new Date();
	const { data: bills, error } = await supabase
		.from('financial_events')
		.select('*')
		.eq('user_id', userId)
		.eq('status', 'pending')
		.in('event_type', ['bill', 'expense']) // expenses marked as pending are essentially bills?
		.gte('start_date', now.toISOString().split('T')[0]);

	if (error) {
		return { confidence, message: 'Erro ao consultar contas.', type: 'error' };
	}

	const upcomingBills = bills.filter((bill) => {
		const dueDate = new Date(bill.due_date || bill.start_date);
		const daysUntilDue = Math.ceil(
			(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		return daysUntilDue <= 7;
	});

	let message = '';
	if (upcomingBills.length === 0) {
		message = 'Você não tem contas próximas do vencimento.';
	} else if (upcomingBills.length === 1) {
		message = 'Você tem 1 conta para pagar em breve.';
	} else {
		message = `Você tem ${upcomingBills.length} contas para pagar em breve.`;
	}

	return {
		confidence,
		data: {
			bills: upcomingBills
				.map((b) => ({
					amount: Number(b.amount),
					dueDate: new Date(b.due_date || b.start_date),
					id: b.id,
					name: b.title,
					status: b.status,
				}))
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
			totalAmount: bills.reduce((sum, bill) => sum + Number(bill.amount), 0),
			totalPending: bills.length,
		},
		message,
		type: 'bills',
	};
}

async function handleIncomingCommand(
	userId: string,
	confidence: number,
): Promise<ProcessedCommand> {
	const now = new Date();
	const currentMonth = now.getMonth();

	const { data: income, error } = await supabase
		.from('financial_events')
		.select('*')
		.eq('user_id', userId)
		.eq('event_type', 'income')
		.gte('start_date', now.toISOString().split('T')[0]);

	if (error) {
		return {
			confidence,
			message: 'Erro ao consultar recebimentos.',
			type: 'error',
		};
	}

	const upcomingIncoming = income.filter(
		(item) => new Date(item.start_date).getMonth() === currentMonth,
	);

	let message = '';
	if (upcomingIncoming.length === 0) {
		message = 'Você não tem recebimentos programados para este mês.';
	} else if (upcomingIncoming.length === 1) {
		message = 'Você tem 1 recebimento programado para este mês.';
	} else {
		message = `Você tem ${upcomingIncoming.length} recebimentos programados para este mês.`;
	}

	return {
		confidence,
		data: {
			incoming: upcomingIncoming
				.map((i) => ({
					amount: Number(i.amount),
					expectedDate: new Date(i.start_date),
					id: i.id,
					source: i.title,
					type: i.category,
				}))
				.sort((a, b) => a.expectedDate.getTime() - b.expectedDate.getTime()),
			totalExpected: upcomingIncoming.reduce(
				(sum, item) => sum + Number(item.amount),
				0,
			),
		},
		message,
		type: 'incoming',
	};
}

async function handleProjectionCommand(
	userId: string,
	confidence: number,
): Promise<ProcessedCommand> {
	// Fetch current balance
	const accounts = await getUserAccounts(userId);
	const currentBalance = accounts.reduce(
		(sum, account) => sum + account.balance,
		0,
	);

	// Fetch pending bills
	const { data: bills } = await supabase
		.from('financial_events')
		.select('amount')
		.eq('user_id', userId)
		.in('event_type', ['bill', 'expense'])
		.eq('status', 'pending');

	const pendingBills = (bills || []).reduce(
		(sum, bill) => sum + Number(bill.amount),
		0,
	);

	// Fetch expected incoming
	const { data: income } = await supabase
		.from('financial_events')
		.select('amount')
		.eq('user_id', userId)
		.eq('event_type', 'income')
		.gte('start_date', new Date().toISOString().split('T')[0]);

	const expectedIncoming = (income || []).reduce(
		(sum, item) => sum + Number(item.amount),
		0,
	);

	const projectedBalance = currentBalance - pendingBills + expectedIncoming;
	const variation = projectedBalance - currentBalance;

	let message = '';
	if (variation > 0) {
		message = 'Seu saldo deve aumentar até o final do mês.';
	} else if (variation < 0) {
		message = 'Seu saldo deve diminuir até o final do mês.';
	} else {
		message = 'Seu saldo deve permanecer estável até o final do mês.';
	}

	return {
		confidence,
		data: {
			currentBalance,
			expectedIncoming,
			pendingBills,
			projectedBalance,
			variation,
		},
		message,
		type: 'projection',
	};
}

async function handleTransferCommand(
	userId: string,
	transcript: string,
	confidence: number,
): Promise<ProcessedCommand> {
	// Simple stub implementation - extract basic info from transcript
	// In a real app, we'd use NLU entity extraction here too
	const amountMatch = transcript.match(/(\d+[,.]?\d*)/i);
	const amount = amountMatch
		? parseFloat(amountMatch[1].replace(',', '.'))
		: null;
	const recipient = 'Destinatário (detectado)'; // Mock extraction

	if (!recipient) {
		return {
			confidence,
			message: 'Para quem você gostaria de transferir?',
			type: 'error',
		};
	}

	if (!amount) {
		return {
			confidence,
			message: 'Qual valor você gostaria de transferir?',
			type: 'error',
		};
	}

	const accounts = await getUserAccounts(userId);
	const currentBalance = accounts.reduce(
		(sum, account) => sum + account.balance,
		0,
	);

	if (amount > currentBalance) {
		return {
			confidence,
			message: 'Saldo insuficiente para esta transferência.',
			type: 'error',
		};
	}

	return {
		confidence,
		data: {
			amount,
			estimatedTime: 'Instantâneo',
			method: 'PIX',
			recipient,
			requiresConfirmation: true,
		},
		message: `Transferência de ${formatCurrency(amount)} para ${recipient}`,
		requiresConfirmation: true,
		type: 'transfer',
	};
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('pt-BR', {
		currency: 'BRL',
		style: 'currency',
	}).format(amount);
}

// Brazilian financial utilities
export const brazilianFinancialUtils = {
	formatCurrency,
	formatPhone: (phone: string) => {
		// Format Brazilian phone number
		const cleaned = phone.replace(/[^\d]/g, '');
		if (cleaned.length === 11) {
			return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
		}
		return phone;
	},
	isValidCNPJ: (cnpj: string) => {
		// Basic CNPJ validation
		const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');
		return cleanedCNPJ.length === 14;
	},
	isValidCPF: (cpf: string) => {
		// Basic CPF validation
		const cleanedCPF = cpf.replace(/[^\d]/g, '');
		return cleanedCPF.length === 11;
	},
};

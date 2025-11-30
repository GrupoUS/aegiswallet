// Voice command processor for Brazilian Portuguese
// Uses Clerk/Drizzle architecture with NeonDB
// Commands are processed via API calls for security

import { logger } from '@/lib/logging/logger';
import { createNLUEngine } from '@/lib/nlu/nluEngine';
import { IntentType } from '@/lib/nlu/types';

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
 *
 * Note: This now requires userId and authToken to be passed from the frontend
 * as we use API-based access instead
 */
export async function processVoiceCommandWithNLU(
	transcript: string,
	userId?: string,
	authToken?: string,
): Promise<ProcessedCommand> {
	try {
		if (!userId || !authToken) {
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

		// Process command based on intent via API
		const commandType = mapIntentToCommandType(nluResult.intent);
		return executeCommand(
			commandType,
			transcript,
			userId,
			authToken,
			nluResult.confidence,
		);
	} catch (error) {
		logger.voiceError('NLU processing error', {
			error: error instanceof Error ? error.message : String(error),
			transcript: transcript.substring(0, 100),
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

function mapIntentToCommandType(intent: IntentType): string | null {
	switch (intent) {
		case IntentType.CHECK_BALANCE:
			return 'balance';
		case IntentType.CHECK_BUDGET:
			return 'budget';
		case IntentType.PAY_BILL:
			return 'bills';
		case IntentType.CHECK_INCOME:
			return 'incoming';
		case IntentType.FINANCIAL_PROJECTION:
			return 'projection';
		case IntentType.TRANSFER_MONEY:
			return 'transfer';
		default:
			return null;
	}
}

/**
 * Legacy function - updated to be async and use API
 */
export async function processVoiceCommand(
	transcript: string,
	confidence: number = 0.8,
	userId?: string,
	authToken?: string,
): Promise<ProcessedCommand> {
	// Check confidence threshold
	if (confidence < CONFIDENCE_THRESHOLD) {
		return {
			confidence,
			message: 'Não entendi bem. Poderia repetir mais claramente?',
			type: 'error',
		};
	}

	if (!userId || !authToken) {
		return {
			confidence,
			message: 'Você precisa estar logado.',
			type: 'error',
		};
	}

	// Match transcript against command patterns
	const commandType = matchCommand(transcript);
	return executeCommand(commandType, transcript, userId, authToken, confidence);
}

function matchCommand(transcript: string): string | null {
	for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
		if (patterns.some((pattern) => pattern.test(transcript))) {
			return command;
		}
	}
	return null;
}

/**
 * Execute command via API call
 */
async function executeCommand(
	commandType: string | null,
	transcript: string,
	userId: string,
	authToken: string,
	confidence: number,
): Promise<ProcessedCommand> {
	if (!commandType) {
		return {
			confidence,
			message:
				'Comando não reconhecido. Tente: "Como está meu saldo?" ou "Quanto posso gastar?"',
			type: 'error',
		};
	}

	try {
		const response = await fetch('/api/v1/voice/command', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${authToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				command: commandType,
				transcript,
				userId,
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const result = await response.json();
		return {
			type: result.type || commandType,
			message: result.message,
			data: result.data,
			confidence,
			requiresConfirmation: result.requiresConfirmation,
		} as ProcessedCommand;
	} catch (error) {
		logger.error('Error executing voice command', { error, commandType });
		return {
			confidence,
			message: 'Não foi possível processar o comando no momento.',
			type: 'error',
		};
	}
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

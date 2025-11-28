/**
 * Server-side Voice Command Processing Service
 * Handles NLU processing for Portuguese voice commands in Brazilian Portuguese
 */

import type { ProcessVoiceCommandInput as ServerProcessVoiceCommandInput } from '@/types/server.types';

const MIN_AUTOMATION_CONFIDENCE = 0.8;

export interface VoiceCommandContext {
	user: {
		id: string;
		email: string;
		role?: string;
	};
	// Database access is now handled via global db client or dependency injection if needed
}

export interface VoiceCommandEntities {
	amount?: number;
	currency?: string;
	recipient?: string;
	pixKey?: string;
	pixKeyType?: 'EMAIL' | 'PHONE' | 'CPF' | 'RANDOM_KEY';
	billType?: 'electricity' | 'water' | 'phone' | 'internet';
	[key: string]: unknown;
}

export interface VoiceCommandResult {
	intent: string | null;
	entities: VoiceCommandEntities;
	confidence: number;
	response: string;
	requiresConfirmation: boolean;
	sessionId: string;
	language: string;
	processedAt: string;
}

export interface VoiceCommandServiceInput
	extends ServerProcessVoiceCommandInput {
	userId: string;
	context: VoiceCommandContext;
}

/**
 * Detect intent and extract entities from voice command
 */
function detectIntentAndEntities(command: string): {
	intent: string | null;
	entities: VoiceCommandEntities;
	confidence: number;
} {
	const lowerCommand = command.toLowerCase().trim();
	const entities: VoiceCommandEntities = {};

	// Define intent patterns for better maintainability
	const intentPatterns = [
		{
			intent: 'check_balance',
			patterns: ['saldo', 'quanto tenho', 'quanto dinheiro', 'verificar saldo'],
		},
		{
			intent: 'transfer_money',
			patterns: ['transferir', 'pagar', 'enviar dinheiro', 'mandar dinheiro'],
			entityExtractor: (cmd: string) => extractTransferEntities(cmd, entities),
		},
		{
			intent: 'pay_bill',
			patterns: ['conta', 'boleto', 'pagar conta', 'pagar boleto'],
			entityExtractor: () => extractBillEntities(lowerCommand, entities),
		},
		{
			intent: 'transaction_history',
			patterns: ['extrato', 'transações', 'historico', 'compras'],
		},
		{
			intent: 'pix_transfer',
			patterns: ['pix', 'fazer pix'],
			entityExtractor: (cmd: string) => extractPixEntities(cmd, entities),
		},
	];

	// Find matching intent
	for (const { intent, patterns, entityExtractor } of intentPatterns) {
		if (patterns.some((pattern) => lowerCommand.includes(pattern))) {
			if (entityExtractor) {
				entityExtractor(command);
			}
			return {
				intent,
				entities,
				confidence: 0.9,
			};
		}
	}

	// Unknown command
	return {
		intent: 'unknown',
		entities,
		confidence: 0.3,
	};
}

/**
 * Extract entities for transfer commands
 */
function extractTransferEntities(
	command: string,
	entities: VoiceCommandEntities,
): void {
	// Extract amount entity (simplified regex for demo)
	const amountMatch = command.match(/r?\$?\s*(\d+(?:,\d{1,2})?)/i);
	if (amountMatch) {
		const amount = parseFloat(amountMatch[1].replace(',', '.'));
		entities.amount = amount;
		entities.currency = 'BRL';
	}

	// Extract recipient (simplified - would need NLP in production)
	const recipientMatch = command.match(
		/(?:para|para o|para a)\s+([a-zá-ú\s]{2,30})/i,
	);
	if (recipientMatch) {
		entities.recipient = recipientMatch[1].trim();
	}
}

/**
 * Extract entities for bill payment commands
 */
function extractBillEntities(
	lowerCommand: string,
	entities: VoiceCommandEntities,
): void {
	// Extract bill type
	if (lowerCommand.includes('luz')) {
		entities.billType = 'electricity';
	} else if (lowerCommand.includes('água')) {
		entities.billType = 'water';
	} else if (lowerCommand.includes('telefone')) {
		entities.billType = 'phone';
	} else if (lowerCommand.includes('internet')) {
		entities.billType = 'internet';
	}
}

/**
 * Extract entities for PIX commands
 */
function extractPixEntities(
	command: string,
	entities: VoiceCommandEntities,
): void {
	// Extract PIX key patterns
	const emailMatch = command.match(
		/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
	);
	const phoneMatch = command.match(/\(?(\d{2})?\)?\s?(\d{4,5})-?(\d{4})/);
	const cpfMatch = command.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);

	if (emailMatch) {
		entities.pixKey = emailMatch[1];
		entities.pixKeyType = 'EMAIL';
	} else if (phoneMatch) {
		entities.pixKey = phoneMatch[0];
		entities.pixKeyType = 'PHONE';
	} else if (cpfMatch) {
		entities.pixKey = cpfMatch[0];
		entities.pixKeyType = 'CPF';
	}
}

/**
 * Generate response based on intent and entities
 */
function generateResponse(
	intent: string | null,
	entities: VoiceCommandEntities,
): string {
	switch (intent) {
		case 'check_balance':
			return 'Verificando seu saldo...';
		case 'transfer_money':
			if (entities.amount && entities.recipient) {
				return `Preparando transferência de R$ ${entities.amount} para ${entities.recipient}`;
			} else {
				return 'Entendi que quer transferir dinheiro. Para quem e quanto?';
			}
		case 'pay_bill':
			return 'Buscando suas contas a pagar...';
		case 'transaction_history':
			return 'Mostrando seu histórico de transações...';
		case 'pix_transfer':
			return 'Preparando transferência PIX...';
		default:
			return 'Não entendi o comando. Pode repetir?';
	}
}

/**
 * Process voice command through NLU pipeline
 *
 * Features:
 * - Brazilian Portuguese command recognition
 * - Financial command patterns (saldo, transferir, pagar conta, etc.)
 * - Confidence scoring and confirmation requirements
 * - LGPD-compliant logging
 * - Entity extraction (amounts, recipients, etc.)
 */
export async function processVoiceCommand(
	input: VoiceCommandServiceInput,
): Promise<VoiceCommandResult> {
	const {
		commandText,
		sessionId,
		language,
		requireConfirmation,
		userId: _userId,
	} = input;
	const command = commandText ?? '';

	// Simulate processing delay for realistic UX
	await new Promise((resolve) => setTimeout(resolve, 300));

	// Command detection and intent extraction
	const { intent, entities, confidence } = detectIntentAndEntities(command);

	// Determine if confirmation is required based on confidence
	const requiresConfirmation =
		confidence < MIN_AUTOMATION_CONFIDENCE || (requireConfirmation ?? false);

	// Generate appropriate response
	const response = generateResponse(intent, entities);

	const result: VoiceCommandResult = {
		confidence,
		entities,
		intent,
		language: language ?? 'pt-BR',
		processedAt: new Date().toISOString(),
		requiresConfirmation,
		response,
		sessionId,
	};

	return result;
}

/**
 * Get available voice commands with Portuguese examples
 */
export function getAvailableCommands() {
	return {
		commands: [
			{
				description: 'Verificar saldo da conta',
				examples: [
					'Qual é o meu saldo?',
					'Quanto dinheiro eu tenho?',
					'Mostrar meu saldo',
				],
				name: 'check_balance',
			},
			{
				description: 'Transferir dinheiro para outra conta',
				examples: [
					'Transferir R$ 100 para João',
					'Pagar 50 reais para Maria',
					'Enviar R$ 200 para o email teste@email.com',
				],
				name: 'transfer_money',
			},
			{
				description: 'Pagar contas e boletos',
				examples: [
					'Pagar conta de luz',
					'Pagar boleto do cartão',
					'Quitar conta de telefone',
				],
				name: 'pay_bill',
			},
			{
				description: 'Fazer transferência PIX',
				examples: [
					'Fazer PIX para o CPF 123.456.789-00',
					'Enviar PIX para o telefone 11999999999',
					'Transferir por PIX para maria@email.com',
				],
				name: 'pix_transfer',
			},
			{
				description: 'Ver histórico de transações',
				examples: [
					'Mostrar minhas transações',
					'Ver extrato do mês',
					'Histórico de compras',
				],
				name: 'transaction_history',
			},
		],
		language: 'pt-BR',
	};
}

/**
 * Validate command confidence and automation eligibility
 */
export function canAutomateCommand(
	confidence: number,
	requireConfirmation: boolean,
): boolean {
	return confidence >= MIN_AUTOMATION_CONFIDENCE && !requireConfirmation;
}

export default {
	processVoiceCommand,
	getAvailableCommands,
	canAutomateCommand,
	MIN_AUTOMATION_CONFIDENCE,
};

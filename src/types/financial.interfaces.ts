/**
 * Comprehensive Financial Interfaces for Brazilian Market
 * Replaces all 'any' types with proper TypeScript interfaces
 * LGPD-compliant data structures with Brazilian financial system integration
 */

import { z } from 'zod';

// =============================================================================
// BRAZILIAN-SPECIFIC FINANCIAL TYPES
// =============================================================================

/**
 * CPF validation schema - Cadastro de Pessoas Físicas
 * Format: XXX.XXX.XXX-XX (11 digits)
 */
export const CPFSchema = z
	.string()
	.regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
	.transform((val) => (val.replace(/\D/g, '').length === 11 ? val : undefined));

/**
 * CNPJ validation schema - Cadastro Nacional da Pessoa Jurídica
 * Format: XX.XXX.XXX/XXXX-XX (14 digits)
 */
export const CNPJSchema = z
	.string()
	.regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido')
	.transform((val) => (val.replace(/\D/g, '').length === 14 ? val : undefined));

/**
 * PIX Key Types for Brazilian Instant Payment System
 */
export type PIXKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM_KEY';

/**
 * Brazilian Currency - BRL (Real)
 */
export type Currency = 'BRL';

/**
 * Brazilian Bank Account Types
 */
export type BankAccountType =
	| 'CHECKING'
	| 'SAVINGS'
	| 'INVESTMENT'
	| 'SALARY'
	| 'DIGITAL_WALLET';

/**
 * Brazilian Financial Institutions
 */
export interface BankInstitution {
	id: string;
	code: string; // COMPE code
	name: string;
	fullName: string;
	ispb: string; // Banco Central's identifier
}

// =============================================================================
// LGPD-COMPLIANT USER INTERFACES
// =============================================================================

/**
 * LGPD-compliant user profile with minimal data collection
 */
export interface LGPDUserProfile {
	id: string;
	email: string;
	fullName?: string; // Optional for privacy
	cpf?: string; // Optional and encrypted
	phone?: string; // Optional and encrypted
	birthDate?: string; // Optional and encrypted
	currency: Currency;
	language: 'pt-BR';
	timezone: string; // Brazilian timezones
	autonomyLevel: number; // 50-95% automation level
	preferences: UserPreferences;
	consent: UserConsentRecord[];
	createdAt: string;
	updatedAt: string;
	lastLogin?: string;
}

/**
 * User preferences with privacy-by-design
 */
export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	notifications: {
		email: boolean;
		push: boolean;
		sms: boolean;
		financialAlerts: boolean;
	};
	accessibility: {
		highContrast: boolean;
		largeText: boolean;
		screenReader: boolean;
		voiceFeedback: boolean;
	};
	financial: {
		autoCategorize: boolean;
		budgetAlerts: boolean;
		weeklySummary: boolean;
	};
	privacy: {
		dataRetentionMonths: number;
		analyticsConsent: boolean;
		marketingConsent: boolean;
	};
}

/**
 * LGPD consent records
 */
export interface UserConsentRecord {
	consentType:
		| 'DATA_PROCESSING'
		| 'MARKETING'
		| 'ANALYTICS'
		| 'VOICE_PROCESSING';
	consentVersion: string;
	granted: boolean;
	consentDate: string;
	ipAddress?: string; // Stored for security, not analytics
	userAgent?: string;
	withdrawnAt?: string;
}

// =============================================================================
// FINANCIAL EVENT INTERFACES
// =============================================================================

/**
 * Financial Event Categories for Brazilian Market
 */
export type FinancialEventCategory =
	| 'RECEITA' // Income
	| 'DESPESA_FIXA' // Fixed Expenses
	| 'DESPESA_VARIAVEL' // Variable Expenses
	| 'INVESTIMENTO' // Investment
	| 'EMPRESTIMO' // Loan
	| 'IMPOSTO' // Tax
	| 'TRANSPORTE' // Transportation
	| 'ALIMENTACAO' // Food
	| 'MORADIA' // Housing
	| 'SAUDE' // Health
	| 'EDUCACAO' // Education
	| 'LAZER' // Leisure
	| 'OUTROS'; // Other

/**
 * Brazilian-specific event types
 */
export type BrazilianEventType =
	| 'SALARIO'
	| 'DECIMO_TERCEIRO'
	| 'FERIAS'
	| 'ALUGUEL'
	| 'CONDOMINIO'
	| 'LUZ'
	| 'AGUA'
	| 'INTERNET'
	| 'CELULAR'
	| 'SUPERMERCADO'
	| 'RESTAURANTE'
	| 'TRANSPORTE_PUBLICO'
	| 'UBER_99'
	| 'COMBUSTIVEL'
	| 'PIX_TRANSFER'
	| 'TED_DOC'
	| 'BOLETO_PAGAMENTO'
	| 'CARTAO_CREDITO'
	| 'INVESTIMENTO_CDB'
	| 'INVESTIMENTO_TESOURO'
	| 'PREVIDENCIA'
	| 'PLANO_SAUDE';

/**
 * Core Financial Event interface
 */
export interface FinancialEvent {
	id: string;
	userId: string;
	title: string;
	description?: string;
	amount: number;
	isIncome: boolean;
	category: FinancialEventCategory;
	brazilianEventType?: BrazilianEventType;
	status: FinancialEventStatus;
	priority: FinancialEventPriority;
	startDate: string; // ISO 8601
	endDate: string; // ISO 8601
	dueDate?: string; // For bills
	allDay: boolean;
	isRecurring: boolean;
	recurrenceRule?: string; // RRULE format
	color: string;
	icon?: string;
	attachments?: string[];
	tags?: string[];
	metadata?: FinancialEventMetadata;
	installmentInfo?: InstallmentInfo;
	parentEventId?: string; // For recurring events
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	location?: string;
	notes?: string;
}

/**
 * Financial Event Status
 */
export type FinancialEventStatus =
	| 'PENDENTE' // Pending
	| 'CONFIRMADO' // Confirmed
	| 'CONCLUIDO' // Completed
	| 'CANCELADO' // Cancelled
	| 'ATRASADO' // Overdue
	| 'AGENDADO' // Scheduled
	| 'EM_PROCESSO'; // In Progress

/**
 * Financial Event Priority
 */
export type FinancialEventPriority =
	| 'BAIXA' // Low
	| 'NORMAL' // Normal
	| 'ALTA' // High
	| 'URGENTE'; // Urgent

/**
 * Financial Event Metadata
 */
export interface FinancialEventMetadata {
	merchantCategory?: string;
	confidence?: number; // AI confidence score
	dataSource?: 'MANUAL' | 'VOICE' | 'BANK_SYNC' | 'OCR' | 'API';
	originalText?: string; // Original voice/OCR text
	processingTime?: number; // milliseconds
	autoCategorized?: boolean;
	requiresConfirmation?: boolean;
	lastValidatedAt?: string;
	auditTrail?: AuditEntry[];
}

/**
 * Installment Information
 */
export interface InstallmentInfo {
	totalInstallments: number;
	currentInstallment: number;
	installmentAmount: number;
	remainingAmount: number;
	nextInstallmentDate?: string;
}

/**
 * Audit Entry for LGPD compliance
 */
export interface AuditEntry {
	timestamp: string;
	action: string;
	userId?: string;
	ipAddress?: string;
	userAgent?: string;
	oldValue?: unknown;
	newValue?: unknown;
}

// =============================================================================
// BANK ACCOUNT INTERFACES
// =============================================================================

/**
 * Bank Account interface for Brazilian banking system
 */
export interface BankAccount {
	id: string;
	userId: string;
	institution: BankInstitution;
	accountType: BankAccountType;
	accountHolderName?: string;
	accountNumber?: string; // Encrypted
	accountMask: string; // Masked display (****1234)
	balance: number;
	availableBalance?: number;
	currency: Currency;
	isActive: boolean;
	isPrimary: boolean;
	belvoAccountId?: string; // For bank integration
	lastSync?: string;
	syncStatus: 'SUCCESS' | 'PENDING' | 'ERROR';
	syncErrorMessage?: string;
	createdAt: string;
	updatedAt: string;
}

// =============================================================================
// PIX TRANSFER INTERFACES
// =============================================================================

/**
 * PIX Transfer interface
 */
export interface PIXTransfer {
	id: string;
	userId: string;
	amount: number;
	recipientName: string;
	recipientDocument?: string; // CPF/CNPJ
	recipientBank?: string;
	pixKey: string;
	pixKeyType: PIXKeyType;
	description?: string;
	status: PIXTransferStatus;
	initiationMethod: 'MANUAL' | 'VOICE' | 'SCHEDULED' | 'API';
	confirmationMethod?: 'BIOMETRIC' | 'PIN' | 'OTP' | 'PUSH';
	requiresConfirmation: boolean;
	endToEndId?: string; // Unique transaction identifier
	transactionId?: string;
	confirmedAt?: string;
	executedAt?: string;
	metadata?: PIXTransferMetadata;
	createdAt: string;
	updatedAt: string;
}

/**
 * PIX Transfer Status
 */
export type PIXTransferStatus =
	| 'PENDENTE'
	| 'AGENDADO'
	| 'EM_PROCESSO'
	| 'CONFIRMADO'
	| 'CONCLUIDO'
	| 'FALHOU'
	| 'CANCELADO'
	| 'ESTORNADO';

/**
 * PIX Transfer Metadata
 */
export interface PIXTransferMetadata {
	confidence?: number;
	voiceCommandText?: string;
	recipientAccountHistory?: boolean;
	fraudDetectionScore?: number;
	requiresAdditionalVerification?: boolean;
	limitExceeded?: boolean;
	scheduledPaymentId?: string;
}

/**
 * PIX Key interface
 */
export interface PIXKey {
	id: string;
	userId: string;
	keyType: PIXKeyType;
	keyValue: string;
	label?: string;
	isActive: boolean;
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
}

// =============================================================================
// BOLETO INTERFACES (Brazilian Payment Slips)
// =============================================================================

/**
 * Boleto interface for Brazilian payment slips
 */
export interface Boleto {
	id: string;
	userId: string;
	barcode: string;
	digitableLine?: string;
	amount: number;
	dueDate: string;
	payeeName: string;
	payeeDocument?: string;
	description?: string;
	status: BoletoStatus;
	discountAmount?: number;
	fineAmount?: number;
	interestAmount?: number;
	captureMethod?: 'CAMERA' | 'MANUAL' | 'API' | 'VOICE';
	paymentConfirmation?: string;
	paidAt?: string;
	scheduledPaymentId?: string;
	metadata?: BoletoMetadata;
	createdAt: string;
	updatedAt: string;
}

/**
 * Boleto Status
 */
export type BoletoStatus =
	| 'PENDENTE'
	| 'VENCIDO'
	| 'PAGO'
	| 'CANCELADO'
	| 'AGENDADO_PAGAMENTO';

/**
 * Boleto Metadata
 */
export interface BoletoMetadata {
	confidence?: number;
	ocrConfidence?: number;
	voiceCommandText?: string;
	recognizedAmount?: number;
	recognizedDueDate?: string;
	duplicateCheck?: boolean;
	autoCategorized?: boolean;
}

// =============================================================================
// PAYMENT RULES INTERFACES
// =============================================================================

/**
 * Payment Rules for autonomous financial management
 */
export interface PaymentRule {
	id: string;
	userId: string;
	payeeName: string;
	payeeType: 'MERCHANT' | 'PERSON' | 'INSTITUTION' | 'UTILITY';
	payeeKey?: string; // PIX key, account number, etc.
	category?: FinancialEventCategory;
	maxAmount: number;
	autonomyLevel: number; // 50-95% automation level
	tolerancePercentage?: number;
	preferredTime?: string; // HH:mm format
	isActive: boolean;
	description?: string;
	metadata?: PaymentRuleMetadata;
	createdAt: string;
	updatedAt: string;
}

/**
 * Payment Rule Metadata
 */
export interface PaymentRuleMetadata {
	lastUsed?: string;
	successRate?: number;
	averageAmount?: number;
	paymentHistory?: PaymentHistoryEntry[];
	confidence?: number;
	requiresConfirmation?: boolean;
}

/**
 * Payment History Entry
 */
export interface PaymentHistoryEntry {
	date: string;
	amount: number;
	status: 'SUCCESS' | 'FAILED' | 'PENDING';
	processingTime?: number;
	confirmationMethod?: string;
}

// =============================================================================
// SCHEDULED PAYMENTS INTERFACES
// =============================================================================

/**
 * Scheduled Payment interface
 */
export interface ScheduledPayment {
	id: string;
	userId: string;
	amount: number;
	payeeName: string;
	payeeKey: string;
	paymentType: 'PIX' | 'TED' | 'BOLETO' | 'CARTAO';
	dueDate: string;
	scheduledTime: string;
	status: ScheduledPaymentStatus;
	ruleId?: string;
	requiresApproval: boolean;
	approvalMethod?: 'BIOMETRIC' | 'PIN' | 'OTP' | 'PUSH';
	approvedAt?: string;
	approvedBy?: string;
	executedAt?: string;
	executionAttempts: number;
	maxAttempts: number;
	lastAttemptAt?: string;
	errorCode?: string;
	errorMessage?: string;
	transactionId?: string;
	metadata?: ScheduledPaymentMetadata;
	createdAt: string;
	updatedAt: string;
}

/**
 * Scheduled Payment Status
 */
export type ScheduledPaymentStatus =
	| 'AGENDADO'
	| 'PENDENTE_APROVACAO'
	| 'APROVADO'
	| 'EM_PROCESSO'
	| 'CONCLUIDO'
	| 'FALHOU'
	| 'CANCELADO'
	| 'EXCEDIDO_TENTATIVAS';

/**
 * Scheduled Payment Metadata
 */
export interface ScheduledPaymentMetadata {
	confidence?: number;
	voiceCommandText?: string;
	scheduledBy: 'MANUAL' | 'VOICE' | 'RULE' | 'RECURRING';
	notificationsSent: number;
	lastNotificationAt?: string;
}

// =============================================================================
// VOICE COMMAND INTERFACES
// =============================================================================

/**
 * Voice Command interface
 */
export interface VoiceCommand {
	id: string;
	userId: string;
	commandText: string;
	recognizedText?: string;
	confidence?: number;
	intent: NLUIntent;
	entities: CommandEntity[];
	response?: string;
	actions: CommandAction[];
	sessionId: string;
	audioId?: string;
	processingTime?: number;
	status: VoiceCommandStatus;
	metadata?: VoiceCommandMetadata;
	createdAt: string;
	processedAt?: string;
}

/**
 * Voice Command Status
 */
export type VoiceCommandStatus =
	| 'PROCESSANDO'
	| 'PROCESSADO'
	| 'FALHOU'
	| 'REQUER_CONFIRMACAO'
	| 'EXECUTADO'
	| 'CANCELADO';

/**
 * NLU Intent interface
 */
export interface NLUIntent {
	type: string;
	confidence: number;
	parameters: Record<string, unknown>;
	context?: Record<string, unknown>;
}

/**
 * Command Entity interface
 */
export interface CommandEntity {
	type: string;
	value: string | number;
	confidence: number;
	startIndex?: number;
	endIndex?: number;
	metadata?: Record<string, unknown>;
}

/**
 * Command Action interface
 */
export interface CommandAction {
	type: string;
	parameters: Record<string, unknown>;
	requiresConfirmation: boolean;
	confirmationMessage?: string;
}

/**
 * Voice Command Metadata
 */
export interface VoiceCommandMetadata {
	audioDuration?: number;
	audioQuality?: number;
	backgroundNoise?: boolean;
	multipleSpeakers?: boolean;
	languageDetected?: string;
	accentDetected?: string;
	modelVersion?: string;
}

// =============================================================================
// FORM INTERFACES (React Hook Form)
// =============================================================================

/**
 * Financial Event Form Data interface
 */
export interface FinancialEventFormData {
	title: string;
	description?: string;
	amount: number;
	isIncome: boolean;
	category: FinancialEventCategory;
	brazilianEventType?: BrazilianEventType;
	startDate: string;
	endDate?: string;
	dueDate?: string;
	allDay: boolean;
	isRecurring: boolean;
	recurrenceRule?: string;
	priority: FinancialEventPriority;
	notes?: string;
	location?: string;
	tags?: string[];
	attachments?: string[];
	color?: string; // Added missing color field
	status?: FinancialEventStatus; // Added missing status field
}

/**
 * PIX Transfer Form Data interface
 */
export interface PIXTransferFormData {
	amount: number;
	recipientName: string;
	pixKey: string;
	pixKeyType: PIXKeyType;
	description?: string;
	scheduledDate?: string;
	requiresConfirmation: boolean;
}

/**
 * Boleto Form Data interface
 */
export interface BoletoFormData {
	barcode?: string;
	digitableLine?: string;
	amount: number;
	dueDate: string;
	payeeName: string;
	description?: string;
	autoSchedulePayment?: boolean;
}

/**
 * Payment Rule Form Data interface
 */
export interface PaymentRuleFormData {
	payeeName: string;
	payeeType: 'MERCHANT' | 'PERSON' | 'INSTITUTION' | 'UTILITY';
	payeeKey?: string;
	category?: FinancialEventCategory;
	maxAmount: number;
	autonomyLevel: number;
	tolerancePercentage?: number;
	preferredTime?: string;
	description?: string;
}

// =============================================================================
// VALIDATION SCHEMAS (Zod)
// =============================================================================

/**
 * Financial Event validation schema
 */
export const FinancialEventSchema = z.object({
	allDay: z.boolean(),
	amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
	attachments: z.array(z.string()).optional(),
	brazilianEventType: z
		.enum([
			'SALARIO',
			'DECIMO_TERCEIRO',
			'FERIAS',
			'PIS',
			'RENDIMENTO_EXTRA',
			'ALUGUEL',
			'PRESTACAO_IMOVEL',
			'FINANCIAMENTO_IMOVEL',
			'CONDOMINIO',
			'IPTU',
			'ENERGIA',
			'AGUA',
			'GAS',
			'INTERNET',
			'TELEFONE',
			'TV_ASSINATURA',
			'SUPERMERCADO',
			'RESTAURANTE',
			'TRANSPORTE_PUBLICO',
			'UBER',
			'COMBUSTIVEL',
			'SAUDE',
			'EDUCACAO',
			'PREVIDENCIA',
			'PLANO_SAUDE',
		])
		.optional(),
	category: z.enum([
		'RECEITA',
		'DESPESA_FIXA',
		'DESPESA_VARIAVEL',
		'TRANSPORTE',
		'ALIMENTACAO',
		'MORADIA',
		'SAUDE',
		'EDUCACAO',
		'LAZER',
		'OUTROS',
	]),
	description: z.string().trim().max(500, 'Descrição muito longa').optional(),
	dueDate: z
		.string()
		.datetime({ message: 'Data de vencimento inválida' })
		.optional(),
	endDate: z
		.string()
		.datetime({ message: 'Data de término inválida' })
		.optional(),
	isIncome: z.boolean(),
	isRecurring: z.boolean(),
	location: z.string().trim().max(200, 'Localização muito longa').optional(),
	notes: z.string().trim().max(1000, 'Notas muito longas').optional(),
	priority: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']),
	recurrenceRule: z
		.string()
		.regex(/^FREQ=/, 'Regra de recorrência inválida')
		.optional(),
	startDate: z.string().datetime({ message: 'Data de início inválida' }),
	tags: z.array(z.string().trim().max(50, 'Tag muito longa')).optional(),
	title: z
		.string()
		.trim()
		.min(1, 'Título é obrigatório')
		.max(100, 'Título muito longo'),
});

/**
 * PIX Transfer validation schema
 */
export const PIXTransferSchema = z.object({
	amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
	description: z.string().trim().max(200, 'Descrição muito longa').optional(),
	pixKey: z
		.string()
		.trim()
		.min(1, 'Chave PIX é obrigatória')
		.max(100, 'Chave PIX muito longa'),
	pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'CHAVE_ALEATORIA']),
	recipientName: z
		.string()
		.trim()
		.min(1, 'Nome do beneficiário é obrigatório')
		.max(100, 'Nome muito longo'),
	requiresConfirmation: z.boolean(),
	scheduledDate: z
		.string()
		.datetime({ message: 'Data agendada inválida' })
		.optional(),
});

/**
 * Boleto validation schema
 */
export const BoletoSchema = z
	.object({
		amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
		autoSchedulePayment: z.boolean().optional(),
		barcode: z
			.string()
			.trim()
			.regex(/^\d+$/, 'Código de barras deve conter apenas números')
			.optional(),
		description: z.string().trim().max(200, 'Descrição muito longa').optional(),
		digitableLine: z
			.string()
			.trim()
			.regex(/^\d+$/, 'Linha digitável deve conter apenas números')
			.optional(),
		dueDate: z.string().datetime({ message: 'Data de vencimento inválida' }),
		payeeName: z
			.string()
			.trim()
			.min(1, 'Nome do beneficiário é obrigatório')
			.max(100, 'Nome muito longo'),
	})
	.refine((data) => data.barcode || data.digitableLine, {
		message: 'Código de barras ou linha digitável é obrigatório',
		path: ['barcode'],
	});

/**
 * Payment Rule validation schema
 */
export const PaymentRuleSchema = z.object({
	autonomyLevel: z
		.number()
		.min(50)
		.max(95, 'Nível de autonomia deve estar entre 50 e 95'),
	category: z.enum([
		'RECEITA',
		'DESPESA_FIXA',
		'DESPESA_VARIAVEL',
		'TRANSPORTE',
		'ALIMENTACAO',
		'MORADIA',
		'SAUDE',
		'EDUCACAO',
		'LAZER',
		'OUTROS',
	]),
	description: z.string().optional(),
	maxAmount: z.number().min(0.01, 'Valor máximo deve ser maior que zero'),
	payeeKey: z.string().optional(),
	payeeName: z.string().min(1, 'Nome do beneficiário é obrigatório'),
	payeeType: z.enum(['MERCHANT', 'PERSON', 'INSTITUTION', 'UTILITY']),
	preferredTime: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido')
		.optional(),
	tolerancePercentage: z.number().min(0).max(100).optional(),
});

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract keys from interface for type-safe form fields
 */
export type FinancialEventFormKeys = keyof FinancialEventFormData;
export type PIXTransferFormKeys = keyof PIXTransferFormData;
export type BoletoFormKeys = keyof BoletoFormData;
export type PaymentRuleFormKeys = keyof PaymentRuleFormData;

/**
 * Database insert/update types
 */
export type FinancialEventInsert = Omit<
	FinancialEvent,
	'id' | 'createdAt' | 'updatedAt'
>;
export type FinancialEventUpdate = Partial<
	Omit<FinancialEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export type PIXTransferInsert = Omit<
	PIXTransfer,
	'id' | 'createdAt' | 'updatedAt'
>;
export type PIXTransferUpdate = Partial<
	Omit<PIXTransfer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export type BoletoInsert = Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>;
export type BoletoUpdate = Partial<
	Omit<Boleto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard functions for runtime validation
 */
export function isFinancialEvent(obj: unknown): obj is FinancialEvent {
	const event = obj as Record<string, unknown>;
	return (
		typeof event === 'object' &&
		event !== null &&
		typeof event.id === 'string' &&
		typeof event.userId === 'string' &&
		typeof event.title === 'string' &&
		typeof event.amount === 'number' &&
		typeof event.isIncome === 'boolean' &&
		typeof event.startDate === 'string' &&
		typeof event.endDate === 'string'
	);
}

export function isPIXTransfer(obj: unknown): obj is PIXTransfer {
	const transfer = obj as Record<string, unknown>;
	return (
		typeof transfer === 'object' &&
		transfer !== null &&
		typeof transfer.id === 'string' &&
		typeof transfer.userId === 'string' &&
		typeof transfer.amount === 'number' &&
		typeof transfer.recipientName === 'string' &&
		typeof transfer.pixKey === 'string'
	);
}

export function isBoleto(obj: unknown): obj is Boleto {
	const boleto = obj as Record<string, unknown>;
	return (
		typeof boleto === 'object' &&
		boleto !== null &&
		typeof boleto.id === 'string' &&
		typeof boleto.userId === 'string' &&
		typeof boleto.amount === 'number' &&
		typeof boleto.dueDate === 'string' &&
		typeof boleto.payeeName === 'string' &&
		(typeof boleto.barcode === 'string' ||
			typeof boleto.digitableLine === 'string')
	);
}

export function isValidPIXKeyType(value: string): value is PIXKeyType {
	const validTypes: PIXKeyType[] = [
		'CPF',
		'CNPJ',
		'EMAIL',
		'PHONE',
		'RANDOM_KEY',
	];
	return validTypes.includes(value as PIXKeyType);
}

export function isValidCurrency(value: string): value is Currency {
	return value === 'BRL';
}

export function isBrazilianDocument(value: string): boolean {
	const cleanValue = value.replace(/\D/g, '');
	return cleanValue.length === 11 || cleanValue.length === 14;
}

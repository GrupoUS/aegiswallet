/**
 * PIX Transfer Type Definitions for AegisWallet
 *
 * BCB Compliance: These types ensure type safety for PIX transfer operations
 * and prevent invalid transfer types that could cause financial errors.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

export enum PixTransferType {
	CPF = 'cpf',
	PHONE = 'phone',
	EMAIL = 'email',
	RANDOM_KEY = 'random_key',
}

/**
 * Type guard for PIX transfer type validation
 * Ensures only valid PIX transfer types are processed
 */
export function isValidPixTransferType(type: unknown): type is PixTransferType {
	return Object.values(PixTransferType).includes(type as PixTransferType);
}

/**
 * PIX transfer request interface for type-safe operations
 */
export interface PixTransferRequest {
	recipient: string;
	amount: number;
	type: PixTransferType;
	description?: string;
	createdAt: Date;
}

/**
 * PIX transfer response interface for API responses
 */
export interface PixTransferResponse {
	id: string;
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	request: PixTransferRequest;
	processedAt?: Date;
	errorMessage?: string;
}

/**
 * BCB-compliant PIX transaction metadata with enhanced validation
 */
export interface PixTransactionMetadata {
	transactionId: string;
	authCode: string;
	bankCode: string;
	processedAt: Date;
	lgpdConsent: boolean;
	// Security fields
	endToEndId?: string;
	transactionAmount: number;
	recipientInfo: {
		document: string; // CPF/CNPJ
		name?: string;
		ispb: string;
	};
	senderInfo: {
		document: string; // CPF/CNPJ
		name?: string;
		ispb: string;
	};
	// BCB requirements
	purpose?: string;
	remittanceInfo?: string;
}

/**
 * Enhanced PIX transfer request with security validation
 */
export interface SecurePixTransferRequest extends PixTransferRequest {
	// Security constraints
	dailyLimit: number;
	transactionLimit: number;
	requiresBiometric: boolean;
	lgpdConsent: {
		dataProcessing: boolean;
		transactionStorage: boolean;
		thirdPartySharing: boolean;
		timestamp: Date;
	};
	// Brazilian compliance fields
	recipientDocument: string; // CPF/CNPJ format
	recipientBank: string; // Bank code or ISPB
	purposeCode?: string; // Transaction purpose per BCB
}

/**
 * PIX transfer limits configuration (BCB compliant)
 */
export interface PixTransferLimits {
	dailyLimit: number; // R$ 10.000 per BCB regulation
	monthlyLimit: number; // R$ 100.000 per BCB regulation
	transactionLimit: number; // R$ 5.000 per transaction
	monthlyTransactionCount: number; // Maximum 100 transactions/month
	timeWindowMinutes: number; // Anti-fraud time window
}

/**
 * Default PIX transfer limits (BCB compliant)
 */
export const DEFAULT_PIX_LIMITS: PixTransferLimits = {
	dailyLimit: 10000, // R$ 10.000
	monthlyLimit: 100000, // R$ 100.000
	transactionLimit: 5000, // R$ 5.000
	monthlyTransactionCount: 100,
	timeWindowMinutes: 60, // 1 hour window
};

// ============================================================================
// Enhanced Security Validation Functions for PIX
// ============================================================================

/**
 * Validate CPF/CNPJ format (Brazilian document validation)
 */
export function validateBrazilianDocument(document: string): {
	isValid: boolean;
	type?: 'CPF' | 'CNPJ';
	error?: string;
} {
	const cleanDoc = document.replace(/\D/g, '');

	// CPF validation (11 digits)
	if (cleanDoc.length === 11) {
		// Basic CPF validation algorithm
		let sum = 0;
		let remainder: number;

		for (let i = 1; i <= 9; i++) {
			sum += Number.parseInt(cleanDoc.substring(i - 1, i), 10) * (11 - i);
		}

		remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) remainder = 0;
		if (remainder !== Number.parseInt(cleanDoc.substring(9, 10), 10)) {
			return { isValid: false, error: 'CPF inválido' };
		}

		sum = 0;
		for (let i = 1; i <= 10; i++) {
			sum += Number.parseInt(cleanDoc.substring(i - 1, i), 10) * (12 - i);
		}

		remainder = (sum * 10) % 11;
		if (remainder === 10 || remainder === 11) remainder = 0;
		if (remainder !== Number.parseInt(cleanDoc.substring(10, 11), 10)) {
			return { isValid: false, error: 'CPF inválido' };
		}

		return { isValid: true, type: 'CPF' };
	}

	// CNPJ validation (14 digits)
	if (cleanDoc.length === 14) {
		// Basic CNPJ validation
		const weightsFirstDigit = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
		const weightsSecondDigit = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

		let sum = 0;
		for (let i = 0; i < 12; i++) {
			sum += Number.parseInt(cleanDoc[i], 10) * weightsFirstDigit[i];
		}

		let remainder = sum % 11;
		const firstDigit = remainder < 2 ? 0 : 11 - remainder;

		if (firstDigit !== Number.parseInt(cleanDoc[12], 10)) {
			return { isValid: false, error: 'CNPJ inválido' };
		}

		sum = 0;
		for (let i = 0; i < 13; i++) {
			sum += Number.parseInt(cleanDoc[i], 10) * weightsSecondDigit[i];
		}

		remainder = sum % 11;
		const secondDigit = remainder < 2 ? 0 : 11 - remainder;

		if (secondDigit !== Number.parseInt(cleanDoc[13], 10)) {
			return { isValid: false, error: 'CNPJ inválido' };
		}

		return { isValid: true, type: 'CNPJ' };
	}

	return { isValid: false, error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' };
}

/**
 * Validate PIX transfer amount against BCB limits
 */
export function validatePixTransferAmount(
	amount: number,
	limits: PixTransferLimits = DEFAULT_PIX_LIMITS,
): { isValid: boolean; error?: string; suggestedLimit?: number } {
	if (Number.isNaN(amount) || amount <= 0) {
		return { isValid: false, error: 'Valor deve ser um número positivo' };
	}

	if (amount > limits.transactionLimit) {
		return {
			isValid: false,
			error: `Valor excede limite de R$ ${limits.transactionLimit.toLocaleString('pt-BR')} por transação`,
			suggestedLimit: limits.transactionLimit,
		};
	}

	if (amount > limits.dailyLimit) {
		return {
			isValid: false,
			error: `Valor excede limite diário de R$ ${limits.dailyLimit.toLocaleString('pt-BR')}`,
			suggestedLimit: limits.dailyLimit,
		};
	}

	return { isValid: true };
}

/**
 * Comprehensive type guard for PIX transaction metadata
 */
export function isValidPixTransactionMetadata(
	metadata: unknown,
): metadata is PixTransactionMetadata {
	if (typeof metadata !== 'object' || metadata === null) return false;

	const m = metadata as Record<string, unknown>;

	// Required fields validation
	if (!m.transactionId || typeof m.transactionId !== 'string' || m.transactionId.length < 20) {
		return false;
	}

	if (!m.authCode || typeof m.authCode !== 'string' || m.authCode.length !== 8) {
		return false;
	}

	if (!m.bankCode || typeof m.bankCode !== 'string' || !/^\d{3}$/.test(m.bankCode)) {
		return false;
	}

	if (!(m.processedAt && m.processedAt instanceof Date)) {
		return false;
	}

	if (typeof m.lgpdConsent !== 'boolean') {
		return false;
	}

	if (typeof m.transactionAmount !== 'number' || m.transactionAmount <= 0) {
		return false;
	}

	// Validate recipient and sender info
	if (!m.recipientInfo || typeof m.recipientInfo !== 'object') return false;
	if (!m.senderInfo || typeof m.senderInfo !== 'object') return false;

	const recipient = m.recipientInfo as Record<string, unknown>;
	const sender = m.senderInfo as Record<string, unknown>;

	// Recipient validation
	const recipientDocValidation = validateBrazilianDocument(recipient.document as string);
	if (!recipientDocValidation.isValid) return false;

	if (!recipient.ispb || typeof recipient.ispb !== 'string' || !/^\d{8}$/.test(recipient.ispb)) {
		return false;
	}

	// Sender validation
	const senderDocValidation = validateBrazilianDocument(sender.document as string);
	if (!senderDocValidation.isValid) return false;

	if (!sender.ispb || typeof sender.ispb !== 'string' || !/^\d{8}$/.test(sender.ispb)) {
		return false;
	}

	// Amount validation against limits
	const amountValidation = validatePixTransferAmount(m.transactionAmount);
	if (!amountValidation.isValid) return false;

	return true;
}

/**
 * Type guard for secure PIX transfer requests
 */
export function isValidSecurePixTransferRequest(
	request: unknown,
): request is SecurePixTransferRequest {
	if (typeof request !== 'object' || request === null) return false;

	const r = request as Record<string, unknown>;

	// Basic PixTransferRequest validation
	if (!r.recipient || typeof r.recipient !== 'string' || r.recipient.length < 3) {
		return false;
	}

	if (typeof r.amount !== 'number' || r.amount <= 0) {
		return false;
	}

	if (!isValidPixTransferType(r.type)) {
		return false;
	}

	if (!(r.createdAt && r.createdAt instanceof Date)) {
		return false;
	}

	// Security constraints validation
	if (typeof r.dailyLimit !== 'number' || r.dailyLimit <= 0) {
		return false;
	}

	if (typeof r.transactionLimit !== 'number' || r.transactionLimit <= 0) {
		return false;
	}

	if (typeof r.requiresBiometric !== 'boolean') {
		return false;
	}

	// Document validation
	const documentValidation = validateBrazilianDocument(r.recipientDocument as string);
	if (!documentValidation.isValid) {
		return false;
	}

	if (!r.recipientBank || typeof r.recipientBank !== 'string') {
		return false;
	}

	// LGPD consent validation
	if (!r.lgpdConsent || typeof r.lgpdConsent !== 'object') {
		return false;
	}

	const consent = r.lgpdConsent as Record<string, unknown>;
	if (
		typeof consent.dataProcessing !== 'boolean' ||
		typeof consent.transactionStorage !== 'boolean' ||
		typeof consent.thirdPartySharing !== 'boolean' ||
		!(consent.timestamp instanceof Date)
	) {
		return false;
	}

	return true;
}

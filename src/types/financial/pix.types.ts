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
 * BCB-compliant PIX transaction metadata
 */
export interface PixTransactionMetadata {
	transactionId: string;
	authCode: string;
	bankCode: string;
	processedAt: Date;
	lgpdConsent: boolean;
}

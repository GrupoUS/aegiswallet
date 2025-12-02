/**
 * Financial Transaction Type Definitions for AegisWallet
 *
 * LGPD Compliance: These types ensure type safety for financial transaction processing
 * and prevent accidental exposure of sensitive financial data.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
	REFUNDED = 'refunded',
}

/**
 * Transaction category enumeration
 */
export enum TransactionCategory {
	FOOD = 'food',
	TRANSPORT = 'transport',
	SHOPPING = 'shopping',
	ENTERTAINMENT = 'entertainment',
	BILLS = 'bills',
	HEALTHCARE = 'healthcare',
	EDUCATION = 'education',
	SALARY = 'salary',
	INVESTMENT = 'investment',
	OTHER = 'other',
}

/**
 * Base transaction interface
 */
export interface Transaction {
	id: string;
	userId: string;
	amount: number;
	currency: 'BRL';
	categoryId: string;
	description: string;
	date: Date;
	status: TransactionStatus;
	createdAt: Date;
	updatedAt: Date;
	recipient?: string;
	reference?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Transaction creation interface
 */
export interface CreateTransactionRequest {
	amount: number;
	description: string;
	categoryId: string;
	recipient?: string;
	reference?: string;
	date?: Date;
}

/**
 * Transaction update interface
 */
export interface UpdateTransactionRequest {
	id: string;
	amount?: number;
	description?: string;
	categoryId?: string;
	status?: TransactionStatus;
}

/**
 * Transaction validation schema
 */
export interface TransactionValidation {
	amount: {
		required: true;
		min: 0.01;
		max: 100000;
	};
	description: {
		required: true;
		minLength: 1;
		maxLength: 255;
	};
	categoryId: {
		required: true;
	};
	recipient: {
		required: false;
		pattern: RegExp;
	};
	reference: {
		required: false;
		maxLength: 50;
	};
}

/**
 * Type guard for transaction validation
 */
export function isValidTransaction(transaction: unknown): transaction is Transaction {
	if (!transaction || typeof transaction !== 'object') {
		return false;
	}

	const tx = transaction as Record<string, unknown>;

	return (
		typeof tx.id === 'string' &&
		typeof tx.userId === 'string' &&
		typeof tx.amount === 'number' &&
		tx.amount > 0 &&
		typeof tx.currency === 'string' &&
		tx.currency === 'BRL' &&
		typeof tx.categoryId === 'string' &&
		typeof tx.description === 'string' &&
		tx.date instanceof Date &&
		typeof tx.status === 'string' &&
		Object.values(TransactionStatus).includes(tx.status as TransactionStatus) &&
		tx.createdAt instanceof Date &&
		tx.updatedAt instanceof Date
	);
}

/**
 * Type guard for transaction creation request
 */
export function isValidCreateTransactionRequest(
	request: unknown,
): request is CreateTransactionRequest {
	if (!request || typeof request !== 'object') {
		return false;
	}

	const req = request as Record<string, unknown>;

	return (
		typeof req.amount === 'number' &&
		req.amount > 0 &&
		typeof req.description === 'string' &&
		req.description.length >= 1 &&
		req.description.length <= 255 &&
		typeof req.categoryId === 'string' &&
		(!('recipient' in req) || typeof req.recipient === 'string') &&
		(!('reference' in req) || typeof req.reference === 'string') &&
		(!('date' in req) || req.date instanceof Date)
	);
}

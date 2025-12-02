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
		maxLength: 50;
	};
}

/**
 * Type guard for transaction validation
 */
export function isValidTransaction(obj: unknown): obj is Transaction {
	if (!obj || typeof obj !== 'object') {
		return false;
	}

	const transaction = obj as Record<string, unknown>;

	return (
		typeof transaction.id === 'string' &&
		typeof transaction.userId === 'string' &&
		typeof transaction.amount === 'number' &&
		transaction.currency === 'BRL' &&
		typeof transaction.categoryId === 'string' &&
		typeof transaction.description === 'string' &&
		transaction.date instanceof Date &&
		Object.values(TransactionStatus).includes(transaction.status as TransactionStatus)
	);
}

/**
 * Type guard for create transaction request
 */
export function isValidCreateTransactionRequest(obj: unknown): obj is CreateTransactionRequest {
	if (!obj || typeof obj !== 'object') {
		return false;
	}

	const request = obj as Record<string, unknown>;

	return (
		typeof request.amount === 'number' &&
		request.amount > 0 &&
		typeof request.description === 'string' &&
		request.description.length > 0 &&
		typeof request.categoryId === 'string'
	);
}

/**
 * Transaction metadata interface
 */
export interface TransactionMetadata {
	paymentMethod?: string;
	location?: {
		name: string;
		address?: string;
	};
	tags?: string[];
	notes?: string;
}

/**
 * Transaction statistics interface
 */
export interface TransactionStatistics {
	totalAmount: number;
	transactionCount: number;
	averageAmount: number;
	categoryBreakdown: Record<string, number>;
	monthlyBreakdown: Record<string, number>;
}

/**
 * Transaction search filters
 */
export interface TransactionFilters {
	categoryId?: string;
	status?: TransactionStatus;
	dateFrom?: Date;
	dateTo?: Date;
	minAmount?: number;
	maxAmount?: number;
	searchTerm?: string;
}

/**
 * Transaction list response
 */
export interface TransactionListResponse {
	transactions: Transaction[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}

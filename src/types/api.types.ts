/**
 * API Response Types for AegisWallet
 * Provides type-safe interfaces for all API responses
 * compliant with LGPD and Brazilian financial regulations
 */

// =====================================================
// Base API Response Types
// =====================================================

/**
 * Standard API response wrapper for successful responses
 */
export interface ApiResponse<T = unknown> {
	data?: T;
	meta?: {
		requestId?: string;
		retrievedAt?: string;
		updatedAt?: string;
		createdAt?: string;
		total?: number;
	};
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
	code: string;
	error: string;
	details?: Record<string, unknown>;
}

/**
 * API response that can be either success or error
 */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

// =====================================================
// Transaction API Types
// =====================================================

/**
 * Transaction data structure
 */
export interface TransactionData {
	id: string;
	userId: string;
	amount: string;
	description: string;
	transactionType: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status: 'cancelled' | 'failed' | 'pending' | 'posted';
	transactionDate?: string;
	categoryId?: string;
	accountId?: string;
	paymentMethod?: string;
	merchantName?: string;
	notes?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Transaction list response
 */
export interface TransactionsListResponse {
	data: TransactionData[];
	meta: {
		requestId: string;
		retrievedAt: string;
		total: number;
	};
}

/**
 * Transaction statistics response
 */
export interface TransactionStatisticsResponse {
	data: {
		balance: number;
		expenses: number;
		income: number;
		period: 'week' | 'month' | 'quarter' | 'year';
		transactionsCount: number;
	};
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

/**
 * Transaction creation request
 */
export interface CreateTransactionRequest {
	amount: number;
	description: string;
	transactionType: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	transactionDate?: string;
	categoryId?: string;
	accountId?: string;
	paymentMethod?: string;
	merchantName?: string;
	notes?: string;
	tags?: string[];
}

/**
 * Transaction update request
 */
export interface UpdateTransactionRequest {
	amount?: number;
	description?: string;
	transactionType?: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	categoryId?: string;
	accountId?: string;
	paymentMethod?: string;
	merchantName?: string;
	notes?: string;
	tags?: string[];
}

// =====================================================
// Bank Accounts API Types
// =====================================================

/**
 * Bank account data structure
 */
export interface BankAccountData {
	id: string;
	userId: string;
	institutionName: string;
	institutionId?: string;
	accountType: 'checking' | 'savings' | 'investment' | 'cash';
	balance: string;
	currency: string;
	isPrimary: boolean;
	isActive: boolean;
	accountMask?: string;
	belvoAccountId?: string;
	syncStatus: 'manual' | 'auto' | 'pending' | 'error';
	createdAt: string;
	updatedAt: string;
}

/**
 * Bank accounts list response
 */
export interface BankAccountsListResponse {
	data: BankAccountData[];
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

/**
 * Total balance response
 */
export interface TotalBalanceResponse {
	data: Record<string, number>;
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

/**
 * Balance history item
 */
export interface BalanceHistoryItem {
	date: string;
	balance: number;
}

/**
 * Balance history response
 */
export interface BalanceHistoryResponse {
	data: BalanceHistoryItem[];
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

/**
 * Bank account creation request
 */
export interface CreateBankAccountRequest {
	institutionName: string;
	accountType: 'checking' | 'savings' | 'investment' | 'cash';
	balance: number;
	currency: string;
	isPrimary?: boolean;
	isActive?: boolean;
	accountMask?: string;
	institutionId?: string;
}

/**
 * Bank account update request
 */
export interface UpdateBankAccountRequest {
	institutionName?: string;
	accountType?: 'checking' | 'savings' | 'investment' | 'cash';
	balance?: number;
	currency?: string;
	isPrimary?: boolean;
	isActive?: boolean;
	accountMask?: string;
}

/**
 * Balance update request
 */
export interface UpdateBalanceRequest {
	balance: number;
}

// =====================================================
// Financial Events API Types
// =====================================================

/**
 * Financial event data structure
 */
export interface FinancialEventData {
	id: string;
	userId: string;
	title: string;
	description?: string;
	amount?: number;
	type: 'income' | 'expense';
	start: string;
	end: string;
	category?: string;
	location?: string;
	notes?: string;
	icon?: string;
	color?: string;
	allDay?: boolean;
	isRecurring?: boolean;
	recurrenceRule?: string;
	dueDate?: string;
	completedAt?: string;
	tags?: string[];
	attachments?: string[];
	isIncome?: boolean;
	brazilianEventType?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Financial events list response
 */
export interface FinancialEventsListResponse {
	data: FinancialEventData[];
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

// =====================================================
// Billing API Types
// =====================================================

/**
 * Subscription data structure
 */
export interface SubscriptionData {
	id: string;
	userId: string;
	status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid';
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	cancelAtPeriodEnd?: boolean;
	canceledAt?: string;
	planId?: string;
	stripeSubscriptionId?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Billing plan data structure
 */
export interface BillingPlanData {
	id: string;
	name: string;
	description?: string;
	price: number;
	currency: string;
	interval: 'month' | 'year';
	features: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Subscription response
 */
export interface SubscriptionResponse {
	subscription?: SubscriptionData;
	plan?: BillingPlanData;
}

/**
 * Plans response
 */
export interface PlansResponse {
	plans: BillingPlanData[];
}

/**
 * Payment methods response
 */
export interface PaymentMethodsResponse {
	methods: Array<{
		id: string;
		type: 'card' | 'bank_account' | 'pix';
		isDefault: boolean;
		last4?: string;
		bankName?: string;
		createdAt: string;
	}>;
}

/**
 * Invoices response
 */
export interface InvoicesResponse {
	invoices: Array<{
		id: string;
		number: string;
		status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
		amount: number;
		currency: string;
		dueDate?: string;
		paidAt?: string;
		createdAt: string;
	}>;
}

/**
 * Payment history response
 */
export interface PaymentHistoryResponse {
	payments: Array<{
		id: string;
		amount: number;
		currency: string;
		status: 'succeeded' | 'failed' | 'pending' | 'refunded';
		method: string;
		description?: string;
		createdAt: string;
	}>;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
	sessionId: string;
	url?: string;
	customerId?: string;
}

/**
 * Portal session response
 */
export interface PortalSessionResponse {
	url: string;
	customerId?: string;
}

// =====================================================
// Contacts API Types
// =====================================================

/**
 * Contact data structure
 */
export interface ContactData {
	id: string;
	userId: string;
	name: string;
	email?: string;
	phone?: string;
	cpf?: string;
	notes?: string;
	isFavorite?: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Contacts list response
 */
export interface ContactsListResponse {
	data: ContactData[];
	meta: {
		requestId: string;
		retrievedAt: string;
	};
}

/**
 * Contact creation request
 */
export interface CreateContactRequest {
	name: string;
	email?: string;
	phone?: string;
	cpf?: string;
	notes?: string;
	isFavorite?: boolean;
}

/**
 * Contact update request
 */
export interface UpdateContactRequest {
	name?: string;
	email?: string;
	phone?: string;
	cpf?: string;
	notes?: string;
	isFavorite?: boolean;
}

// =====================================================
// Error Types
// =====================================================

/**
 * Enhanced API error with Brazilian compliance context
 */
export interface EnhancedApiError extends Error {
	status?: number;
	code?: string;
	details?: Record<string, unknown>;
	requestId?: string;
	userId?: string;
	lgpdContext?: {
		dataAccess?: string;
		consentProvided?: boolean;
		retentionPeriod?: string;
	};
	brazilianCompliance?: {
		bcbCompliant?: boolean;
		pixValidated?: boolean;
		currencyFormat?: string;
	};
}

// =====================================================
// Request/Response Wrapper Types
// =====================================================

/**
 * API request context for logging and compliance
 */
export interface ApiRequestContext {
	requestId: string;
	userId?: string;
	method: string;
	url: string;
	timestamp: string;
	userAgent?: string;
	ipAddress?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
	data: {
		id: string;
		filename: string;
		size: number;
		mimeType: string;
		url?: string;
	};
	meta: {
		requestId: string;
		uploadedAt: string;
	};
}

// =====================================================
// Health Check Types
// =====================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
	status: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: string;
	version: string;
	services: {
		database: 'connected' | 'disconnected' | 'error';
		authentication: 'healthy' | 'error';
		payments: 'healthy' | 'error';
		external: 'healthy' | 'error';
	};
	uptime?: number;
	memory?: {
		used: number;
		total: number;
		percentage: number;
	};
}

// =====================================================
// Type Guards for API Responses
// =====================================================

/**
 * Type guard for API success response
 */
export function isApiSuccessResponse<T>(response: unknown): response is ApiResponse<T> {
	return typeof response === 'object' && response !== null && 'data' in response;
}

/**
 * Type guard for API error response
 */
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
	return typeof response === 'object' && response !== null && 'error' in response;
}

/**
 * Type guard for transaction data
 */
export function isTransactionData(data: unknown): data is TransactionData {
	return typeof data === 'object' && data !== null && 'id' in data && 'transactionType' in data;
}

/**
 * Type guard for bank account data
 */
export function isBankAccountData(data: unknown): data is BankAccountData {
	return typeof data === 'object' && data !== null && 'id' in data && 'accountType' in data;
}

/**
 * Type guard for financial event data
 */
export function isFinancialEventData(data: unknown): data is FinancialEventData {
	return typeof data === 'object' && data !== null && 'id' in data && 'type' in data;
}

/**
 * Type guard for contact data
 */
export function isContactData(data: unknown): data is ContactData {
	return typeof data === 'object' && data !== null && 'id' in data && 'name' in data;
}

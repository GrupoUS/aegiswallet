/**
 * Router Types for AegisWallet Brazilian Financial Application
 *
 * Comprehensive TypeScript definitions for TanStack Router integration
 * with authentication, financial operations, and performance optimizations
 */

// Define custom error type since inferRouterError isn't exported
export interface FinancialRouterError {
	message: string;
	code?: string;
	details?: {
		field?: string;
		validation?: Record<string, string[]>;
		transactionId?: string;
		stack?: string;
	};
	recoverable?: boolean;
	suggestion?: string;
}

// Brazilian financial route paths
export interface FinancialRoutePaths {
	// Core financial routes
	dashboard: '/dashboard';
	saldo: '/saldo';
	contas: '/contas';
	contasBancarias: '/contas-bancarias';

	// Transaction management
	calendario: '/calendario';

	// Settings and configuration
	configuracoes: '/configuracoes';
	settings: '/settings';

	// AI assistant
	aiChat: '/ai-chat';

	// Authentication
	login: '/login';
	signup: '/signup';

	// Legal and privacy
	privacidade: '/privacidade';

	// Home
	home: '/';
}

// Financial route parameters for transactions and accounts
export interface FinancialRouteParams {
	/**
	 * Transaction ID for editing/viewing specific transactions
	 * @example 'tx-12345'
	 */
	transactionId?: string;

	/**
	 * Account ID for viewing specific bank accounts
	 * @example 'acc-67890'
	 */
	accountId?: string;

	/**
	 * Date range for financial reports
	 * @example '2024-01-01:2024-01-31'
	 */
	dateRange?: string;

	/**
	 * Transaction type filter
	 * @example 'income' | 'expense' | 'transfer'
	 */
	transactionType?: 'income' | 'expense' | 'transfer';

	/**
	 * Currency filter (Brazilian real by default)
	 * @example 'BRL' | 'USD' | 'EUR'
	 */
	currency?: 'BRL' | 'USD' | 'EUR';
}

// Search parameters for financial routes
export interface FinancialSearchSchema extends FinancialRouteParams {
	/**
	 * Pagination offset
	 */
	offset?: number;

	/**
	 * Number of items per page
	 */
	limit?: number;

	/**
	 * Sort field for financial data
	 */
	sortBy?: 'date' | 'amount' | 'description' | 'category';

	/**
	 * Sort direction
	 */
	sortOrder?: 'asc' | 'desc';

	/**
	 * Filter by transaction category
	 * @example 'alimentação' | 'transporte' | 'moradia'
	 */
	category?: string;

	/**
	 * Minimum amount filter (in cents)
	 */
	minAmount?: number;

	/**
	 * Maximum amount filter (in cents)
	 */
	maxAmount?: number;

	/**
	 * Search term for descriptions
	 */
	search?: string;

	/**
	 * Authentication-related parameters
	 */
	redirect?: string;
	reason?: 'auth_required' | 'session_expired' | 'logout';
	welcome?: string;
}

// Route state for financial operations
export interface FinancialRouteState {
	/**
	 * Whether navigation originated from a financial transaction
	 */
	fromFinancialTransaction?: boolean;

	/**
	 * ID of the transaction being processed
	 */
	transactionId?: string;

	/**
	 * Type of financial operation being performed
	 */
	operation?: 'create' | 'edit' | 'delete' | 'view';

	/**
	 * Previous route for navigation history
	 */
	previousRoute?: string;

	/**
	 * Success message from previous operation
	 */
	successMessage?: string;

	/**
	 * Error message from previous operation
	 */
	errorMessage?: string;

	/**
	 * Financial form data to preserve during navigation
	 */
	preservedFormData?: Record<string, unknown>;
}

// Enhanced router error codes for Brazilian financial context
export type FinancialErrorCode =
	| 'INSUFFICIENT_FUNDS'
	| 'INVALID_AMOUNT'
	| 'ACCOUNT_NOT_FOUND'
	| 'UNAUTHORIZED'
	| 'UNKNOWN_ERROR';

// Route metadata for performance and SEO
export interface FinancialRouteMeta {
	/**
	 * Page title in Brazilian Portuguese
	 */
	title: string;

	/**
	 * Page description for SEO
	 */
	description?: string;

	/**
	 * Priority for preloading (1-10, higher = more important)
	 */
	preloadPriority?: number;

	/**
	 * Whether route requires real-time data updates
	 */
	requiresRealtime?: boolean;

	/**
	 * Expected page load time in milliseconds
	 */
	expectedLoadTime?: number;

	/**
	 * Accessibility compliance level
	 */
	accessibility?: 'AA' | 'AAA';

	/**
	 * LGPD compliance requirements
	 */
	lgpdCompliance?: {
		requiresConsent?: boolean;
		dataRetentionDays?: number;
		encryptAtRest?: boolean;
	};
}

// Financial route context for authentication and permissions
export interface FinancialRouteContext {
	/**
	 * Whether user has permission to access financial data
	 */
	hasFinancialAccess: boolean;

	/**
	 * User roles for financial operations
	 */
	roles: ('admin' | 'user' | 'readonly')[];

	/**
	 * Whether user can perform transactions
	 */
	canTransact: boolean;

	/**
	 * Whether user can view sensitive data
	 */
	canViewSensitiveData: boolean;

	/**
	 * User's preferred currency
	 */
	preferredCurrency: 'BRL' | 'USD' | 'EUR';

	/**
	 * User's language preference
	 */
	language: 'pt-BR' | 'en-US';
}

// Route loader data types
export interface FinancialRouteLoaderData {
	/**
	 * User's financial summary
	 */
	financialSummary?: {
		totalBalance: number;
		monthlyIncome: number;
		monthlyExpenses: number;
		accountCount: number;
	};

	/**
	 * Recent transactions
	 */
	recentTransactions?: Array<{
		id: string;
		description: string;
		amount: number;
		date: string;
		category: string;
	}>;

	/**
	 * User's bank accounts
	 */
	bankAccounts?: Array<{
		id: string;
		name: string;
		balance: number;
		type: string;
	}>;

	/**
	 * Real-time connection status
	 */
	realtimeStatus?: {
		connected: boolean;
		lastSync: string;
		pendingUpdates: number;
	};
}

// Type helpers for route inference
export type FinancialRouteId = string;

/**
 * Brazilian financial validation helpers
 */
export const financialValidators = {
	/**
	 * Validate Brazilian currency amount
	 */
	currency: (amount: string): boolean => {
		return /^\d{1,9}(\.\d{2})?$/.test(amount);
	},

	/**
	 * Validate Brazilian date format (DD/MM/YYYY or YYYY-MM-DD)
	 */
	date: (date: string): boolean => {
		return /^\d{2}\/\d{2}\/\d{4}$/.test(date) || /^\d{4}-\d{2}-\d{2}$/.test(date);
	},

	/**
	 * Validate Brazilian CPF (simplified)
	 */
	cpf: (cpf: string): boolean => {
		return /^\d{11}$/.test(cpf) || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
	},

	/**
	 * Validate Brazilian CNPJ (simplified)
	 */
	cnpj: (cnpj: string): boolean => {
		return /^\d{14}$/.test(cnpj) || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
	},
};

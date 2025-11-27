/**
 * API Bridge Types
 * Tipos de API para consistência entre frontend e backend
 */

// Base API Response Structure
export interface ApiResponse<T = unknown> {
	data: T;
	meta: {
		requestId: string;
		retrievedAt: string;
		total?: number;
	};
}

// Error Response Structure
export interface ApiError {
	error: string;
	code: string;
	details?: Record<string, unknown>;
}

// Paginated Response
export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		requestId: string;
		retrievedAt: string;
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

// Transaction Types
export interface Transaction {
	id: string;
	userId: string;
	amount: string;
	title: string;
	description?: string;
	eventType:
		| 'income'
		| 'expense'
		| 'bill'
		| 'scheduled'
		| 'transfer'
		| 'pix'
		| 'boleto';
	status: 'pending' | 'paid' | 'scheduled' | 'cancelled' | 'posted' | 'failed';
	startDate: string;
	endDate: string;
	category?: string;
	accountId?: string;
	createdAt: string;
	updatedAt: string;
	isIncome?: boolean;
	dueDate?: string;
	priority?: 'low' | 'normal' | 'high';
	tags?: string[];
}

export interface CreateTransactionInput {
	amount: number;
	description?: string;
	fromAccountId: string;
	toAccountId?: string;
	type: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	metadata?: Record<string, unknown>;
}

export interface TransactionFilters {
	limit?: number;
	offset?: number;
	categoryId?: string;
	accountId?: string;
	type?: 'transfer' | 'debit' | 'credit' | 'pix' | 'boleto';
	status?: 'cancelled' | 'failed' | 'pending' | 'posted';
	startDate?: string;
	endDate?: string;
	search?: string;
}

// User Profile Types
export interface UserProfile {
	id: string;
	email: string;
	fullName?: string;
	phone?: string;
	cpf?: string;
	birthDate?: string;
	autonomyLevel?: number;
	voiceCommandEnabled?: boolean;
	language?: string;
	timezone?: string;
	currency?: string;
	profileImageUrl?: string;
	isActive?: boolean;
	lastLogin?: string;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateProfileInput {
	full_name?: string;
	phone?: string;
}

export interface UserPreferences {
	id: string;
	userId: string;
	theme?: string;
	notificationsEmail?: boolean;
	notificationsPush?: boolean;
	notificationsSms?: boolean;
	autoCategorize?: boolean;
	budgetAlerts?: boolean;
	voiceFeedback?: boolean;
	accessibilityHighContrast?: boolean;
	accessibilityLargeText?: boolean;
	accessibilityScreenReader?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UpdatePreferencesInput {
	theme?: string;
	notifications_email?: boolean;
	notifications_push?: boolean;
	notifications_sms?: boolean;
	auto_categorize?: boolean;
	budget_alerts?: boolean;
	voice_feedback?: boolean;
}

// Financial Statistics
export interface FinancialStatistics {
	balance: number;
	expenses: number;
	income: number;
	period: 'week' | 'month' | 'quarter' | 'year';
	transactionsCount: number;
}

export interface StatisticsFilters {
	period?: 'week' | 'month' | 'quarter' | 'year';
	accountId?: string;
}

// Bank Account Types
export interface BankAccount {
	id: string;
	userId: string;
	name: string;
	type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
	provider?: string;
	balance: string;
	currency: string;
	isActive?: boolean;
	createdAt: string;
	updatedAt: string;
}

// Google Calendar Sync Types
export interface GoogleCalendarSyncStatus {
	googleEmail: string | null;
	isConnected: boolean;
	isEnabled: boolean;
	lastSyncAt: string | null;
}

export interface GoogleCalendarSyncSettings {
	auto_sync_interval_minutes: number;
	created_at: string;
	last_full_sync_at?: string;
	sync_categories: string[] | null;
	sync_direction: 'one_way_to_google' | 'one_way_from_google' | 'bidirectional';
	sync_enabled: boolean;
	sync_financial_amounts: boolean;
	sync_token?: string;
	updated_at: string;
	user_id: string;
}

export interface UpdateGoogleCalendarSettingsInput {
	auto_sync_interval_minutes?: number;
	sync_categories?: string[] | null;
	sync_direction?:
		| 'one_way_to_google'
		| 'one_way_from_google'
		| 'bidirectional';
	sync_enabled?: boolean;
	sync_financial_amounts?: boolean;
}

export interface GoogleCalendarSyncEventInput {
	direction: 'to_google' | 'from_google';
	eventId: string;
}

export interface GoogleCalendarSyncHistory {
	id: string;
	userId: string;
	action: string;
	eventId?: string;
	details: unknown;
	createdAt: string;
}

export interface SyncHistoryFilters {
	limit?: number;
}

// HTTP Method Aliases for API Client
export interface ApiMethods {
	get<T = unknown>(
		url: string,
		config?: RequestConfig,
	): Promise<ApiResponse<T>>;
	post<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig,
	): Promise<ApiResponse<T>>;
	put<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig,
	): Promise<ApiResponse<T>>;
	patch<T = unknown>(
		url: string,
		data?: unknown,
		config?: RequestConfig,
	): Promise<ApiResponse<T>>;
	delete<T = unknown>(
		url: string,
		config?: RequestConfig,
	): Promise<ApiResponse<T>>;
}

export interface RequestConfig {
	params?: Record<string, unknown>;
	headers?: Record<string, string>;
}

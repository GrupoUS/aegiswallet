import { z } from 'zod';

// Brazilian Financial Types
export const PixKeyTypeSchema = z.enum([
	'CPF',
	'CNPJ',
	'EMAIL',
	'PHONE',
	'RANDOM_KEY',
]);
export type PixKeyType = z.infer<typeof PixKeyTypeSchema>;

export const PixTransferStatusSchema = z.enum([
	'PENDING',
	'PROCESSING',
	'COMPLETED',
	'FAILED',
	'REVERSED',
	'SCHEDULED',
]);
export type PixTransferStatus = z.infer<typeof PixTransferStatusSchema>;

export const BoletoStatusSchema = z.enum([
	'REGISTERED',
	'PAID',
	'OVERDUE',
	'CANCELED',
	'SCHEDULED_FOR_PAYMENT',
]);
export type BoletoStatus = z.infer<typeof BoletoStatusSchema>;

// PIX Operations
export interface PixKey {
	id: string;
	key: string;
	keyType: PixKeyType;
	bankName: string;
	isActive: boolean;
	createdAt: string;
	isDefault?: boolean;
}

export interface PixTransfer {
	id: string;
	amount: number;
	recipientKey: string;
	recipientKeyType: PixKeyType;
	recipientName: string;
	description?: string;
	status: PixTransferStatus;
	endToEndId?: string;
	createdAt: string;
	scheduledFor?: string;
	completedAt?: string;
	failureReason?: string;
}

export interface PixQrCode {
	qrCode: string;
	qrCodeImage?: string;
	amount: number;
	recipientKey: string;
	description?: string;
	expiresAt?: string;
	createdAt: string;
}

// Boleto Operations
export interface Boleto {
	id: string;
	barcode: string;
	digitableLine: string;
	amount: number;
	dueDate: string;
	beneficiaryName: string;
	beneficiaryCnpj?: string;
	status: BoletoStatus;
	discountAmount?: number;
	fineAmount?: number;
	interestAmount?: number;
	captureMethod?: 'barcode' | 'image' | 'manual';
	paidAt?: string;
	scheduledPaymentId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface BoletoCalculation {
	originalAmount: number;
	discountAmount?: number;
	fineAmount?: number;
	interestAmount?: number;
	totalAmount: number;
	dueDate: string;
	paymentDate?: string;
	daysOverdue?: number;
}

// Contacts and Payment Methods
export interface Contact {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	cpf?: string;
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
}

// Database response types (snake_case as returned from NeonDB via Drizzle)
export interface ContactDbRow {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	cpf?: string;
	is_favorite: boolean;
	created_at: string;
	updated_at: string;
	user_id: string;
}

export interface ContactPaymentMethodDbRow {
	id: string;
	contact_id: string;
	payment_type: 'PIX' | 'TED' | 'DOC';
	pix_key?: string;
	pix_key_type?: PixKeyType;
	bank_code?: string;
	bank_name?: string;
	account_number?: string;
	account_type?: string;
	agency?: string;
	is_favorite: boolean;
	is_verified: boolean;
	label?: string;
	last_used_at?: string;
	usage_count: number;
}

export interface ContactWithPaymentMethods extends ContactDbRow {
	contact_payment_methods: ContactPaymentMethodDbRow[];
}

export interface ContactPaymentMethod {
	id: string;
	contactId: string;
	paymentType: 'PIX' | 'TED' | 'DOC';
	pixKey?: string;
	pixKeyType?: PixKeyType;
	bankCode?: string;
	bankName?: string;
	accountNumber?: string;
	accountType?: string;
	agency?: string;
	isFavorite: boolean;
	isVerified: boolean;
	label?: string;
	lastUsedAt?: string;
	usageCount: number;
}

// Financial Insights
export interface SpendingAnalysis {
	period: { startDate: string; endDate: string };
	totalSpending: number;
	categoryBreakdown: CategorySpending[];
	trends: SpendingTrend[];
	insights: string[];
	recommendations: string[];
}

export interface CategorySpending {
	categoryId: string;
	categoryName: string;
	amount: number;
	percentage: number;
	transactionCount: number;
	trend: 'increasing' | 'decreasing' | 'stable';
	trendPercentage?: number;
}

export interface SpendingTrend {
	period: string;
	amount: number;
	percentageChange: number;
	categories: CategorySpending[];
	// Per-category trend fields for detailed analysis
	categoryId?: string;
	direction?: 'increasing' | 'decreasing' | 'stable';
}

export interface CashFlowForecast {
	forecastPeriod: { startDate: string; endDate: string };
	predictedIncome: number;
	predictedExpenses: number;
	netCashFlow: number;
	confidence: number;
	keyFactors: string[];
	warnings: string[];
	monthlyBreakdown: MonthlyCashFlow[];
}

export interface MonthlyCashFlow {
	month: string;
	income: number;
	expenses: number;
	netFlow: number;
	confidence: number;
}

export interface AnomalyDetection {
	anomalies: FinancialAnomaly[];
	riskScore: number;
	recommendations: string[];
	lastAnalyzed: string;
}

export interface FinancialAnomaly {
	type:
		| 'unusual_spending'
		| 'duplicate_transaction'
		| 'potential_fraud'
		| 'budget_exceeded';
	severity: 'low' | 'medium' | 'high' | 'critical';
	description: string;
	amount?: number;
	date: string;
	category?: string;
	recommendedAction: string;
}

// Security and Fraud Detection
export interface FraudRiskAssessment {
	riskScore: number;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	factors: RiskFactor[];
	recommendation: string;
	requiresAdditionalVerification: boolean;
	assessedAt: string;
}

export interface RiskFactor {
	type: string;
	weight: number;
	value: string;
	impact: 'positive' | 'negative' | 'neutral';
}

export interface SecurityAlert {
	id: string;
	type:
		| 'suspicious_login'
		| 'unusual_transaction'
		| 'multiple_failed_attempts'
		| 'data_breach';
	severity: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	actionRequired: boolean;
	recommendedActions: string[];
	createdAt: string;
	acknowledgedAt?: string;
}

// Voice Interface
export interface VoiceCommand {
	command: string;
	intent: string;
	entities: VoiceEntity[];
	confidence: number;
	requiresConfirmation: boolean;
	suggestedAction?: string;
}

export interface VoiceEntity {
	type: string;
	value: string;
	confidence: number;
}

export interface VoiceConfirmation {
	type: 'transaction' | 'data_access' | 'security_action';
	details: string;
	confirmationCode?: string;
	expiresAt: string;
}

// Notifications
export interface NotificationPreference {
	type:
		| 'low_balance'
		| 'large_transaction'
		| 'payment_reminder'
		| 'security_alert'
		| 'insight_available';
	enabled: boolean;
	channels: ('push' | 'email' | 'sms' | 'in_app')[];
	threshold?: number;
	frequency: 'immediate' | 'daily' | 'weekly';
}

export interface FinancialAlert {
	id: string;
	type:
		| 'low_balance'
		| 'large_transaction'
		| 'payment_due'
		| 'budget_exceeded'
		| 'unusual_activity';
	title: string;
	message: string;
	severity: 'info' | 'warning' | 'error' | 'success';
	data?: Record<string, unknown>;
	read: boolean;
	createdAt: string;
	actionUrl?: string;
}

// Multi-modal Responses
export interface VisualReport {
	type:
		| 'spending_chart'
		| 'cash_flow_graph'
		| 'category_breakdown'
		| 'trend_analysis'
		| 'budget_comparison';
	title: string;
	description: string;
	chartData: ChartData;
	insights: string[];
	format: 'json' | 'svg' | 'png';
	generatedAt: string;
}

export interface ChartData {
	labels: string[];
	datasets: Dataset[];
	options?: Record<string, unknown>;
}

export interface Dataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string | string[];
	borderWidth?: number;
}

export interface ExportOptions {
	format: 'csv' | 'xlsx' | 'pdf' | 'json';
	dateRange: { startDate: string; endDate: string };
	includeCategories: string[];
	includeCharts: boolean;
	includeInsights: boolean;
}

export interface ExportedReport {
	id: string;
	type: string;
	format: string;
	fileUrl: string;
	expiresAt: string;
	generatedAt: string;
	recordCount: number;
}

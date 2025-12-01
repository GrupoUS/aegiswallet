import type { paymentHistory, subscriptionPlans, subscriptions } from '@/db/schema';

// ========================================
// INFERRED TYPES FROM DRIZZLE SCHEMA
// ========================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;

// ========================================
// API RESPONSE TYPES
// ========================================

export interface CheckoutSessionResponse {
	sessionId: string;
	checkoutUrl: string | null;
}

export interface PortalSessionResponse {
	portalUrl: string | null;
}

export interface SubscriptionResponse {
	subscription: Subscription | null;
	plan: SubscriptionPlan;
	canAccessAI: boolean;
	allowedModels: string[];
}

export interface PlansResponse {
	plans: (SubscriptionPlan & { priceFormatted: string })[];
}

export interface PaymentHistoryResponse {
	payments: PaymentHistory[];
	total: number;
}

export interface PaymentMethod {
	id: string;
	type: 'card' | 'pix' | 'bank_account';
	last4?: string;
	brand?: string;
	expiryMonth?: number;
	expiryYear?: number;
	isDefault: boolean;
	createdAt: string;
	// PIX specific
	pixKey?: string;
	pixKeyType?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
	// Bank account specific
	bankName?: string;
	accountNumber?: string;
	accountType?: 'checking' | 'savings';
}

export interface Invoice {
	id: string;
	number: string;
	status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
	amountDue: number;
	amountPaid: number;
	amountRemaining: number;
	currency: string;
	dueDate: string;
	createdAt: string;
	paidAt?: string;
	description?: string;
	receiptUrl?: string;
	invoicePdf?: string;
	// Line items
	items: InvoiceItem[];
}

export interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	amount: number;
	currency: string;
}

export interface PaymentMethodsResponse {
	paymentMethods: PaymentMethod[];
	hasMore: boolean;
	total: number;
}

export interface InvoicesResponse {
	invoices: Invoice[];
	total: number;
	hasMore: boolean;
}

export interface AddPaymentMethodRequest {
	type: 'card' | 'pix' | 'bank_account';
	isDefault?: boolean;
	// Card fields
	cardNumber?: string;
	expiryMonth?: number;
	expiryYear?: number;
	cvc?: string;
	// PIX fields
	pixKey?: string;
	pixKeyType?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
	// Bank account fields
	bankCode?: string;
	accountNumber?: string;
	accountType?: 'checking' | 'savings';
	accountHolderName?: string;
	documentNumber?: string;
}

export interface UpdatePaymentMethodRequest {
	isDefault?: boolean;
}

// ========================================
// ENUMS
// ========================================

export type SubscriptionStatus =
	| 'free'
	| 'trialing'
	| 'active'
	| 'past_due'
	| 'canceled'
	| 'unpaid';

export type PaymentStatus = 'succeeded' | 'failed' | 'pending';

export type PaymentMethodType = 'card' | 'pix' | 'bank_account';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export type PixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';

export type AccountType = 'checking' | 'savings';

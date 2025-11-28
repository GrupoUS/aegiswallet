import type {
	paymentHistory,
	subscriptionPlans,
	subscriptions,
} from '@/db/schema';

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

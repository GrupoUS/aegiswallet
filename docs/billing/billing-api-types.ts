/**
 * AegisWallet Billing API TypeScript Types
 * 
 * Complete type definitions for the billing API endpoints
 * Designed for Brazilian market with LGPD compliance
 */

// ========================================
// SHARED TYPES
// ========================================

export interface BaseApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string; // Always in Portuguese for Brazilian market
    details?: {
      field?: string;
      value?: any;
      reason?: string;
    };
  };
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends BaseApiResponse<{
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextPage?: number;
    prevPage?: number;
  };
}> {}

// ========================================
// PAYMENT METHODS TYPES
// ========================================

export enum PaymentMethodType {
  CARD = 'card',
  PIX = 'pix',
  BOLETO = 'boleto'
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  ELO = 'elo',
  HIPERCARD = 'hipercard',
  AMEX = 'amex',
  DINERS = 'diners',
  UNKNOWN = 'unknown'
}

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: PaymentMethodType;
  brand?: CardBrand;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string; // Only visible to user, encrypted at rest
  isDefault: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GetPaymentMethodsRequest {
  limit?: number;
  offset?: number;
  type?: PaymentMethodType;
}

export interface CreatePaymentMethodRequest {
  paymentMethodId: string; // Stripe PaymentMethod ID
  setAsDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodRequest {
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface DeletePaymentMethodRequest {
  id: string;
}

// ========================================
// INVOICES TYPES
// ========================================

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible'
}

export enum BillingReason {
  SUBSCRIPTION_CREATE = 'subscription_create',
  SUBSCRIPTION_CYCLE = 'subscription_cycle',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  SUBSCRIPTION_THRESHOLD = 'subscription_threshold',
  MANUAL = 'manual',
  UPcoming = 'upcoming'
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  amountDue: number; // in cents
  amountPaid: number; // in cents
  amountRemaining: number; // in cents
  currency: string; // Always 'BRL' for Brazilian market
  tax: number; // in cents
  total: number; // in cents
  dueDate?: string;
  periodStart: string;
  periodEnd: string;
  description?: string;
  billingReason: BillingReason;
  customerEmail?: string;
  customerName?: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string; // Brazilian state (2-letter code)
    postalCode: string;
    country: string; // Always 'BR'
  };
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  stripeLineItemId: string;
  description: string;
  quantity: number;
  unitAmount: number; // in cents
  amount: number; // in cents
  currency: string; // Always 'BRL'
  periodStart?: string;
  periodEnd?: string;
  proration: boolean;
  discountAmount: number; // in cents
  taxAmount: number; // in cents
  taxable: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface GetInvoicesRequest {
  limit?: number;
  offset?: number;
  status?: InvoiceStatus;
  billingReason?: BillingReason;
  dateFrom?: string;
  dateTo?: string;
  includeLineItems?: boolean;
}

export interface GetInvoiceRequest {
  id: string;
  includeLineItems?: boolean;
}

export interface PayInvoiceRequest {
  id: string;
  paymentMethodId?: string; // Uses default if not provided
}

export interface CreateInvoiceRequest {
  userId: string;
  subscriptionId?: string;
  amountDue: number; // in cents
  currency?: string; // Defaults to 'BRL'
  dueDate?: string;
  description?: string;
  billingReason?: BillingReason;
  lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId' | 'stripeLineItemId' | 'createdAt'>[];
  metadata?: Record<string, any>;
}

// ========================================
// SUBSCRIPTION ENHANCEMENTS
// ========================================

export interface SubscriptionUsage {
  id: string;
  userId: string;
  subscriptionId: string;
  metricName: string;
  quantity: number;
  unit: string;
  periodStart: string;
  periodEnd: string;
  aggregationType: 'sum' | 'max' | 'last';
  metadata: Record<string, any>;
  createdAt: string;
}

export interface RecordUsageRequest {
  metricName: string;
  quantity: number;
  unit?: string;
  periodStart?: string;
  periodEnd?: string;
  aggregationType?: 'sum' | 'max' | 'last';
  metadata?: Record<string, any>;
}

export interface GetUsageRequest {
  metricName?: string;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  offset?: number;
  aggregationType?: 'sum' | 'max' | 'last';
}

// ========================================
// BILLING ANALYTICS TYPES
// ========================================

export interface SpendingAnalytics {
  period: 'month' | 'quarter' | 'year';
  totalSpent: number; // in cents
  averageMonthlySpending: number; // in cents
  transactionCount: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number; // percentage
  spendingByCategory: {
    subscriptions: number;
    oneTimePayments: number;
    taxes: number;
  };
  monthlyBreakdown: Array<{
    month: string; // '2024-01', '2024-02', etc.
    amount: number; // in cents
    transactionCount: number;
  }>;
}

export interface UsageAnalytics {
  metricName: string;
  period: 'month' | 'quarter' | 'year';
  totalUsage: number;
  averageDailyUsage: number;
  peakUsage: number;
  usageByPeriod: Array<{
    period: string;
    usage: number;
  }>;
  usageBySubscription?: Array<{
    subscriptionId: string;
    planId: string;
    usage: number;
  }>;
}

export interface GetSpendingAnalyticsRequest {
  period: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number; // Only for monthly reports
  includeBreakdown?: boolean;
}

export interface GetUsageAnalyticsRequest {
  metricName: string;
  period: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
  includeBySubscription?: boolean;
}

// ========================================
// BILLING EVENTS TYPES
// ========================================

export enum BillingEventType {
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_PARTIALLY_REFUNDED = 'payment.partially_refunded',
  PAYMENT_FULLY_REFUNDED = 'payment.fully_refunded',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_FINALIZED = 'invoice.finalized',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_UPCOMING = 'invoice.upcoming',
  INVOICE_VOIDED = 'invoice.voided',
  INVOICE_MARKED_UNCOLLECTIBLE = 'invoice.marked_uncollectible',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  SUBSCRIPTION_CREATED = 'customer.subscription.created',
  SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  PAYMENT_METHOD_ATTACHED = 'payment_method.attached',
  PAYMENT_METHOD_DETACHED = 'payment_method.detached',
  PAYMENT_METHOD_UPDATED = 'payment_method.updated',
  WEBHOOK_DELIVERED = 'webhook.delivered',
  WEBHOOK_FAILED = 'webhook.failed'
}

export interface BillingEvent {
  id: string;
  userId: string;
  eventType: BillingEventType;
  stripeEventId?: string;
  processed: boolean;
  data: Record<string, any>; // Full Stripe event data
  processingError?: string;
  webhookId?: string;
  createdAt: string;
  processedAt?: string;
}

export interface GetBillingEventsRequest {
  limit?: number;
  offset?: number;
  eventType?: BillingEventType;
  processed?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// ========================================
// CHECKOUT AND PORTAL TYPES
// ========================================

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  paymentMethodTypes?: PaymentMethodType[];
  metadata?: Record<string, any>;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CreateCustomerPortalSessionRequest {
  returnUrl: string;
}

export interface CustomerPortalSessionResponse {
  url: string;
}

// ========================================
// BILLING SETTINGS TYPES
// ========================================

export interface BillingSettings {
  userId: string;
  preferredPaymentMethodId?: string;
  invoiceDeliveryMethod: 'email' | 'portal' | 'both';
  invoiceEmail?: string;
  automaticPaymentEnabled: boolean;
  paymentReminderEnabled: boolean;
  paymentReminderDays: number[];
  lowBalanceThreshold?: number; // in cents
  currency: string; // Always 'BRL'
  timezone: string; // Brazil timezone (e.g., 'America/Sao_Paulo')
  locale: string; // Always 'pt-BR'
  metadata: Record<string, any>;
  updatedAt: string;
}

export interface UpdateBillingSettingsRequest {
  preferredPaymentMethodId?: string;
  invoiceDeliveryMethod?: 'email' | 'portal' | 'both';
  invoiceEmail?: string;
  automaticPaymentEnabled?: boolean;
  paymentReminderEnabled?: boolean;
  paymentReminderDays?: number[];
  lowBalanceThreshold?: number;
  timezone?: string;
  metadata?: Record<string, any>;
}

// ========================================
// ERROR TYPES
// ========================================

export enum BillingErrorCode {
  // Payment Method Errors
  PAYMENT_METHOD_NOT_FOUND = 'PAYMENT_METHOD_NOT_FOUND',
  PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID',
  PAYMENT_METHOD_ALREADY_DEFAULT = 'PAYMENT_METHOD_ALREADY_DEFAULT',
  PAYMENT_METHOD_DECLINED = 'PAYMENT_METHOD_DECLINED',
  
  // Invoice Errors
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  INVOICE_EXPIRED = 'INVOICE_EXPIRED',
  INVOICE_UNAVAILABLE = 'INVOICE_UNAVAILABLE',
  
  // Subscription Errors
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',
  SUBSCRIPTION_LIMIT_REACHED = 'SUBSCRIPTION_LIMIT_REACHED',
  
  // Payment Errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_INSUFFICIENT_FUNDS',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  
  // General Billing Errors
  BILLING_ACCOUNT_SUSPENDED = 'BILLING_ACCOUNT_SUSPENDED',
  BILLING_SERVICE_UNAVAILABLE = 'BILLING_SERVICE_UNAVAILABLE',
  BILLING_RATE_LIMIT_EXCEEDED = 'BILLING_RATE_LIMIT_EXCEEDED',
  
  // LGPD Compliance Errors
  DATA_RETENTION_POLICY = 'DATA_RETENTION_POLICY',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',
  DATA_EXPORT_PROCESSING = 'DATA_EXPORT_PROCESSING',
  DATA_DELETION_PROCESSING = 'DATA_DELETION_PROCESSING',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// ========================================
// LGPD COMPLIANCE TYPES
// ========================================

export interface LGPDDataExport {
  userId: string;
  exportId: string;
  format: 'json' | 'csv' | 'pdf';
  data: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      cpf?: string;
      createdAt: string;
      updatedAt: string;
    };
    billingInfo: {
      subscriptions: any[];
      paymentMethods: any[];
      invoices: any[];
      paymentHistory: any[];
      usage: any[];
    };
    consentRecords: any[];
    exportDate: string;
    retentionPolicies: any[];
  };
  exportedAt: string;
  validUntil: string; // 30 days from export
}

export interface LGPDDataDeletionRequest {
  userId: string;
  requestId: string;
  reason: string;
  scope: 'full' | 'billing_only' | 'subscription_only';
  legalHolds: string[];
  requestedAt: string;
  estimatedCompletionDate: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
}

// ========================================
// WEBHOOK TYPES
// ========================================

export interface StripeWebhookEvent {
  id: string;
  object: string; // 'event'
  apiVersion: string;
  created: number;
  type: BillingEventType;
  data: {
    object: any; // Stripe object (payment_intent, invoice, etc.)
  };
  livemode: boolean;
  pendingWebhooks: number;
  request: {
    id: string | null;
    idempotencyKey: string | null;
  };
}

export interface WebhookProcessingResult {
  eventId: string;
  processed: boolean;
  error?: string;
  processingTime: number; // in milliseconds
}

// ========================================
// RATE LIMITING TYPES
// ========================================

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string; // Portuguese message
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export const billingRateLimits: Record<string, RateLimitConfig> = {
  // Strict limits for payment operations
  payment: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Muitas tentativas de pagamento. Por favor, aguarde alguns minutos.',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Moderate limits for read operations
  read: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Muitas solicitações. Por favor, aguarde um momento.',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // High limits for webhook processing
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Limite de webhooks excedido.',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Export operations (expensive)
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Limite de exportação de dados excedido. Tente novamente em uma hora.',
    standardHeaders: true,
    legacyHeaders: false
  }
};

// ========================================
// UTILITY TYPES
// ========================================

export interface BrazilianCurrency {
  amount: number; // in cents
  formatted: string; // e.g., 'R$ 12,34'
  currency: 'BRL';
}

export interface TaxInfo {
  amount: number; // in cents
  rate: number; // percentage
  description: string; // e.g., 'ISS 5%', 'PIS 0,65%'
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string; // 2-letter Brazilian state code
  postalCode: string;
  country: 'BR';
}

export interface BrazilianStates {
  [key: string]: string; // e.g., 'SP': 'São Paulo'
}

export const BRAZILIAN_STATES: BrazilianStates = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins'
};

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface BillingConfig {
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  brazil: {
    defaultCurrency: 'BRL';
    defaultLocale: 'pt-BR';
    defaultTimezone: string; // 'America/Sao_Paulo'
    supportedPaymentMethods: PaymentMethodType[];
    taxRates: Record<string, number>;
  };
  lgpd: {
    retentionMonths: {
      billing: number;
      paymentMethods: number;
      consentRecords: number;
    };
    consentTypes: string[];
    dataExportFormats: string[];
  };
  features: {
    usageBasedBilling: boolean;
    multiplePaymentMethods: boolean;
    automatedInvoicing: boolean;
    billingAnalytics: boolean;
    customerPortal: boolean;
  };
}

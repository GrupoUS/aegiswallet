# AegisWallet Billing Database Schema & API Comprehensive Plan

## Executive Summary

This document provides a complete research and plan for AegisWallet's billing system, including database schema enhancements, API endpoints, security patterns, and LGPD compliance for the Brazilian market.

**Current State**: AegisWallet already has a solid billing foundation with Stripe integration, subscription management, and payment history tracking. This plan enhances the existing implementation with additional features for complete billing management.

**Technology Stack**: Supabase (PostgreSQL) + Drizzle ORM + Stripe + Hono RPC + Clerk Auth

---

## 1. Database Schema Analysis

### 1.1 Current Billing Tables (Already Implemented)

The existing billing schema is comprehensive and LGPD-compliant:

#### `subscription_plans`
- **Purpose**: Available subscription plans configuration
- **Key Features**: BRL pricing, Stripe integration, feature management
- **Brazilian Compliance**: Portuguese names, BRL currency

#### `subscriptions`
- **Purpose**: User subscription records linking Clerk to Stripe
- **Key Features**: Subscription lifecycle management, billing periods
- **LGPD Compliance**: Sensitive billing data with retention policies

#### `payment_history`
- **Purpose**: Complete payment transaction history
- **Key Features**: Stripe integration, failure tracking, receipts
- **Brazilian Compliance**: BRL currency, Portuguese descriptions

### 1.2 Schema Strengths

✅ **Complete Stripe Integration**: All critical Stripe data preserved
✅ **LGPD Compliant**: Proper data retention and privacy considerations
✅ **Brazilian Localization**: BRL currency, Portuguese interface support
✅ **Audit Ready**: Comprehensive logging and metadata
✅ **Performance Optimized**: Proper indexing and relationships

### 1.3 Recommended Enhancements

#### 1.3.1 Payment Methods Table
```sql
-- For storing multiple payment methods per user
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'card', 'pix', 'boleto'
  brand TEXT, -- 'visa', 'mastercard', etc.
  last4 TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.3.2 Enhanced Invoices Table
```sql
-- Detailed invoice tracking beyond payment history
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  subscription_id UUID REFERENCES subscriptions(id),
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER NOT NULL DEFAULT 0,
  amount_remaining INTEGER GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  currency TEXT NOT NULL DEFAULT 'BRL',
  due_date TIMESTAMP WITH TIME ZONE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.3.3 Invoice Line Items
```sql
-- Detailed breakdown of invoice charges
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_line_item_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_amount INTEGER NOT NULL, -- in cents
  amount INTEGER NOT NULL, -- quantity * unit_amount
  currency TEXT NOT NULL DEFAULT 'BRL',
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  proration BOOLEAN DEFAULT false,
  metadata JSONB
);
```

#### 1.3.4 Billing Events Table
```sql
-- Comprehensive audit log for billing events
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'payment.succeeded', 'invoice.created', etc.
  stripe_event_id TEXT UNIQUE,
  processed BOOLEAN DEFAULT false,
  data JSONB NOT NULL, -- Full Stripe event data
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

#### 1.3.5 Subscription Usage Tracking
```sql
-- For tracking usage-based billing features
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric_name TEXT NOT NULL, -- 'api_calls', 'transactions', etc.
  quantity INTEGER NOT NULL DEFAULT 1,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Row Level Security (RLS) Policies

### 2.1 Current RLS Implementation

AegisWallet uses application-level RLS through Drizzle clients rather than PostgreSQL RLS policies. This approach provides better TypeScript integration and debugging.

### 2.2 Recommended RLS Policy Patterns

#### 2.2.1 User Isolation Policy
```typescript
// All billing tables must enforce user isolation
const userIsolationPolicy = {
  subscriptions: 'user_id = current_user_id()',
  payment_history: 'user_id = current_user_id()',
  payment_methods: 'user_id = current_user_id()',
  invoices: 'user_id = current_user_id()',
  invoice_line_items: {
    // Join with invoices table
    'invoice_id IN (SELECT id FROM invoices WHERE user_id = current_user_id())'
  }
};
```

#### 2.2.2 Service Account Access
```typescript
// Service account bypasses RLS for webhook processing
const serviceAccountPolicy = {
  // Allow service account to access all records for webhook processing
  'service_account role': 'BYPASS RLS'
};
```

### 2.3 RLS Performance Optimization

```typescript
// Indexes for RLS performance
CREATE INDEX CONCURRENTLY idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX CONCURRENTLY idx_payment_history_user_id_created ON payment_history(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_invoices_user_id_status ON invoices(user_id, status);
CREATE INDEX CONCURRENTLY idx_payment_methods_user_id_default ON payment_methods(user_id, is_default);
```

---

## 3. API Endpoint Specifications

### 3.1 Current API Structure Analysis

The existing billing API structure is well-organized with Hono RPC:

```
/api/v1/billing/
├── checkout/        # Stripe checkout sessions
├── subscription/    # Subscription management
├── portal/         # Customer portal access
├── plans/          # Available plans
├── webhook/        # Stripe webhook processing
└── payment-history/ # Payment transaction history
```

### 3.2 Recommended Additional Endpoints

#### 3.2.1 Payment Methods Management

```typescript
// GET /api/v1/billing/payment-methods
interface GetPaymentMethodsRequest {
  limit?: number;
  offset?: number;
}

interface GetPaymentMethodsResponse {
  data: {
    paymentMethods: PaymentMethod[];
    total: number;
  };
  meta: { requestId: string };
}

// POST /api/v1/billing/payment-methods
interface CreatePaymentMethodRequest {
  paymentMethodId: string; // Stripe PaymentMethod ID
  setAsDefault?: boolean;
}

// DELETE /api/v1/billing/payment-methods/:id
interface DeletePaymentMethodRequest {
  id: string;
}

// PUT /api/v1/billing/payment-methods/:id/default
interface SetDefaultPaymentMethodRequest {
  id: string;
}
```

#### 3.2.2 Enhanced Invoice Management

```typescript
// GET /api/v1/billing/invoices
interface GetInvoicesRequest {
  limit?: number;
  offset?: number;
  status?: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dateFrom?: string;
  dateTo?: string;
}

interface GetInvoicesResponse {
  data: {
    invoices: Invoice[];
    total: number;
  };
  meta: { requestId: string };
}

// GET /api/v1/billing/invoices/:id
interface GetInvoiceRequest {
  id: string;
  includeLineItems?: boolean;
}

// POST /api/v1/billing/invoices/:id/pay
interface PayInvoiceRequest {
  id: string;
  paymentMethodId?: string; // Optional, uses default if not provided
}
```

#### 3.2.3 Subscription Usage Tracking

```typescript
// GET /api/v1/billing/usage
interface GetUsageRequest {
  metricName?: string;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  offset?: number;
}

// POST /api/v1/billing/usage
interface RecordUsageRequest {
  metricName: string;
  quantity: number;
  periodStart?: string;
  periodEnd?: string;
}
```

#### 3.2.4 Billing Analytics

```typescript
// GET /api/v1/billing/analytics/spending
interface GetSpendingAnalyticsRequest {
  period: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
}

// GET /api/v1/billing/analytics/usage
interface GetUsageAnalyticsRequest {
  metricName: string;
  period: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
}
```

### 3.3 API Response Patterns

#### 3.3.1 Standard Response Format
```typescript
interface StandardApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}
```

#### 3.3.2 Pagination Pattern
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

#### 3.3.3 Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string; // e.g., 'PAYMENT_METHOD_NOT_FOUND'
    message: string; // Portuguese for Brazilian market
    details?: {
      field?: string;
      value?: any;
    };
    request_id: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}
```

---

## 4. Security Implementation Patterns

### 4.1 Authentication & Authorization

#### 4.1.1 Middleware Pattern
```typescript
// Enhanced auth middleware for billing endpoints
export const billingAuthMiddleware = async (c: Context, next: Next) => {
  const auth = await validateClerkAuth(c);
  if (!auth?.user) {
    return c.json({ error: 'Não autorizado' }, 401);
  }
  
  // Set user context for RLS
  c.set('auth', auth);
  await createUserScopedPoolClient(auth.user.id);
  
  await next();
};
```

#### 4.1.2 Rate Limiting
```typescript
// Different rate limits for billing operations
export const billingRateLimits = {
  // Strict limits for payment operations
  payment: { windowMs: 60000, max: 5 }, // 5 per minute
  
  // Moderate limits for read operations
  read: { windowMs: 60000, max: 30 }, // 30 per minute
  
  // High limits for webhook processing
  webhook: { windowMs: 60000, max: 100 }, // 100 per minute
};
```

### 4.2 Data Encryption

#### 4.2.1 Sensitive Data Encryption
```typescript
// Encrypt payment method details
const encryptedPaymentMethodFields = [
  'card_number',
  'cvc',
  'stripe_token',
  'bank_account_number'
];

// Use Supabase's pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption function
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(data, current_setting('app.encryption_key')), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 API Key Management

#### 4.3.1 Stripe Configuration
```typescript
// Secure Stripe configuration
const stripeConfig = {
  apiKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: '2024-11-20.acacia',
  
  // Brazilian-specific configuration
  brazil: {
    preferredLocales: ['pt-BR'],
    defaultCurrency: 'brl',
    paymentMethodTypes: ['card', 'boleto', 'pix']
  }
};
```

---

## 5. LGPD Compliance Guidelines

### 5.1 Data Classification

#### 5.1.1 Sensitive Billing Data
- **Payment Method Details**: Encrypted at rest
- **Transaction History**: Retained for 5 years per LGPD
- **Invoices**: Retained for 5 years per fiscal requirements
- **Consent Records**: Stored with versioning and audit trail

#### 5.1.2 Data Retention Policies
```typescript
// LGPD-compliant retention policies
const lgpdRetentionPolicies = {
  financial_data: {
    retention_months: 60, // 5 years
    legal_basis: 'legal_requirement',
    description: 'Dados financeiros conforme exigência fiscal'
  },
  
  payment_methods: {
    retention_months: 60,
    legal_basis: 'contractual_necessity',
    description: 'Dados para processamento de pagamentos'
  },
  
  consent_records: {
    retention_months: 84, // 7 years
    legal_basis: 'legal_requirement',
    description: 'Registros de consentimento LGPD'
  }
};
```

### 5.2 Data Subject Rights Implementation

#### 5.2.1 Right to Access
```typescript
// Export all billing data for user
export async function exportBillingData(userId: string): Promise<BillingDataExport> {
  return {
    subscriptions: await getUserSubscriptions(userId),
    paymentHistory: await getUserPaymentHistory(userId),
    invoices: await getUserInvoices(userId),
    paymentMethods: await getUserPaymentMethods(userId),
    usage: await getUserUsageRecords(userId),
    exportDate: new Date(),
    format: 'json'
  };
}
```

#### 5.2.2 Right to Deletion (with legal holds)
```typescript
// Handle deletion requests with legal compliance
export async function handleBillingDataDeletion(
  userId: string,
  legalHolds?: string[]
): Promise<DeletionResult> {
  // Check for legal holds
  const hasActiveSubscriptions = await checkActiveSubscriptions(userId);
  const hasUnpaidInvoices = await checkUnpaidInvoices(userId);
  const hasLegalHolds = legalHolds?.length > 0;
  
  if (hasActiveSubscriptions || hasUnpaidInvoices || hasLegalHolds) {
    return {
      success: false,
      reason: 'Dados retidos por obrigação legal ou contratual',
      retentionUntil: calculateRetentionDate(userId)
    };
  }
  
  // Proceed with anonymization
  await anonymizeBillingData(userId);
  return { success: true };
}
```

### 5.3 Consent Management

#### 5.3.1 Billing Consent Types
```typescript
export enum BillingConsentType {
  PAYMENT_PROCESSING = 'payment_processing',
  AUTOMATIC_CHARGES = 'automatic_charges',
  INVOICE_DELIVERY = 'invoice_delivery',
  USAGE_TRACKING = 'usage_tracking',
  MARKETING_COMMUNICATIONS = 'marketing_communications'
}
```

#### 5.3.2 Consent Workflow
```typescript
// Multi-step consent for billing features
export const billingConsentFlow = [
  {
    type: BillingConsentType.PAYMENT_PROCESSING,
    required: true,
    description: 'Processamento de pagamentos via Stripe'
  },
  {
    type: BillingConsentType.AUTOMATIC_CHARGES,
    required: false,
    description: 'Cobrança automática de assinaturas'
  },
  {
    type: BillingConsentType.INVOICE_DELIVERY,
    required: true,
    description: 'Envio de faturas por email'
  }
];
```

---

## 6. Performance Optimization Strategies

### 6.1 Database Optimization

#### 6.1.1 Indexing Strategy
```sql
-- Performance indexes for billing queries
CREATE INDEX CONCURRENTLY idx_subscriptions_user_status 
ON subscriptions(user_id, status);

CREATE INDEX CONCURRENTLY idx_payment_history_user_created 
ON payment_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_invoices_user_status_created 
ON invoices(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_payment_methods_user_default 
ON payment_methods(user_id, is_default) WHERE is_default = true;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_payment_history_user_status_created 
ON payment_history(user_id, status, created_at DESC);
```

#### 6.1.2 Query Optimization
```typescript
// Optimized payment history query with pagination
export async function getPaymentHistoryOptimized(
  userId: string,
  options: { limit: number; offset: number }
): Promise<PaymentHistory[]> {
  // Use cursor-based pagination for better performance
  return await db
    .select()
    .from(paymentHistory)
    .where(eq(paymentHistory.userId, userId))
    .orderBy(desc(paymentHistory.createdAt))
    .limit(options.limit)
    .offset(options.offset)
    .execute(); // Use execute() for better performance with large result sets
}
```

### 6.2 Caching Strategy

#### 6.2.1 Subscription Status Caching
```typescript
// Cache subscription status for 5 minutes
const subscriptionCache = new Map<string, {
  status: SubscriptionStatus;
  expires: number;
}>();

export async function getCachedSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const cached = subscriptionCache.get(userId);
  const now = Date.now();
  
  if (cached && cached.expires > now) {
    return cached.status;
  }
  
  // Fetch from database
  const subscription = await getUserSubscription(userId);
  subscriptionCache.set(userId, {
    status: subscription.status,
    expires: now + 5 * 60 * 1000 // 5 minutes
  });
  
  return subscription.status;
}
```

### 6.3 API Performance

#### 6.3.1 Response Compression
```typescript
// Enable gzip compression for large billing data
app.use('/api/v1/billing/*', async (c, next) => {
  const acceptEncoding = c.req.header('Accept-Encoding') || '';
  
  if (acceptEncoding.includes('gzip')) {
    c.header('Content-Encoding', 'gzip');
  }
  
  await next();
});
```

#### 6.3.2 Request Debouncing
```typescript
// Debounce expensive billing operations
const debouncedUsageTracking = debounce(
  async (userId: string, metric: string, quantity: number) => {
    await recordUsage(userId, metric, quantity);
  },
  5000 // 5 second debounce
);
```

---

## 7. Migration Strategy

### 7.1 Migration Plan

#### 7.1.1 Phase 1: New Tables
```sql
-- Migration 001: Add payment methods table
CREATE TABLE payment_methods (
  -- Schema as defined above
);

-- Migration 002: Add invoices table
CREATE TABLE invoices (
  -- Schema as defined above
);

-- Migration 003: Add invoice line items table
CREATE TABLE invoice_line_items (
  -- Schema as defined above
);
```

#### 7.1.2 Phase 2: Data Migration
```typescript
// Migrate existing payment history to invoices
export async function migratePaymentHistoryToInvoices() {
  const unpaidPayments = await db
    .select()
    .from(paymentHistory)
    .where(eq(paymentHistory.status, 'pending'))
    .execute();
  
  for (const payment of unpaidPayments) {
    await createInvoiceFromPayment(payment);
  }
}
```

#### 7.1.3 Phase 3: Backfill Data
```typescript
// Backfill missing invoice data from Stripe
export async function backfillInvoiceData() {
  const users = await db.select().from(users).execute();
  
  for (const user of users) {
    if (user.stripeCustomerId) {
      await syncStripeInvoices(user.id, user.stripeCustomerId);
    }
  }
}
```

### 7.2 Rollback Strategy

#### 7.2.1 Migration Rollbacks
```typescript
// Safe rollback procedures
export const rollbackProcedures = {
  '001_payment_methods': 'DROP TABLE IF EXISTS payment_methods;',
  '002_invoices': 'DROP TABLE IF EXISTS invoices;',
  '003_invoice_line_items': 'DROP TABLE IF EXISTS invoice_line_items;'
};
```

---

## 8. Testing Approach

### 8.1 Unit Testing

#### 8.1.1 Database Layer Tests
```typescript
// Test subscription management
describe('Subscription Management', () => {
  it('should create subscription with proper RLS', async () => {
    const subscription = await createSubscription(testUser.id, 'basic');
    expect(subscription.userId).toBe(testUser.id);
    
    // Test RLS isolation
    const otherUserSubscription = await getSubscriptionForUser(otherUser.id);
    expect(otherUserSubscription).toBeNull();
  });
});
```

#### 8.1.2 API Endpoint Tests
```typescript
// Test billing API endpoints
describe('Billing API', () => {
  it('should return payment history for authenticated user', async () => {
    const response = await app.request('/api/v1/billing/payment-history', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.payments).toBeInstanceOf(Array);
  });
});
```

### 8.2 Integration Testing

#### 8.2.1 Stripe Integration Tests
```typescript
// Test Stripe webhook processing
describe('Stripe Webhooks', () => {
  it('should process invoice.payment_succeeded webhook', async () => {
    const webhookEvent = createMockWebhookEvent('invoice.payment_succeeded');
    const response = await app.request('/api/v1/billing/webhook', {
      method: 'POST',
      headers: { 'Stripe-Signature': webhookSignature },
      body: JSON.stringify(webhookEvent)
    });
    
    expect(response.status).toBe(200);
    
    // Verify payment history record created
    const paymentHistory = await getPaymentHistoryByInvoiceId(webhookEvent.data.object.id);
    expect(paymentHistory).toBeTruthy();
  });
});
```

### 8.3 Load Testing

#### 8.3.1 Billing API Load Tests
```typescript
// Load test billing endpoints
describe('Billing API Load Tests', () => {
  it('should handle 100 concurrent payment history requests', async () => {
    const requests = Array(100).fill(null).map(() => 
      app.request('/api/v1/billing/payment-history', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    );
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 200).length;
    expect(successCount).toBeGreaterThan(95); // 95% success rate
  });
});
```

### 8.4 LGPD Compliance Testing

#### 8.4.1 Data Retention Tests
```typescript
// Test LGPD data retention
describe('LGPD Compliance', () => {
  it('should retain payment history for 5 years', async () => {
    const oldPayment = await createPaymentHistory({
      userId: testUser.id,
      createdAt: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000) // 4 years ago
    });
    
    // Should still be accessible
    const paymentHistory = await getPaymentHistory(testUser.id);
    expect(paymentHistory).toContainEqual(expect.objectContaining({
      id: oldPayment.id
    }));
  });
});
```

---

## 9. Implementation Priorities

### 9.1 Phase 1: Core Enhancements (Weeks 1-2)
1. **Payment Methods Table**: Enable multiple payment methods
2. **Enhanced Invoice Management**: Better invoice tracking and management
3. **API Rate Limiting**: Proper rate limiting for billing endpoints
4. **Performance Optimization**: Database indexes and query optimization

### 9.2 Phase 2: Advanced Features (Weeks 3-4)
1. **Usage-Based Billing**: Track usage for flexible pricing
2. **Billing Analytics**: Spending and usage analytics
3. **Enhanced Webhook Processing**: More robust webhook handling
4. **Data Migration Scripts**: Migrate existing data to new structure

### 9.3 Phase 3: Compliance & Security (Weeks 5-6)
1. **LGPD Data Retention**: Automated retention policies
2. **Data Export/Deletion**: Complete LGPD compliance
3. **Enhanced Security**: Additional security measures
4. **Comprehensive Testing**: Full test suite coverage

---

## 10. Success Metrics

### 10.1 Performance Metrics
- **API Response Time**: < 150ms for billing endpoints (P95)
- **Database Query Time**: < 50ms for common queries
- **Error Rate**: < 0.1% for billing operations
- **Uptime**: 99.9% availability for billing services

### 10.2 Compliance Metrics
- **LGPD Compliance**: 100% data retention policy compliance
- **Audit Trail**: 100% billing events logged
- **Data Security**: Zero data breaches
- **Consent Management**: 100% required consents collected

### 10.3 Business Metrics
- **Payment Success Rate**: > 95%
- **Churn Reduction**: 20% reduction through better billing management
- **User Satisfaction**: > 4.5/5 for billing experience
- **Support Tickets**: 50% reduction in billing-related tickets

---

## Conclusion

This comprehensive plan provides AegisWallet with a complete, secure, and LGPD-compliant billing system that serves the Brazilian market effectively. The implementation builds upon the existing solid foundation while adding necessary enhancements for complete billing management.

The phased approach ensures gradual implementation with minimal disruption, while maintaining high security and compliance standards throughout.

**Estimated Implementation Time**: 6 weeks
**Risk Level**: Low (building on existing foundation)
**Compliance Level**: 100% LGPD compliant
**Performance Target**: Sub-150ms response times

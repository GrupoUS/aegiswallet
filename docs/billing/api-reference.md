# Billing API Reference

Complete API reference for AegisWallet billing endpoints.

## Base URL

```
https://app.aegiswallet.com.br/api/v1/billing
```

## Authentication

All endpoints (except webhooks) require authentication via Bearer token in the Authorization header:

```http
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### Get Subscription

Get current user's subscription and plan information.

```http
GET /api/v1/billing/subscription
```

**Response 200 OK:**
```json
{
  "data": {
    "subscription": {
      "id": "uuid",
      "userId": "user_xxxxx",
      "stripeCustomerId": "cus_xxxxx",
      "stripeSubscriptionId": "sub_xxxxx",
      "planId": "basic",
      "status": "active",
      "currentPeriodStart": "2025-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
      "cancelAtPeriodEnd": false,
      "canceledAt": null,
      "trialStart": null,
      "trialEnd": null
    },
    "plan": {
      "id": "basic",
      "name": "Básico",
      "description": "Chat IA e automações básicas",
      "priceCents": 5900,
      "currency": "BRL",
      "features": ["Chat IA (Gemini Flash)", "3 contas bancárias", "Automações básicas"]
    },
    "canAccessAI": true,
    "allowedModels": ["gemini-flash"]
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### Create Checkout Session

Create a Stripe checkout session for subscription purchase.

```http
POST /api/v1/billing/checkout
```

**Request Body:**
```json
{
  "priceId": "price_xxxxx",
  "successUrl": "https://app.aegiswallet.com.br/billing/success",
  "cancelUrl": "https://app.aegiswallet.com.br/billing/cancel"
}
```

**Response 200 OK:**
```json
{
  "data": {
    "sessionId": "cs_xxxxx",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_xxxxx"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Usage:**
Redirect user to `checkoutUrl` to complete payment.

---

### Create Portal Session

Create a Stripe customer portal session for subscription management.

```http
POST /api/v1/billing/portal
```

**Request Body:**
```json
{
  "returnUrl": "https://app.aegiswallet.com.br/settings/billing"
}
```

**Response 200 OK:**
```json
{
  "data": {
    "portalUrl": "https://billing.stripe.com/session/xxxxx"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

**Error 400 Bad Request:**
```json
{
  "error": "Assinatura não encontrada"
}
```

---

### List Plans

List all available subscription plans.

```http
GET /api/v1/billing/plans
```

**Response 200 OK:**
```json
{
  "data": {
    "plans": [
      {
        "id": "free",
        "name": "Gratuito",
        "description": "Dashboard básico e recursos limitados",
        "priceCents": 0,
        "currency": "BRL",
        "interval": null,
        "stripePriceId": null,
        "features": ["Dashboard básico", "1 conta bancária", "Transações limitadas"],
        "aiModels": [],
        "maxBankAccounts": 1,
        "maxTransactionsPerMonth": 100,
        "isActive": true,
        "displayOrder": 0,
        "priceFormatted": "R$ 0,00"
      },
      {
        "id": "basic",
        "name": "Básico",
        "description": "Chat IA e automações básicas",
        "priceCents": 5900,
        "currency": "BRL",
        "interval": "month",
        "stripePriceId": "price_xxxxx",
        "features": ["Chat IA (Gemini Flash)", "3 contas bancárias", "Automações básicas"],
        "aiModels": ["gemini-flash"],
        "maxBankAccounts": 3,
        "maxTransactionsPerMonth": null,
        "isActive": true,
        "displayOrder": 1,
        "priceFormatted": "R$ 59,00"
      }
    ]
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### Get Payment History

Get user's payment history with pagination.

```http
GET /api/v1/billing/payment-history?limit=10&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10, max: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Response 200 OK:**
```json
{
  "data": {
    "payments": [
      {
        "id": "uuid",
        "userId": "user_xxxxx",
        "subscriptionId": "uuid",
        "stripePaymentIntentId": "pi_xxxxx",
        "stripeInvoiceId": "in_xxxxx",
        "stripeChargeId": "ch_xxxxx",
        "amountCents": 5900,
        "currency": "BRL",
        "status": "succeeded",
        "description": "Assinatura AegisWallet",
        "receiptUrl": "https://invoice.stripe.com/xxxxx",
        "invoicePdf": "https://invoice.stripe.com/xxxxx/pdf",
        "failureCode": null,
        "failureMessage": null,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 15
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

### Stripe Webhook

Endpoint for Stripe webhook events (not authenticated).

```http
POST /api/v1/billing/webhook
```

**Headers:**
```
stripe-signature: t=xxxxx,v1=xxxxx
```

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Response 200 OK:**
```json
{
  "received": true
}
```

**Error 400 Bad Request:**
```json
{
  "error": "Invalid signature"
}
```

---

## Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (plan upgrade required)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

- Checkout/Portal: 10 requests per minute per user
- Subscription/Payment History: 30 requests per minute per user
- Plans: No rate limit (public endpoint)

## Error Responses

### Standard Error
```json
{
  "error": "Error message"
}
```

### Plan Upgrade Required (403)
```json
{
  "code": "PLAN_UPGRADE_REQUIRED",
  "error": "Seu plano atual não permite acesso a este recurso",
  "details": {
    "currentPlan": "free",
    "requiredPlan": "basic",
    "upgradeUrl": "/billing"
  }
}
```

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
import { apiClient } from '@/lib/api/client';

// Get subscription
const { data } = await apiClient.get('/api/v1/billing/subscription');

// Create checkout
const { data: checkout } = await apiClient.post('/api/v1/billing/checkout', {
  priceId: 'price_xxxxx',
  successUrl: window.location.origin + '/billing/success',
  cancelUrl: window.location.origin + '/billing/cancel',
});

// Redirect to checkout
window.location.href = checkout.checkoutUrl;

// Open customer portal
const { data: portal } = await apiClient.post('/api/v1/billing/portal', {
  returnUrl: window.location.origin + '/settings/billing',
});
window.location.href = portal.portalUrl;
```

### React Hooks

```typescript
import { useSubscription, useCheckout, useBillingPortal } from '@/hooks/billing';

function BillingComponent() {
  const { data: subscription, isLoading } = useSubscription();
  const { mutate: createCheckout, isPending } = useCheckout();
  const { mutate: openPortal } = useBillingPortal();

  const handleUpgrade = () => {
    createCheckout({
      priceId: 'price_xxxxx',
      successUrl: window.location.origin + '/billing/success',
      cancelUrl: window.location.origin + '/billing/cancel',
    });
  };

  const handleManage = () => {
    openPortal({
      returnUrl: window.location.origin + '/settings/billing',
    });
  };

  return (
    <div>
      <p>Plan: {subscription?.plan.name}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleManage}>Manage</button>
    </div>
  );
}
```

### cURL Examples

```bash
# Get subscription
curl -X GET https://app.aegiswallet.com.br/api/v1/billing/subscription \
  -H "Authorization: Bearer <token>"

# Create checkout
curl -X POST https://app.aegiswallet.com.br/api/v1/billing/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_xxxxx"}'

# List plans (no auth required)
curl -X GET https://app.aegiswallet.com.br/api/v1/billing/plans

# Get payment history
curl -X GET "https://app.aegiswallet.com.br/api/v1/billing/payment-history?limit=10" \
  -H "Authorization: Bearer <token>"
```

## Webhooks Integration

### Clerk Webhook

```http
POST /api/webhooks/clerk
```

Handles user lifecycle events from Clerk.

**Events:**
- `user.created` - Creates Stripe customer and free subscription
- `user.deleted` - Deletes Stripe customer and subscription (LGPD compliance)

See [Clerk Integration Guide](./clerk-integration.md) for details.

## Related Documentation

- [Stripe Setup Guide](./stripe-setup.md)
- [Clerk Integration Guide](./clerk-integration.md)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)

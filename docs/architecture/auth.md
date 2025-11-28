---
title: Authentication & Multi-Tenant Architecture
description: Complete guide for Clerk + Neon integration with multi-tenant data isolation
last_updated: 2025-11-28
form: explanation
tags: [authentication, clerk, neon, multi-tenant, database, security, lgpd]
related:
  - ../billing/api-reference.md
  - ../billing/clerk-integration.md
  - ../billing/stripe-setup.md
---

# Authentication & Multi-Tenant Architecture

> **AegisWallet Authentication System**: Complete guide to user authentication with Clerk, database isolation with Neon PostgreSQL, and multi-tenant architecture.

## Overview

AegisWallet implements a robust, LGPD-compliant authentication system using:

- **Clerk**: User authentication, session management, and identity provider
- **Neon PostgreSQL**: Serverless PostgreSQL with Row Level Security (RLS)
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Multi-Tenant Isolation**: Per-user data segregation at database level

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │ React 19    │────│ ClerkProvider│────│  SignIn/SignUp │ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ JWT Token (Bearer)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    HONO API SERVER                          │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │ Auth        │────│ User Context │────│ RLS-Scoped     │ │
│  │ Middleware  │    │ (userId)     │    │ Database Client│ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ SET app.current_user_id
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEON POSTGRESQL                           │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │ RLS         │────│ User Data    │────│ Complete       │ │
│  │ Policies    │    │ Isolation    │    │ LGPD Compliance│ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Clerk Authentication Setup

### 1.1 Prerequisites

- [Clerk Account](https://clerk.com/sign-up)
- [Bun](https://bun.sh) installed
- Neon PostgreSQL database

### 1.2 Environment Configuration

Add these variables to `.env.local`:

```bash
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # Client-side
CLERK_SECRET_KEY=sk_test_xxxxx             # Server-side only
CLERK_WEBHOOK_SECRET=whsec_xxxxx           # Webhook verification

# Database Configuration
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

> **Important**: Never commit secrets to version control. Use `pk_test_` keys for development and `pk_live_` keys for production.

### 1.3 ClerkProvider Setup

The application wraps with `ClerkProvider` in `src/main.tsx`:

```typescript
// src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
  <RouterProvider router={router} context={{ auth }} />
</ClerkProvider>
```

### 1.4 Authentication Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `<SignIn />` | User login form |
| `/signup` | `<SignUp />` | User registration form |
| `/dashboard/*` | Protected | Requires authentication |

### 1.5 Protected Routes

Route guards in `src/routes/__root.tsx`:

```typescript
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
```

### 1.6 Auth Hooks

```typescript
import { useAuth, useUser } from '@clerk/clerk-react'

function Dashboard() {
  const { userId, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isSignedIn) return <Loading />

  return <h1>Welcome, {user.firstName}!</h1>
}
```

---

## 2. Multi-Tenant Database Architecture

### 2.1 Single Database, User-Level Isolation

AegisWallet uses a **single shared database** with **Row Level Security (RLS)** for complete user data isolation. This approach:

- ✅ Simplifies operations (single database to manage)
- ✅ Reduces costs (no per-user database provisioning)
- ✅ Ensures performance (optimized indexes on `user_id`)
- ✅ Guarantees isolation (enforced at PostgreSQL level)

```
┌─────────────────────────────────────────────────────────┐
│                  NEON DATABASE                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                   users TABLE                    │   │
│  │  user_abc123  │  user_def456  │  user_ghi789   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              bank_accounts TABLE                 │   │
│  │  [RLS] Only shows rows where                     │   │
│  │        user_id = get_current_user_id()          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              transactions TABLE                  │   │
│  │  [RLS] Only shows rows where                     │   │
│  │        user_id = get_current_user_id()          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Schema Pattern: Every Table Has user_id

All user data tables include a `user_id` column referencing the Clerk user:

```typescript
// src/db/schema/bank-accounts.ts
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }),
  // ... other fields
})
```


Tables with user isolation:
- `users`, `user_preferences`, `user_security`
- `bank_accounts`, `transactions`, `transaction_categories`
- `pix_keys`, `pix_qr_codes`, `pix_transactions`
- `boletos`, `boleto_payments`
- `contacts`, `contact_payment_methods`
- `financial_events`, `event_reminders`
- `notifications`, `alert_rules`
- `chat_sessions`, `chat_messages`, `voice_commands`
- `lgpd_consents`, `lgpd_consent_logs`, `lgpd_export_requests`

---

## 3. Row Level Security (RLS) Implementation

### 3.1 Enabling RLS on Tables

```sql
-- Enable RLS on all user tables
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
-- ... all user data tables
```

### 3.2 Helper Function for User Context

```sql
-- Function to get current user ID from Clerk context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;
```

### 3.3 RLS Policies

Each table has a policy that restricts access to the authenticated user's data:

```sql
-- Users can only access their own bank accounts
CREATE POLICY bank_accounts_own ON bank_accounts
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- Users can only access their own transactions
CREATE POLICY transactions_own ON transactions
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());
```

### 3.4 Performance Indexes

```sql
-- Indexes on user_id columns for RLS performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_pix_transactions_user_id ON pix_transactions(user_id);
```

---

## 4. User-Scoped Database Clients

### 4.1 HTTP Client (for single queries)

```typescript
// src/db/rls.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export const createUserScopedClient = (userId: string) => {
  const sqlClient = neon(process.env.DATABASE_URL)
  const db = drizzle(sqlClient, { schema })

  return {
    ...db,

    async withUserContext<T>(queryFn: () => Promise<T>): Promise<T> {
      // Set user context for RLS
      await db.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`
      )
      return queryFn()
    },

    getDb: () => db,
    getUserId: () => userId,
  }
}
```


### 4.2 Pool Client (for transactions)

```typescript
// src/db/rls.ts
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

export const createUserScopedPoolClient = async (userId: string) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    min: 5,
  })

  const db = drizzle(pool, { schema })

  // Set user context for the session (using parameterized query to prevent SQL injection)
  await pool.query('SELECT set_config($1, $2, true)', ['app.current_user_id', userId])

  return {
    db,
    pool,

    async transaction<T>(fn: (tx) => Promise<T>): Promise<T> {
      return db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${userId}, true)`
        )
        return fn(tx)
      })
    },

    async close() {
      await pool.end()
    },
  }
}
```

### 4.3 Service Account (bypasses RLS)

For admin operations, background jobs, and migrations:

```typescript
// src/db/rls.ts
export const createServiceClient = () => {
  const sqlClient = neon(process.env.DATABASE_URL)
  const db = drizzle(sqlClient, { schema })

  return {
    ...db,

    async withServiceContext<T>(queryFn: () => Promise<T>): Promise<T> {
      await db.execute(
        sql`SELECT set_config('app.is_service_account', 'true', true)`
      )
      return queryFn()
    },
  }
}
```

---

## 5. Authenticated Database Client Pattern

### 5.1 Creating Client from Request

```typescript
// src/db/auth-client.ts
import { createClerkClient } from '@clerk/backend'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export async function createAuthenticatedDbClient(request: Request) {
  // Authenticate request with Clerk
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  })

  const requestState = await clerkClient.authenticateRequest(request)
  const authObject = requestState.toAuth()
  const userId = authObject?.userId

  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Create Neon connection
  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql, { schema })

  return {
    db,
    userId,

    async executeWithContext(query) {
      await sql`SET LOCAL app.current_user_id = ${userId}`
      return db.execute(query)
    },
  }
}
```


### 5.2 Usage in API Routes

```typescript
// src/server/routes/bank-accounts.ts
import { Hono } from 'hono'
import { createClientFromAuth } from '@/db/rls'

const app = new Hono()

app.get('/api/v1/accounts', async (c) => {
  const auth = c.get('auth')
  const db = createClientFromAuth(auth)

  // RLS automatically filters by user_id
  const accounts = await db.getDb()
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))

  return c.json({ data: accounts })
})
```

---

## 6. User-Scoped Query Helpers

### 6.1 Pre-built Query Functions

```typescript
// src/db/clerk-neon.ts
import { eq, and, desc } from 'drizzle-orm'
import { db } from './client'
import * as schema from './schema'

// All queries automatically filter by userId

export async function getUserBankAccounts(userId: string) {
  return db
    .select()
    .from(schema.bankAccounts)
    .where(eq(schema.bankAccounts.userId, userId))
    .orderBy(desc(schema.bankAccounts.createdAt))
}

export async function getUserTransactions(userId: string, options?: {
  limit?: number
  accountId?: string
  startDate?: Date
}) {
  const conditions = [eq(schema.transactions.userId, userId)]

  if (options?.accountId) {
    conditions.push(eq(schema.transactions.accountId, options.accountId))
  }

  return db
    .select()
    .from(schema.transactions)
    .where(and(...conditions))
    .orderBy(desc(schema.transactions.transactionDate))
    .limit(options?.limit ?? 50)
}

export async function getUserFinancialSummary(userId: string) {
  const accounts = await db
    .select({
      balance: schema.bankAccounts.balance,
      currency: schema.bankAccounts.currency,
    })
    .from(schema.bankAccounts)
    .where(
      and(
        eq(schema.bankAccounts.userId, userId),
        eq(schema.bankAccounts.isActive, true)
      )
    )

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  )

  return {
    totalBalance,
    accountCount: accounts.length,
    currency: 'BRL',
  }
}
```

### 6.2 CRUD Operations with Ownership Check

```typescript
// src/db/clerk-neon.ts

export async function createUserTransaction(userId: string, data: TransactionInput) {
  const result = await db
    .insert(schema.transactions)
    .values({
      ...data,
      userId, // Always set userId
    })
    .returning()

  return result[0]
}

export async function updateUserTransaction(
  userId: string,
  transactionId: string,
  data: Partial<TransactionInput>
) {
  // Ownership check: only update if user owns the transaction
  const result = await db
    .update(schema.transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(schema.transactions.id, transactionId),
        eq(schema.transactions.userId, userId) // Ownership check
      )
    )
    .returning()

  return result[0]
}

export async function deleteUserTransaction(userId: string, transactionId: string) {
  const result = await db
    .delete(schema.transactions)
    .where(
      and(
        eq(schema.transactions.id, transactionId),
        eq(schema.transactions.userId, userId) // Ownership check
      )
    )
    .returning()

  return result[0]
}
```


---

## 7. Clerk Webhooks Integration

### 7.1 Webhook Endpoint

Handles user lifecycle events from Clerk:

```typescript
// src/server/routes/webhooks/clerk.ts
import { Hono } from 'hono'
import { Webhook } from 'svix'

const app = new Hono()

app.post('/api/webhooks/clerk', async (c) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  const payload = await c.req.text()
  const headers = {
    'svix-id': c.req.header('svix-id'),
    'svix-timestamp': c.req.header('svix-timestamp'),
    'svix-signature': c.req.header('svix-signature'),
  }

  // Verify webhook signature
  const wh = new Webhook(webhookSecret)
  const event = wh.verify(payload, headers)

  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data)
      break
    case 'user.deleted':
      await handleUserDeleted(event.data)
      break
  }

  return c.json({ received: true })
})
```

### 7.2 User Creation Flow

```
User signs up via Clerk
         │
         ▼
Clerk sends `user.created` webhook
         │
         ▼
Backend receives webhook at /api/webhooks/clerk
         │
         ▼
Creates Stripe customer with user email
         │
         ▼
Stores stripeCustomerId in Clerk privateMetadata
         │
         ▼
Creates free subscription record in database
```

```typescript
async function handleUserCreated(data: UserCreatedEvent) {
  const { id: userId, email_addresses, first_name, last_name } = data
  const email = email_addresses[0]?.email_address

  // 1. Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    name: `${first_name} ${last_name}`,
    metadata: { clerkUserId: userId },
  })

  // 2. Store stripeCustomerId in Clerk
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { stripeCustomerId: stripeCustomer.id },
  })

  // 3. Create database records
  await db.insert(users).values({
    id: userId,
    email,
    fullName: `${first_name} ${last_name}`,
  })

  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: stripeCustomer.id,
    planId: 'free',
    status: 'free',
  })
}
```

### 7.3 User Deletion Flow (LGPD Compliance)

```typescript
async function handleUserDeleted(data: UserDeletedEvent) {
  const { id: userId } = data

  // 1. Find subscription
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (subscription[0]?.stripeCustomerId) {
    // 2. Cancel Stripe subscriptions
    await stripe.subscriptions.list({
      customer: subscription[0].stripeCustomerId,
    }).then(async (subs) => {
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id)
      }
    })

    // 3. Delete Stripe customer
    await stripe.customers.del(subscription[0].stripeCustomerId)
  }

  // 4. Delete all user data (LGPD compliance)
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
  await db.delete(transactions).where(eq(transactions.userId, userId))
  await db.delete(bankAccounts).where(eq(bankAccounts.userId, userId))
  // ... delete all user-related records
}
```


---

## 8. Billing Integration

### 8.1 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| Gratuito | R$ 0,00 | Dashboard básico, 1 conta, 100 transações/mês |
| Básico | R$ 59,00/mês | Chat IA (Gemini Flash), 3 contas, automações |
| Avançado | R$ 119,00/mês | Todos modelos IA, contas ilimitadas, suporte premium |

### 8.2 Stripe Integration

```typescript
// Create checkout session
app.post('/api/v1/billing/checkout', async (c) => {
  const auth = c.get('auth')
  const { priceId, successUrl, cancelUrl } = await c.req.json()

  const session = await stripe.checkout.sessions.create({
    customer: auth.user.stripeCustomerId,
    payment_method_types: ['card', 'boleto'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return c.json({ checkoutUrl: session.url })
})
```

### 8.3 Customer Portal

```typescript
app.post('/api/v1/billing/portal', async (c) => {
  const auth = c.get('auth')
  const { returnUrl } = await c.req.json()

  const session = await stripe.billingPortal.sessions.create({
    customer: auth.user.stripeCustomerId,
    return_url: returnUrl,
  })

  return c.json({ portalUrl: session.url })
})
```

---

## 9. Security Best Practices

### 9.1 Environment Variables

```bash
# .env.local (never commit!)

# Clerk (required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Client-safe
CLERK_SECRET_KEY=sk_test_...             # Server-only
CLERK_WEBHOOK_SECRET=whsec_...           # Webhook verification

# Database
DATABASE_URL=postgresql://...            # Neon connection string

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 9.2 Secret Rotation

- Rotate keys immediately if compromised
- Use `pk_test_` for development, `pk_live_` for production
- Store secrets in deployment platform (Vercel)

### 9.3 Webhook Security

```typescript
// Always verify webhook signatures
const wh = new Webhook(webhookSecret)
const event = wh.verify(payload, headers) // Throws if invalid

// Never skip verification
// ❌ const event = JSON.parse(payload)
```

### 9.4 Data Access Control

```typescript
// ✅ Always include userId in queries
const accounts = await db
  .select()
  .from(bankAccounts)
  .where(eq(bankAccounts.userId, auth.userId))

// ❌ Never query without user filter
// const accounts = await db.select().from(bankAccounts)
```

---

## 10. LGPD Compliance

### 10.1 Data Retention Policies

| Data Type | Retention | Legal Basis |
|-----------|-----------|-------------|
| Financial Data | 5 years | Legal requirement (fiscal) |
| Payment Methods | 5 years | Contractual necessity |
| Consent Records | 7 years | Legal requirement |
| Audit Logs | 5 years | Legal requirement |

### 10.2 Right to Access (Data Export)

```typescript
export async function exportUserData(userId: string) {
  return {
    profile: await db.select().from(users).where(eq(users.id, userId)),
    bankAccounts: await getUserBankAccounts(userId),
    transactions: await getUserTransactions(userId),
    pixKeys: await getUserPixKeys(userId),
    consents: await getUserConsents(userId),
    exportDate: new Date(),
    format: 'json',
  }
}
```


### 10.3 Right to Deletion

```typescript
export async function handleDataDeletion(userId: string) {
  // Check for legal holds
  const hasActiveSubscription = await checkActiveSubscription(userId)
  const hasUnpaidInvoices = await checkUnpaidInvoices(userId)

  if (hasActiveSubscription || hasUnpaidInvoices) {
    return {
      success: false,
      reason: 'Dados retidos por obrigação legal ou contratual',
      retentionUntil: calculateRetentionDate(userId),
    }
  }

  // Proceed with anonymization/deletion
  await anonymizeUserData(userId)
  return { success: true }
}
```

---

## 11. Testing Authentication

### 11.1 Integration Test

```bash
# Run Clerk + Neon integration tests
bun scripts/test-clerk-neon-integration.ts
```

### 11.2 RLS Isolation Test

```typescript
describe('RLS Data Isolation', () => {
  it('should isolate user data', async () => {
    const userA = 'user_test_a'
    const userB = 'user_test_b'

    // Create transaction for User A
    await createUserTransaction(userA, { amount: 100 })

    // User B should not see User A's transaction
    const userBTransactions = await getUserTransactions(userB)
    expect(userBTransactions).toHaveLength(0)
  })
})
```

### 11.3 Webhook Testing

```bash
# Local development with ngrok
ngrok http 3000

# Use ngrok URL in Clerk webhook settings
# https://xxxxx.ngrok.io/api/webhooks/clerk
```

---

## 12. Troubleshooting

### 12.1 "Missing VITE_CLERK_PUBLISHABLE_KEY"

- Verify `.env.local` contains the key
- Restart development server after adding

### 12.2 Authentication Not Persisting

- Enable browser cookies
- Check Clerk Dashboard session settings
- Clear browser cache

### 12.3 RLS Not Filtering Data

- Verify `SET LOCAL app.current_user_id` is called
- Check RLS policies are applied: `SELECT * FROM pg_policies`
- Ensure indexes exist on `user_id` columns

### 12.4 Webhook Not Receiving Events

- Verify endpoint URL is HTTPS (production)
- Check Clerk Dashboard > Webhooks > Events for delivery status
- Validate webhook secret matches

---

## 13. Quick Reference

### 13.1 Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | ClerkProvider setup |
| `src/db/rls.ts` | User-scoped database clients |
| `src/db/clerk-neon.ts` | Query helpers with user isolation |
| `src/db/auth-client.ts` | Authenticated database client |
| `drizzle/0000_clerk_rls_policies.sql` | RLS policies |
| `src/server/routes/webhooks/clerk.ts` | Webhook handler |

### 13.2 Essential Commands

```bash
# Development
bun dev                                    # Start dev server

# Database
bunx drizzle-kit push                      # Push schema to Neon
bunx drizzle-kit generate                  # Generate migrations

# Testing
bun scripts/test-clerk-neon-integration.ts # Test integration
bun scripts/test-rls-isolation.ts          # Test data isolation
bun scripts/apply-rls-policies.ts          # Apply RLS policies
```

### 13.3 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/webhooks/clerk` | POST | Webhook | User lifecycle events |
| `/api/v1/billing/subscription` | GET | Bearer | Get subscription |
| `/api/v1/billing/checkout` | POST | Bearer | Create checkout |
| `/api/v1/billing/portal` | POST | Bearer | Customer portal |
| `/api/v1/billing/plans` | GET | Public | List plans |

---

## See Also

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk + Neon Integration](https://clerk.com/docs/integrations/databases/neon)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [LGPD Compliance](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

# Backend API Guide

## Package Identity

**Purpose**: Hono RPC API server for AegisWallet financial operations
**Framework**: Hono (edge-first) + @hono/zod-validator + Drizzle ORM

## Setup & Run

> See root `AGENTS.md` for global commands (`bun install`, `bun type-check`, `bun lint`)

```bash
# Server-specific commands
bun dev:server                 # Backend only (http://localhost:3000)
bun build:api                  # Build for Vercel deployment
bun test:integration           # Integration tests
bun health:check               # Health endpoint check
```

## Patterns & Conventions

### File Organization

```
src/server/
├── routes/
│   ├── health.ts              # Health check endpoints
│   ├── static.ts              # Static file serving
│   └── v1/                    # API v1 routes
│       ├── users.ts           # User management
│       ├── transactions.ts    # Transaction CRUD
│       ├── bank-accounts.ts   # Bank account management
│       ├── billing/           # Billing & subscriptions
│       ├── calendar.ts        # Financial events
│       └── [domain].ts        # Domain-specific routes
├── middleware/
│   ├── auth.ts                # Clerk authentication
│   ├── cors.ts                # CORS configuration
│   └── subscription.ts        # Subscription validation
├── webhooks/
│   └── clerk.ts               # Clerk webhook handlers
├── cron/
│   └── [job].ts               # Background jobs
└── lib/
    ├── logger.ts              # Structured logging
    └── db-error-handler.ts    # Database error handling
```

### API Route Pattern

**Copy pattern from**: `src/server/routes/v1/users.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '@/server/middleware/auth';

const usersRouter = new Hono();

// GET /api/v1/users/me
usersRouter.get('/me', authMiddleware, async (c) => {
  const { userId } = c.get('auth');

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ data: user });
});

// POST /api/v1/users/preferences
const preferencesSchema = z.object({
  language: z.enum(['pt-BR', 'en-US']),
  currency: z.string(),
});

usersRouter.post(
  '/preferences',
  authMiddleware,
  zValidator('json', preferencesSchema),
  async (c) => {
    const { userId } = c.get('auth');
    const data = c.req.valid('json');

    await db
      .update(users)
      .set({ preferences: data })
      .where(eq(users.clerkId, userId));

    return c.json({ success: true });
  }
);

export default usersRouter;
```

### Naming Conventions

- **Routes**: `/api/v1/{domain}/{action}` (e.g., `/api/v1/users/me`)
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Files**: kebab-case (e.g., `bank-accounts.ts`)
- **Routers**: camelCase with `Router` suffix (e.g., `usersRouter`)

### Validation Pattern

#### ✅ DO: Zod Validation with @hono/zod-validator

```typescript
// Copy pattern from: src/server/routes/v1/transactions.ts
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  type: z.enum(['income', 'expense']),
  date: z.string().datetime(),
});

router.post(
  '/transactions',
  authMiddleware,
  zValidator('json', createTransactionSchema),
  async (c) => {
    const data = c.req.valid('json'); // Type-safe validated data
    // ... implementation
  }
);
```

#### ✅ DO: Authentication Middleware

```typescript
// Copy pattern from: src/server/middleware/auth.ts
import { authMiddleware } from '@/server/middleware/auth';

router.get('/protected', authMiddleware, async (c) => {
  const { userId } = c.get('auth'); // Clerk user ID
  // ... implementation
});
```

#### ✅ DO: Error Handling

```typescript
// Copy pattern from: src/server/lib/db-error-handler.ts
try {
  const result = await db.query.users.findFirst({ ... });
  if (!result) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json({ data: result });
} catch (error) {
  logger.error('Database error', { error, userId });
  return c.json({ error: 'Internal server error' }, 500);
}
```

#### ❌ DON'T: Unvalidated Input

```typescript
// ❌ BAD: No validation
router.post('/transactions', async (c) => {
  const data = await c.req.json(); // Unvalidated!
  await db.insert(transactions).values(data);
});

// ✅ GOOD: Zod validation
router.post(
  '/transactions',
  zValidator('json', createTransactionSchema),
  async (c) => {
    const data = c.req.valid('json'); // Type-safe!
    await db.insert(transactions).values(data);
  }
);
```

#### ❌ DON'T: Missing Authentication

```typescript
// ❌ BAD: No auth on protected route
router.get('/user-data', async (c) => {
  // Anyone can access!
});

// ✅ GOOD: Auth middleware
router.get('/user-data', authMiddleware, async (c) => {
  const { userId } = c.get('auth');
  // Only authenticated users
});
```

### Database Query Pattern

**Copy pattern from**: `src/server/routes/v1/transactions.ts`

```typescript
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Query with filters
const userTransactions = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense')
    )
  )
  .orderBy(desc(transactions.date))
  .limit(50);
```

### Webhook Pattern

**Copy pattern from**: `src/server/webhooks/clerk.ts`

```typescript
import { Webhook } from 'svix';

router.post('/webhooks/clerk', async (c) => {
  const payload = await c.req.text();
  const headers = c.req.header();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(payload, headers);
    // Handle webhook event
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Invalid signature' }, 400);
  }
});
```

## Touch Points / Key Files

**Core Server**:
- `src/server/server.ts` - Server entry point
- `src/server/index.ts` - Hono app configuration
- `src/server/routes/api.ts` - API route aggregation

**Health Checks**:
- `src/server/routes/health.ts` - Health endpoints (`/api/health`, `/api/ping`)
- `src/server/routes/v1/health.ts` - v1 health endpoints

**API Routes**:
- `src/server/routes/v1/users.ts` - User management
- `src/server/routes/v1/transactions.ts` - Transaction CRUD
- `src/server/routes/v1/bank-accounts.ts` - Bank account management
- `src/server/routes/v1/billing/` - Billing & subscriptions
- `src/server/routes/v1/calendar.ts` - Financial events

**Middleware**:
- `src/server/middleware/auth.ts` - Clerk authentication
- `src/server/middleware/cors.ts` - CORS configuration
- `src/server/middleware/subscription.ts` - Subscription validation

**Webhooks**:
- `src/server/webhooks/clerk.ts` - Clerk webhook handlers

**Utilities**:
- `src/server/lib/logger.ts` - Structured logging
- `src/server/lib/db-error-handler.ts` - Database error handling

## JIT Index Hints

```bash
# Find API routes
rg -n "export default.*Hono" src/server/routes/

# Find route handlers
rg -n "\.(get|post|put|delete)\(" src/server/routes/

# Find middleware usage
rg -n "authMiddleware|zValidator" src/server/routes/

# Find database queries
rg -n "db\.(select|insert|update|delete)" src/server/routes/

# Find webhook handlers
rg -n "webhooks" src/server/

# Find cron jobs
find src/server/cron -name "*.ts"
```

## Common Gotchas

- **Database Client**: Import from `@/db/client` (server-only), NOT `@/db` (client-safe)
- **Authentication**: Always use `authMiddleware` on protected routes
- **Validation**: Always validate input with Zod schemas

## Pre-PR Checks

```bash
bun type-check && bun lint && bun test:integration
```

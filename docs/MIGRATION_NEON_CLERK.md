# Migration Guide: Supabase to Neon + Clerk + Drizzle

## Overview

This document tracks the migration from Supabase (Auth + Database) to:
- **Database**: Neon (PostgreSQL Serverless) + Drizzle ORM
- **Authentication**: Clerk

## Migration Status

### ✅ Completed

1. **Dependencies installed**
   - `drizzle-orm` v0.44.7
   - `@neondatabase/serverless` v1.0.2
   - `drizzle-kit` v0.31.7
   - `@clerk/clerk-react` v5.57.0
   - `@clerk/backend` v2.24.0
   - `@clerk/localizations` v3.28.5

2. **Drizzle Schema created** (`src/db/schema/`)
   - `users.ts` - User management tables
   - `bank-accounts.ts` - Bank accounts integration (Belvo)
   - `transactions.ts` - Financial transactions
   - `calendar.ts` - Financial calendar events
   - `pix.ts` - Brazilian PIX payment system
   - `contacts.ts` - Contact directory
   - `boletos.ts` - Brazilian payment slips
   - `voice-ai.ts` - Voice commands and AI insights
   - `notifications.ts` - User notifications
   - `audit.ts` - LGPD compliance audit logs
   - `relations.ts` - Table relations
   - `index.ts` - Central export

3. **Database client created** (`src/db/client.ts`)
   - HTTP client for simple queries
   - Pool client for transactions

4. **Clerk integration** (`src/integrations/clerk/`)
   - `provider.tsx` - Brazilian Portuguese localized provider
   - `hooks.ts` - Custom Clerk hooks
   - `client.ts` - Clerk configuration
   - `index.ts` - Central export

5. **Auth middleware migrated** (`src/server/middleware/clerk-auth.ts`)
   - Clerk token verification
   - User context with Drizzle client

6. **Transactions router migrated** (`src/server/routes/v1/transactions.ts`)
   - Full Drizzle ORM implementation

### 🔄 In Progress

7. **API routes requiring migration** (use `supabase` → `db`):
   - `src/server/routes/v1/users.ts`
   - `src/server/routes/v1/bank-accounts.ts`
   - `src/server/routes/v1/calendar.ts`
   - `src/server/routes/v1/compliance.ts`
   - `src/server/routes/v1/contacts.ts`
   - `src/server/routes/v1/google-calendar.ts`
   - `src/server/routes/v1/voice.ts`
   - `src/server/routes/v1/ai-chat.ts`

### ⏳ Pending

8. **Database migration**
   - Run `bun db:generate` to generate SQL migrations
   - Run `bun db:push` to apply schema to Neon
   - Migrate existing data from Supabase to Neon

9. **Environment variables**
   - Set `DATABASE_URL` to Neon connection string
   - Set `CLERK_SECRET_KEY` for backend auth

10. **Testing**
    - Unit tests for Drizzle queries
    - Integration tests for Clerk auth
    - E2E tests for full flow

## Migration Pattern for Routers

### Before (Supabase)
```typescript
const { user, supabase } = c.get('auth');

const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id);
```

### After (Drizzle)
```typescript
import { eq } from 'drizzle-orm';
import { transactions } from '@/db/schema';

const { user, db } = c.get('auth');

const data = await db
  .select()
  .from(transactions)
  .where(eq(transactions.userId, user.id));
```

## Key Differences

| Feature | Supabase | Neon + Drizzle |
|---------|----------|----------------|
| Client | `supabase.from('table')` | `db.select().from(table)` |
| Filters | `.eq('col', val)` | `eq(table.col, val)` |
| Insert | `.insert({...})` | `db.insert(table).values({...})` |
| Update | `.update({...})` | `db.update(table).set({...})` |
| Delete | `.delete()` | `db.delete(table)` |
| Return | `.select().single()` | `.returning()` |

## Environment Setup

```bash
# Required environment variables
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Running Migrations

```bash
# Generate SQL migrations from schema
bun db:generate

# Apply migrations to database
bun db:migrate

# Push schema directly (dev only)
bun db:push

# Open Drizzle Studio
bun db:studio
```

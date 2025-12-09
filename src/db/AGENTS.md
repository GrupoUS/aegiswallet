# Database Layer Guide

## Package Identity

**Purpose**: Drizzle ORM database layer for Neon PostgreSQL
**ORM**: Drizzle (type-safe, TCP connection)
**Database**: Neon (serverless PostgreSQL)

## Setup & Run

> See root `AGENTS.md` for global commands (`bun install`, `bun type-check`)

```bash
# Database-specific commands
bun neon:verify                # Comprehensive setup verification
bun smoke:db                   # Quick connection test
bun db:generate                # Generate migrations from schema
bun db:migrate                 # Apply migrations
bun db:push                    # Push schema directly (dev only)
bun db:studio                  # Visual database browser
bun db:compliance              # LGPD compliance validation
```

## Patterns & Conventions

### File Organization

```
src/db/
├── schema/
│   ├── index.ts               # Schema aggregation
│   ├── users.ts               # User schema
│   ├── transactions.ts        # Transaction schema
│   ├── bank-accounts.ts       # Bank account schema
│   ├── billing.ts             # Billing & subscriptions
│   ├── lgpd.ts                # LGPD compliance tables
│   ├── pix.ts                 # PIX payment tables
│   └── [domain].ts            # Domain-specific schemas
├── client.ts                  # Database client (server-only)
├── index.ts                   # Schema exports (client-safe)
├── migrate.ts                 # Migration runner
└── seed.ts                    # Database seeding
```

### Schema Pattern

**Copy pattern from**: `src/db/schema/users.ts`

```typescript
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  preferences: jsonb('preferences').$type<UserPreferences>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

interface UserPreferences {
  language: 'pt-BR' | 'en-US';
  currency: string;
  notifications: boolean;
}
```

### Naming Conventions

- **Tables**: snake_case (e.g., `bank_accounts`)
- **Columns**: snake_case (e.g., `created_at`)
- **Types**: PascalCase (e.g., `User`, `NewUser`)
- **Files**: kebab-case (e.g., `bank-accounts.ts`)

### Relations Pattern

**Copy pattern from**: `src/db/schema/relations.ts`

```typescript
import { relations } from 'drizzle-orm';
import { users } from './users';
import { transactions } from './transactions';

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
```

### Query Pattern

#### ✅ DO: Type-Safe Queries

```typescript
// Copy pattern from: src/server/routes/v1/users.ts
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Select with filter
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.clerkId, userId))
  .limit(1);

// Insert
const [newUser] = await db
  .insert(users)
  .values({
    clerkId: userId,
    email: 'user@example.com',
    name: 'User Name',
  })
  .returning();

// Update
await db
  .update(users)
  .set({ name: 'New Name' })
  .where(eq(users.id, userId));

// Delete
await db
  .delete(users)
  .where(eq(users.id, userId));
```

#### ✅ DO: Complex Queries with Joins

```typescript
// Copy pattern from: src/server/routes/v1/transactions.ts
import { db } from '@/db/client';
import { transactions, bankAccounts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const results = await db
  .select({
    transaction: transactions,
    account: bankAccounts,
  })
  .from(transactions)
  .leftJoin(bankAccounts, eq(transactions.accountId, bankAccounts.id))
  .where(
    and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense')
    )
  )
  .orderBy(desc(transactions.date))
  .limit(50);
```

#### ✅ DO: LGPD Compliance (Audit Logs)

```typescript
// Copy pattern from: src/db/schema/lgpd.ts
import { auditLogs } from '@/db/schema';

// Log data access
await db.insert(auditLogs).values({
  userId,
  action: 'data_access',
  resource: 'user_profile',
  metadata: { ip: clientIp },
});
```

#### ❌ DON'T: Import Database Client in Frontend

```typescript
// ❌ BAD: Importing db client in frontend code
import { db } from '@/db/client'; // Server-only!

// ✅ GOOD: Use API routes
const response = await fetch('/api/v1/users/me');
const { data } = await response.json();
```

#### ❌ DON'T: Raw SQL (Use Query Builder)

```typescript
// ❌ BAD: Raw SQL (type-unsafe)
const users = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);

// ✅ GOOD: Query builder (type-safe)
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);
```

### Migration Pattern

**Copy pattern from**: `drizzle/migrations/`

```bash
# Generate migration from schema changes
bun db:generate

# Review generated migration in drizzle/migrations/
# Apply migration
bun db:migrate
```

### Seeding Pattern

**Copy pattern from**: `src/db/seed.ts`

```typescript
import { db } from '@/db/client';
import { users, subscriptionPlans } from '@/db/schema';

async function seed() {
  // Seed subscription plans
  await db.insert(subscriptionPlans).values([
    {
      name: 'Gratuito',
      price: 0,
      features: ['Dashboard básico'],
    },
    {
      name: 'Básico',
      price: 5900, // R$ 59.00 in cents
      features: ['Chat IA', 'Automações básicas'],
    },
  ]);
}

seed();
```

## Touch Points / Key Files

**Core Database**:
- `src/db/client.ts` - Database client (server-only)
- `src/db/index.ts` - Schema exports (client-safe)
- `src/db/migrate.ts` - Migration runner
- `src/db/seed.ts` - Database seeding

**Schemas**:
- `src/db/schema/index.ts` - Schema aggregation
- `src/db/schema/users.ts` - User schema
- `src/db/schema/transactions.ts` - Transaction schema
- `src/db/schema/bank-accounts.ts` - Bank account schema
- `src/db/schema/billing.ts` - Billing & subscriptions
- `src/db/schema/lgpd.ts` - LGPD compliance tables
- `src/db/schema/pix.ts` - PIX payment tables
- `src/db/schema/relations.ts` - Table relations

**Migrations**:
- `drizzle/migrations/` - Generated migrations
- `drizzle.config.ts` - Drizzle configuration

## JIT Index Hints

```bash
# Find schema definitions
rg -n "export const.*=.*pgTable" src/db/schema/

# Find database queries
rg -n "db\.(select|insert|update|delete)" src/

# Find migrations
find drizzle/migrations -name "*.sql"

# Find type exports
rg -n "export type.*=.*typeof.*\.\$infer" src/db/schema/

# Find relations
rg -n "relations\(" src/db/schema/
```

## Common Gotchas

- **Client Import**: NEVER import `db` from `@/db/client` in frontend (server-only)
- **Schema Import**: Safe to import schemas from `@/db` in frontend (types only)
- **LGPD**: Log all data access in `audit_logs` table (compliance requirement)

## Pre-PR Checks

```bash
bun type-check && bun db:compliance && bun test:integration
```

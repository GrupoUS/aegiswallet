# tRPC Architecture

> **Status**: ⚠️ DEPRECATED - Kept for Historical Reference Only
> **Last Updated**: 2025-11-25
> **Ownership**: Backend Development Team
> **Superseded By**: [Hono RPC Architecture](./hono-rpc-architecture.md)

---

## ⚠️ DEPRECATION NOTICE

**This document is DEPRECATED and kept for historical reference only.**

The AegisWallet project has migrated from tRPC to Hono RPC. For current architecture documentation, please refer to:

- **[Hono RPC Architecture](./hono-rpc-architecture.md)** - Current architecture documentation
- **[Hono RPC Patterns](./hono-rpc-patterns.md)** - Implementation patterns and best practices
- **[Migration Plan](./trpc-to-hono-migration-plan.md)** - Migration rationale and process

### Migration Summary
- **Bundle Size Reduction**: ~50KB from removing tRPC dependencies
- **Simplified Stack**: Fewer abstractions, clearer error traces
- **API Pattern**: `/api/v1/{domain}/{action}` with HTTP method semantics
- **Client**: `apiClient` from `@/lib/api-client` + TanStack Query

---

## Historical Documentation (Below)

The following content documents the previous tRPC implementation for reference purposes only. **Do not use these patterns for new development.**

---

## 1. Why We Used tRPC (Historical)

- **End-to-End Type Safety** – Automatic TypeScript inference from server to client without code generation.
- **React Query Integration** – First-class integration with TanStack Query (caching, optimistic updates, background refetch).
- **Input Validation** – Runtime validation using Zod schemas shared across frontend/back.
- **Composable Middleware** – Authentication, rate limiting, fraud detection, and logging layers are reusable.
- **Developer Experience** – Autocomplete, inline docs, refactor-safe contracts.
- **Superjson Support** – Transparent serialization for complex types (Date, BigInt, Map, Set).

---

## 2. Architecture Overview

- **Hybrid Approach** – Hono handles HTTP/static assets, tRPC handles API procedures.
- **Server Setup** – `src/server/index.ts` mounts tRPC at `/api/trpc/*` via `fetchRequestHandler`.
- **Context** – `src/server/context.ts` derives a request-scoped Supabase client and session from the `Authorization` header.
- **Router Organization** – Consolidated routers for auth/users/transactions plus domain-specific routers (pix, bankAccounts, contacts, calendar, google-calendar, voice).

---

## 3. Router Structure

### Consolidated Routers (`src/server/routers/consolidated/`)

- `auth.ts` – Authentication flows (signIn, signUp, signOut, resetPassword) with security logging + rate limiting.
- `users.ts` – Profile CRUD, preferences, summaries, account deletion.
- `transactions.ts` – Transaction CRUD with fraud detection, statistics, projections.

### Specialized Routers

- `pix.ts` – PIX keys, transactions, QR codes, stats (≈470 LOC).
- `bankAccounts.ts` – Manual bank account CRUD, balance aggregation.
- `contacts.ts` – Contact CRUD/search/favorites/statistics.
- `calendar.ts` – Financial events/reminders/notifications.
- `google-calendar.ts` – Google Calendar sync (settings, history, sync operations).
- `voice.ts` – Voice command processing, feedback, analytics.
- `banking.ts` – Placeholder for future Belvo/Open Banking integration (see Section 9).

### Procedures

- Shared helpers live under `src/server/procedures/` (voice + banking placeholder) with consolidated routers storing the real business logic.

---

## 4. Authentication & Middleware

- **Context (`src/server/context.ts`)**
  - Extracts JWT from `Authorization` header.
  - Creates request-scoped Supabase client with row-level security.
  - Validates the session and attaches `user`, `supabase`, and metadata to the tRPC context.
- **Procedures (`src/server/trpc-helpers.ts`)**
  - `publicProcedure`: Available without auth but still rate-limited.
  - `protectedProcedure`: Requires `ctx.user`; throws `UNAUTHORIZED` otherwise.
  - `generalApiRateLimit`: Default middleware for all procedures (tunable per domain).
- **Security Tooling**
  - `logSecurityEvent`, `logOperation`, `logError`.
  - Password validation, authentication rate limiting, fraud detection guardrails.

---

## 5. Client-Side Integration

### Setup (`src/lib/trpc.ts`)

```typescript
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}
      },
    }),
  ],
})
```

### Usage Patterns

```typescript
// Query
const { data, isLoading, error } = trpc.pix.getKeys.useQuery()

// Mutation
const utils = trpc.useUtils()
const { mutate: createKey } = trpc.pix.createKey.useMutation({
  onSuccess: () => {
    toast.success('Chave PIX cadastrada com sucesso')
    utils.pix.getKeys.invalidate()
  },
  onError: (error) => {
    toast.error(error.message || 'Erro ao cadastrar chave PIX')
  },
})
```

---

## 6. Trade-offs vs. Plain Hono

| Aspect | tRPC Advantage | Plain Hono Advantage |
| --- | --- | --- |
| Type Safety | ✅ Automatic inference, zero drift | ❌ Manual DTOs |
| React Query | ✅ Hooks + caching out of the box | ❌ Requires custom glue |
| Validation | ✅ Zod at procedure boundary | ❌ Manual middleware |
| DX | ✅ Autocomplete, refactor safety | ❌ Boilerplate heavy |
| Bundle Size | ❌ +~50KB (tree-shakable) | ✅ Minimal |
| Client Compatibility | ❌ TS-first | ✅ Works with any HTTP client |
| Debugging | ⚖️ Requires tRPC tooling | ✅ Simpler stack traces |

**Use Plain Hono When**
- Building public REST endpoints for non-TypeScript consumers.
- Handling webhooks/server-to-server callbacks.
- Streaming/file upload/download flows.

**Use tRPC When**
- The consumer is React/TypeScript.
- Business logic requires strong validation/policies.
- Real-time UX benefits from TanStack Query features.

---

## 7. Best Practices

### Router Organization
- Consolidate: Keep domain routers coherent (auth, users, transactions).
- Specialize: Large domains (pix, calendar) deserve dedicated routers.
- Avoid duplication: Don’t keep outdated `procedures/` copies once logic is inside routers.

### Error Handling
- Wrap procedures with `try/catch`.
- Re-throw `TRPCError` instances.
- Use `logError` with sanitized payloads.
- Return localized (PT-BR) user messages.

### Validation
- Zod schemas for every input.
- Central validators (`@/lib/validation/*`) for CPF, phone, PIX keys, etc.
- Normalize strings (trim, lowercase emails) before persistence.

### Logging
- `logOperation` for success.
- `logError` for failures.
- `logSecurityEvent` for auth/fraud-sensitive flows (IP, user agent, rule triggered).

### Rate Limiting
- `generalApiRateLimit` is the default.
- Specialized limiters for auth, PIX transfers, QR creation, voice commands.

---

## 8. Common Patterns

### Pagination

```typescript
getAll: protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().default(0),
  }))
  .query(async ({ ctx, input }) => {
    const { data, count, error } = await ctx.supabase
      .from('table')
      .select('*', { count: 'exact' })
      .range(input.offset, input.offset + input.limit - 1)

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar os dados.' })

    return {
      items: data ?? [],
      totalCount: count ?? 0,
      hasMore: input.offset + input.limit < (count ?? 0),
    }
  })
```

### Optimistic Updates

```typescript
const utils = trpc.useUtils()
const { mutate } = trpc.transactions.create.useMutation({
  onMutate: async (newTransaction) => {
    await utils.transactions.getAll.cancel()
    const previous = utils.transactions.getAll.getData()
    utils.transactions.getAll.setData(undefined, (old) => [
      newTransaction,
      ...(old ?? []),
    ])
    return { previous }
  },
  onError: (_err, _newTransaction, context) => {
    utils.transactions.getAll.setData(undefined, context?.previous)
  },
  onSettled: () => {
    utils.transactions.getAll.invalidate()
  },
})
```

### Conditional Queries

```typescript
const { data } = trpc.transactions.getById.useQuery(
  { id: transactionId },
  { enabled: Boolean(transactionId) },
)
```

---

## 9. Migration Guide

### From REST to tRPC
1. Create router + procedures.
2. Add Zod validation.
3. Move business logic into procedures.
4. Wrap with error handling/logging.
5. Update client to use TRPC hooks.
6. Remove old REST endpoints.

### From tRPC to Hono
1. Create Hono route handler.
2. Port validation into middleware.
3. Reuse business logic.
4. Update clients to fetch/axios.
5. Decommission tRPC procedure.

---

## 10. Troubleshooting

| Issue | Fix |
| --- | --- |
| **Type errors** | Ensure `AppRouter` export/import is aligned across server/client. |
| **Auth failures** | Confirm JWT header is set; check Supabase session validity. |
| **Rate limit exceeded** | Tune limits or inspect `rateLimiter` redis store. |
| **Serialization errors** | Keep `superjson` transformer in client + server. |
| **Supabase RLS** | Verify policies permit the intended access path. |

### Debug Tips
- Enable tRPC dev mode for verbose errors (`NODE_ENV=development`).
- Use React Query DevTools (`@tanstack/react-query-devtools`) to inspect cache.
- Review structured logs (operation/security/error) for context.
- Confirm Supabase migrations are in sync; drift causes runtime failures.

---

## Appendix – Banking Router Placeholder

`src/server/procedures/banking.ts` remains as a placeholder for future Belvo/Open Banking integration. It will eventually expose account linking, synchronization, and balance retrieval flows once the integration roadmap is prioritized.



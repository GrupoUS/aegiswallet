# tRPC to Hono RPC Migration Plan

## Executive Summary

This document outlines the strategic migration from tRPC to Hono RPC for the AegisWallet project. The migration follows KISS and YAGNI principles by implementing a gradual, incremental approach that minimizes risk and maintains system stability throughout the process.

### Migration Rationale
- **Simplify Stack**: Reduce dependencies and bundle size (~50KB reduction expected)
- **Improve Debugging**: Clearer stack traces and simpler debugging process
- **Maintain Functionality**: Zero regressions while improving developer experience
- **Future-Proof**: More flexible architecture for future enhancements

### Timeline Overview
- **Total Duration**: 6-8 weeks
- **Approach**: 4-phase gradual migration with coexistence
- **Risk Level**: Medium-High (mitigated by incremental approach)

## Current State Analysis

### tRPC Architecture Overview
- **Routers**: 15+ routers with ~40 procedures
  - Core routers: auth, users, transactions, pix, contacts, bankAccounts, calendar, googleCalendar
  - Specialized routers: voice, banking procedures
- **Client Integration**: 10+ hooks using `trpc.*` (useQuery/useMutation)
- **Middleware Stack**: Authentication, rate limiting, validation
- **Bundle Size Impact**: ~50KB from tRPC packages

### Hook Dependencies
- `usePix.tsx`: Complex PIX operations with real-time subscriptions
- `useContacts.ts`: Contact management with optimistic updates
- `useBankAccounts.ts`: Bank account CRUD operations
- `use-transactions.tsx`: Transaction history and filtering
- `useFinancialEvents.ts`: Financial calendar events
- `useProfile.ts`: User profile management
- `useVoiceCommand.ts`: Voice command processing

### Existing Hono Implementation
- **Current Routes**: Minimal (`/api/ping`, `/api/status`)
- **Server**: Hono-based with edge-first architecture
- **Authentication**: JWT via Authorization header with request-scoped Supabase client

## Hono RPC Design Patterns

### Endpoint Structure
- **URL Pattern**: `/api/v1/{domain}/{action}`
- **HTTP Methods**:
  - GET for queries
  - POST for mutations
  - PUT for updates
  - DELETE for deletions
- **Versioning**: `/api/v1`, `/api/v2` for breaking changes

### Type-Safe Contracts
- **Validation**: Zod schemas for input validation
- **Type Inference**: `z.infer<typeof schema>` for type definitions
- **Shared Schemas**: Common validation between server and client

### Authentication Middleware
- **JWT Extraction**: From Authorization header
- **Supabase Client**: Request-scoped with user token
- **User Validation**: Verify token and attach user context
- **Error Handling**: Standardized 401 responses

### Error Handling Patterns
- **Standard Format**:
  ```json
  {
    "error": "Error message",
    "code": "ERROR_CODE",
    "details": { /* optional */ }
  }
  ```
- **Status Codes**: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)
- **Logging**: Structured error logging with context

## Code Examples

### Hono RPC Endpoint Pattern
```typescript
// src/server/routes/v1/pix.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

const pixRouter = new Hono()

// Type-safe schema
const createKeySchema = z.object({
  type: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  value: z.string().min(1),
})

// Endpoint with validation
pixRouter.post(
  '/keys',
  authMiddleware,
  zValidator('json', createKeySchema),
  async (c) => {
    const { user, supabase } = c.get('auth')
    const input = c.req.valid('json')

    // Business logic
    const { data, error } = await supabase
      .from('pix_keys')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({ data }, 201)
  }
)
```

### Custom React Query Hook
```typescript
// src/hooks/usePix.ts (migrated)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function usePixKeys() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['pix', 'keys'],
    queryFn: () => apiClient.get('/api/v1/pix/keys'),
  })

  const { mutate: createKey } = useMutation({
    mutationFn: (input) => apiClient.post('/api/v1/pix/keys', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix', 'keys'] })
      toast.success('Chave PIX cadastrada!')
    },
  })

  return { keys: data?.data || [], isLoading, createKey }
}
```

### API Client Utility
```typescript
// src/lib/api-client.ts
import { supabase } from '@/integrations/supabase/client'

class ApiClient {
  private async getHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    }
  }

  async get(url: string) {
    const res = await fetch(url, {
      headers: await this.getHeaders(),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // ... put, delete methods
}

export const apiClient = new ApiClient()
```

### Authentication Middleware
```typescript
// src/server/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { createRequestScopedClient } from '@/integrations/supabase/factory'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createRequestScopedClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('auth', { user, supabase })
  await next()
})
```

## Migration Phases

### Phase 1: Foundation (Week 1-2)
**Objectives**: Establish Hono RPC patterns and infrastructure

**Tasks**:
- Create `src/lib/api-client.ts` with fetch wrapper
- Create `src/server/middleware/auth.ts` for JWT validation
- Create `src/server/routes/v1/` directory structure
- Implement first Hono RPC endpoint (`/api/v1/health`)
- Test coexistence with tRPC
- Document patterns in `docs/architecture/hono-rpc-patterns.md`

**Deliverables**:
- Working API client with authentication
- Authentication middleware
- First Hono RPC endpoint
- Documentation of patterns

### Phase 2: Standalone Routers (Week 3-4)
**Objectives**: Migrate low-dependency routers to validate patterns

**Tasks**:
- Migrate `voice` router → `/api/v1/voice/*`
- Migrate `banking` router → `/api/v1/banking/*`
- Update `useVoiceCommand` hook to use apiClient
- Validate authentication, rate limiting, error handling
- Run parallel tests (tRPC vs Hono endpoints)

**Deliverables**:
- Voice and banking endpoints in Hono RPC
- Updated hooks using apiClient
- Validation of migration patterns

### Phase 3: Core Routers (Week 5-7)
**Objectives**: Migrate high-traffic routers while maintaining functionality

**Tasks**:
- Migrate `pix` → `/api/v1/pix/*` (keys, transactions, qr-codes, stats)
- Migrate `contacts` → `/api/v1/contacts/*`
- Migrate `bankAccounts` → `/api/v1/bank-accounts/*`
- Migrate `calendar` → `/api/v1/calendar/*`
- Migrate `googleCalendar` → `/api/v1/google-calendar/*`
- Migrate `users` → `/api/v1/users/*`
- Migrate `transactions` → `/api/v1/transactions/*`
- Refactor hooks: `usePix`, `useContacts`, `useBankAccounts`, `useFinancialEvents`, `use-transactions`, `useProfile`
- Maintain real-time subscriptions (Supabase channels)
- Implement optimistic updates in React Query

**Deliverables**:
- All core routers migrated to Hono RPC
- All hooks refactored to use apiClient
- Preserved functionality with improved performance

### Phase 4: Cleanup (Week 8)
**Objectives**: Remove tRPC dependencies and finalize migration

**Tasks**:
- Remove tRPC dependencies from package.json:
  - `@trpc/client`
  - `@trpc/react-query`
  - `@trpc/server`
  - `superjson` (if not used elsewhere)
- Delete `src/server/trpc.ts`, `src/lib/trpc.ts`
- Delete `src/server/routers/` directory
- Delete `src/server/procedures/` directory
- Update `src/server/index.ts` to remove tRPC handler
- Update documentation (`trpc-architecture.md` → `hono-rpc-architecture.md`)
- Run full test suite
- Bundle size analysis (expect ~50KB reduction)

**Deliverables**:
- Clean codebase without tRPC dependencies
- Updated documentation
- Performance metrics showing improvement

## Coexistence Strategy

During migration (Phases 1-3), both tRPC and Hono RPC will coexist:

### Server Side
```typescript
// src/server/index.ts
const app = new Hono()

// Hono RPC routes (new)
app.route('/api/v1', v1Router)

// tRPC handler (legacy, will be removed in Phase 4)
app.use('/api/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    router: appRouter,
    req: c.req.raw,
    createContext,
  })
})
```

### Client Side
- Hooks using tRPC: Continue working unchanged
- Hooks migrated to Hono RPC: Use `apiClient` + React Query
- No breaking changes for components consuming hooks

## Router Migration Priority

### Low Priority (Phase 2)
1. `voice` - Low usage, standalone
2. `banking` - Placeholder only

### High Priority (Phase 3)
1. `pix` - High traffic, complex (keys, transactions, QR codes, stats)
2. `contacts` - Medium complexity
3. `bankAccounts` - Medium complexity
4. `calendar` - Medium complexity, Google sync integration
5. `googleCalendar` - Depends on calendar
6. `users` - Core functionality
7. `transactions` - Core functionality
8. `auth` - Critical (migrate last for safety)

## Hook Migration Checklist

For each hook (e.g., `usePix`):
- [ ] Create Hono RPC endpoints for all procedures
- [ ] Implement Zod validation schemas
- [ ] Add authentication middleware
- [ ] Test endpoints with Postman/curl
- [ ] Refactor hook to use `apiClient`
- [ ] Preserve React Query patterns (caching, invalidation)
- [ ] Maintain optimistic updates
- [ ] Keep real-time subscriptions (Supabase channels)
- [ ] Update tests
- [ ] Verify no regressions in UI

## Type Safety Strategy

### Before (tRPC)
```typescript
// Automatic inference from server to client
const { data } = trpc.pix.getKeys.useQuery()
// data is typed automatically
```

### After (Hono RPC)
```typescript
// Manual type definitions
type PixKey = { id: string; type: string; value: string }

const { data } = useQuery<{ data: PixKey[] }>({
  queryKey: ['pix', 'keys'],
  queryFn: () => apiClient.get('/api/v1/pix/keys'),
})
```

### Mitigation Strategies
- Share Zod schemas between server and client
- Use `z.infer<typeof schema>` for types
- Create type definitions in `src/types/api.types.ts`

## Testing Strategy

### Unit Tests
- Test Hono RPC endpoints with mock Supabase client
- Test hooks with React Testing Library + MSW

### Integration Tests
- Test full flow (endpoint → hook → component)
- Verify authentication, validation, error handling

### Parallel Testing (Phases 2-3)
- Run same test suite against tRPC and Hono endpoints
- Compare responses, performance, error handling
- Ensure feature parity before removing tRPC

## Risk Assessment

### High Risks
- **Type Safety Loss**: Mitigated by shared Zod schemas and manual types
- **Breaking Changes**: Mitigated by gradual migration and coexistence
- **Performance Regression**: Mitigated by benchmarking and monitoring

### Medium Risks
- **Developer Experience**: Mitigated by clear patterns and documentation
- **Testing Coverage**: Mitigated by comprehensive test suite

### Low Risks
- **Bundle Size**: Expected reduction (~50KB)
- **Maintenance**: Simpler stack, easier to debug

## Rollback Strategy

If issues arise during migration:

### Phase 1-2
- Simply don't migrate more routers, keep using tRPC

### Phase 3
- Revert specific hooks to tRPC (keep both endpoints)

### Phase 4
- Don't remove tRPC dependencies until 100% confident

### Rollback Steps
1. Revert hook changes (git revert)
2. Keep Hono endpoints (no harm in coexistence)
3. Monitor for issues
4. Resume migration when ready

## Success Metrics

- [ ] Zero regressions in functionality
- [ ] Bundle size reduced by ~50KB
- [ ] Type-check passes with zero errors
- [ ] All tests passing (unit + integration + E2E)
- [ ] Performance maintained or improved (TTFB, response times)
- [ ] Developer satisfaction (simpler debugging, clearer stack traces)

## Timeline Estimate

### Total Duration: 6-8 weeks
(can be parallelized with feature work)

- **Phase 1**: 1-2 weeks (foundation, patterns, first endpoint)
- **Phase 2**: 1-2 weeks (voice, banking routers)
- **Phase 3**: 3-4 weeks (core routers, hooks refactoring)
- **Phase 4**: 1 week (cleanup, documentation, validation)

### Effort: ~80-120 hours total
(can be split across team)

## Decision Points

Before proceeding with each phase, validate:
- [ ] Phase 1: Patterns documented, first endpoint working
- [ ] Phase 2: Standalone routers migrated, no regressions
- [ ] Phase 3: Core routers migrated, performance validated
- [ ] Phase 4: All tests passing, bundle size reduced

## Conclusion

This migration follows KISS and YAGNI principles by:

- **Gradual approach**: No big-bang rewrite
- **Coexistence**: tRPC and Hono RPC run together
- **Simplicity**: Reduce dependencies, simpler stack
- **Type safety**: Maintained via Zod schemas
- **Low risk**: Rollback strategy at every phase

The migration will result in:
- **Smaller bundle**: ~50KB reduction
- **Simpler stack**: Easier debugging, clearer traces
- **Maintained functionality**: Zero regressions
- **Better DX**: Fewer abstractions, more control

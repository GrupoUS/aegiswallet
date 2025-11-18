# AegisWallet Development Rules & Standards - Version: 2.0.0

## Purpose & Scope

This document establishes comprehensive rules and standards for AI-assisted development of AegisWallet, an autonomous financial assistant for the Brazilian market. It transforms reactive AI interactions into proactive, context-aware collaboration while ensuring consistent, enforceable standards across all development activities.

**Scope**: All AI-assisted development tasks including code implementation, architecture decisions, documentation, testing, and deployment workflows.

## Core Project Identity

### Project Overview
**AegisWallet** is a voice-first autonomous financial assistant designed for the Brazilian market, targeting 95% automation of financial management tasks. It is NOT a cryptocurrency wallet application.

**Core Mission**: Democratize financial automation in Brazil through voice-first AI assistance, progressive trust building (50% → 95% autonomy), and seamless integration with Brazilian financial systems.

### Technology Stack Mandate
- **Core**: Bun + Hono + React 19 + TypeScript + Supabase
- **Frontend**: TanStack Router v5 + TanStack Query v5 + Vite + Tailwind CSS
- **Backend**: tRPC v11 + Hono (Edge-first) + Supabase Functions
- **Database**: Supabase (Postgres + Auth + Realtime + RLS)
- **Package Manager**: Bun (3-5x faster than npm/pnpm)

### Technology Stack Docs
- **TanStack Router**:
```bash
curl "https://r.jina.ai/https://tanstack.com/router/v5/docs/getting-started" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **TanStack Query**:
```bash
curl "https://r.jina.ai/https://tanstack.com/query/latest/docs/framework/react/quick-start" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **Hono**:
```bash
curl "https://r.jina.ai/https://hono.dev/llms-full.txt" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **TRPC**:
```bash
curl "https://r.jina.ai/https://trpc.io/docs/client/tanstack-react-query/setup" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **Vite**:
```bash
curl "https://r.jina.ai/https://vite.dev/guide/features" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **Tailwind CSS**:
```bash
curl "https://r.jina.ai/https://tailwindcss.com/docs/styling-with-utility-classes" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **Bun**:
```bash
curl "https://r.jina.ai/https://bun.sh/llms-full.txt" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```
- **Supabase**:
```bash
curl "https://r.jina.ai/https://supabase.com/llms/guides.txt" \
  -H "Authorization: Bearer <YOUR_JINA_API_KEY>"
```

## Implementation Guidelines

### Architectural Rules

**MUST**:
- Follow KISS (Keep It Simple, Stupid) and YAGNI (You Aren't Gonna Need It) principles
- Maintain single repository structure with current `src/` organization
- Use tRPC v11 for all API procedures with TypeScript strict mode
- Implement Row Level Security (RLS) on all database tables
- Use Supabase client integration patterns from `src/integrations/supabase/client.ts`
- Preserve existing project structure and avoid over-engineering

**SHOULD**:
- Prioritize voice-first interface design in all user interactions
- Design for Brazilian financial system integration (PIX, boletos, Open Banking)
- Implement progressive AI autonomy levels (50% → 95% trust)
- Use edge-first architecture with Hono for optimal performance
- Apply LGPD compliance principles in all data handling

**MAY**:
- Add AI provider factory pattern when scaling user base
- Implement Belvo API integration in future development phases
- Add advanced analytics and insights features
- Create multi-language support beyond Portuguese

**MUST NOT**:
- Create microservices architecture (maintain monolithic approach)
- Use ORMs or abstract database layers (direct Supabase SDK usage)
- Implement complex authentication flows (use Supabase Auth patterns)
- Over-engineer solutions for "just in case" scenarios
- Modify existing database schema without proper migration planning

### Code Quality Standards

**MUST**:
- Use TypeScript strict mode with no implicit any types
- Implement comprehensive Zod validation for all API inputs
- Write meaningful commit messages following conventional commits
- Maintain 90%+ test coverage for critical components
- Use OXLint for code quality validation (50-100x faster than ESLint)

**SHOULD**:
- Follow existing naming conventions and code patterns
- Use absolute imports for internal modules
- Implement proper error handling with user-friendly messages
- Use TanStack Query for server state management
- Apply Tailwind CSS for styling with shadcn/ui components

## Database & API Standards

### Database Schema Rules

**MUST**:
- Use PostgreSQL with Supabase integration
- Implement RLS policies on all tables with tenant isolation
- Use UUID primary keys for all tables
- Include `created_at` and `updated_at` timestamps
- Generate TypeScript types via Supabase CLI

**SHOULD**:
- Use descriptive table and column names in snake_case
- Implement proper foreign key relationships
- Use appropriate constraints and indexes
- Plan migrations carefully with rollback strategies

### API Design Standards

**MUST**:
- Use tRPC v11 for all API procedures
- Implement proper input validation with Zod schemas
- Use consistent error handling patterns
- Return consistent response formats
- Implement proper authentication checks

**Examples**:

```typescript
// ✅ DO: Consistent error handling
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Operation failed. Please try again.',
  })
}

// ❌ DON'T: Inconsistent error responses
if (error) {
  return { error: error.message } // Inconsistent format
}
```

## Testing & Quality Assurance

### Testing Requirements

**MUST**:
- Achieve 90%+ test coverage for critical business logic
- Use Vitest for unit/integration tests (3-5x faster than Jest)
- Implement E2E tests with Playwright for user workflows
- Test RLS policies with crafted JWTs
- Include performance testing for financial operations

**SHOULD**:
- Test error scenarios and edge cases
- Mock external dependencies appropriately
- Use property-based testing for complex logic
- Implement visual regression testing for UI components

## Validation Criteria

### Rule Compliance Checklist

- [ ] Project identity correctly reflects financial assistant (not crypto wallet)
- [ ] Technology stack compliance maintained
- [ ] KISS/YAGNI principles followed in implementation
- [ ] TypeScript strict mode enforced
- [ ] tRPC patterns implemented correctly
- [ ] Supabase integration patterns followed
- [ ] Test coverage ≥90% for critical components
- [ ] Security standards implemented
- [ ] Performance benchmarks met
- [ ] LGPD compliance maintained
- [ ] Documentation standards followed
- [ ] Code review standards followed

## Quick Reference

### Essential Commands
```bash
# Development
bun dev                    # Start development servers
bun build                  # Build all apps and packages

# Quality Assurance
bun lint                   # Lint with OXLint (50-100x faster)
bun type-check             # TypeScript strict mode validation
bun test                   # Run unit and integration tests
bunx biome check           # Alternative quality validation
```

### Import Patterns
```typescript
// Supabase Client
import { supabase } from "@/integrations/supabase/client"

// tRPC
import { router, publicProcedure, protectedProcedure } from "@/server/trpc"

// React Query
import { useQuery, useMutation } from "@tanstack/react-query"
```

### File Structure
```
src/
├── components/               # React UI components
│   ├── ui/                  # shadcn/ui components
│   └── [feature-components]/
├── contexts/                 # React contexts and providers
├── data/                     # Static data and constants
├── hooks/                    # Custom React hooks
├── integrations/
│   └── supabase/            # Supabase client configuration
├── lib/                      # Utility libraries and helpers
├── routes/                   # TanStack Router pages
│   └── __root.tsx          # Root layout
├── server/                   # Backend Hono + tRPC server
│   ├── context.ts          # tRPC context
│   ├── index.ts             # Server entry point
│   ├── middleware/         # Server middleware
│   ├── procedures/         # tRPC procedures
│   ├── routers/            # tRPC routers
│   ├── server.ts           # Hono server setup
│   └── trpc.ts             # tRPC router configuration
├── services/                # Business logic services
├── styles/                  # Global styles and CSS
├── test/                    # Test utilities and fixtures
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── App.tsx                  # Main React application
├── main.tsx                 # Application entry point
└── routeTree.gen.ts        # Generated router types
```

### Project-Specific Patterns

```typescript
// tRPC Procedure Pattern
export const exampleRouter = createTRPCRouter({
  getExample: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),

  createExample: protectedProcedure
    .input(z.object({ data: z.any() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation with authentication
    }),
});

// React Query Pattern
export function useExampleData(id: string) {
  return useQuery({
    queryKey: ["example", id],
    queryFn: () => fetchExample(id),
  });
}

// Router Pattern (TanStack)
export const ExampleRoute = createRoute({
  component: ExampleComponent,
  path: "/example/$id",
  loader: ({ params }) => loadExampleData(params.id),
});
```

**Remember**: Our goal is a simple, autonomous financial assistant that Brazilian users love. Every decision should serve this vision while maintaining technical excellence.
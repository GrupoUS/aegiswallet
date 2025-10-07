# AegisWallet Development Rules & Standards - Version: 2.0.0

## Purpose & Scope

This document establishes comprehensive rules and standards for AI-assisted development of AegisWallet, an autonomous financial assistant for the Brazilian market. It transforms reactive AI interactions into proactive, context-aware collaboration while ensuring consistent, enforceable standards across all development activities.

**Scope**: All AI-assisted development tasks including code implementation, architecture decisions, documentation, testing, and deployment workflows.

## Core Principles

```yaml
CORE_STANDARDS:
  mantra: "Think → Research → Plan → Decompose with atomic tasks → Implement → Validate"
  mission: "Research first, think systematically, implement flawlessly with cognitive intelligence"
  research_driven: "Multi-source validation for all complex implementations"
  vibecoder_integration: "Constitutional excellence with one-shot resolution philosophy"
  core_principle: "Simple systems that work over complex systems that don't"
  preserve_context: "Maintain complete context across all agent and thinking transitions"
  incorporate_always: "Incorporate what we already have, avoid creating new files, enhance the existing structure"
  always_audit: "Never assume the error is fixed, always audit and validate"
  COGNITIVE_ARCHITECTURE:
  meta_cognition: "Think about the thinking process, identify biases, apply constitutional analysis"
  multi_perspective_analysis:
    - "user_perspective: Understanding user intent and constraints"
    - "developer_perspective: Technical implementation and architecture considerations"
    - "business_perspective: Cost, timeline, and stakeholder impact analysis"
    - "security_perspective: Risk assessment and compliance requirements"
    - "quality_perspective: Standards enforcement and continuous improvement"
```

### Development Philosophy

**Mantra**: _"Think → Research → Decompose → Plan → Implement → Validate"_

**KISS Principle**: Choose the simplest solution that meets requirements. Prioritize readable code over clever optimizations. Reduce cognitive load and avoid over-engineering.

**YAGNI Principle**: Build only what requirements specify. Resist "just in case" features. Refactor when requirements emerge. Focus on current user stories and remove unused, redundant and dead code immediately.

**Chain of Thought**: Break problems into sequential steps and atomic subtasks. Verbalize reasoning process. Show intermediate decisions. Validate against requirements.

**Avoid Never Used**: Make sure every file, route, hook, component is being use correctly, avoid errors like "Variable is declared but never used", "Import is never used", "Function is declared but never used". Make sure to remove unused code immediately and create components, hooks, routes only when they are needed. If you create something new, make sure it is being used correctly creating the necessary references.

### A.P.T.E Methodology

**Analyze** → Comprehensive requirements analysis
**Plan** → Strategic implementation planning
**Think** → Metacognition and multi-perspective evaluation
**Execute** → Systematic implementation with quality gates

**Quality Standard**: ≥9.5/10 rating on all deliveries

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

### Code Examples

```typescript
// ✅ DO: Proper tRPC procedure with validation
export const createTransactionRouter = (t: any) => ({
  create: t.procedure
    .input(z.object({
      description: z.string().min(1),
      amount: z.number(),
      category: z.string(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      const { data, error } = await ctx.supabase
        .from('transactions')
        .insert({
          user_id: ctx.user.id,
          description: input.description,
          amount: input.amount,
          category: input.category,
          date: input.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),
})

// ❌ DON'T: Skip validation or error handling
export const badExample = (t: any) => ({
  create: t.procedure
    .mutation(async ({ ctx, input }) => {
      // No validation, no error handling - VIOLATION
      await ctx.supabase
        .from('transactions')
        .insert(input)
    }),
})
```

```typescript
// ✅ DO: Proper Supabase client usage
import { supabase } from "@/integrations/supabase/client";

const { data: transactions, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) {
  throw new Error(`Transaction fetch failed: ${error.message}`)
}

// ❌ DON'T: Direct API calls or client-side filtering
const allTransactions = await fetch('/api/transactions')
const userTransactions = allTransactions.filter(t => t.user_id === userId)
```

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

## Development Workflow Standards

### Mandatory Development Process

**Phase 1: Analysis & Planning**
1. **Sequential Thinking**: Always use sequential-thinking tool first
2. **Requirements Analysis**: Understand complete requirements before implementation
3. **Context Research**: Use Context7 MCP for official documentation research
4. **Architecture Review**: Check existing architecture docs for patterns

**Phase 2: Implementation**
1. **Tool Selection**: Use appropriate MCP tools (serena, desktop-commander)
2. **Code Quality**: Follow established patterns and standards
3. **Testing**: Implement comprehensive testing during development
4. **Validation**: Verify functionality against requirements

**Phase 3: Quality Assurance**
1. **Code Review**: Validate against quality criteria
2. **Testing**: Ensure 90%+ coverage for critical components
3. **Security**: Verify no vulnerabilities in implementation
4. **Performance**: Confirm no regression in Core Web Vitals

### Research Protocol

**MANDATORY STEPS** before implementing unfamiliar patterns:

1. **Context7 MCP Research**:
   ```typescript
   // Research query structure
   search_documentation({
     query: 'technology_name pattern_type best_practices project_context',
     sources: ['official_docs', 'github_issues', 'community_guides'],
   })
   ```

2. **Compatibility Verification**:
   - Confirm compatibility with Bun runtime
   - Verify TypeScript 5.9+ compatibility
   - Check integration with existing stack

3. **Implementation Planning**:
   - Document specific approach
   - Plan integration with existing code
   - Identify potential conflicts or dependencies

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

### Quality Gates

All code changes must pass:
1. **Automated Tests**: 100% pass rate
2. **Type Checking**: Zero TypeScript errors
3. **Security Scan**: Zero high-severity vulnerabilities
4. **Performance**: No Core Web Vitals regression
5. **Code Quality**: OXLint validation with zero errors

## Security & Compliance

### Security Standards

**MUST**:
- Implement proper input validation and sanitization
- Use Supabase RLS for data access control
- Encrypt sensitive data at rest and in transit
- Implement proper audit trails for financial operations
- Use secure authentication patterns with Supabase Auth

**SHOULD**:
- Implement rate limiting for API endpoints
- Use secure session management
- Validate all external API responses
- Implement proper CORS configuration

### LGPD Compliance (Brazilian Data Protection)

**MUST**:
- Obtain explicit user consent for data processing
- Implement data minimization principles
- Provide data export and deletion capabilities
- Maintain audit logs for data access
- Implement proper data retention policies

## Performance Standards

### Performance Requirements

**MUST**:
- Edge read TTFB ≤ 150 ms (P95)
- Realtime UI updates ≤ 1.5 s (P95)
- Voice command processing ≤ 2 s (P95)
- Maintain Lighthouse performance score ≥ 90

**SHOULD**:
- Optimize bundle size for fast loading
- Implement proper caching strategies
- Use lazy loading for non-critical features
- Monitor performance metrics continuously

## Dependencies & Relationships

### Required Dependencies

- **Technology Stack**: Bun + Hono + React 19 + TypeScript + Supabase
- **Frontend**: TanStack Router v5 + TanStack Query v5 + Vite + Tailwind CSS
- **Backend**: tRPC v11 + Hono (Edge-first) + Supabase Functions
- **Database**: Supabase (Postgres + Auth + Realtime + RLS)

### Enhancing Dependencies

- **AI Integration**: OpenAI/Gemini for voice command processing (future phase)
- **Financial APIs**: Belvo integration for bank connectivity (future phase)
- **Analytics**: Customer behavior analytics (future phase)

### Conflicting Dependencies

- **Node.js**: Avoid Node-specific patterns that don't work with Bun
- **Complex ORMs**: Avoid Prisma/TypeORM in favor of direct Supabase SDK
- **Microservices**: Avoid distributed architecture complexity

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

### Quality Metrics

- **Code Quality**: OXLint validation with zero errors
- **Type Safety**: Zero TypeScript errors in strict mode
- **Test Coverage**: 90%+ for critical business logic
- **Performance**: Core Web Vitals ≥ 90
- **Security**: Zero high-severity vulnerabilities

## Maintenance & Updates

### Version Management

- **Major Version** (X.0.0): Breaking changes requiring migration
- **Minor Version** (X.Y.0): New functionality or significant clarifications
- **Patch Version** (X.Y.Z): Bug fixes and minor improvements

### Review Schedule

- **Monthly Review**: Check technology stack updates and security patches
- **Quarterly Review**: Comprehensive rule effectiveness assessment
- **Annual Review**: Major architecture and standards evaluation
- **Triggered Review**: When dependencies change or issues identified

## Success Metrics

### Development Excellence Metrics

- **Implementation Speed**: Time from requirement to deployment
- **Code Quality**: OXLint score and test coverage
- **Bug Rate**: Production issues per feature
- **Performance**: Core Web Vitals and API response times
- **Team Productivity**: Features delivered per sprint

### Project Success Metrics

- **User Adoption**: Active users and feature utilization
- **Automation Rate**: Percentage of financial tasks automated
- **User Satisfaction**: Feedback scores and retention rates
- **Technical Excellence**: Code quality and system reliability
- **Compliance**: LGPD and financial regulation adherence

---

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

# Database
bunx supabase db push      # Apply database migrations
bunx supabase gen types    # Generate TypeScript types
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
├── integrations/supabase/    # Supabase client configuration
├── server/                   # Backend tRPC procedures
├── components/              # React components
├── pages/                   # TanStack Router pages
└── hooks/                   # Custom React hooks
```

**Remember**: Our goal is a simple, autonomous financial assistant that Brazilian users love. Every decision should serve this vision while maintaining technical excellence.
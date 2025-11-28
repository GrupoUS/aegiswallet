# AegisWallet Development Rules

> Voice-first financial assistant for Brazilian market. NOT crypto wallet.

## Quick Commands

```bash
# Development
bun dev                    # Start development servers
bun build                  # Build all apps

# Quality Assurance (Run in Parallel)
bun lint                   # Lint with Biome
bun type-check             # TypeScript validation
bun test                   # Run tests with Vitest
bun test:e2e               # End-to-end tests

# Brazilian Compliance (Run in Parallel)
bun test:e2e:lgpd          # LGPD compliance tests
bun test:e2e:a11y          # Accessibility audit
bun test:e2e:pix           # PIX transaction tests
bun test:e2e:portuguese    # Portuguese interface tests
```

## Technology Stack

- **Runtime**: Bun 1.x
- **Frontend**: React 19 + TanStack Router v5 + TanStack Query v5 + Tailwind CSS
- **Backend**: Hono RPC (Edge-first) + @hono/zod-validator
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: Clerk (user management + sessions)
- **Package Manager**: Bun (3-5x faster)
- **API Pattern**: `/api/v1/{domain}/{action}` with HTTP method semantics

## Project Structure

```
src/                     # Main application source code
├── components/          # React components by feature
│   ├── accessibility/   # WCAG compliance & voice features
│   ├── auth/           # Authentication components (Clerk)
│   ├── billing/        # Subscription & payment management
│   ├── dashboard/      # Main dashboard components
│   ├── financial/      # Banking & transaction features
│   ├── providers/      # React context providers
│   ├── voice/          # Voice interface components
│   └── ui/             # Reusable UI components
├── server/              # Hono API server
│   ├── config/         # Server configuration
│   ├── cron/           # Cron job handlers
│   ├── routes/         # API route handlers
│   ├── middleware/     # Request middleware
│   ├── lib/            # Server utilities
│   └── webhooks/       # External webhook handlers
├── db/                  # Drizzle database schema
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── routes/              # Frontend routes (TanStack Router)
├── types/               # TypeScript type definitions
└── features/            # Feature-based modules

drizzle/                 # Database management
└── migrations/         # Database schema migrations

scripts/                 # Build & utility scripts
├── seed-database.ts    # Database seeding
├── build-api.ts        # API build process
└── test-*.ts           # Integration test scripts

.factory/                # Droid CLI agents & skills
docs/                    # Project documentation
tests/                   # End-to-end tests (Playwright)
```

## Core Principles

**ULTRATHINK**: Always use `sequential-thinking` → `think` tool before implementation.
**KISS**: Simplest solution that works. Readable > clever optimizations.
**YAGNI**: Build only what's needed now. Remove dead code immediately.
**MANDATORY**: Use `serena` MCP for codebase search. Never speculate about unread code.

> **Mantra**: "Think → Research → Decompose with atomic tasks → Plan → Implement → Validate"

> **Note**: See `.factory/AGENTS.md` for orchestration details and dynamic agent routing.

## Code Style

```typescript
// ✅ Good: descriptive, typed, error handling
async function fetchUserById(id: string): Promise<User> {
  if (!id) throw new Error('User ID required');
  return await api.get(`/users/${id}`);
}

// ❌ Bad: vague, untyped, no validation
async function get(x) {
  return await api.get('/users/' + x);
}
```

- Functions: camelCase | Classes: PascalCase | Constants: UPPER_SNAKE
- Use Zod for validation. Use Drizzle for database operations.

## Testing Requirements

**MUST**:
- Achieve 90%+ test coverage for critical business logic
- Use Vitest for unit/integration tests (3-5x faster than Jest)
- Implement E2E tests with Playwright for user workflows
- Test database permissions with Drizzle query validation
- Include performance testing for financial operations

**Quality Gates**: All PRs must pass ✅ Tests | ✅ TypeScript | ✅ Lint | ✅ Security scan | ✅ Lighthouse ≥90

## Available Specialized Droids

| Droid | Purpose | When to Use |
|-------|---------|-------------|
| **apex-dev** | Advanced implementation with Brazilian fintech specialization | Complexity ≥7, performance-critical, security-sensitive |
| **database-specialist** | Neon/PostgreSQL + Drizzle expert with LGPD data protection focus | ANY database operation, schema changes, migration management |
| **code-reviewer** | Enhanced security architect with Brazilian compliance validation | Post-implementation, security validation, architecture review |
| **apex-ui-ux-designer** | UI/UX orchestrator with WCAG 2.1 AA+ accessibility focus | ANY new UI component, design decision, accessibility |
| **apex-researcher** | Multi-source Brazilian regulations research (≥95% accuracy) | Compliance questions, regulatory research, market analysis |
| **product-architect** | Product strategy and requirements integration | Product strategy, large-scale documentation, rules framework |

> **For orchestration details and dynamic routing**: See `.factory/AGENTS.md`

## Brazilian Compliance Requirements

**Security MUST**:
- Implement proper input validation and sanitization
- Use Drizzle query building for safe database operations
- Encrypt sensitive data at rest and in transit
- Use secure authentication patterns with Clerk sessions

**LGPD MUST**:
- Obtain explicit user consent for data processing
- Implement data minimization principles
- Provide data export and deletion capabilities
- Maintain audit logs for data access

**Financial MUST**:
- Follow BCB (Central Bank of Brazil) specifications for PIX
- Implement Portuguese-first interfaces
- Meet WCAG 2.1 AA+ accessibility requirements

## Critical Rules & Boundaries

✅ **Always**: Validate inputs, use Drizzle safely, encrypt sensitive data, test before commit
⚠️ **Ask First**: Schema changes, new dependencies, CI/CD modifications  
🚫 **Never**: Commit secrets, skip compliance validation, speculate about unread code

## Development Workflow

**Complexity Assessment**: 1-10 scale for task difficulty
**TDD Required**: For complexity ≥7
**Parallel Strategy**: Research + implementation phases when possible
**Quality Gates**: Security → Brazilian compliance → Performance validation

---

> **For complete orchestration details**: See `.factory/AGENTS.md` for dynamic agent routing, spec mode protocols, and parallel execution coordination.

---

> **For complete orchestration details**: See `.factory/AGENTS.md` for dynamic agent routing, spec mode protocols, and parallel execution coordination.

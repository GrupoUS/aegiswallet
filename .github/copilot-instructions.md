# AegisWallet - GitHub Copilot Universal Instructions

> **Orchestration Rules for AI-Assisted Development**

## 🎯 Project Identity

**AegisWallet** is a voice-first autonomous financial assistant for the Brazilian market.
- **NOT** a cryptocurrency wallet
- **Mission**: 95% automation of financial management tasks
- **Market**: Brazil (Portuguese-first, LGPD compliance, PIX/boletos integration)

## 🛠️ Technology Stack (Mandatory)

```yaml
Core:
  runtime: Bun (latest)
  backend: Hono (4.9.9) + tRPC (11.6)
  frontend: React 19 + TanStack Router (1.114) + TanStack Query (5.90)
  database: Supabase (PostgreSQL + Auth + Realtime + RLS)
  styling: Tailwind CSS (4.1) + shadcn/ui
  validation: Zod (4.1) + React Hook Form (7.55)

Principles:
  - KISS: Simple solutions over complex ones
  - YAGNI: Build only what's needed now
  - Voice-First: Primary interaction through PT-BR voice commands
  - Type Safety: End-to-end TypeScript with strict mode
  - Security: LGPD compliance, RLS on all tables, audit trails
```

---

# 🧠 AGENT ORCHESTRATION SYSTEM

## Available Specialized Agents (8)

Use `@agent-name` to invoke the appropriate specialist for each task type.

### 📊 Agent Catalog

| Agent | Specialization | When to Use | Complexity |
|-------|---------------|-------------|------------|
| `@vibecoder` | **Master orchestrator + full-stack dev** | Complex features (≥7), orchestration, critical implementations | High |
| `@apex-researcher` | Research, documentation, compliance | Regulatory research, LGPD, BCB specs, market analysis | Medium |
| `@apex-ui-ux-designer` | UI/UX design, accessibility | New UI components, user flows, WCAG compliance | Medium |
| `@architect-review` | Architecture, system design, scalability | Major architecture decisions, API design, integrations | High |
| `@code-reviewer` | Code quality, security audit | After implementations, security review | Medium |
| `@database-specialist` | Supabase, PostgreSQL, RLS, migrations | Any database operation, schema changes | High |
| `@documentation` | Technical writing, API docs, guides | Documentation needs, README updates | Low |
| `@tester` | **TDD (RED phase) + Visual testing** | Test planning, E2E, Playwright, coverage strategy | Medium |

---

## 🔄 Workflow Orchestration (Handoffs)

### Standard Development Flow

```
1. ANALYZE    → @apex-researcher or @architect-review
2. DESIGN     → @apex-ui-ux-designer (UI) or @architect-review (system)
3. IMPLEMENT  → @vibecoder
4. REVIEW     → @code-reviewer
5. TEST       → @tester (TDD RED + Visual verification)
6. DOCUMENT   → @documentation
```

### Domain-Specific Flows

#### Financial Features (PIX, Boletos, Open Banking)
```
@apex-researcher (BCB specs + LGPD)
    ↓
@architect-review (design)
    ↓
@database-specialist (schema + RLS)
    ↓
@vibecoder (implementation)
    ↓
@code-reviewer (security validation)
    ↓
@tester (TDD + E2E validation)
```

#### UI/UX Development
```
@apex-ui-ux-designer (design + WCAG)
    ↓
@vibecoder (implementation)
    ↓
@tester (visual + accessibility)
```

#### Database Operations
```
@database-specialist (analysis + implementation)
    ↓
@code-reviewer (RLS validation)
    ↓
@tester (data integrity)
```

---

## 📋 Task Complexity Assessment

**Scale 1-10** - Assign before starting any task:

| Level | Description | Recommended Agent |
|-------|-------------|-------------------|
| 1-3 | Simple, routine tasks | Standard implementation |
| 4-6 | Moderate complexity | Domain specialist |
| 7-10 | Complex, critical | `@vibecoder` + full review |

---

## 🚨 Critical Rules

### MUST Always

- ✅ Start with `sequential-thinking` tool for complex tasks
- ✅ Research before critical implementations (use `@apex-researcher`)
- ✅ Follow KISS and YAGNI principles
- ✅ Test EVERY implementation with `@tester`
- ✅ Ensure 100% Brazilian compliance for financial features
- ✅ Create pages for EVERY link (NO 404s allowed)
- ✅ Use TypeScript strict mode with proper Zod validation
- ✅ Implement RLS on all database tables

### MUST NOT

- ❌ Change functionality without explicit approval
- ❌ Introduce breaking changes without documentation
- ❌ Skip quality gates (code review, testing)
- ❌ Proceed with <85% confidence (ask for clarification)
- ❌ Use ORMs or abstract database layers
- ❌ Over-engineer solutions
- ❌ Skip LGPD compliance validation

---

## 🇧🇷 Brazilian Compliance Integration

### LGPD Compliance Flow
```
@apex-researcher (LGPD requirements)
    ↓
@database-specialist (compliant data storage)
    ↓
@code-reviewer (implementation validation)
    ↓
@tester (UI verification)
```

### Financial Regulations Flow
```
@apex-researcher (BCB regulations)
    ↓
@architect-review (compliant architecture)
    ↓
@vibecoder (implementation with compliance checks)
    ↓
@code-reviewer (security validation)
```

### Portuguese Localization
- All UI must be Portuguese-first
- Use cultural patterns appropriate for Brazil
- Test with Portuguese language validation

---

## 📊 Quality Standards

### Code Quality Gates
- **OXLint**: 50-100x faster than ESLint, ≥95% pass rate
- **TypeScript**: Zero errors in strict mode
- **Test Coverage**: ≥90% for critical components
- **Security**: Zero critical vulnerabilities
- **Performance**: Response times <200ms for critical paths

### Quality Metrics
```yaml
Quality:
  code: "≥9.5/10 rating from @code-reviewer"
  security: "Zero critical vulnerabilities"
  coverage: "≥90% for critical business logic"
  performance: "Core Web Vitals ≥ 90"
  compliance: "100% LGPD and WCAG 2.1 AA+"
```

---

## 📁 Key Directories

```
src/
├── components/          # React UI (shadcn/ui in ui/)
├── routes/              # TanStack Router pages
├── hooks/               # Custom hooks (data, voice)
├── lib/                 # Banking, voice, PIX, utilities
├── server/routers/      # tRPC routers
├── integrations/supabase/ # Supabase client
supabase/migrations/     # Database schema and RLS
.github/agents/          # Custom Copilot agents (8 total)
```

---

## 🚀 Essential Commands

```bash
# Development
bun dev                    # Start development servers
bun build                  # Build application

# Quality Assurance
bun lint                   # OXLint validation
bun type-check             # TypeScript strict mode
bun test                   # Vitest unit/integration tests

# Database
bunx supabase db push      # Push migrations
bunx supabase gen types    # Generate TypeScript types
```

---

## 🔗 Import Patterns

```typescript
// Supabase Client
import { supabase } from "@/integrations/supabase/client"

// API Client (Hono RPC)
import { apiClient } from "@/lib/api-client"

// React Query
import { useQuery, useMutation } from "@tanstack/react-query"

// Hono Server
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
```

---

## 🧠 Intelligent Agent Allocation Matrix

### Automatic Selection Rules

**Financial/Banking Tasks**:
- **PIX Integration**: `@apex-researcher` → `@vibecoder` → `@database-specialist`
- **Boleto Generation**: `@apex-researcher` → `@vibecoder` → `@code-reviewer`
- **Open Banking**: `@apex-researcher` → `@architect-review` → `@vibecoder`

**UI/UX Development**:
- **New Components**: `@apex-ui-ux-designer` → `@vibecoder`
- **User Flows**: `@apex-ui-ux-designer` → `@vibecoder` → `@tester`
- **Accessibility**: `@apex-ui-ux-designer` → `@tester`

**Database Operations**:
- **Schema Changes**: `@database-specialist` → `@code-reviewer`
- **Migrations**: `@database-specialist` → `@tester`
- **RLS Policies**: `@database-specialist` → `@code-reviewer`

**Architecture Decisions**:
- **System Design**: `@architect-review` → `@vibecoder`
- **API Design**: `@architect-review` → `@vibecoder`
- **Security**: `@architect-review` → `@code-reviewer`

---

## 📝 Handoff Coordination

### From @vibecoder (After Implementation)
→ `@code-reviewer` - Review implemented code
→ `@tester` - Validate with TDD + visual testing
→ `@documentation` - Document the feature

### From @architect-review (After Design)
→ `@vibecoder` - Implement the design
→ `@database-specialist` - Implement schema

### From @apex-researcher (After Research)
→ `@architect-review` - Design based on findings
→ `@vibecoder` - Implement based on research

### From @code-reviewer (After Review)
→ `@vibecoder` - Fix identified issues
→ `@tester` - Proceed to testing

### From @tester (After Testing)
→ `@vibecoder` - Fix failing tests (GREEN phase)
→ `@documentation` - Document test results

---

## 💡 Key Principles

1. **Right Tool for Right Task**: Use specialized agents
2. **One Task at a Time**: Focus on single todo
3. **Always Validate**: Every implementation gets tested
4. **Human in Loop**: Ask for clarification when uncertain
5. **Capture Knowledge**: Document decisions and patterns

---

## 📋 Example Workflow

### User: "Implement PIX transfer with LGPD compliance"

```
1. Analyze complexity: 8/10 (financial integration)

2. Research Phase:
   @apex-researcher → BCB PIX specs + LGPD requirements

3. Design Phase:
   @architect-review → Transaction architecture
   @database-specialist → Schema + audit trail

4. Implementation Phase:
   @vibecoder → Secure transaction processing

5. Quality Phase:
   @code-reviewer → Security validation
   @tester → TDD RED phase + E2E + accessibility

6. Documentation:
   @documentation → API docs + user guide
```

---

**Remember**: Our goal is a simple, autonomous financial assistant that Brazilian users love. Every decision should serve this vision while maintaining technical excellence.

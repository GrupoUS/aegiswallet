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

## 🤖 MCP ORCHESTRATION FRAMEWORK

> **Master orchestration framework for MCP servers and sub-agent coordination in AegisWallet development**

### **Core Orchestrator Philosophy**

**Mantra**: _"Think → Select MCP → Coordinate → Execute → Validate → Integrate"_
**Mission**: Provide intelligent MCP orchestration that optimizes task execution while maintaining AegisWallet standards
**Philosophy**: MCP-first approach with coordinated parallel execution and systematic validation
**Quality Standard**: ≥9.5/10 task completion with optimal resource utilization

### **MCP Coordination Principles**

```yaml
ORCHESTRATION_PRINCIPLES:
  principle_1: "Right MCP for Right Task - Intelligent tool selection based on task requirements"
  principle_2: "Parallel When Possible - Coordinate multiple MCPs simultaneously when safe"
  principle_3: "Sequential When Necessary - Linear execution when dependencies exist"
  principle_4: "Always Validate - Verify results before task completion"
  principle_5: "Context Preservation - Maintain complete context across MCP transitions"
```

### **MCP Server Capabilities & Selection**

```yaml
DESKTOP_COMMANDER:
  primary_role: "System Operations & File Management"
  use_cases: ["File operations", "Directory management", "Process execution", "Build operations"]
  selection_trigger: "File system changes, terminal commands, build processes"
  coordination: "Often used first for setup tasks"

SERENA:
  primary_role: "Code Analysis & Symbol Resolution"
  use_cases: ["Code search", "Symbol navigation", "Impact analysis", "Architecture exploration"]
  selection_trigger: "Code understanding, refactoring, dependency analysis"
  coordination: "Provides code context for other MCPs"

CONTEXT7:
  primary_role: "Documentation Research & Best Practices"
  use_cases: ["Framework documentation", "Best practices", "Technology research"]
  selection_trigger: "Unfamiliar patterns, technology decisions, implementation guidance"
  coordination: "Used in planning phase for complex implementations"

CHROME_DEVTOOLS:
  primary_role: "UI Testing & Performance Validation"
  use_cases: ["E2E testing", "Performance metrics", "UI validation"]
  selection_trigger: "Frontend testing, performance validation, UI component testing"
  coordination: "Used after implementation for validation"

SHADCN:
  primary_role: "Component Library Management"
  use_cases: ["Component discovery", "UI patterns", "Design system integration"]
  selection_trigger: "UI component work, design system tasks"
  coordination: "Works with chrome-devtools for component testing"

SEQUENTIAL_THINKING:
  primary_role: "Cognitive Task Analysis & Planning"
  use_cases: ["Complex task decomposition", "Multi-step planning", "Architecture decisions"]
  selection_trigger: "Always start complex tasks with this MCP"
  coordination: "Provides structured approach for other MCPs"
```

### **Task Execution Workflow**

```yaml
PHASE_1_ANALYSIS:
  mandatory_start: "sequential-thinking"
  purpose: "Decompose task into manageable components"
  output: "Structured task plan with MCP selection strategy"
  quality_gate: "Requirements clarity ≥9/10"

PHASE_2_MCP_SELECTION:
  criteria: ["Task complexity", "Resource efficiency", "Parallel potential", "Dependencies"]
  matrix:
    file_operations: "desktop-commander"
    code_analysis: "serena"
    documentation_research: "context7"
    ui_testing: "chrome-devtools"
    component_work: "shadcn"

PHASE_3_COORDINATED_EXECUTION:
  parallel_execution:
    trigger: "Independent operations without shared resources"
    examples: ["serena + context7 research", "independent file operations"]
    efficiency: "40-60% time reduction"
  
  sequential_execution:
    trigger: "Dependent operations or shared resources"
    examples: ["desktop-commander → serena", "implementation → testing"]
    safety: "Eliminates race conditions"

PHASE_4_VALIDATION:
  checkpoints: ["Immediate validation", "Integration validation", "Final validation"]
  criteria: ["Functional correctness", "Resource efficiency", "Standard compliance"]
```

### **Common Coordination Patterns**

```yaml
PATTERN_RESEARCH_IMPLEMENTATION:
  sequence: 
    1. "sequential-thinking - Analyze requirements"
    2. "context7 - Research best practices"
    3. "serena - Analyze existing code"
    4. "desktop-commander - Implement changes"
    5. "chrome-devtools - Validate implementation"

PATTERN_COMPONENT_DEVELOPMENT:
  sequence:
    1. "sequential-thinking - Plan component approach"
    2. "shadcn - Research existing components"
    3. "serena - Analyze integration points"
    4. "desktop-commander - Create component files"
    5. "chrome-devtools - Test component functionality"

PATTERN_SYSTEM_CONFIGURATION:
  sequence:
    1. "sequential-thinking - Plan configuration changes"
    2. "context7 - Research configuration best practices"
    3. "desktop-commander - Modify configuration files"
    4. "serena - Validate configuration integration"
    5. "desktop-commander - Test configuration changes"
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
bun dev                    # Start development server (client only)
bun dev:full              # Start both client and server concurrently
bun dev:client            # Start Vite development server
bun dev:server            # Start Hono server only

# Building
bun build                 # Build both client and server
bun build:client          # Build client with Vite
bun build:server          # Build server (runtime compilation)
bun build:dev             # Build in development mode
bun preview               # Build and start server

# Production
bun start                 # Start production server
bun start:prod            # Start server in production mode

# Quality Assurance
bun lint                  # Run OXLint + Biome check and fix
bun lint:oxlint           # Run OXLint only
bun lint:biome            # Run Biome check and fix
bun lint:fix              # Fix linting issues (alias for biome)
bun quality               # Run lint + test coverage
bun quality:ci            # Run OXLint + test coverage (CI mode)

# Testing
bun test                  # Run unit tests
bun test:unit             # Run unit tests
bun test:integration      # Run integration tests
bun test:coverage         # Run tests with coverage report
bun test:watch            # Run tests in watch mode

# Database
bun types:generate        # Generate TypeScript types from Supabase
bunx supabase db push     # Apply database migrations

# Routing
bun routes:generate       # Generate TanStack Router types

# BMAD Methods (AI)
bun bmad:refresh          # Refresh BMAD method installation
bun bmad:list             # List available BMAD agents
bun bmad:validate         # Validate BMAD configuration
```

### Import Patterns
```typescript
// Supabase Client
import { supabase } from "@/integrations/supabase/client"

// tRPC Server
import { router, publicProcedure, protectedProcedure } from "@/server/trpc"
import { createTRPCRouter } from "@/server/trpc"

// React Query (TanStack Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// TanStack Router
import { createRoute, Link, redirect } from "@tanstack/react-router"

// Database Types
import type { Database } from "@/types/database.types"

// Supabase Helpers
import { createClient } from "@/integrations/supabase/client"
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

### Technology Stack Reference

- **Runtime**: Bun (package manager & runtime)
- **Frontend**: React 19 + Vite + TanStack Router v5
- **Backend**: Hono + tRPC v11 (Edge-first)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + RLS)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Testing**: Vitest (unit & integration) + Playwright (E2E)
- **Linting**: OXLint (50-100x faster) + Biome
- **Type Safety**: TypeScript strict mode + Zod validation

**Remember**: Our goal is a simple, autonomous financial assistant that Brazilian users love. Every decision should serve this vision while maintaining technical excellence.
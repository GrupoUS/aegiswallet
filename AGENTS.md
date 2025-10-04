# 🚀 NEONPRO PROJECT CONSTITUTION

## MANDATORY READ:

- **[Tech Stack](docs/architecture/tech-stack.md)** - Complete technology decisions and rationale
- **[Frontend Architecture](docs/architecture/frontend-architecture.md)** - Frontend structure and patterns

### Key Commands

The following commands are available at the root of the monorepo:

**Development**

- `bun dev`: Start the development servers for all apps.
- `bun build`: Build all apps and packages.

**Testing (Functional)**

- `bun test`: Run unit and integration tests for packages
- `bun test:coverage`: Generate code coverage report

**Quality Assurance**

- `bun lint`: Lint codebase with OXLint (50-100x faster than ESLint) ✅
- `bun lint:fix`: Auto-fix linting issues
- `bun format`: Format codebase with Biome
- `bunx biome check`: Alternative code quality validation

**Type Safety**

- `bun type-check`: Run TypeScript type checking
- `bunx biome check --apply`: Auto-fix code issues

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

### A.P.T.E Methodology

**Analyze** → Comprehensive requirements analysis
**Plan** → Strategic implementation planning
**Think** → Metacognition and multi-perspective evaluation
**Execute** → Systematic implementation with quality gates

**Quality Standard**: ≥9.5/10 rating on all deliveries

## Project Architecture

### Technology Stack

**Core Technologies**: Bun + Hono + React 19 + TypeScript + Supabase
**Frontend**: TanStack Router v5 + TanStack Query v5 + Vite + Tailwind CSS
**Backend**: tRPC v11 + Hono (Edge-first) + Supabase Functions
**Database**: Supabase (Postgres + Auth + Realtime + RLS)

**Package Manager**: Bun (3-5x faster than npm/pnpm)
**Testing**: Vitest + Playwright + OXLint (50-100x faster linting)

**WCAG 2.1 AA+**: Accessibility compliance mandatory

## Development Standards

### Code Quality

**TypeScript Strict Mode**: Maximum type safety enforcement

- Strict null checks and type inference
- No implicit any types allowed
- Comprehensive interface definitions

**Code Organization**: Clean architecture principles

- Feature-based folder structure
- Separation of concerns maintained
- Consistent naming conventions

**Import Standards**: Optimized module management

- Absolute imports for internal modules
- Proper barrel exports organization
- Tree-shaking optimization support

### Testing Requirements

**Test Coverage**: Minimum 90% for critical components

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user workflows

**Testing Tools**: Bun-optimized testing stack

- Vitest for unit/integration tests (3-5x faster)
- Playwright for E2E automation (3 essential browsers)
- OXLint for code quality validation (50-100x faster)

**Performance Testing**: Healthcare-optimized benchmarks

- Performance metrics API testing with timeout optimization
- Memory usage validation and optimization tracking
- Edge function performance verification
- Healthcare compliance performance standards

```yaml
validation:
  vibecoder_integration: "Quality Validation & Testing with constitutional enforcement gates"
  architecture_analysis: "Always check architecture docs for best practices validation"
  technology_excellence: "Framework best practices compliance and performance optimization"
  qa_mandatory:
    post_modification_checks:
      - "Syntax errors verification with zero tolerance policy"
      - "Duplicates/orphans detection with cleanup protocols"
      - "Feature validation against requirements with completeness verification"
      - "Requirements compliance with constitutional principles validation"
      - "Security vulnerabilities assessment with compliance verification"
      - "Test coverage ≥90% with comprehensive testing protocols"
  verification_rule: "Never assume changes complete without explicit verification"
```

### Security Standards

**Input Validation**: Mandatory sanitization

- Zod schema validation for all inputs
- SQL injection prevention via RLS
- XSS protection with proper escaping

**Authentication & Authorization**: Multi-layer security

- JWT with refresh token rotation
- Role-based access control (RBAC)
- Session management with audit trails

**Data Protection**: Healthcare compliance enforcement

- Encryption at rest and in transit
- Patient data access logging
- Automated compliance violation detection

**Theme Integration**:

```bash
# Install specific theme from tweakcn.com
bunx shadcn@latest add https://tweakcn.com/themes/cmesqts4l000r04l7bgdqfpxb
```

**Documentation Research**:

- **MUST** use Context7 MCP for component customization: `search_documentation("shadcn/ui CLI component customization monorepo")`
- Official docs: https://ui.shadcn.com/docs/cli

### Documentation Research Protocol

**MANDATORY STEPS** before executing any CLI command:

1. **Context7 MCP Research**:
   ```typescript
   // Example research query structure
   search_documentation({
     query: 'service_name CLI command_type best_practices project_context',
     sources: ['official_docs', 'github_issues', 'community_guides'],
   })
   ```

2. **Compatibility Verification**:
   - Confirm command works with Bun runtime
   - Verify TypeScript 5.9+ compatibility

3. **Prerequisites Check**:
   - Authentication status verified
   - Required environment variables set
   - Project configuration files present
   - Dependencies installed and up-to-date

4. **Command Documentation**:
   - Document command pattern in this file
   - Add to project runbook if recurring
   - Include error handling procedures
   - Note any project-specific modifications

### Error Handling Procedures

**CLI Command Failure Protocol**:

```yaml
step_1_capture:
  action: "Capture full error output including exit code"
  tool: "Desktop Commander MCP with error logging"

step_2_research:
  action: "Research error via Context7 MCP"
  query_pattern: "service_name CLI error_message troubleshooting"

step_3_verify:
  checks:
    - "Authentication status valid"
    - "Configuration files correct"
    - "Environment variables set"
    - "Network connectivity available"

step_4_fallback:
  options:
    - "Try alternative CLI flag/option"
    - "Check service status page"
    - "Verify API rate limits"
    - "Review recent service updates"

step_5_document:
  action: "Document error and resolution in project knowledge base"
  location: "docs/troubleshooting/cli-errors.md"
```

### Prohibited Practices

**MUST NOT**:

- Use web UIs for operations that have CLI equivalents
- Make direct API calls when CLI tools are available
- Manually edit configuration files managed by CLIs
- Skip Context7 MCP research for unfamiliar commands
- Execute CLI commands outside Desktop Commander MCP
- Proceed with <90% confidence in command correctness

**MUST ALWAYS**:

- Research command syntax via Context7 MCP first
- Execute all CLI operations via Desktop Commander MCP
- Verify command success and side effects
- Document new command patterns in this file
- Update audit trails for all service operations
- Maintain authentication status across sessions

## Project Restrictions

### MUST Requirements

- **Type Safety**: Strict TypeScript mode, no any types
- **Test Coverage**: Minimum 90% for critical components
- **Security**: Zero vulnerabilities in production builds
- **Performance**: All SLOs must be met or exceeded

### MUST NOT Violations

- **Data Protection**: Never expose patient data without encryption
- **Authentication**: Never bypass security controls
- **Compliance**: Never deploy without healthcare validation
- **Performance**: Never degrade Core Web Vitals below targets
- **Documentation**: Never commit without proper documentation

### Quality Gates

All code changes must pass:

1. **Automated Tests**: 100% pass rate
2. **Type Checking**: Zero TypeScript errors
3. **Security Scan**: Zero high-severity vulnerabilities
4. **Performance**: No regression in Core Web Vitals

---

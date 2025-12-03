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

## MCP Optimization Guide

### MCP Architecture Overview

**MCPs Diretos (stdio)** - Conexão direta via stdio, menor latência:
- `serena` - Codebase intelligence (MANDATORY para busca de código)

**MCPs via Docker Gateway** - Servidores containerizados, maior flexibilidade:
- `context7` - Documentação técnica de bibliotecas
- `fetch` - Busca de URLs e conversão para markdown
- `playwright` - Automação de browser e testes E2E
- `sequential-thinking` - Raciocínio estruturado para problemas complexos
- `stripe` - Interação com serviços Stripe via API
- `tavily` - Busca web em tempo real, extração de conteúdo, crawling

**Quando usar cada tipo**:
- **Diretos**: Apenas serena para operações frequentes de busca de código, baixa latência necessária
- **Docker Gateway**: Todos os outros MCPs - operações especializadas, isolamento necessário, integrações externas

### Core MCP Stack

#### Codebase Intelligence

**serena** (MANDATORY)
- **Propósito**: Busca semântica no codebase, análise de símbolos, gerenciamento de memória
- **Quando usar**: SEMPRE para busca de código. Nunca use grep/native search para código
- **Quando NÃO usar**: Busca em arquivos não-código (use grep para logs/configs)
- **Melhores práticas**:
  - Use `get_symbols_overview` antes de ler arquivos inteiros
  - Use `find_symbol` com `include_body=false` primeiro, depois `include_body=true` apenas quando necessário
  - Use `find_referencing_symbols` para entender impacto de mudanças
  - Use `think_about_collected_information` após múltiplas buscas
- **Configurações**: Projeto já configurado em `D:\Coders\aegiswallet`

#### Documentation & Research

**context7** (via Docker Gateway)
- **Propósito**: Documentação oficial de bibliotecas e frameworks
- **Quando usar**:
  - Buscar documentação oficial de bibliotecas (React, TypeScript, Drizzle, etc.)
  - Validar padrões e melhores práticas
  - Entender APIs e funcionalidades
- **Quando NÃO usar**: Busca de código no projeto (use serena), pesquisa web geral (use tavily)
- **Melhores práticas**:
  - Use `resolve-library-id` primeiro para obter ID correto
  - Use `get-library-docs` com `topic` específico para focar resultados
  - Configure `CONTEXT7_MAX_TOKENS=10000` para balancear contexto vs custo
- **Configurações**: `CONTEXT7_MAX_TOKENS=10000`, `CONTEXT7_TIMEOUT=15000`

**fetch** (via Docker Gateway)
- **Propósito**: Busca de URLs e conversão para markdown
- **Quando usar**: Extração de conteúdo de URLs específicas
- **Quando NÃO usar**: Busca geral (use tavily), múltiplas URLs (use tavily-crawl)
- **Melhores práticas**: Use para URLs únicas quando precisa de conteúdo específico

**tavily** (via Docker Gateway)
- **Propósito**: Busca web em tempo real, extração de conteúdo, crawling de sites
- **Quando usar**:
  - Pesquisa sobre tecnologias atuais e tendências
  - Validação de padrões da comunidade
  - Pesquisa de compliance brasileiro (LGPD, BCB, PIX)
  - Extração de conteúdo de URLs específicas
- **Quando NÃO usar**: Documentação oficial (use context7), código local (use serena)
- **Melhores práticas**:
  - Use `tavily-search` para pesquisa geral com `max_results=10-20`
  - Use `tavily-extract` para conteúdo específico de URLs
  - Use `tavily-crawl` para mapear estrutura de sites
  - Use `search_depth=advanced` para pesquisas complexas
  - Configure `time_range` para resultados recentes quando relevante
- **Tools disponíveis**: `tavily-search`, `tavily-extract`, `tavily-crawl`, `tavily-map`

#### Reasoning & Planning

**sequential-thinking** (via Docker Gateway)
- **Propósito**: Raciocínio estruturado através de sequências de pensamento
- **Quando usar**:
  - Problemas complexos (complexity ≥7)
  - Análise arquitetural
  - Planejamento de implementação
  - Validação de abordagens múltiplas
- **Quando NÃO usar**: Tarefas simples e diretas, operações rotineiras
- **Melhores práticas**:
  - Use ANTES de implementação para problemas complexos
  - Permita revisão de pensamentos anteriores (`isRevision=true`)
  - Ajuste `totalThoughts` conforme necessário durante o processo
  - Use para validação de hipóteses antes de implementar
- **Configurações**: `SEQUENTIAL_THINKING_MAX_TOKENS=16000`, `SEQUENTIAL_THINKING_THOUGHTS_TO_KEEP=10`

#### Browser Automation & Testing

**playwright** (via Docker Gateway)
- **Propósito**: Automação de browser, testes E2E, validação de UI
- **Quando usar**:
  - Testes E2E de workflows de usuário
  - Validação de acessibilidade (WCAG 2.1 AA+)
  - Testes de performance de UI
  - Validação de integrações frontend
- **Quando NÃO usar**: Testes unitários (use Vitest), análise de código (use serena)
- **Melhores práticas**:
  - Use para testes de compliance brasileiro (LGPD, acessibilidade)
  - Integre com testes PIX e transações financeiras
  - Use para validação de interfaces em português

#### External Integrations

**stripe** (via Docker Gateway)
- **Propósito**: Interação com serviços Stripe para pagamentos
- **Quando usar**: Operações de billing, subscriptions, payment intents
- **Melhores práticas**: Use para validação de integrações de pagamento

### MCP Selection Matrix

| Task Type | Primary MCP | Secondary MCP | When to Use Parallel |
|-----------|-------------|---------------|---------------------|
| **Code Search** | serena | - | Never - serena is sufficient |
| **Library Docs** | context7 | tavily | When validating official + community patterns |
| **Web Research** | tavily | context7 | For comprehensive research (official + current) |
| **Complex Problem** | sequential-thinking | serena | Before implementation for complexity ≥7 |
| **Database Ops** | CLI (neon) | serena | Schema changes via CLI + code analysis (serena) |
| **E2E Testing** | playwright | serena | Test implementation + code validation |
| **UI Components** | context7 + serena | playwright | Component docs + code analysis + accessibility testing |
| **Compliance Research** | tavily + context7 | sequential-thinking | Brazilian regulations (LGPD/BCB/PIX) |
| **Architecture** | sequential-thinking | serena + context7 | Design decisions + validation |

### MCP Coordination Patterns

#### Sequential Workflows

**Pattern 1: Research → Implementation**
```
1. sequential-thinking (analyze problem)
2. context7 (official docs) + tavily (current patterns) [PARALLEL]
3. serena (codebase analysis)
4. Implementation
5. playwright (E2E validation)
```

**Pattern 2: Database Changes**
```
1. sequential-thinking (design schema)
2. CLI neon (validate schema) + serena (check existing patterns) [PARALLEL]
3. Implementation
4. CLI neon (validate RLS) + playwright (test integration) [PARALLEL]
```

**Pattern 3: UI Component**
```
1. serena (check existing usage)
2. context7 (component docs via Docker Gateway)
3. Implementation
4. playwright (accessibility test via Docker Gateway)
```

#### Parallel Execution

**Quando executar em paralelo**:
- ✅ Pesquisa: context7 + tavily (diferentes fontes)
- ✅ Validação: CLI neon + serena (DB + código)
- ✅ Compliance: tavily + context7 + sequential-thinking (múltiplas perspectivas)
- ✅ Testing: playwright + serena (testes + análise de código)

**Quando executar sequencialmente**:
- ❌ serena → context7 (busca código primeiro, depois docs)
- ❌ sequential-thinking → implementation (planejar antes de implementar)
- ❌ CLI neon → serena (mudanças DB primeiro, depois análise de código)

#### Fallback Strategies

**Se serena falhar**:
- Fallback: Use `grep` apenas para arquivos não-código
- Nunca use grep para código - aguarde serena ou use `find_file`

**Se context7 falhar** (via Docker Gateway):
- Fallback: Use tavily para documentação da comunidade
- Fallback: Use fetch para URLs específicas de documentação

**Se tavily falhar**:
- Fallback: Use fetch para URLs específicas
- Fallback: Use context7 para documentação oficial

**Se sequential-thinking falhar** (via Docker Gateway):
- Fallback: Use `think` tool nativo
- Continue com pesquisa (context7 + tavily) antes de implementar

### Performance Optimization

#### Latency Reduction

**MCP Direto (serena)**:
- Latência esperada: <100ms
- Use `alwaysAllow` para tools frequentes
- Configure timeouts apropriados
- **Otimização**: Use `get_symbols_overview` antes de `find_symbol` com body

**MCPs via Docker Gateway**:
- Latência esperada: <3ms (gateway) + latência do serviço
- Use paralelização quando possível
- Cache resultados quando apropriado
- **Otimizações específicas**:
  - **context7**: Use `topic` específico para reduzir tokens
  - **tavily**: Use `max_results` apropriado (10-20 geralmente suficiente)
  - **sequential-thinking**: Ajuste `totalThoughts` dinamicamente
  - **fetch**: Use apenas para URLs únicas, não para múltiplas URLs

#### Cost Optimization

**Token Management**:
- **context7**: `CONTEXT7_MAX_TOKENS=10000` (balance contexto vs custo)
- **sequential-thinking**: `SEQUENTIAL_THINKING_MAX_TOKENS=16000` (pensamentos complexos)
- **tavily**: Use `max_results` mínimo necessário

**Request Optimization**:
- Evite chamadas redundantes (use cache quando possível)
- Combine pesquisas relacionadas em uma chamada quando possível
- Use paralelização para reduzir tempo total (não custo por request)

### Docker Gateway Tools Reference

**Available via Docker Gateway** (use `mcp-find` to discover more):

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **context7** | Library documentation | Official docs, API references |
| **tavily** | Web search & extraction | Search, extract, crawl, map sites |
| **playwright** | Browser automation | E2E testing, UI validation |
| **sequential-thinking** | Structured reasoning | Multi-step problem solving |
| **stripe** | Payment processing | Billing, subscriptions, payments |
| **fetch** | URL content retrieval | Single URL to markdown |

**Discovering New Tools**:
```bash
# Use mcp-find to search Docker catalog
mcp-find query="<tool-name>" limit=10
```

### Integration with Core Principles

**ULTRATHINK Integration**:
- `sequential-thinking` → `think` tool → Implementation
- Obrigatório para complexity ≥7
- Use para validação de abordagens antes de implementar

**MANDATORY serena Usage**:
- SEMPRE use serena para busca de código
- Nunca especule sobre código não lido
- Use `think_about_collected_information` após múltiplas buscas

**Research Workflow**:
- context7 (oficial) + tavily (comunidade) → Cross-validation
- ≥95% accuracy requirement para compliance brasileiro
- Use sequential-thinking para síntese de múltiplas fontes

**Quality Gates**:
- Database changes → CLI neon + serena validation
- UI components → playwright (a11y) + serena (code review)
- Security → tavily (patterns) + context7 (best practices)

### CLI Tools (Não MCP)

**Use CLI ao invés de MCP para**:
- **neon** - Operações de banco de dados PostgreSQL via Neon CLI
  - Migrações: `neon migrations apply`
  - Queries: Use Drizzle ORM no código
  - Validação: `neon db validate`
- **clerk** - Autenticação e gerenciamento de usuários via Clerk CLI
  - Setup: `clerk setup`
  - Sync: `clerk sync`
  - Webhooks: Configure via dashboard
- **github** - Operações Git e GitHub via Git CLI
  - Commits: `git commit`
  - Push: `git push`
  - PRs: Use GitHub CLI `gh pr create`
- **shadcn** - Componentes UI via shadcn CLI
  - Adicionar: `npx shadcn@latest add [component]`
  - Listar: `npx shadcn@latest list`
- **vercel** - Deploy e operações Vercel via Vercel CLI
  - Deploy: `vercel deploy`
  - Logs: `vercel logs`
  - Env: `vercel env`

**Razão**: Essas ferramentas têm CLIs maduros e integração direta é mais eficiente que via MCP.

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

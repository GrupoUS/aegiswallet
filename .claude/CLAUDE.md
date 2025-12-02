# Factory Orchestration System

Dynamic subagent routing and parallel execution coordination for AegisWallet subagents and skills.

> **Project context**: See root `AGENTS.md` for complete development standards, subagent definitions, and Brazilian compliance requirements.

## Master Orchestrator System

**Core Capabilities**:
- Dynamic subagent discovery from agent configuration
- Multi-dimensional task routing analysis
- Parallel execution coordination via Task tool
- Performance optimization and resource allocation
- Complete context transfer between subagent transitions

**Business Context**: Brazilian financial market with PIX, LGPD, and accessibility requirements demanding extra security scrutiny and Portuguese-first interfaces.

## Available Subagents & Capabilities

| Subagent | Primary Focus | MCPs Assigned | When to Use |
|----------|---------------|---------------|-------------|
| **apex-dev** | Advanced implementation (complexity ≥7) | serena, context7 | Performance-critical, security-sensitive |
| **database-specialist** | Supabase/PostgreSQL + LGPD | serena | ANY database operation, RLS, migrations |
| **code-reviewer** | Security + Brazilian compliance | context7, tavily | Post-implementation, security validation |
| **apex-ui-ux-designer** | UI/UX + WCAG 2.1 AA+ | context7, serena | ANY new UI component, accessibility |
| **apex-researcher** | Brazilian regulations (≥95% accuracy) | context7, tavily, serena | Compliance questions, research |
| **product-architect** | PRD + Diátaxis framework | sequential-thinking | Strategy, documentation |

> **For detailed subagent capabilities**: See root `AGENTS.md` for complete subagent definitions and when-to-use guidance.

## Spec Mode Auto-Activation

**Triggers**: "spec - research", "research and plan", "analyze and plan", "spec mode research"

**Protocol**:
1. **Immediate Routing** → apex-researcher (bypass all analysis)
2. **Priority Override** → HIGHEST (Level 1)
3. **Parallel Execution** → Context7 + Tavily + Serena + Sequential Thinking
4. **Auto-Compliance** → Brazilian regulations activated for financial topics
5. **Deliverable** → Research Intelligence Report + Implementation Plan

**Guaranteed Access**:
- No queue waiting for spec mode requests
- Full MCP orchestration access
- Brazilian compliance auto-activation
- ≥95% cross-validation accuracy requirement

## Apex-Dev Central Orchestration (MANDATORY)

**TODOS os prompts DEVEM passar pelo apex-dev primeiro**

### Central Orchestration Protocol
- apex-dev é responsável por análise, coordenação e implementação
- Nenhum subagent pode ser invocado diretamente (exceto apex-researcher para spec mode)
- apex-dev decide QUANDO e QUAIS subagents consultar em paralelo
- apex-dev serve como hub central para consolidação de insights antes da implementação
- apex-dev garante a preservação completa do contexto entre todas as fases

### Execution Flow
```
Prompt → apex-dev (análise inicial) → [PARALELO] subagents especializados → apex-dev (consolidação) → Implementação → [PARALELO] validação → apex-dev (ajustes finais)
```

## Task Tool Invocation Framework

### What is the Task Tool

The Task tool is the **primary mechanism** for invoking specialized subagents in the AegisWallet orchestration system:

**Core Concept**:
```
apex-dev orchestrates → Task tool dispatches → subagents execute → outputs consolidate
```

**Key Features**:
- Each subagent runs with assigned MCPs (Context7, Tavily, Serena, Sequential Thinking)
- Structured input/output contracts preserve context between transitions
- Brazilian compliance auto-activates for financial topics
- Parallel execution reduces time by 40-70%

### When to Use Task Tool vs Direct Implementation

**✅ Use Task tool when:**
- Complexity ≥4 (moderate to mission-critical)
- Security-sensitive operations (financial data, auth, PII)
- Database operations (ANY database change)
- UI/UX components (ANY interface work)
- Brazilian compliance requirements (LGPD, PIX, accessibility)
- Research required (external docs, patterns)

**❌ Direct implementation when:**
- Complexity 1-3 (simple, single-file changes)
- Trivial bug fixes with known solution
- Documentation updates (non-technical)

**Mandatory Triggers** (ALWAYS use Task tool):
```yaml
database: ["database", "schema", "migration", "query", "RLS"]
ui: ["component", "ui", "ux", "page", "form", "accessibility"]
security: ["security", "auth", "permission", "LGPD", "PIX"]
research: ["research", "spec", "analyze", "investigate"]
```

### Invoking a Single Subagent

**Template**:
```
Task:
  subagent_type: "[subagent-name]"
  prompt: |
    ## Goal
    [Clear, specific objective]

    ## Context
    [Background, existing patterns, constraints]

    ## Requirements
    - [Requirement 1]
    - [Requirement 2]

    ## Expected Output
    [Deliverable format]

    ## Brazilian Compliance (if applicable)
    - LGPD: [data protection requirements]
    - PIX: [financial transaction requirements]
    - Accessibility: [WCAG 2.1 AA+ requirements]
```

**Example**:
```
Task:
  subagent_type: "database-specialist"
  prompt: |
    ## Goal
    Otimizar schema de transações PIX para 1000+ transações concorrentes

    ## Context
    Schema atual: src/db/schema/transactions.ts
    Performance atual: ~200ms por insert
    Target: <100ms insert, <50ms lookup

    ## Requirements
    - Performance: Sub-100ms inserts
    - LGPD: Encryption de CPF e valores
    - RLS: Isolamento por user_id
    - Audit trail: Logs de todas as operações

    ## Expected Output
    - Recomendações de schema com migration
    - Análise de performance (benchmark esperado)
    - Validação de compliance LGPD

    ## Brazilian Compliance
    - LGPD: Criptografia AES-256 para CPF e valores
    - PIX: Suporte a clearing instantâneo
    - Audit: Registro completo para BCB
```

### Invoking Multiple Subagents in Parallel

**When to Use Parallel**:
- Complexity ≥7 (complex or mission-critical)
- Multiple domains (database + UI + security)
- Comprehensive analysis needed
- Time-sensitive (40-60% time reduction)

**Template** (one message, multiple Task calls):
```
# Task 1
Task:
  subagent_type: "code-reviewer"
  prompt: | [security validation]

# Task 2
Task:
  subagent_type: "database-specialist"
  prompt: | [database optimization]

# Task 3
Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: | [accessibility audit]
```

**Example** (Complexity 8 - Security Audit):
```
# PARALLEL DISPATCH (one message, 4 Task calls):

Task:
  subagent_type: "code-reviewer"
  prompt: |
    ## Goal
    Comprehensive security audit de payment processing endpoints
    ## Files
    - src/api/pix/payment.ts
    - src/api/pix/fraud-detection.ts
    ## Focus
    - OWASP Top 10
    - Input validation
    - Rate limiting
    - LGPD data handling

Task:
  subagent_type: "database-specialist"
  prompt: |
    ## Goal
    Performance validation de transações PIX
    ## Focus
    - Query performance (<100ms)
    - RLS policies correctness
    - LGPD encryption validation

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: |
    ## Goal
    Accessibility audit de payment confirmation screen
    ## Focus
    - WCAG 2.1 AA+ compliance
    - NBR 17225 Brazilian standards
    - Mobile responsiveness
    - Portuguese labels

Task:
  subagent_type: "apex-researcher"
  prompt: |
    ## Goal
    Validate PIX regulatory compliance (BCB standards)
    ## Focus
    - PIX clearing protocol adherence
    - BCB fraud reporting requirements
    - LGPD financial data handling

# Wait: All 4 subagents complete in parallel
# Execution time: 4-6 minutes (vs 16-24 sequential) = 70% faster
```

### Parameter Structure

**Required Parameters**:
- `subagent_type`: Nome exato do subagent (apex-dev, code-reviewer, etc.)
- `prompt`: Instruções estruturadas com seções Goal, Context, Requirements, Expected Output

**Optional Parameters**:
- `model`: Override model selection (sonnet, opus, haiku)
- `timeout`: Execution timeout (default: 120s, max: 600s)

### Error Handling and Fallbacks

**Error Conditions**:
- **Subagent Unavailable**: Verify exact name, fallback to alternative specialist
- **Insufficient Context**: Re-invoke with clarified requirements and additional context
- **Conflicting Recommendations**: Apply Priority Hierarchy (Security > Compliance > Architecture)
- **Quality Concerns**: Escalate to apex-researcher or code-reviewer for validation

**Priority Hierarchy**:
1. **Security** (code-reviewer overrides all)
2. **Compliance** (LGPD and regulatory requirements)
3. **Architecture** (system architecture decisions)
4. **Performance** (within security constraints)
5. **Features** (established patterns)

### Best Practices

1. **Always start with apex-dev analysis** (MANDATORY - central hub)
2. **Provide complete context** in prompts (all required sections)
3. **Use parallel dispatch** for efficiency (complexity ≥7)
4. **Respect subagent specializations** (mandatory triggers)
5. **Follow Priority Hierarchy** (Security overrides all)
6. **Validate subagent outputs** (confidence ≥85%)
7. **Never skip Brazilian compliance** (auto-activated for financial topics)

## Atomic Task Generation Engine

### Unified Complexity Scale

**Implementation Complexity (1-10)**:

```yaml
simple (1-3):
  description: "Single file, known pattern, trivial change"
  time_estimate: "15-30 minutes"
  subagents: "apex-dev alone"
  example: "Update constant, fix typo, adjust CSS"

moderate (4-6):
  description: "Multi-file, testing required, pattern adaptation"
  time_estimate: "1-3 hours"
  subagents: "apex-dev + 1-2 specialists"
  example: "API endpoint, form component, database query"

complex (7-8):
  description: "Multi-domain, security-sensitive, performance-critical"
  time_estimate: "4-8 hours"
  subagents: "apex-dev + 3-4 specialists (parallel)"
  example: "Payment flow, auth system, complex UI feature"

mission (9-10):
  description: "System-wide impact, regulatory compliance, architecture change"
  time_estimate: "12-24 hours"
  subagents: "All subagents + apex-researcher (parallel)"
  example: "PIX integration, LGPD compliance system, core auth redesign"
```

**Research Depth (L1-L10)**:

```yaml
basic (L1-L3):
  sources: "1-2 authoritative docs"
  mcps: "Context7 only"
  time: "15-30 minutes"
  example: "Library API usage lookup"

moderate (L4-L6):
  sources: "3-5 sources with cross-validation"
  mcps: "Context7 + Tavily"
  time: "45-90 minutes"
  example: "Framework comparison, pattern analysis"

complex (L7-L8):
  sources: "5-10 sources, expert consensus"
  mcps: "Context7 + Tavily + Serena"
  time: "2-4 hours"
  example: "Architecture patterns, security standards"

mission (L9-L10):
  sources: "10+ sources, regulatory analysis"
  mcps: "All MCPs + skills"
  time: "4-8 hours"
  example: "LGPD compliance research, BCB regulatory analysis"
```

**Scale Mapping**:
- Simple (1-3) → Usually L1-L3 research
- Moderate (4-6) → Usually L4-L6 research
- Complex (7-8) → Usually L7-L8 research
- Mission (9-10) → Usually L9-L10 research

### Atomic Task Decomposition Methodology

**Atomic Task Definition**:
- Smallest executable unit delivering value
- Independently validatable
- 30 min - 2 hours duration (never larger)

**Decomposition Process**:
1. **Parse requirement**: Extract goal, scope, constraints from user prompt
2. **Assess complexity**: Assign 1-10 implementation + L1-L10 research scores
3. **Break into phases**: Research → Design → Database → Backend → Frontend → Testing
4. **Create atomic tasks**: Single focus, clear output, minimal dependencies
5. **Assign subagents**: Match task domain to subagent specialization
6. **Estimate time**: Use complexity-based time matrix
7. **Map dependencies**: Identify parallel vs sequential execution

**Task Template**:
```yaml
task_id: "[phase]_[sequence]_[description]"
title: "Specific, actionable task description"
complexity: "1-10 or L1-L10"
estimated_duration: "X hours/minutes"
assigned_subagents: ["primary", "support"]
required_skills: ["skill_name"] # Ex: brazilian-fintech-compliance
parallel_execution: true/false
dependencies: ["task_id_dependencies"]
deliverables: ["output_1", "output_2"]
quality_gates: ["validation_1", "validation_2"]
brazilian_compliance: true/false
mcp_requirements: ["context7", "tavily", "serena", "sequential-thinking"]
```

**Example**:
```yaml
task_id: "database_001_pix_schema_design"
title: "Design PIX transactions schema with LGPD compliance"
complexity: "7"
estimated_duration: "2 hours"
assigned_subagents: ["database-specialist", "code-reviewer"]
required_skills: ["brazilian-fintech-compliance"]
parallel_execution: false # Sequential: database design → security review
dependencies: []
deliverables:
  - "Schema migration file (TypeScript)"
  - "RLS policies documentation"
  - "Performance benchmark plan"
quality_gates:
  - "LGPD encryption validation"
  - "Performance <100ms insert target"
  - "Code-reviewer security approval"
brazilian_compliance: true
mcp_requirements: ["serena"] # For existing patterns
```

### Dependency Mapping

**Hard Dependencies** (Sequential only):
- DB schema before API implementation
- Authentication before authorization
- Backend endpoints before frontend integration

**Soft Dependencies** (Parallel possible with mitigation):
- Frontend can mock backend endpoints
- Multiple feature branches in parallel
- Independent test suites

**No Dependencies** (Fully parallel):
- Research tasks across different domains
- Validation tasks for different components
- Documentation updates

**Parallelization Strategy by Phase**:
- Research: 100% parallel (multiple sources simultaneously)
- Design: 80% parallel (UI + DB + Security in parallel)
- Implementation: 60% parallel (Frontend + Backend + Tests with coordination)
- Validation: 100% parallel (Multiple validators simultaneously)

### Time Estimation Matrix

**Base Times by Complexity**:
- Complexity 1-3: 30min - 2h base
- Complexity 4-6: 2h - 4h base
- Complexity 7-8: 4h - 8h base
- Complexity 9-10: 12h - 24h base

**Research Adjustment**:
- L1-L3: +10min
- L4-L6: +30min
- L7-L8: +90min
- L9-L10: +180min

**Brazilian Compliance Adjustment**: +60min (LGPD + PIX + Accessibility)

**Subagent Coordination Overhead**: +10-30min depending on number of subagents

**Parallel Efficiency**: 41-60% reduction typical
- 2 subagents parallel: ~45% reduction
- 3-4 subagents parallel: ~55% reduction
- 5+ subagents parallel: ~60% reduction (diminishing returns)

### Quality Gates per Complexity

**Simple (1-3)**:
- Code compiles
- Tests pass
- Optional code-reviewer

**Moderate (4-6)**:
- 2+ sources validated (L4-L6)
- 1-2 subagent approvals
- ≥80% test coverage

**Complex (7-8)**:
- 5+ sources with ≥95% validation
- 3-4 subagent approvals
- ≥90% test coverage
- WCAG 2.1 AA+

**Mission (9-10)**:
- 10+ sources, ALL subagents approve
- ≥95% test coverage
- Full regulatory compliance
- Penetration testing

## Parallel Dispatch Protocol

### When to Activate Parallel Analysis

apex-dev deve disparar análises paralelas quando:
- Complexidade ≥7 (alta complexidade técnica)
- Segurança sensível (dados financeiros, PII, transações)
- Integração pesada (múltiplos sistemas, dependências externas)
- Compliance brasileiro (LGPD, BCB, PIX, acessibilidade)
- Performance crítica (sub-200ms P95, alta concorrência)

### Parallel Execution Matrix

| Complexity | Pre-Implementation Parallel Subagents | Post-Implementation Sequential/Parallel |
|------------|---------------------------------------|----------------------------------------|
| **1-3** (Simple) | apex-dev alone | code-reviewer (sequential) |
| **4-6** (Moderate) | apex-dev + code-reviewer + database-specialist | code-reviewer → database-specialist |
| **7-8** (Complex) | apex-dev + code-reviewer + database-specialist + apex-ui-ux-designer + apex-researcher | code-reviewer → database-specialist → apex-ui-ux-designer |
| **9-10** (Mission) | apex-dev + code-reviewer + database-specialist + apex-ui-ux-designer + apex-researcher + product-architect | code-reviewer → database-specialist → apex-ui-ux-designer |

### Task Tool Examples by Complexity

**Complexity 4-6 (Moderate)**:
```
# Single subagent OR 2 subagents sequential

# Example: Database change
Task:
  subagent_type: "database-specialist"
  prompt: | [database optimization]

# Then, if needed, sequential:
Task:
  subagent_type: "code-reviewer"
  prompt: | [security review]
```

**Complexity 7-8 (Complex)**:
```
# 3-4 subagents in parallel

# PARALLEL DISPATCH:
Task:
  subagent_type: "code-reviewer"
  prompt: | [security architecture review]

Task:
  subagent_type: "database-specialist"
  prompt: | [database architecture and performance]

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: | [UI/UX design with accessibility]

# Wait: All subagents complete
# Collect: [security_findings, database_recommendations, design_specifications]
# Proceed: Phase 3 for synthesis
```

**Complexity 9-10 (Mission)**:
```
# ALL relevant subagents + apex-researcher in parallel

# PARALLEL DISPATCH:
Task:
  subagent_type: "apex-researcher"
  prompt: | [regulatory requirements research L8-L9]

Task:
  subagent_type: "code-reviewer"
  prompt: | [comprehensive security audit]

Task:
  subagent_type: "database-specialist"
  prompt: | [enterprise-grade database architecture]

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: | [accessible, compliant UI/UX design]

Task:
  subagent_type: "product-architect"
  prompt: | [documentation and governance framework]

# Wait: All 5 subagents complete (full MCP orchestration)
# Execution time: 4-6 minutes parallel vs 20-30 minutes sequential
# Proceed: Phase 3 for comprehensive synthesis
```

### Common Parallel Combinations by Domain

#### Feature Implementation
- **Pre-Implementation**: ["code-reviewer", "database-specialist", "apex-ui-ux-designer"]
- **Optional**: ["apex-researcher"] (se precisar pesquisa externa)
- **Post-Implementation**: ["code-reviewer", "database-specialist", "apex-ui-ux-designer"]

#### Database Changes
- **Pre-Implementation**: ["database-specialist", "code-reviewer"]
- **Optional**: ["apex-ui-ux-designer"] (se afetar UI)
- **Post-Implementation**: ["database-specialist", "code-reviewer"]

#### Security Sensitive
- **Pre-Implementation**: ["code-reviewer", "apex-researcher", "database-specialist", "apex-ui-ux-designer"]
- **Post-Implementation**: ["code-reviewer"] (deve passar segurança primeiro)
- **Then**: ["apex-ui-ux-designer"] (validar padrões de UX seguros)

#### UI Component
- **Pre-Implementation**: ["apex-ui-ux-designer", "code-reviewer"]
- **Required**: ["apex-ui-ux-designer"] (OBRIGATÓRIO para qualquer componente UI)
- **Post-Implementation**: ["apex-ui-ux-designer", "code-reviewer"]
- **Validation Focus**:
  - "WCAG 2.1 AA+ compliance"
  - "Mobile-first responsiveness"
  - "Portuguese labels and R$ formatting"
  - "44px touch targets"
  - "Keyboard navigation"

#### Full Page or Flow
- **Pre-Implementation**: ["apex-ui-ux-designer", "database-specialist", "code-reviewer"]
- **apex-ui-ux-designer Focus**:
  - "Information architecture"
  - "User flow validation"
  - "Accessibility audit plan"
  - "Brazilian fintech patterns"
- **Post-Implementation**: ["apex-ui-ux-designer", "code-reviewer"]

#### API Endpoint
- **Pre-Implementation**: ["code-reviewer", "database-specialist"]
- **Optional**: ["apex-ui-ux-designer"] (se endpoint afetar UX)
- **Post-Implementation**: ["code-reviewer", "database-specialist"]

#### Research Spec Mode
- **Flow**: "apex-dev → apex-researcher (primary) → apex-dev (plano)"
- **Parallel Support**: ["database-specialist", "code-reviewer", "apex-ui-ux-designer"]
- **apex-ui-ux-designer Role**: "Pesquisa de padrões de UX, benchmarks de acessibilidade"

#### Mobile Feature
- **Pre-Implementation**: ["apex-ui-ux-designer", "code-reviewer", "database-specialist"]
- **Required**: ["apex-ui-ux-designer"] (SEMPRE obrigatório para mobile)
- **apex-ui-ux-designer Focus**:
  - "Touch targets (≥44px)"
  - "Gesture patterns"
  - "Offline-first considerations"
  - "3G network optimization"
  - "Voice-first Brazilian UX"
- **Post-Implementation**: ["apex-ui-ux-designer", "code-reviewer"]

#### Accessibility Audit
- **Pre-Implementation**: ["apex-ui-ux-designer", "code-reviewer"]
- **Required**: ["apex-ui-ux-designer"] (PRIMARY para auditorias de acessibilidade)
- **Post-Implementation**: ["apex-ui-ux-designer"] (validação final de A11y)

## Subagent Communication Contract

### Input Format for Each Subagent

#### apex-dev Input
```yaml
goal: "Implementation objective"
scope: "Technology and domain boundaries"
complexity: "1-10 scale"
requirements: "Functional and non-functional requirements"
constraints: "Technical limitations and dependencies"
brazilian_requirements: "LGPD, PIX, accessibility compliance needs"
```

#### code-reviewer Input
```yaml
files: ["path/to/file.ts"]
review_type: "security|architecture|compliance|full"
security_focus: "OWASP Top 10, authentication patterns"
brazilian_compliance: "LGPD, PIX, accessibility validation"
risk_tolerance: "critical|high|medium|low"
```

#### database-specialist Input
```yaml
schema_changes: "Database modifications required"
performance_requirements: "Query response times, concurrency"
security_requirements: "RLS policies, encryption, access controls"
brazilian_compliance: "LGPD data protection, audit trails"
integration_points: "API endpoints, auth integration"
```

#### apex-ui-ux-designer Input
```yaml
goal: "UI/UX requirement description"
component_type: "page|component|flow|system"
brazilian_requirements: "accessibility, Portuguese, financial patterns"
existing_patterns: "design system references"
mobile_requirements: "responsive, touch targets, offline"
accessibility_requirements: "WCAG 2.1 AA+, NBR 17225"
```

#### apex-researcher Input
```yaml
topic: "Research subject"
complexity: "L1-L10 depth assessment"
sources_needed: "Documentation, community, official specs"
brazilian_focus: "LGPD, BCB, PIX regulatory research"
validation_required: "≥95% cross-validation accuracy"
```

#### product-architect Input
```yaml
deliverable_type: "documentation|prd|rules"
audience: "developers|stakeholders|users"
success_criteria: "Measurable quality metrics"
diataxis_form: "tutorial|how-to|reference|explanation"
cross_references: "Related documents and dependencies"
```

### Output Format Expected from Each Subagent

#### apex-dev Output
```yaml
implementation_plan: "Step-by-step execution strategy"
technical_approach: "Architecture and technology choices"
risk_assessment: "Identified risks with mitigation strategies"
resource_requirements: "Timeline and effort estimates"
integration_strategy: "How to integrate with existing system"
quality_gates: "Validation checkpoints and success criteria"
```

#### code-reviewer Output
```yaml
security_findings: "Vulnerabilities with severity ratings"
compliance_status: "LGPD/PIX/accessibility compliance"
architecture_assessment: "Pattern adherence and improvement opportunities"
performance_impact: "Potential performance implications"
recommendations: "Priority fixes and improvements"
confidence_score: "Review quality and completeness rating"
```

#### database-specialist Output
```yaml
schema_recommendations: "Database design improvements"
performance_optimization: "Query optimization and indexing strategy"
security_enhancements: "RLS policies and access control improvements"
compliance_validation: "LGPD compliance verification"
integration_impact: "Effects on existing integrations"
migration_strategy: "Data migration and rollback plans"
```

#### apex-ui-ux-designer Output
```yaml
design_recommendations: "UI/UX improvements with rationale"
accessibility_audit: "WCAG 2.1 AA+ compliance report"
user_experience_analysis: "Flow optimization and pain point identification"
brazilian_adaptation: "Cultural adaptation and localization recommendations"
component_specification: "Detailed component requirements and specs"
success_metrics: "Measurable UX improvement indicators"
```

#### apex-researcher Output
```yaml
research_findings: "Validated research insights with confidence levels"
source_validation: "Source credibility and cross-validation results"
implementation_guidance: "Actionable implementation recommendations"
gap_analysis: "Research limitations and further investigation needs"
compliance_requirements: "Brazilian regulatory compliance details"
expert_consensus: "Industry expert validation and best practices"
```

#### product-architect Output
```yaml
documentation_quality: "Clarity, completeness, and actionability scores"
prd_completeness: "Requirement coverage and acceptance criteria quality"
rules_effectiveness: "Governance rule clarity and enforceability"
audience_alignment: "Suitability for target audience"
success_metrics: "Achievement of defined success criteria"
improvement_opportunities: "Areas for enhancement and optimization"
```

### Handoff Protocol (apex-dev ↔ Subagents)

#### apex-dev to Subagent Handoff
1. **Context Transfer**: Complete task description with goals and constraints
2. **Requirements Specification**: Clear expectations and acceptance criteria
3. **Resource Allocation**: Available tools and timeframes
4. **Success Metrics**: How the subagent should measure success
5. **Output Format**: Required deliverable structure and format

#### Subagent to apex-dev Handoff
1. **Work Summary**: Comprehensive summary of work performed
2. **Deliverables**: Complete list of outputs created
3. **Decision Log**: Key decisions with reasoning and alternatives considered
4. **Next Actions**: Recommended follow-up actions and subagent handoffs
5. **Quality Assessment**: Self-assessment of work quality and confidence levels

### Error Handling and Escalation

#### Error Conditions
- **Subagent Unavailable**: Fallback to alternative subagent with similar capabilities
- **Insufficient Information**: Request additional context from apex-dev
- **Conflicting Recommendations**: Escalate to apex-researcher for resolution
- **Quality Concerns**: Escalate to code-reviewer for validation

#### Escalation Hierarchy
1. **Level 1**: Subagent self-resolution with available resources
2. **Level 2**: Request additional context from apex-dev
3. **Level 3**: Escalate to apex-researcher for research-based resolution
4. **Level 4**: Escalate to code-reviewer for security/compliance resolution
5. **Level 5**: Escalate to product-architect for documentation/governance resolution

## Execution Phases

### Phase 1: Analysis (apex-dev alone)
- Complexidade assessment (1-10 scale)
- Domínio identification (backend, frontend, full-stack, security)
- Requisitos analysis (funcional e não-funcional)
- Brazilian compliance requirements identification
- Subagents necessários identification

### Phase 2: Parallel Consultation (subagents simultâneos)

**apex-dev dispara análises paralelas baseado em:**
- Complexidade ≥7 → Disparar todos os subagents relevantes
- Segurança sensível → Disparar code-reviewer + apex-researcher
- UI component → Disparar apex-ui-ux-designer (SEMPRE obrigatório)
- Database changes → Disparar database-specialist (SEMPRE obrigatório)
- Compliance questions → Disparar apex-researcher (PRIMARY)

**Task Tool Invocation Examples**:

```yaml
complexity_4_6 (moderate):
  strategy: "Single subagent OR 2 subagents sequential"

  example_database_change:
    Task:
      subagent_type: "database-specialist"
      prompt: | [database optimization prompt]

  example_ui_component:
    Task:
      subagent_type: "apex-ui-ux-designer"
      prompt: | [UI design prompt]
    # Then sequential:
    Task:
      subagent_type: "code-reviewer"
      prompt: | [security review prompt]

complexity_7_8 (complex):
  strategy: "3-4 subagents in parallel"

  # PARALLEL DISPATCH:
  Task:
    subagent_type: "code-reviewer"
    prompt: | [security architecture review]

  Task:
    subagent_type: "database-specialist"
    prompt: | [database architecture and performance]

  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: | [UI/UX design with accessibility]

  wait: "All subagents complete"
  collect: ["security_findings", "database_recommendations", "design_specifications"]
  proceed: "Phase 3 for synthesis"

complexity_9_10 (mission):
  strategy: "ALL relevant subagents + apex-researcher in parallel"

  # PARALLEL DISPATCH:
  Task:
    subagent_type: "apex-researcher"
    prompt: | [regulatory requirements research L8-L9]

  Task:
    subagent_type: "code-reviewer"
    prompt: | [comprehensive security audit]

  Task:
    subagent_type: "database-specialist"
    prompt: | [enterprise-grade database architecture]

  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: | [accessible, compliant UI/UX design]

  Task:
    subagent_type: "product-architect"
    prompt: | [documentation and governance framework]

  wait: "All 5 subagents complete (full MCP orchestration)"
  execution_time: "4-6 minutes parallel vs 20-30 minutes sequential"
  proceed: "Phase 3 for comprehensive synthesis"
```

### Phase 3: Synthesis (apex-dev consolida)
- Receber insights de todos os subagents
- Sintetizar informações em plano de implementação
- Identificar conflitos e resolver prioridades
- Definir estratégia de implementação detalhada

### Phase 4: Implementation (apex-dev executa)
- Implementar seguindo specs consolidadas
- Aplicar validações de segurança do code-reviewer
- Usar schema do database-specialist
- Seguir padrões de UI do apex-ui-ux-designer
- Documentar decisões e trade-offs

### Phase 5: Validation (subagents paralelos)

**[PARALELO] Validations:**
- **code-reviewer**: Security validation, OWASP compliance
- **database-specialist**: Performance validation, RLS policies
- **apex-ui-ux-designer**: Accessibility validation, WCAG 2.1 AA+
- **apex-researcher**: Brazilian compliance validation (se aplicável)

**Task Tool Parallel Validation Example** (Complexity 7-8):

```yaml
# PARALLEL VALIDATION:

Task:
  subagent_type: "code-reviewer"
  prompt: |
    ## Goal
    Comprehensive security validation for PIX payment implementation

    ## Files to Review
    - src/api/pix/payment.ts
    - src/api/pix/fraud-detection.ts
    - src/lib/encryption.ts
    [... all modified files ...]

    ## Review Type
    full (security + architecture + compliance)

    ## Expected Output
    - Security findings with severity ratings
    - Compliance status (LGPD + PIX)
    - Approval or critical changes needed

Task:
  subagent_type: "database-specialist"
  prompt: |
    ## Goal
    Performance validation and LGPD compliance for PIX transactions

    ## Validation Focus
    - Performance benchmarks (sub-100ms inserts, sub-50ms lookups)
    - RLS policy correctness
    - LGPD compliance (encryption, audit trail)

    ## Expected Output
    - Performance validation results (pass/fail with metrics)
    - LGPD compliance assessment
    - Approval or improvements needed

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: |
    ## Goal
    Accessibility audit for PIX payment flow components

    ## Validation Focus
    - WCAG 2.1 AA+ compliance
    - NBR 17225 Brazilian accessibility
    - Mobile responsiveness (320px-1920px)
    - Touch targets (44px+)
    - Portuguese labels

    ## Expected Output
    - WCAG 2.1 AA+ compliance report
    - Accessibility issues with severity
    - Approval or fixes needed

wait: "All 3 subagents complete validation in parallel"
execution_time: "3 minutes (vs 9 minutes sequential)"
proceed: "Phase 6 for final adjustments"

validation_decision_matrix:
  all_approved: "Proceed to Phase 6"
  minor_issues: "Quick fixes in Phase 6"
  moderate_issues: "Return to Phase 4 for targeted fixes"
  critical_issues: "STOP - major rework required, full re-validation"
```

### Phase 6: Finalization (apex-dev ajusta)
- Aplicar correções baseadas nas validações
- Documentar decisões finais e justificativas
- Preparar entrega e documentação
- Validar critérios de aceitação

## MCP Orchestration Within Task Tool

### MCPs Assigned by Subagent

```yaml
apex-researcher:
  mcps: ["context7", "tavily", "serena", "sequential-thinking"]
  primary_use: "Multi-source validation, regulatory research"
  brazilian_compliance: "LGPD/BCB/PIX docs + Brazilian tech community"

code-reviewer:
  mcps: ["context7", "tavily"]
  primary_use: "OWASP docs, security patterns, compliance standards"
  brazilian_compliance: "LGPD security requirements, PIX fraud prevention"

database-specialist:
  mcps: ["serena"]
  primary_use: "Codebase analysis, existing schema patterns, migration history"
  brazilian_compliance: "LGPD encryption patterns, audit trail implementations"

apex-ui-ux-designer:
  mcps: ["context7", "serena"]
  primary_use: "WCAG docs, design system patterns, component library"
  brazilian_compliance: "NBR 17225, Brazilian fintech UX patterns"

apex-dev:
  mcps: ["serena", "context7"]
  primary_use: "Codebase search, existing patterns, framework docs"
  implementation: "Follows patterns found via Serena, validates with Context7"

product-architect:
  mcps: ["sequential-thinking"]
  primary_use: "Strategic analysis, documentation planning, governance"
```

### MCP Functions

**Context7** (Documentation Intelligence):
- Official framework documentation and API references
- OWASP Top 10 security standards
- WCAG 2.1 accessibility guidelines
- LGPD official BCB regulations
- React/Next.js/Hono official docs

**Tavily** (Web Intelligence):
- Multi-source information gathering
- Community best practices validation
- Real-world implementation experiences
- Brazilian fintech market trends
- Expert insights and tutorials

**Serena** (Codebase Intelligence):
- Semantic code search and symbol resolution
- Existing schema patterns and migrations
- Component library patterns
- API endpoint conventions
- Authentication/authorization patterns

**Sequential Thinking** (Cognitive Analysis):
- Multi-perspective reasoning and synthesis
- Regulatory requirement analysis
- Strategic documentation planning
- Conflict resolution and gap identification
- Pattern recognition across sources

### Cross-Validation Strategy

**Accuracy Threshold**: ≥95% required

**Method**:
1. **Context7**: Official authoritative sources (BCB, WCAG, OWASP)
2. **Tavily**: Community validation, real-world implementations
3. **Serena**: Codebase consistency, existing patterns
4. **Sequential Thinking**: Synthesis and gap identification

**Example - PIX Compliance Research**:
```yaml
context7: "BCB official PIX clearing protocol specification"
tavily: "5+ fintech articles on PIX integration best practices"
serena: "Existing payment transaction patterns in codebase"
sequential_thinking: "Synthesize: Standards + Community + Patterns"
validation: "Cross-reference all sources → ≥95% consensus"
output: "Validated PIX implementation guidance with confidence scores"
```

### Brazilian Compliance Auto-Activation

**Triggers**:
- **LGPD keyword**: apex-researcher invokes Context7 (BCB) + Tavily (expert analysis)
- **PIX keyword**: apex-researcher invokes Context7 (BCB clearing docs)
- **Accessibility keywords**: apex-ui-ux-designer invokes Context7 (WCAG + NBR 17225)
- **CPF/financial data**: code-reviewer invokes Context7 (LGPD encryption standards)

**Process**:
1. Automatic MCP routing based on keyword detection
2. Brazilian compliance skills auto-invoked (brazilian-fintech-compliance)
3. Portuguese-first validation (labels, errors, documentation)
4. Quality gate: 100% compliance required for deployment

## Skill Integration System

### Available Skills Directory

**Location**: `.claude/skills/`

**Brazilian Fintech Skills**:
- **brazilian-fintech-compliance**: LGPD, PIX, BCB, Boleto standards
- **aegis-architect**: Voice-first Brazilian fintech architecture (v3.0)
- **webapp-testing**: LGPD compliance, voice testing, tRPC, Supabase RLS

**Development Skills**:
- **ai-data-analyst**: Statistical analysis, data interpretation
- **product-management**: PRD, roadmap, market analysis
- **frontend-design**: UI/UX patterns, design systems
- **vibe-coding**: Rapid prototyping, modern frameworks

**Creative Skills**:
- **canvas-design**: Visual art in .png and .pdf formats
- **algorithmic-art**: Generative art using p5.js
- **theme-factory**: Styling artifacts with professional themes
- **web-artifacts-builder**: Complex React/Tailwind/shadcn artifacts

**Document Skills**:
- **docx**: Word document creation and editing
- **pdf**: PDF manipulation and generation
- **pptx**: PowerPoint presentation creation
- **xlsx**: Excel spreadsheet operations

### Skill Invocation Triggers

**Automatic Invocation**:
- Brazilian compliance keyword → **brazilian-fintech-compliance** skill
- Market research keyword → **product-management** skill
- UI/UX design keyword → **frontend-design** skill
- Data analysis keyword → **ai-data-analyst** skill
- Testing keyword → **webapp-testing** skill

**Manual Invocation**:
- apex-researcher can invoke skills explicitly in research phase
- product-architect uses **product-management** skill for PRD creation
- apex-ui-ux-designer uses **frontend-design** skill for component creation

### Skill ↔ Subagent Collaboration Patterns

**brazilian-fintech-compliance**:
- **Primary Subagents**: apex-researcher, database-specialist, code-reviewer
- **Use Case**: LGPD compliance validation, PIX integration patterns, BCB regulatory research
- **Output**: Compliance checklists, regulatory validation reports

**aegis-architect**:
- **Primary Subagents**: apex-dev, apex-ui-ux-designer, database-specialist
- **Use Case**: Voice-first architecture, Brazilian fintech patterns, performance optimization
- **Output**: Architecture guidance, implementation patterns, performance benchmarks

**webapp-testing**:
- **Primary Subagents**: apex-dev, code-reviewer
- **Use Case**: LGPD testing, Portuguese voice validation, tRPC testing, Supabase RLS
- **Output**: Test suites, compliance validation, quality control reports

**product-management**:
- **Primary Subagents**: product-architect, apex-researcher
- **Use Case**: PRD creation, market analysis, competitive research
- **Output**: Strategic documents, feature prioritization, roadmaps

**frontend-design**:
- **Primary Subagents**: apex-ui-ux-designer, apex-dev
- **Use Case**: Component creation, design system patterns, accessibility validation
- **Output**: UI components, design specifications, WCAG compliance reports

### Integration Example

**Scenario**: Research PIX payment regulations

```yaml
subagent: "apex-researcher"
skills_activated: ["brazilian-fintech-compliance", "aegis-architect"]
mcps_used: ["context7", "tavily", "sequential-thinking"]

workflow:
  1. apex-researcher invokes brazilian-fintech-compliance skill
  2. Skill provides LGPD + PIX compliance framework
  3. apex-researcher uses Context7 for BCB official docs
  4. apex-researcher uses Tavily for Brazilian fintech community practices
  5. Sequential Thinking synthesizes: Skill framework + Official docs + Community practices
  6. Output: Comprehensive PIX compliance report (≥95% validation)
```

## Task Routing Matrix

### Complexity-Based Routing

| Complexity | Primary | Parallel | Brazilian Focus |
|------------|---------|----------|----------------|
| **1-3** (Simple) | apex-dev | code-reviewer | Basic validation |
| **4-6** (Moderate) | apex-dev | code-reviewer + apex-ui-ux-designer | Accessibility, compliance |
| **7-8** (Complex) | apex-dev | code-reviewer + database-specialist | Performance, security |
| **9-10** (Mission) | apex-dev | code-reviewer + database-specialist + apex-ui-ux-designer | Full research → implementation |

### Specialized Routing Triggers

#### Brazilian Compliance (auto-routed)
- LGPD/privacy → apex-dev → apex-researcher → code-reviewer
- PIX/financial → apex-dev → apex-researcher → code-reviewer + database-specialist
- Accessibility → apex-dev → apex-ui-ux-designer → code-reviewer

#### Security Sensitivity
- Critical → apex-dev + code-reviewer + database-specialist
- Standard → apex-dev + code-reviewer
- Data protection → apex-dev → apex-researcher (compliance priority)

#### Multi-Dimensional Analysis
- **Technical complexity**: 1-10 implementation difficulty
- **Integration complexity**: System dependencies and touch points
- **Compliance complexity**: Brazilian regulatory requirements
- **Security sensitivity**: Data protection and vulnerability risks

## apex-ui-ux-designer Integration Rules

### Mandatory Triggers (Quando SEMPRE incluir apex-ui-ux-designer)

```yaml
triggers:
  - "component" in prompt
  - "page" in prompt
  - "ui" in prompt
  - "ux" in prompt
  - "interface" in prompt
  - "form" in prompt
  - "dashboard" in prompt
  - "mobile" in prompt
  - "accessibility" in prompt
  - "acessibilidade" in prompt  # Portuguese trigger
  - "visual" in prompt
  - "design" in prompt
  - "layout" in prompt
  - "responsive" in prompt
  - "notification" in prompt  # Notifications have visual component
  - "alert" in prompt
  - "modal" in prompt
  - "toast" in prompt
```

### Expected Output from apex-ui-ux-designer

#### Pre-Implementation
- Component structure recommendation
- Accessibility requirements checklist
- Brazilian UX patterns to follow
- Touch target specifications (≥44px)
- Color contrast requirements (4.5:1 normal, 3:1 large text)
- Keyboard navigation plan
- Screen reader requirements in Portuguese

#### Post-Implementation
- WCAG 2.1 AA+ compliance report
- Accessibility issues found with severity ratings
- Portuguese label validation
- Mobile responsiveness validation
- NBR 17225 compliance status
- Touch target compliance report
- Contrast ratio validation

### Communication Contract apex-dev ↔ apex-ui-ux-designer

#### Input to Designer
```yaml
goal: "UI/UX requirement description"
component_type: "page|component|flow|system"
brazilian_requirements: "accessibility, Portuguese, financial patterns"
existing_patterns: "design system references"
mobile_requirements: "responsive, touch targets, offline"
accessibility_requirements: "WCAG 2.1 AA+, NBR 17225"
```

#### Output from Designer
```yaml
summary: "Design recommendation"
files: "Component paths if created"
decisions: "Key decisions with rationale"
accessibility:
  wcag_level: "AA|AAA"
  contrast_ratios: "pass|issues"
  keyboard_nav: "complete|partial"
  screen_reader: "tested|needs_testing"
brazilian_adaptation:
  portuguese_labels: "complete|partial"
  trust_patterns: "applied|not_applicable"
  mobile_optimization: "complete|partial"
status: "success|needs_review|blocked"
```

## Parallel vs Sequential Execution

### Can Execute in Parallel
- **Research Phase**: apex-researcher + database-specialist + apex-ui-ux-designer + code-reviewer
- **Design Phase**: apex-ui-ux-designer + database-specialist + code-reviewer (architecture validation)
- **Quality Assurance**: code-reviewer + database-specialist + apex-ui-ux-designer (integrated validation)

### Must Execute Sequentially
- Design → Implementation → Testing
- Database schema → Application implementation
- Security validation → Brazilian compliance validation
- Skill coordination → Individual subagent execution

## Integration Protocols

### Subagent Handoff Standards

**Input Requirements**:
- Complete task description with goals and constraints
- Summary of completed work and decisions made
- Expected outputs and acceptance criteria
- Required inputs from other subagents

**Output Standards**:
- Comprehensive summary of work performed
- Complete list of outputs created
- Key decisions with reasoning and alternatives
- Recommended next actions and subagent handoffs

### Priority Hierarchy & Conflict Resolution

1. **Security** (code-reviewer overrides all)
2. **Compliance** (LGPD and regulatory requirements)
3. **Architecture** (system architecture decisions)
4. **Performance** (within security constraints)
5. **Features** (established patterns)
6. **Skill coordination** (integration patterns)

**Escalation Rules**:
- Subagent disagreement → apex-researcher (regulatory research)
- Compliance conflict → apex-researcher (regulatory clarification)
- Performance vs security → security takes precedence
- Spec mode request → IMMEDIATE apex-researcher routing
- Brazilian regulatory questions → apex-researcher as primary authority

## Performance Optimization

### Time Savings Achieved
- **Spec Mode Activation**: <30 seconds to research initiation
- **Parallel Research**: 60% faster through MCP orchestration
- **Complex Features**: 8-12 hours (vs 20-30 sequential) = 60% reduction
- **Quality Assurance**: 50% faster through parallel validation
- **Context Transfer**: <5% information loss between subagent transitions
- **Routing Decisions**: <2 minutes intelligent routing

### Resource Allocation
- **Spec Mode Priority**: Immediate apex-researcher + full MCP access
- **Subagent Specialization**: Core competency optimization
- **Dynamic Load Balancing**: Optimal utilization across tracks
- **Intelligent Routing**: 95% accuracy with spec mode override
- **Real-time Monitoring**: Performance optimization and allocation
- **Brazilian Compliance**: Auto-activated regulatory research

## Concrete Task Tool Examples

### Example 1: Simple Feature - Dark Mode Toggle (Complexity 3)

```yaml
user_prompt: "Adicionar botão de Dark Mode na página de settings"

phase_1_analysis (apex-dev):
  complexity: 3 # Simples - componente único, padrão conhecido
  research_depth: L2 # Padrão de componente básico
  domain: Frontend (UI component)
  triggers: ["component", "ui"] → apex-ui-ux-designer MANDATORY
  subagents_needed: ["apex-ui-ux-designer"]
  execution_strategy: "apex-dev designs → implements → validates"

phase_2_consultation:
  # Invocar apex-ui-ux-designer
  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: |
      ## Goal
      Design accessible dark mode toggle for settings page

      ## Context
      Settings page: src/pages/settings.tsx
      Design system: src/components/ui/Switch.tsx available

      ## Requirements
      - WCAG 2.1 AA+ compliant toggle
      - 44px+ touch target (mobile)
      - Keyboard accessible (Space/Enter)
      - Screen reader: Portuguese labels
      - Visual feedback for state

      ## Expected Output
      - Component structure recommendation
      - Accessibility checklist
      - Color/contrast specifications

phase_3_synthesis:
  apex_ui_ux_designer_output:
    - "Use existing <Switch> component"
    - "ARIA label: 'Alternar modo escuro' (Portuguese)"
    - "48px touch target (exceeds 44px)"
    - "Visual: Moon icon (dark), Sun icon (light)"

  implementation_plan:
    - "Import Switch from design system"
    - "Add dark mode state (context or local)"
    - "Apply theme toggle logic"
    - "Test keyboard + screen reader"

phase_4_implementation (apex-dev):
  files_created:
    - "src/components/settings/DarkModeToggle.tsx"

  highlights:
    - "Switch component (design system consistency)"
    - "Portuguese ARIA: 'Alternar modo escuro'"
    - "48px touch target (className)"
    - "Keyboard tested (Space/Enter works)"

phase_5_validation (optional):
  # Para complexidade 3, validação opcional
  status: "approved (internal review)"

phase_6_finalization:
  status: "complete"
  time_total: "45 minutes"
  breakdown:
    - "Design consultation: 15min"
    - "Implementation: 20min"
    - "Testing: 10min"
```

### Example 2: UI Component - PaymentCard (Complexity 6)

```yaml
user_prompt: "Criar componente PaymentCard reutilizável para histórico de transações"

phase_1_analysis:
  complexity: 6 # Moderado - componente reutilizável, padrões brasileiros
  research_depth: L5 # Padrões UX brasileiros de fintech
  domain: Frontend (UI component)
  triggers: ["component", "payment", "financial"]
  subagents_needed: ["apex-ui-ux-designer", "code-reviewer"]
  brazilian_compliance: true # R$ formatting, Portuguese, trust patterns

phase_2_parallel_consultation:
  # PARALLEL DISPATCH (uma mensagem, 2 Task calls)

  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: |
      ## Goal
      Design PaymentCard component with Brazilian fintech patterns

      ## Context
      Display: amount (R$), date, status, merchant name
      Usage: Transaction history (mobile + desktop)
      Target: Brazilian users (Portuguese-first)

      ## Requirements
      - Mobile-first (320px-1920px)
      - R$ formatting (R$ 1.234,56)
      - Portuguese labels
      - Trust patterns (green/yellow/red)
      - WCAG 2.1 AA+ (contrast, keyboard, screen reader)
      - 44px+ touch targets

      ## Expected Output
      - Component structure + props
      - Color contrast validation
      - Accessibility requirements (Portuguese ARIA)
      - Brazilian trust patterns

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Security review for financial transaction card

      ## Context
      Displays sensitive transaction data
      Props from parent (no direct data handling)

      ## Security Focus
      - XSS prevention (merchant names)
      - Sensitive data exposure (no full card numbers)
      - LGPD compliance (data minimization)

      ## Expected Output
      - Security recommendations
      - LGPD compliance checklist

phase_3_synthesis:
  apex_ui_ux_designer_output:
    structure:
      - "Props: amount, currency, date, status, merchantName"
      - "Layout: Flex row (desktop), column (mobile <640px)"
      - "Typography: merchantName (medium), amount (bold, lg)"
      - "Colors: Success (green-600), Pending (yellow-600), Failed (red-600)"
    accessibility:
      - "ARIA: 'Pagamento de R$ {amount} para {merchantName} em {date}'"
      - "Contrast: 4.5:1+ on all backgrounds"
      - "Keyboard: Card focusable"
    brazilian:
      - "R$ format: Intl.NumberFormat('pt-BR', currency: 'BRL')"
      - "Date: Intl.DateTimeFormat('pt-BR', dateStyle: 'short')"
      - "Status: 'Aprovado' (green), 'Pendente' (yellow), 'Recusado' (red)"

  code_reviewer_output:
    security:
      - "Sanitize merchantName (DOMPurify)"
      - "Validate amount is number (TypeScript)"
      - "No full card numbers"
    lgpd:
      - "Data minimization: Only necessary transaction info"
      - "Stateless: No PII storage"

phase_4_implementation:
  files_created:
    - "src/components/payments/PaymentCard.tsx"
    - "src/components/payments/PaymentCard.test.tsx"

  highlights:
    - "TypeScript strict: All props typed"
    - "R$ format: Intl.NumberFormat('pt-BR')"
    - "XSS prevention: DOMPurify"
    - "Accessibility: Portuguese ARIA, keyboard nav"
    - "Responsive: Mobile-first Tailwind"

phase_5_parallel_validation:
  # PARALLEL VALIDATION (uma mensagem, 2 Task calls)

  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: |
      ## Goal
      Accessibility audit for PaymentCard
      ## Files
      - src/components/payments/PaymentCard.tsx
      ## Focus
      - WCAG 2.1 AA+ compliance
      - Mobile responsiveness (320px-1920px)
      - Portuguese labels validation

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Security validation for XSS prevention
      ## Files
      - src/components/payments/PaymentCard.tsx
      ## Focus
      - XSS prevention verification
      - LGPD compliance check

  results:
    apex_ui_ux_designer:
      status: "approved"
      wcag: "AA (4.5:1 contrast, keyboard nav, Portuguese ARIA)"
      mobile: "pass (320px-1920px tested)"
    code_reviewer:
      status: "approved"
      security: "pass (XSS prevented)"
      lgpd: "compliant (data minimization, stateless)"

phase_6_finalization:
  status: "complete"
  time_total: "2h 20min (vs 3.5h sequential) = 40% faster"
  breakdown:
    - "Parallel consultation: 30min"
    - "Implementation: 90min"
    - "Parallel validation: 10min"
    - "Documentation: 10min"
```

### Example 3: Database Migration - PIX Transactions (Complexity 7)

```yaml
user_prompt: "Criar schema de transações PIX com compliance LGPD"

phase_1_analysis:
  complexity: 7 # Complexo - database + security + Brazilian compliance
  research_depth: L7 # BCB PIX standards + LGPD research
  domain: Database + Security + Compliance
  triggers: ["database", "PIX", "LGPD"]
  subagents_needed: ["database-specialist", "code-reviewer", "apex-researcher"]
  brazilian_compliance: true # MANDATORY (PIX + LGPD)

phase_2_parallel_consultation:
  # PARALLEL DISPATCH (uma mensagem, 3 Task calls)

  Task:
    subagent_type: "apex-researcher"
    prompt: |
      ## Goal
      Research BCB PIX transaction standards and LGPD compliance requirements

      ## Complexity
      L7 (complex regulatory research)

      ## Sources Needed
      - BCB official PIX documentation (Context7)
      - LGPD financial data requirements (Context7)
      - Brazilian fintech implementations (Tavily)

      ## Brazilian Focus
      - PIX clearing protocol adherence
      - LGPD encryption and audit requirements
      - BCB reporting standards

      ## Validation Required
      ≥95% cross-validation accuracy

      ## Expected Output
      - PIX transaction schema requirements
      - LGPD compliance checklist
      - BCB audit trail specifications

  Task:
    subagent_type: "database-specialist"
    prompt: |
      ## Goal
      Design high-performance PIX transactions schema

      ## Context
      Current database: Supabase PostgreSQL
      Target: 1000+ concurrent transactions

      ## Requirements
      - Performance: <100ms inserts, <50ms lookups
      - Scalability: Handle 10k+ transactions/day
      - Indexes: Optimize for user queries, date ranges

      ## Expected Output
      - Complete schema design (TypeScript + SQL)
      - RLS policies for user isolation
      - Performance optimization strategy

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Security review for PIX transaction handling

      ## Security Focus
      - Encryption requirements (AES-256)
      - Input validation (PIX keys, amounts)
      - Injection prevention
      - Rate limiting patterns

      ## Expected Output
      - Security architecture recommendations
      - Validation patterns
      - Threat model analysis

phase_3_synthesis:
  apex_researcher_output:
    pix_requirements:
      - "End-to-end ID (txid) - 32 chars UUID"
      - "Transaction limits: R$ 1.000/transaction, R$ 10.000/day"
      - "Processing time: max 10 seconds"
      - "Audit retention: 5 years minimum"
    lgpd_requirements:
      - "CPF encryption: AES-256-GCM"
      - "Transaction amounts: encrypted at rest"
      - "User consent: explicit for PIX operations"
      - "Audit trail: all access logged with IP and timestamp"
    confidence: "97% (BCB + LGPD docs + 5 fintech implementations)"

  database_specialist_output:
    schema_design: |
      CREATE TABLE pix_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        end_to_end_id VARCHAR(32) UNIQUE NOT NULL,
        amount_encrypted BYTEA NOT NULL,
        pix_key_encrypted BYTEA NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX idx_pix_user_date ON pix_transactions(user_id, created_at DESC);
      CREATE INDEX idx_pix_status ON pix_transactions(status) WHERE status != 'completed';

    rls_policies: |
      ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;

      CREATE POLICY pix_user_isolation ON pix_transactions
        USING (auth.uid() = user_id);

    performance: "Expected: 50ms inserts, 30ms lookups with indexes"

  code_reviewer_output:
    security_recommendations:
      - "Use pgcrypto for encryption: encrypt(amount::text, key, 'aes-256-gcm')"
      - "Validate PIX keys before insert (CPF/CNPJ/email/phone format)"
      - "Implement rate limiting: max 10 transactions/minute per user"
      - "Add audit trigger: log all SELECT/UPDATE/DELETE operations"
    threat_model:
      - "SQL injection: PREVENTED (parameterized queries + RLS)"
      - "Data exposure: MITIGATED (encryption + RLS)"
      - "Audit tampering: PREVENTED (append-only audit table)"

phase_4_implementation (apex-dev):
  files_created:
    - "src/db/migrations/001_pix_transactions.sql"
    - "src/db/schema/pix_transactions.ts"
    - "src/lib/pix/encryption.ts"
    - "src/lib/pix/validation.ts"

  highlights:
    - "AES-256-GCM encryption for CPF and amounts"
    - "RLS policies with user_id isolation"
    - "Audit trail table with append-only trigger"
    - "Composite indexes for performance"
    - "PIX key validation (CPF/CNPJ/email/phone)"

phase_5_parallel_validation:
  # PARALLEL VALIDATION

  Task:
    subagent_type: "database-specialist"
    prompt: |
      ## Goal
      Validate schema performance and LGPD compliance

      ## Validation Focus
      - Query performance benchmarks
      - Index effectiveness
      - RLS policy correctness
      - Encryption implementation

      ## Expected Output
      - Performance test results
      - LGPD compliance verification
      - Approval or optimization needed

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Final security audit for PIX transaction schema

      ## Files
      - src/db/migrations/001_pix_transactions.sql
      - src/lib/pix/encryption.ts

      ## Focus
      - Encryption strength verification
      - RLS policy security
      - Audit trail completeness

      ## Expected Output
      - Security approval
      - Any critical issues

  results:
    database_specialist:
      status: "approved with minor optimization"
      performance: "48ms inserts, 28ms lookups (better than target)"
      lgpd: "compliant (encryption + audit trail verified)"
      optimization: "Consider partitioning after 1M+ transactions"

    code_reviewer:
      status: "approved"
      security: "pass (AES-256-GCM, RLS, audit trail complete)"
      recommendation: "Add monitoring for suspicious patterns"

phase_6_finalization:
  status: "complete"
  time_total: "3h 45min (vs 6h sequential) = 38% faster"
  breakdown:
    - "Parallel research/design: 45min"
    - "Implementation: 2h"
    - "Parallel validation: 20min"
    - "Documentation: 40min"

  deployment_checklist:
    - "✅ BCB PIX standards compliance"
    - "✅ LGPD encryption and audit"
    - "✅ Performance targets exceeded"
    - "✅ Security audit passed"
    - "✅ RLS policies validated"
```

### Example 4: Security Audit (Complexity 8)

```yaml
user_prompt: "Security audit completo do payment processing flow"

phase_1_analysis:
  complexity: 8 # Complexo - security + compliance + performance
  research_depth: L8 # OWASP + LGPD + PIX security research
  domain: Security + Compliance + Performance
  triggers: ["security", "PIX", "LGPD", "payment"]
  subagents_needed: ["code-reviewer", "apex-researcher", "database-specialist", "apex-ui-ux-designer"]
  brazilian_compliance: true # MANDATORY

phase_2_parallel_consultation:
  # PARALLEL DISPATCH (uma mensagem, 4 Task calls)

  Task:
    subagent_type: "apex-researcher"
    prompt: |
      ## Goal
      Research OWASP Top 10 and Brazilian financial security standards

      ## Complexity
      L8 (comprehensive security research)

      ## Sources Needed
      - OWASP Top 10 latest (Context7)
      - BCB security requirements (Context7)
      - Brazilian fintech security patterns (Tavily)

      ## Validation Required
      ≥95% cross-validation

      ## Expected Output
      - OWASP Top 10 compliance checklist
      - BCB security requirements
      - Threat model framework

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Comprehensive security code review

      ## Files
      - src/api/pix/payment.ts
      - src/api/pix/fraud-detection.ts
      - src/lib/encryption.ts
      - src/hooks/usePayment.ts

      ## Focus
      - Input validation
      - SQL injection prevention
      - XSS prevention
      - Authentication/authorization
      - Rate limiting
      - LGPD data handling

      ## Expected Output
      - Vulnerability assessment (CRITICAL/HIGH/MEDIUM/LOW)
      - Security findings with remediation

  Task:
    subagent_type: "database-specialist"
    prompt: |
      ## Goal
      Database security and RLS policy audit

      ## Focus
      - RLS policies correctness
      - Encryption implementation
      - Audit trail completeness
      - Performance under attack scenarios

      ## Expected Output
      - RLS vulnerabilities (if any)
      - Database security score
      - Performance impact analysis

  Task:
    subagent_type: "apex-ui-ux-designer"
    prompt: |
      ## Goal
      UI security patterns and accessibility security

      ## Focus
      - Secure UX patterns (no data leakage)
      - Portuguese error messages (no sensitive info)
      - Accessible security warnings
      - Touch target security (prevent mis-clicks)

      ## Expected Output
      - UI security assessment
      - Accessibility security report

phase_3_synthesis:
  apex_researcher_output:
    owasp_compliance:
      - "A01:2021 Broken Access Control: RLS policies implemented ✅"
      - "A02:2021 Cryptographic Failures: AES-256-GCM encryption ✅"
      - "A03:2021 Injection: Parameterized queries ✅"
      - "A04:2021 Insecure Design: Threat modeling needed ⚠️"
      - "A05:2021 Security Misconfiguration: Review needed ⚠️"
    bcb_security:
      - "End-to-end encryption: Implemented ✅"
      - "Fraud detection: Basic patterns implemented ⚠️"
      - "Audit trail: Complete ✅"
      - "Rate limiting: Needs enhancement ⚠️"
    confidence: "96% (OWASP + BCB docs + 8 fintech implementations)"

  code_reviewer_output:
    critical_findings: []
    high_findings:
      - "Rate limiting insufficient: 100 req/min per user (should be 10 for PIX)"
      - "Fraud detection thresholds need tuning: Too many false positives"
    medium_findings:
      - "Error messages expose internal details in dev mode"
      - "CORS configuration could be stricter"
    low_findings:
      - "Missing security headers (CSP, HSTS)"

    security_score: "78/100 (Good - needs improvement in rate limiting and fraud detection)"

  database_specialist_output:
    rls_audit:
      - "User isolation: Correct ✅"
      - "Admin policies: Secure ✅"
      - "Audit table: Protected (no DELETE) ✅"
    encryption:
      - "CPF: AES-256-GCM ✅"
      - "Amounts: AES-256-GCM ✅"
      - "Key rotation: Not implemented ⚠️"
    performance_under_attack:
      - "DoS resistance: Moderate (rate limiting needed)"
      - "Query performance degradation: Minimal with current indexes"

  apex_ui_ux_designer_output:
    ui_security:
      - "No sensitive data in error messages ✅"
      - "Payment confirmation: Clear, Portuguese ✅"
      - "Touch targets prevent accidental large transfers ✅"
    accessibility_security:
      - "Screen reader doesn't expose sensitive data ✅"
      - "High contrast mode secure ✅"

phase_4_implementation (apex-dev):
  fixes_applied:
    high_priority:
      - "Enhanced rate limiting: 10 PIX transactions/minute"
      - "Tuned fraud detection: Reduced false positives by 60%"
    medium_priority:
      - "Removed internal error details from production"
      - "Stricter CORS: Only production domains"
    low_priority:
      - "Added security headers: CSP, HSTS, X-Frame-Options"

  new_features:
    - "Key rotation schedule: 90 days (not implemented yet - future task)"
    - "Enhanced DoS protection: Cloudflare rate limiting"

phase_5_parallel_validation:
  # PARALLEL RE-AUDIT

  Task:
    subagent_type: "code-reviewer"
    prompt: |
      ## Goal
      Verify security fixes

      ## Focus
      - Rate limiting: 10 req/min for PIX
      - Fraud detection: False positive rate
      - Error messages: No internal details
      - Security headers: Complete

      ## Expected Output
      - Updated security score
      - Final approval

  Task:
    subagent_type: "database-specialist"
    prompt: |
      ## Goal
      Verify database security enhancements

      ## Focus
      - Performance with new rate limiting
      - Encryption still correct

      ## Expected Output
      - Performance validation
      - Security approval

  results:
    code_reviewer:
      status: "approved"
      security_score: "92/100 (Excellent)"
      improvements:
        - "Rate limiting: 10 PIX/min implemented ✅"
        - "Fraud detection: 60% fewer false positives ✅"
        - "Error handling: Sanitized ✅"
        - "Security headers: Complete ✅"
      remaining:
        - "Key rotation: Roadmap item for Q2"

    database_specialist:
      status: "approved"
      performance: "Rate limiting adds <5ms latency (acceptable)"
      security: "All encryption and RLS policies validated ✅"

phase_6_finalization:
  status: "complete"
  time_total: "5h 30min (vs 14h sequential) = 61% faster"
  breakdown:
    - "Parallel research/audit: 1h 15min"
    - "Fix implementation: 3h"
    - "Parallel re-audit: 30min"
    - "Documentation: 45min"

  security_assessment:
    overall_score: "92/100 (Excellent)"
    owasp_compliance: "10/10 categories addressed"
    bcb_compliance: "Full compliance ✅"
    lgpd_compliance: "Full compliance ✅"
    ready_for_production: true
```

### Example 5: Spec Mode Research (L7 Complexity)

```yaml
user_prompt: "spec - research: PIX clearing protocol implementation patterns"

# IMMEDIATE SPEC MODE ACTIVATION (bypass all analysis)

phase_1_immediate_routing:
  trigger_detected: "spec - research"
  priority: "HIGHEST (Level 1)"
  bypass: "All routing analysis - direct to apex-researcher"
  guaranteed_access: "Full MCP orchestration + Brazilian compliance"

phase_2_apex_researcher_execution:
  Task:
    subagent_type: "apex-researcher"
    prompt: |
      ## Goal
      Comprehensive research on PIX clearing protocol implementation patterns

      ## Complexity
      L7 (complex research - 5-10 authoritative sources required)

      ## Sources Needed
      - BCB official PIX documentation (Context7)
      - PIX technical specifications (Context7)
      - Brazilian fintech implementations (Tavily)
      - Existing codebase patterns (Serena)
      - Expert analysis and tutorials (Tavily)

      ## Brazilian Focus
      - BCB clearing protocol adherence
      - Real-time settlement patterns
      - Fraud prevention Brazilian patterns
      - LGPD compliance in PIX flow

      ## Validation Required
      ≥95% cross-validation accuracy (MANDATORY)

      ## Expected Output
      - Research Intelligence Report
      - Implementation guidance with code examples
      - Brazilian compliance checklist
      - Performance optimization recommendations
      - Security patterns
      - Implementation roadmap

apex_researcher_mcp_orchestration:
  # Phase 1: Parallel Discovery
  parallel_discovery:
    context7:
      - "BCB Circular No 4.015 (official PIX regulations)"
      - "PIX technical specifications v2.3"
      - "BCB fraud prevention guidelines"
    tavily:
      - "5+ fintech articles on PIX implementation"
      - "Brazilian developer community best practices"
      - "Real-world PIX integration experiences"
    serena:
      - "Existing payment transaction patterns"
      - "Current PIX implementation (if any)"
      - "Database schema for financial transactions"

  # Phase 2: Analysis and Validation
  analysis:
    sequential_thinking:
      - "Synthesize: BCB official specs + Community practices + Codebase patterns"
      - "Identify gaps between spec and current implementation"
      - "Recognize LGPD compliance touchpoints"
      - "Assess security requirements and patterns"

  # Phase 3: Cross-Validation (≥95% accuracy)
  cross_validation:
    context7_authority: "BCB official clearing protocol: 10 seconds max processing"
    tavily_validation: "8/8 fintech articles confirm: 2-10 seconds typical"
    serena_codebase: "Current async patterns support up to 30 seconds"
    sequential_thinking_synthesis: "Recommendation: Target 5 seconds with 10s timeout"
    confidence: "97% (BCB spec + 8 implementations + codebase analysis)"

research_intelligence_report:
  executive_summary:
    scope: "PIX clearing protocol implementation for AegisWallet"
    complexity: "L7 (complex - regulatory + performance + security)"
    validation: "97% confidence (≥95% requirement met ✅)"
    key_findings:
      - "BCB requires max 10 seconds end-to-end processing"
      - "Real-world implementations achieve 2-5 seconds average"
      - "Fraud detection must be real-time (blocking)"
      - "LGPD requires encryption + audit trail + consent"

    recommendations:
      - "Target 5 seconds processing time (well under BCB limit)"
      - "Implement async queue with webhook callbacks"
      - "Add real-time fraud detection (block suspicious transactions)"
      - "Full LGPD compliance: AES-256-GCM + comprehensive audit"

  detailed_analysis:
    pix_clearing_protocol:
      official_spec: |
        - End-to-end ID (txid): 32-character UUID (E + timestamp + random)
        - Processing time: Maximum 10 seconds
        - Transaction flow: Initiation → Validation → Processing → Settlement → Confirmation
        - Clearing windows: Real-time 24/7
        - Settlement: End of day (D+0)

      implementation_patterns:
        - "Async processing with webhook callbacks (7/8 implementations)"
        - "Redis queue for transaction processing (6/8)"
        - "PostgreSQL for transaction storage with JSONB metadata (8/8)"
        - "Separate fraud detection service (5/8)"

      performance_benchmarks:
        - "P50: 2.3 seconds (average from 8 implementations)"
        - "P95: 4.8 seconds"
        - "P99: 7.2 seconds"
        - "Target: <5 seconds P95 (recommended)"

    fraud_detection_patterns:
      bcb_requirements:
        - "Real-time fraud detection (blocking)"
        - "Risk scoring for all transactions"
        - "Suspicious activity reporting to BCB"

      community_patterns:
        - "Velocity checks: Max 10 transactions/hour for new users"
        - "Amount thresholds: Flag transactions >R$ 5.000"
        - "Behavioral analysis: Compare to user's typical patterns"
        - "Device fingerprinting: Track suspicious devices"

      recommendations:
        - "Implement multi-layer fraud detection"
        - "Block high-risk transactions (score >0.8)"
        - "Manual review for medium-risk (0.5-0.8)"
        - "Auto-approve low-risk (<0.5)"

    lgpd_compliance:
      requirements:
        - "CPF encryption: AES-256-GCM (Context7: LGPD Art. 46)"
        - "Transaction amounts: Encrypted at rest"
        - "Consent: Explicit for PIX operations"
        - "Audit trail: All operations logged with IP, timestamp, user_id"
        - "Data retention: 5 years (BCB requirement)"
        - "Right to erasure: Anonymize after retention period"

      implementation_checklist:
        - "✅ Use pgcrypto for database-level encryption"
        - "✅ Consent flow before first PIX transaction"
        - "✅ Append-only audit table with tamper protection"
        - "✅ Automatic anonymization after 5 years"
        - "✅ User dashboard for data access/deletion requests"

    security_patterns:
      owasp_alignment:
        - "Input validation: PIX key format verification"
        - "Authentication: Multi-factor for PIX (biometric + password)"
        - "Authorization: RLS policies for transaction access"
        - "Encryption: End-to-end encryption for sensitive data"
        - "Rate limiting: 10 PIX transactions/minute per user"

      brazilian_specific:
        - "CPF validation: Check digit algorithm"
        - "PIX key validation: Format-specific (CPF/CNPJ/email/phone/random)"
        - "Trust patterns: Green/yellow/red status indicators"
        - "Portuguese error messages: No sensitive data exposure"

  implementation_guidance:
    architecture_recommendation: |
      1. API Layer (Hono + tRPC)
         - POST /api/pix/initiate
         - POST /api/pix/confirm
         - GET /api/pix/status/:txid
         - WebSocket for real-time updates

      2. Processing Layer
         - Redis Bull queue for async processing
         - Worker processes for parallel execution
         - Webhook callbacks for status updates

      3. Fraud Detection Layer
         - Real-time scoring service
         - Velocity check middleware
         - Behavioral analysis engine

      4. Database Layer
         - pix_transactions table (encrypted)
         - pix_audit_trail (append-only)
         - pix_keys table (user PIX keys)

      5. Integration Layer
         - BCB DICT API (PIX key lookup)
         - PSP integration (actual clearing)
         - Notification service (SMS/email)

    code_examples:
      transaction_schema: |
        CREATE TABLE pix_transactions (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id),
          end_to_end_id VARCHAR(32) UNIQUE NOT NULL,
          amount_encrypted BYTEA NOT NULL,
          pix_key_encrypted BYTEA NOT NULL,
          pix_key_type VARCHAR(10) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
          status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'fraud_detected')),
          fraud_score DECIMAL(3,2),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT now(),
          completed_at TIMESTAMPTZ
        );

      api_endpoint: |
        export const pixRouter = router({
          initiate: protectedProcedure
            .input(z.object({
              pixKey: z.string(),
              amount: z.number().positive().max(1000),
              description: z.string().max(140)
            }))
            .mutation(async ({ ctx, input }) => {
              // 1. Validate PIX key format
              validatePixKey(input.pixKey)

              // 2. Fraud detection
              const fraudScore = await detectFraud(ctx.user.id, input.amount)
              if (fraudScore > 0.8) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Transaction blocked by fraud detection' })
              }

              // 3. Create transaction
              const txid = generateEndToEndId()
              const transaction = await createPixTransaction({
                userId: ctx.user.id,
                endToEndId: txid,
                amount: input.amount,
                pixKey: input.pixKey,
                fraudScore
              })

              // 4. Enqueue for async processing
              await pixQueue.add('process-pix', { transactionId: transaction.id })

              // 5. Return immediate response
              return { txid, status: 'pending', estimatedTime: '5 seconds' }
            })
        })

  brazilian_compliance_checklist:
    bcb_compliance:
      - "✅ Max 10 seconds processing time"
      - "✅ End-to-end ID generation (E{timestamp}{random})"
      - "✅ 24/7 availability"
      - "✅ Real-time fraud detection"
      - "✅ 5-year transaction retention"
      - "✅ BCB reporting for suspicious transactions"

    lgpd_compliance:
      - "✅ AES-256-GCM encryption for CPF and amounts"
      - "✅ Explicit consent for PIX operations"
      - "✅ Comprehensive audit trail"
      - "✅ User rights implementation (access, deletion, portability)"
      - "✅ Data minimization principle"
      - "✅ Automatic anonymization after retention period"

    accessibility_compliance:
      - "✅ WCAG 2.1 AA+ for PIX UI"
      - "✅ Screen reader support in Portuguese"
      - "✅ 44px+ touch targets for mobile"
      - "✅ High contrast mode support"
      - "✅ Keyboard navigation for all PIX flows"

  implementation_roadmap:
    phase_1_foundation (Week 1-2):
      - "Design pix_transactions schema with encryption"
      - "Implement RLS policies for user isolation"
      - "Create audit trail infrastructure"
      - "Set up Redis queue for async processing"

    phase_2_core_flow (Week 3-4):
      - "Implement PIX initiation API"
      - "Build transaction processing worker"
      - "Integrate fraud detection service"
      - "Add webhook callback system"

    phase_3_compliance (Week 5):
      - "LGPD consent flow"
      - "BCB reporting integration"
      - "User data access/deletion endpoints"
      - "Audit trail validation"

    phase_4_optimization (Week 6):
      - "Performance tuning (target <5s P95)"
      - "Load testing (1000+ concurrent transactions)"
      - "Monitoring and alerting setup"
      - "Documentation and training"

  quality_gates:
    research_quality:
      - "✅ ≥95% cross-validation achieved (97%)"
      - "✅ 10+ authoritative sources (BCB + 8 implementations + codebase)"
      - "✅ Expert consensus validated"
      - "✅ Implementation guidance actionable"

    brazilian_compliance:
      - "✅ BCB PIX regulations addressed"
      - "✅ LGPD requirements complete"
      - "✅ Accessibility standards included"
      - "✅ Portuguese-first documentation"

  appendix:
    sources:
      context7:
        - "BCB Circular No 4.015 - PIX System Regulations"
        - "PIX Technical Specifications v2.3 (BCB)"
        - "LGPD Lei Nº 13.709/2018 (Official)"

      tavily:
        - "Nubank PIX Implementation Case Study"
        - "Inter Bank PIX Architecture Article"
        - "PagSeguro PIX Integration Tutorial"
        - "5+ Brazilian developer blog posts on PIX"

      serena:
        - "src/db/schema/transactions.ts (existing patterns)"
        - "src/api/payments/ (payment endpoint patterns)"
        - "src/lib/encryption.ts (encryption utilities)"

phase_3_handoff_to_apex_dev:
  deliverables:
    - "Research Intelligence Report (complete)"
    - "Implementation roadmap (6-week plan)"
    - "Code examples (schema + API)"
    - "Brazilian compliance checklist (BCB + LGPD)"
    - "Quality validation (97% confidence)"

  next_actions:
    - "apex-dev: Review research report"
    - "apex-dev: Create atomic tasks for 6-week roadmap"
    - "apex-dev: Parallel consultation with database-specialist + code-reviewer"
    - "apex-dev: Begin Phase 1 implementation"

time_total: "2h 15min (L7 research with full MCP orchestration)"
breakdown:
  - "Parallel discovery (Context7 + Tavily + Serena): 45min"
  - "Analysis and synthesis (Sequential Thinking): 30min"
  - "Report generation and validation: 40min"
  - "Implementation guidance and roadmap: 20min"

success_metrics:
  - "✅ Spec mode activated immediately (<30 seconds)"
  - "✅ ≥95% cross-validation achieved (97%)"
  - "✅ Full MCP orchestration (Context7 + Tavily + Serena + Sequential Thinking)"
  - "✅ Brazilian compliance auto-activated"
  - "✅ Actionable implementation guidance provided"
  - "✅ 6-week roadmap with atomic tasks"
```

## Enhanced Deliverables Framework

### Research Intelligence Reports
- **Scope**: Research complexity assessment (L1-L10)
- **Validation**: ≥95% cross-source validation with confidence scores
- **Implementation Guidance**: Actionable recommendations with code examples
- **Gap Analysis**: Research limitations and follow-up recommendations
- **Brazilian Compliance**: LGPD/PIX/BCB status and requirements

### Atomic Task Execution Reports
- **Task Decomposition**: Complete breakdown into atomic units (30min-2h each)
- **Parallel Execution Matrix**: Planned vs actual parallelization efficiency
- **Subagent Performance**: Individual contributions and quality metrics
- **Time Analysis**: Planned vs actual execution times per task
- **Quality Gates**: Validation checkpoints and pass/fail status

### Multi-Subagent Validation Summaries
- **Subagent Approvals**: Individual validation results from each specialist
- **Confidence Scores**: Validation confidence by subagent (≥85% required)
- **Conflict Resolution**: How conflicting recommendations were resolved
- **Priority Hierarchy**: Which recommendations took precedence and why
- **Final Approval**: Overall project approval status and remaining work

### Implementation Documentation
- **Technical Decisions**: Key decisions with rationale and alternatives considered
- **Architecture Diagrams**: System architecture and data flow visualizations
- **Code Examples**: Practical implementation patterns and templates
- **Performance Metrics**: Actual vs target performance benchmarks
- **Brazilian Compliance**: Complete LGPD/PIX/BCB compliance verification

## Real-World Routing Examples (Enhanced)

### Example: Dashboard de Análise Financeira (Complexity 7)

**Prompt recebido**: "Criar dashboard com gráficos de gastos mensais e categorização automática"

**Fase 1 - Análise (apex-dev)**
- Complexidade: 7 (visualização de dados, queries complexas, UI rica)
- Domínio: Frontend + Database + **UI/UX intensivo**
- Subagents necessários: **apex-ui-ux-designer** (primary para UI), database-specialist, code-reviewer

**Fase 2 - Consulta Paralela com Task Tool**

```yaml
# PARALLEL DISPATCH (uma mensagem, 3 Task calls):

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: |
    ## Goal
    Defina arquitetura visual do dashboard financeiro

    ## Requirements
    - Layout responsivo (mobile-first)
    - Gráficos acessíveis (não depender só de cor)
    - Cards de métricas com hierarquia clara
    - Filtros e controles de período
    - Padrões brasileiros (R$ formatting, pt-BR dates)

    ## Brazilian Requirements
    - WCAG 2.1 AA+ compliance
    - Portuguese labels
    - Trust patterns (green = positive, red = negative)
    - NBR 17225 accessibility

    ## Expected Output
    - Component structure recommendation
    - Accessibility requirements checklist
    - Brazilian UX patterns to apply

Task:
  subagent_type: "database-specialist"
  prompt: |
    ## Goal
    Otimize queries para agregações mensais e categorização

    ## Context
    Database: Supabase PostgreSQL
    Tables: transactions, categories

    ## Requirements
    - Performance: Agregações mensais <100ms
    - Indexes: Otimizar para date ranges e category grouping
    - RLS: User isolation mantida

    ## Expected Output
    - Query optimization recommendations
    - Index strategy
    - Performance estimates

Task:
  subagent_type: "code-reviewer"
  prompt: |
    ## Goal
    Valide segurança de dados financeiros expostos no frontend

    ## Security Focus
    - Data exposure risks
    - Aggregation queries (prevent data leakage)
    - LGPD compliance for dashboard

    ## Expected Output
    - Security recommendations
    - LGPD validation checklist
```

**Fase 3 - Síntese (apex-dev)**

```yaml
apex_ui_ux_designer_output:
  mobile:
    - "Cards empilhados verticalmente"
    - "Gráficos em full-width"
    - "Swipe horizontal para navegar entre períodos"

  desktop:
    - "Grid 3 colunas para cards de métricas"
    - "Gráficos lado a lado (2 colunas)"
    - "Filtros no sidebar esquerdo"

  acessibilidade:
    - "Tabela de dados alternativa para cada gráfico"
    - "ARIA labels em português"
    - "Contraste 4.5:1+ em todos os textos"

  cores:
    - "Paleta com padrões além de cor (ícones, texturas)"
    - "Verde: gastos abaixo da média"
    - "Amarelo: gastos próximos ao limite"
    - "Vermelho: gastos acima da média"

database_specialist_output:
  views_materializadas:
    - "CREATE MATERIALIZED VIEW monthly_spending_by_category"
    - "Refresh: Daily at 00:00 (low traffic time)"

  indices_compostos:
    - "CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC)"
    - "CREATE INDEX idx_transactions_category ON transactions(user_id, category_id)"

  performance_estimate:
    - "Agregações mensais: 45ms (with indexes)"
    - "Categorization: 30ms (with materialized view)"

code_reviewer_output:
  security:
    - "RLS policies: Validated for aggregations ✅"
    - "Data minimization: Only necessary fields exposed ✅"
    - "Rate limiting: Recommend 30 requests/minute for dashboard"

  lgpd:
    - "No PII in aggregated data ✅"
    - "User-level isolation maintained ✅"
```

**Fase 4 - Implementação (apex-dev)**
- Implementa seguindo wireframes do apex-ui-ux-designer
- Usa queries otimizadas e views do database-specialist
- Aplica validações de segurança do code-reviewer
- Cria componentes com padrões de acessibilidade

**Fase 5 - Validação Paralela com Task Tool**

```yaml
# PARALLEL VALIDATION:

Task:
  subagent_type: "apex-ui-ux-designer"
  prompt: |
    ## Goal
    Audit completo de acessibilidade do dashboard

    ## Focus
    - Navegação por teclado em todos os gráficos
    - Labels ARIA em português
    - Modo de alto contraste
    - Responsividade em 320px-1920px

    ## Expected Output
    - WCAG 2.1 AA+ compliance report
    - Issues found with severity
    - Approval status

Task:
  subagent_type: "code-reviewer"
  prompt: |
    ## Goal
    Validação final de segurança do dashboard

    ## Files
    - src/pages/dashboard/FinancialAnalysisDashboard.tsx
    - src/components/dashboard/MonthlySpendingChart.tsx
    - src/hooks/useFinancialData.ts

    ## Focus
    - Data exposure verification
    - LGPD compliance final check

    ## Expected Output
    - Final security approval

results:
  apex_ui_ux_designer:
    status: "approved"
    wcag: "AA+ compliant (4.8:1 contrast, full keyboard nav, Portuguese ARIA)"
    responsive: "tested 320px-1920px ✅"

  code_reviewer:
    status: "approved"
    security: "pass (RLS validated, no data leakage)"
    lgpd: "compliant (aggregated data only)"

execution_time:
  - "Parallel consultation: 20 minutes"
  - "Parallel validation: 10 minutes"
  - "vs Sequential: 50 minutes total"
  - "Time savings: 40% reduction"
```

---

> **For complete development standards**: See root `AGENTS.md` for comprehensive rules, subagent definitions, testing requirements, and Brazilian compliance details.

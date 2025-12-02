# Factory Orchestration System

Dynamic agent routing and parallel execution coordination for AegisWallet droids and skills.

> **Project context**: See root `AGENTS.md` for complete development standards, agent definitions, and Brazilian compliance requirements.

## Master Orchestrator System

**Core Capabilities**:
- Dynamic droid discovery from `.factory/droids/`
- Multi-dimensional task routing analysis
- Parallel execution coordination
- Performance optimization and resource allocation
- Complete context transfer between agent transitions

**Business Context**: Brazilian financial market with PIX, LGPD, and accessibility requirements demanding extra security scrutiny and Portuguese-first interfaces.

## Available Droids & Capabilities

| Droid | Primary Focus | MCPs Assigned | When to Use |
|-------|---------------|---------------|-------------|
| **apex-dev** | Advanced implementation (complexity ≥7) | serena, context7 | Performance-critical, security-sensitive |
| **database-specialist** | Supabase/PostgreSQL + LGPD | serena | ANY database operation, RLS, migrations |
| **code-reviewer** | Security + Brazilian compliance | context7, tavily | Post-implementation, security validation |
| **apex-ui-ux-designer** | UI/UX + WCAG 2.1 AA+ | context7, serena | ANY new UI component, accessibility |
| **apex-researcher** | Brazilian regulations (≥95% accuracy) | context7, tavily, serena | Compliance questions, research |
| **product-architect** | PRD + Diátaxis framework | sequential-thinking | Strategy, documentation |

> **For detailed agent capabilities**: See root `AGENTS.md` for complete agent definitions and when-to-use guidance.

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
- Nenhum droid pode ser invocado diretamente (exceto apex-researcher para spec mode)
- apex-dev decide QUANDO e QUAIS droids consultar em paralelo
- apex-dev serve como hub central para consolidação de insights antes da implementação
- apex-dev garante a preservação completa do contexto entre todas as fases

### Execution Flow
```
Prompt → apex-dev (análise inicial) → [PARALELO] droids especializados → apex-dev (consolidação) → Implementação → [PARALELO] validação → apex-dev (ajustes finais)
```

## Parallel Dispatch Protocol

### When to Activate Parallel Analysis
apex-dev deve disparar análises paralelas quando:
- Complexidade ≥7 (alta complexidade técnica)
- Segurança sensível (dados financeiros, PII, transações)
- Integração pesada (múltiplos sistemas, dependências externas)
- Compliance brasileiro (LGPD, BCB, PIX, acessibilidade)
- Performance crítica (sub-200ms P95, alta concorrência)

### Parallel Execution Matrix
| Complexity | Pre-Implementation Parallel Droids | Post-Implementation Sequential/Parallel |
|------------|-----------------------------------|-----------------------------------------|
| **1-3** (Simple) | apex-dev alone | code-reviewer (sequential) |
| **4-6** (Moderate) | apex-dev + code-reviewer + database-specialist | code-reviewer → database-specialist |
| **7-8** (Complex) | apex-dev + code-reviewer + database-specialist + apex-ui-ux-designer + apex-researcher | code-reviewer → database-specialist → apex-ui-ux-designer |
| **9-10** (Mission) | apex-dev + code-reviewer + database-specialist + apex-ui-ux-designer + apex-researcher + product-architect | code-reviewer → database-specialist → apex-ui-ux-designer |

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

## Droid Communication Contract

### Input Format for Each Droid

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

### Output Format Expected from Each Droid

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

### Handoff Protocol (apex-dev ↔ Droids)

#### apex-dev to Droid Handoff
1. **Context Transfer**: Complete task description with goals and constraints
2. **Requirements Specification**: Clear expectations and acceptance criteria
3. **Resource Allocation**: Available tools and timeframes
4. **Success Metrics**: How the droid should measure success
5. **Output Format**: Required deliverable structure and format

#### Droid to apex-dev Handoff
1. **Work Summary**: Comprehensive summary of work performed
2. **Deliverables**: Complete list of outputs created
3. **Decision Log**: Key decisions with reasoning and alternatives considered
4. **Next Actions**: Recommended follow-up actions and agent handoffs
5. **Quality Assessment**: Self-assessment of work quality and confidence levels

### Error Handling and Escalation

#### Error Conditions
- **Droid Unavailable**: Fallback to alternative droid with similar capabilities
- **Insufficient Information**: Request additional context from apex-dev
- **Conflicting Recommendations**: Escalate to apex-researcher for resolution
- **Quality Concerns**: Escalate to code-reviewer for validation

#### Escalation Hierarchy
1. **Level 1**: Droid self-resolution with available resources
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
- Droids necessários identification

### Phase 2: Parallel Consultation (droids simultâneos)
**apex-dev dispara análises paralelas baseado em:**
- Complexidade ≥7 → Disparar todos os droids relevantes
- Segurança sensível → Disparar code-reviewer + apex-researcher
- UI component → Disparar apex-ui-ux-designer (SEMPRE obrigatório)
- Database changes → Disparar database-specialist (SEMPRE obrigatório)
- Compliance questions → Disparar apex-researcher (PRIMARY)

### Phase 3: Synthesis (apex-dev consolida)
- Receber insights de todos os droids
- Sintetizar informações em plano de implementação
- Identificar conflitos e resolver prioridades
- Definir estratégia de implementação detalhada

### Phase 4: Implementation (apex-dev executa)
- Implementar seguindo specs consolidadas
- Aplicar validações de segurança do code-reviewer
- Usar schema do database-specialist
- Seguir padrões de UI do apex-ui-ux-designer
- Documentar decisões e trade-offs

### Phase 5: Validation (droids paralelos)
**[PARALELO] Validations:**
- **code-reviewer**: Security validation, OWASP compliance
- **database-specialist**: Performance validation, RLS policies
- **apex-ui-ux-designer**: Accessibility validation, WCAG 2.1 AA+
- **apex-researcher**: Brazilian compliance validation (se aplicável)

### Phase 6: Finalization (apex-dev ajusta)
- Aplicar correções baseadas nas validações
- Documentar decisões finais e justificativas
- Preparar entrega e documentação
- Validar critérios de aceitação

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
- Skill coordination → Individual agent execution

## Integration Protocols

### Agent Handoff Standards
**Input Requirements**:
- Complete task description with goals and constraints
- Summary of completed work and decisions made
- Expected outputs and acceptance criteria
- Required inputs from other agents

**Output Standards**:
- Comprehensive summary of work performed
- Complete list of outputs created
- Key decisions with reasoning and alternatives
- Recommended next actions and agent handoffs

### Priority Hierarchy & Conflict Resolution
1. **Security** (code-reviewer overrides all)
2. **Compliance** (LGPD and regulatory requirements)
3. **Architecture** (system architecture decisions)
4. **Performance** (within security constraints)
5. **Features** (established patterns)
6. **Skill coordination** (integration patterns)

**Escalation Rules**:
- Agent disagreement → apex-researcher (regulatory research)
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
- **Context Transfer**: <5% information loss between agent transitions
- **Routing Decisions**: <2 minutes intelligent routing

### Resource Allocation
- **Spec Mode Priority**: Immediate apex-researcher + full MCP access
- **Agent Specialization**: Core competency optimization
- **Dynamic Load Balancing**: Optimal utilization across tracks
- **Intelligent Routing**: 95% accuracy with spec mode override
- **Real-time Monitoring**: Performance optimization and allocation
- **Brazilian Compliance**: Auto-activated regulatory research

## Examples of Real-World Routing

### Security Audit (Complexity: 8)
- **Route**: apex-dev (análise) → [PARALELO] apex-researcher (OWASP) + code-reviewer (vulnerabilities) + database-specialist (RLS) + apex-ui-ux-designer (accessibility security) → apex-dev (consolidação) → Implementação → [PARALELO] code-reviewer (security validation)
- **Parallel**: apex-ui-ux-designer (accessibility security)
- **Compliance**: OWASP + LGPD + Brazilian security standards

## Concrete Workflow Examples

### Example: Dashboard de Análise Financeira

**Prompt recebido**: "Criar dashboard com gráficos de gastos mensais e categorização automática"

**Fase 1 - Análise (apex-dev)**
- Complexidade: 7 (visualização de dados, queries complexas, UI rica)
- Domínio: Frontend + Database + **UI/UX intensivo**
- Droids necessários: **apex-ui-ux-designer** (primary para UI), database-specialist, code-reviewer

**Fase 2 - Consulta Paralela**
```
apex-dev dispatches:
├── apex-ui-ux-designer: "Defina arquitetura visual do dashboard:
│                         - Layout responsivo (mobile-first)
│                         - Gráficos acessíveis (não depender só de cor)
│                         - Cards de métricas com hierarquia clara
│                         - Filtros e controles de período
│                         - Padrões brasileiros (R$ formatting, pt-BR dates)"
├── database-specialist: "Otimize queries para agregações mensais,
│                         índices para categorização"
└── code-reviewer: "Valide segurança de dados financeiros expostos no frontend"
```

**Fase 3 - Síntese (apex-dev)**
- **apex-ui-ux-designer**:
  - Mobile: Cards empilhados, gráficos em full-width, swipe para períodos
  - Desktop: Grid 3 colunas, gráficos lado a lado, filtros no sidebar
  - Acessibilidade: Tabela de dados alternativa para cada gráfico
  - Cores: Paleta com 4.5:1 contraste + padrões além de cor
- database-specialist: Views materializadas para agregações, índices compostos
- code-reviewer: Sanitização de dados, rate limiting em endpoints

**Fase 4 - Implementação (apex-dev)**
- Implementa seguindo wireframes do apex-ui-ux-designer
- Usa queries otimizadas do database-specialist
- Aplica validações do code-reviewer

**Fase 5 - Validação Paralela**
```
apex-dev dispatches:
├── apex-ui-ux-designer: "Audit completo de acessibilidade:
│                         - Navegação por teclado em todos os gráficos
│                         - Labels ARIA em português
│                         - Modo de alto contraste
│                         - Responsividade em 320px-1920px"
└── code-reviewer: "Validação final de segurança"
```

---

> **For complete development standards**: See root `AGENTS.md` for comprehensive rules, agent definitions, testing requirements, and Brazilian compliance details.

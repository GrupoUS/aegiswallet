# AegisWallet Intelligent Orchestrator System

## Purpose
Sistema de orquestração inteligente que decide automaticamente qual droid/skill usar, baseado em `.droid.yaml` triggers e `AGENTS.md` rules.

## How It Works

### 1. Task Analysis & Routing
Quando um request é recebido, o orquestrador:
1. **Detecta modo spec** → `apex-researcher` automaticamente
2. **Detecta compliance brasileiro** → Ativa especialistas LGPD/BCB/WCAG
3. **Analisa complexidade** (1-10) → Seleciona droids adequados
4. **Verifica execução paralela** → Otimiza performance

### 2. Automatic Triggers

#### Spec Mode (Highest Priority)
```yaml
triggers:
  - "spec - research"
  - "research and plan" 
  - "analyze and plan"
  - "investigate and create"
action: "Task(apex-researcher)"
mcp_servers: ["context7", "tavily", "sequential-thinking"]
```

#### Brazilian Compliance (High Priority)
```yaml
lgpd_triggers:
  - "lgpd", "consent", "dados pessoais", "privacy"
  action: "Task(apex-researcher) + Skill(brazilian-fintech-compliance)"

financial_triggers:
  - "pix", "boleto", "bcb", "banco central"
  action: "Task(apex-researcher) + Task(code-reviewer)"

accessibility_triggers:
  - "wcag", "acessibilidade", "libras", "screen reader"
  action: "Task(apex-ui-ux-designer)"
```

#### Database Operations
```yaml
triggers:
  - "database", "schema", "migration", "supabase"
action: "Task(database-specialist)"
priority: "high"
```

#### Security & Code Review
```yaml
triggers:
  - "security", "vulnerability", "auth", "encrypt"
action: "Task(code-reviewer)"
priority: "highest"
```

#### Design & UI/UX
```yaml
triggers:
  - "design", "ui", "ux", "interface", "component"
action: "Task(apex-ui-ux-designer)"
mcp_servers: ["context7"]
```

### 3. Complexity-Based Routing

```yaml
complexity_1_3:
  - database-specialist (se database)
  - code-reviewer (se security)
  - apex-dev (implementação simples)

complexity_4_6:
  - apex-dev + database-specialist
  - apex-ui-ux-designer + code-reviewer

complexity_7_8:
  - apex-dev (primary)
  - code-reviewer + database-specialist (paralelo)

complexity_9_10:
  - apex-researcher (pesquisa)
  - apex-dev (implementação)
  - code-reviewer (validação)
```

### 4. Parallel Execution Patterns

```yaml
allowed_parallel_combinations:
  research_team:
    - "apex-researcher"
    - "database-specialist" 
    - "apex-ui-ux-designer"
    
  quality_gates:
    - "code-reviewer"
    - "database-specialist"
    
  implementation:
    - "apex-dev"
    - "database-specialist"
```

## Usage Examples

### Example 1: Brazilian Fintech Feature
**Request**: "Implement PIX payment system with LGPD compliance"

**Orchestration**:
1. **Detected**: PIX + LGPD → Brazilian financial compliance
2. **Routing**: 
   ```javascript
   [
     Task("apex-researcher"), // Research BCB/PIX specs
     Task("database-specialist"), // Schema with RLS
     Skill("brazilian-fintech-compliance"), // LGPD validation
     Task("code-reviewer") // Security review
   ]
   ```
3. **Execution**: Parallel research → Sequential implementation

### Example 2: Spec Mode Research
**Request**: "spec - research and plan OAuth2 implementation"

**Orchestration**:
1. **Detected**: Spec mode trigger
2. **Routing**: `Task("apex-researcher")` only
3. **Execution**: Research only, no implementation

### Example 3: Database Migration
**Request**: "Create Supabase migration for user profiles with data protection"

**Orchestration**:
1. **Detected**: Database + data protection
2. **Routing**: 
   ```javascript
   [
     Task("database-specialist"), // Migration
     Task("code-reviewer") // Security validation
   ]
   ```

## MCP Server Integration

### MCP Assignment by Specialization
```yaml
apex-researcher: ["context7", "tavily", "sequential-thinking", "serena"]
apex-dev: ["serena", "context7"]
code-reviewer: ["serena", "context7"] 
database-specialist: ["serena"]
apex-ui-ux-designer: ["context7"]
product-architect: ["context7", "tavily", "sequential-thinking"]

brazilian-fintech-compliance: ["context7", "tavily"]
webapp-testing: []
frontend-design: ["context7"]
```

## Implementation Guidelines

### ✅ YOU MUST:
1. **Use Task tool** for droids, **Skill tool** for skills
2. **Route by triggers**, não por chamada direta de MCPs
3. **Check spec mode first** (highest priority)
4. **Validate Brazilian compliance** automaticamente
5. **Use parallel execution** quando possível
6. **Preserve context** entre transições de agentes

### ❌ YOU MUST NEVER:
1. **Call MCPs directly** - sempre através de droids/skills
2. **Skip spec mode detection** - pode implementar prematuramente
3. **Ignore Brazilian triggers** - compliance é obrigatório
4. **Route manually** - usar orquestração automática
5. **Break parallel execution** - otimizar performance

## Quality Gates

Every orchestrated task must pass:
1. **Brazilian Compliance**: 100% LGPD/BCB/WCAG
2. **Security Validation**: Zero critical vulnerabilities  
3. **Code Quality**: TypeScript + Lint + Tests
4. **Performance**: Sub-200ms response times
5. **Accessibility**: WCAG 2.1 AA+ compliance

## Monitoring & Metrics

- **Routing Accuracy**: ≥90% correct droid/skill selection
- **Performance**: 60% reduction vs sequential execution
- **Compliance**: 100% Brazilian validation
- **Context Transfer**: <5% information loss
- **Success Rate**: ≥95% task completion

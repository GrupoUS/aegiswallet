# Factory Orchestration System - AegisWallet Droids & Skills

## Purpose

Orchestration system for `.factory/droids/` and `.factory/skills` specialized agents, focusing on dynamic task routing and parallel execution coordination.

## 🎯 Master Orchestrator Protocol

### Core Orchestration Capabilities
- **Dynamic Droid Discovery**: Auto-scan `.factory/droids/` for available agents
- **Skill Integration**: Coordinate `.factory/skills` for domain-specific expertise  
- **Intelligent Task Routing**: Multi-dimensional analysis for optimal agent selection
- **Parallel Execution Coordination**: Sophisticated multi-track orchestration
- **Performance Optimization**: Real-time monitoring and resource allocation

### Business Context
AegisWallet serves Brazilian financial market with special requirements:
- PIX features need extra security scrutiny (real money at stake)
- Portuguese interfaces must be natural (user trust depends on it)
- LGPD compliance is non-negotiable (legal requirement)
- Accessibility matters (serving visually impaired users)

## 🔍 Auto-Discovery System

### Agent Discovery Protocol
Master orchestrator scans directories to build capability matrix:
- **Parse Agent Capabilities**: Extract expertise, triggers, complexity ratings
- **Build Capability Matrix**: Real-time mapping of skills to task requirements  
- **Update Agent Registry**: Dynamic roster of available specialized agents
- **Maintain Availability Status**: Track current workload and accessibility

### Current Active Agents
```yaml
CORE_IMPLEMENTATION:
  - apex_dev: "Advanced development with Brazilian fintech specialization (Complexity ≥7)"
  - database_specialist: "Supabase/PostgreSQL expert with Brazilian fintech expertise"

QUALITY_ASSURANCE:
  - code_reviewer: "Enhanced security architect with Brazilian compliance and skill integration"

DESIGN_ARCHITECTURE:
  - apex_ui_ux_designer: "Enhanced UI/UX orchestrator with intelligent skill coordination"

RESEARCH_KNOWLEDGE:
  - apex_researcher: "Multi-source validation (≥95% accuracy) + Brazilian regulations"
  - product_architect: "PRD generation + Diátaxis framework + rules engineering"
```

## 🧠 Task Routing Algorithm

### Multi-Dimensional Analysis
```yaml
COMPLEXITY_FACTORS:
  technical_complexity: "1-10 scale (implementation difficulty)"
  integration_complexity: "System dependencies and touch points"
  compliance_complexity: "Brazilian regulatory requirements"
  security_sensitivity: "Data protection and vulnerability risks"

REQUIREMENT_FACTORS:
  brazilian_market: "PIX, boletos, Open Banking integration"
  accessibility_needs: "WCAG 2.1 AA+ compliance requirements"
  language_requirements: "Portuguese-first interface needs"
  performance_requirements: "Response time and scalability needs"

RESOURCE_FACTORS:
  agent_availability: "Current workload and accessibility"
  expertise_matching: "Skill alignment with task requirements"
  parallel_potential: "Opportunities for concurrent execution"
```

### Capability Matching Matrix
```yaml
TECHNICAL_COMPLEXITY:
  1_3: [database_specialist, code_reviewer]
  4_6: [database_specialist, code_reviewer, apex_ui_ux_designer]
  7_8: [apex_dev, code_reviewer, database_specialist]
  9_10: [apex_researcher, apex_dev, code_reviewer]

BRAZILIAN_COMPLIANCE:
  financial_systems: [apex_researcher, database_specialist, code_reviewer]
  lgpd_requirements: [code_reviewer, apex_researcher, database_specialist]
  accessibility: [apex_ui_ux_designer, code_reviewer]
  portuguese_interface: [apex_ui_ux_designer, apex_dev, code_reviewer]

SECURITY_SENSITIVITY:
  critical: [apex_dev, code_reviewer, database_specialist]
  standard: [code_reviewer, database_specialist]
  data_protection: [database_specialist, code_reviewer, apex_researcher]
```

## 🚀 Parallel Execution Workflow

### Orchestration Protocol
1. **Task Analysis** → Complexity assessment + requirement mapping
2. **Agent Discovery** → Capability matrix + availability check  
3. **Dynamic Routing** → Optimal agent selection + fallback chains
4. **Parallel Coordination** → Multi-track execution + synchronization
5. **Quality Assurance** → Parallel validation + compliance checks
6. **Performance Optimization** → Resource monitoring + adaptive scheduling

### Dynamic Routing Examples
```yaml
PIX_PAYMENT_FEATURE:
  complexity: 9
  route: [apex_researcher → apex_dev → database_specialist]
  parallel: [code_reviewer (security) + apex_ui_ux_designer (Brazilian UX)]
  compliance: [LGPD + BCB specs + accessibility + PIX security]

USER_PROFILE_PAGE:
  complexity: 4
  route: [database_specialist → apex_ui_ux_designer]
  parallel: [code_reviewer (security validation)]
  compliance: [Portuguese interface + LGPD + accessibility]

SECURITY_AUDIT:
  complexity: 8
  route: [code_reviewer → apex_researcher → database_specialist]
  parallel: [apex_ui_ux_designer (accessibility security)]
  compliance: [OWASP + LGPD + Brazilian security standards]
```

## ⚡ Parallel Execution Strategy

### Can Run in Parallel:
- **Research Phase**: apex-researcher + database-specialist + product-architect + apex-ui-ux-designer + code-reviewer
- **Design Phase**: apex-ui-ux-designer + database-specialist + code-reviewer (architecture validation)
- **Quality Assurance**: code-reviewer + apex-ui-ux-designer + database-specialist (integrated validation)
- **Skill Coordination**: apex-ui-ux-designer coordinates other agents for optimal workflow

### Must Run Sequentially:
- Design → Implementation → Testing
- Database schema → Application implementation
- Security validation → Brazilian compliance validation
- Skill coordination → Individual agent execution

## 🔗 Integration Protocols

### Handoff Standards
```yaml
INPUT_REQUIREMENTS:
  task_context: "Complete task description with goals and constraints"
  previous_work: "Summary of completed work and decisions made"
  deliverables: "Expected outputs and acceptance criteria"
  dependencies: "Required inputs from other agents"

OUTPUT_STANDARDS:
  work_summary: "Comprehensive summary of work performed"
  deliverables_provided: "Complete list of outputs created"
  decisions_made: "Key decisions with reasoning and alternatives"
  next_steps: "Recommended next actions and agent handoffs"
```

### Conflict Resolution
```yaml
PRIORITY_HIERARCHY:
  1_security: "code_reviewer security decisions override all"
  2_compliance: "LGPD and regulatory requirements take precedence"
  3_architecture: "System architecture decisions guide implementation"
  4_performance: "Performance optimization within security constraints"
  5_features: "Feature implementation follows established patterns"
  6_skill_coordination: "Skill integration patterns guide agent collaboration"

ESCALATION_RULES:
  agent_disagreement: "escalate to apex_researcher for decision with regulatory research"
  compliance_conflict: "escalate to apex_researcher for regulatory clarification"
  performance_v_security: "security takes precedence over performance"
  skill_coordination_conflict: "escalate to apex_researcher for optimal skill usage"
```

## 📊 Performance Metrics

### Time Savings
- **Sequential Development**: 20-30 hours for complex features
- **Parallel Development**: 8-12 hours for complex features (60% reduction)
- **Quality Assurance**: 50% faster through parallel validation
- **Context Transfer Loss**: <5% information loss between agent transitions
- **Decision Latency**: <2 minutes for intelligent routing decisions

### Resource Optimization
- **Agent Specialization**: Each agent works on core competencies
- **Dynamic Load Balancing**: Optimal agent utilization across all tracks
- **Intelligent Routing**: 90% accuracy in task-agent matching
- **Performance Monitoring**: Real-time optimization and resource allocation

## 🚨 Critical Rules

### ✅ YOU MUST:
1. Use dynamic discovery and intelligent routing for ALL tasks
2. Create detailed todo lists with complexity ratings (1-10 scale)
3. Evaluate technical complexity, compliance requirements, and security sensitivity
4. Use capability matrix for 90%+ accuracy in task-agent matching
5. Identify and execute concurrent opportunities whenever possible
6. Maintain complete knowledge transfer between agent transitions
7. Ensure 100% Brazilian compliance for financial features
8. Coordinate skill usage between agents for optimal workflow

### ❌ YOU MUST NEVER:
1. Implement code yourself instead of delegating
2. Skip specialized quality gates
3. Bypass intelligent routing for task assignments
4. Allow context loss between agent handoffs
5. Skip parallel execution opportunities
6. Ignore Brazilian compliance validation

---

**Note**: This document complements the main AGENTS.md with factory-specific orchestration details. Refer to main AGENTS.md for comprehensive development standards, principles, and detailed workflows.

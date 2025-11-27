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
  - apex_researcher: "Enhanced research & planning specialist with parallel MCP orchestration (Context7 + Tavily + Serena) and Sequential Thinking. Auto-activates in spec mode to deliver ≥95% cross-validation accuracy with academic-grade planning taxonomy"
  - product_architect: "PRD generation + Diátaxis framework + rules engineering"
```

## 🎯 SPEC MODE AUTO-ACTIVATION PROTOCOL

### Spec Mode Detection & Activation
The Master Orchestrator implements automatic spec mode detection:

```yaml
spec_mode_triggers:
  auto_activation_phrases:
    - "spec - research and plan"
    - "research and plan"
    - "analyze and plan"
    - "investigate and create implementation plan"
    - "spec - research"
    - "spec mode research"
  
  immediate_routing:
    trigger: "Any spec mode phrase detected"
    primary_agent: "apex_researcher"
    priority: "HIGHEST (Level 1)"
    bypass_analysis: "True for spec mode"
    
  activation_protocol:
    step_1: "Detect spec mode trigger phrase"
    step_2: "Immediately route to apex_researcher"
    step_3: "Execute parallel research chain (Context7 + Tavily + Serena)"
    step_4: "Apply Sequential Thinking for planning"
    step_5: "Generate Research Intelligence Report + Implementation Plan"
```

### Spec Mode Priority Override
```yaml
priority_override_rules:
  spec_mode_supersedes:
    - complexity_analysis: "Spec mode bypasses complexity rating"
    - agent_routing: "Direct routing to apex_researcher"
    - resource_allocation: "Immediate access to all MCP tools"
    - parallel_execution: "Auto-enabled for research efficiency"
    
  guaranteed_execution:
    - "apex_researcher always gets priority in spec mode"
    - "No queue waiting for spec mode requests"
    - "Full MCP orchestration access guaranteed"
    - " Brazilian compliance auto-activation when applicable"
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

### Enhanced Capability Matching Matrix
```yaml
SPEC_MODE_OVERRIDE:
  spec_research_plan:
    trigger: "spec - research and plan phrases"
    primary_agent: "apex_researcher"
    priority: "HIGHEST (Level 1)"
    routing: "IMMEDIATE - bypass all analysis"
    
TECHNICAL_COMPLEXITY:
  1_3: [database_specialist, code_reviewer]
  4_6: [database_specialist, code_reviewer, apex_ui_ux_designer]
  7_8: [apex_dev, code_reviewer, database_specialist]
  9_10: [apex_researcher, apex_dev, code_reviewer]

BRAZILIAN_COMPLIANCE:
  financial_systems: [apex_researcher, database_specialist, code_reviewer]
  lgpd_requirements: [apex_researcher, code_reviewer, database_specialist]  # apex_researcher prioritized
  accessibility: [apex_ui_ux_designer, code_reviewer]
  portuguese_interface: [apex_ui_ux_designer, apex_dev, code_reviewer]
  
BRAZILIAN_RESEARCH_SPECIALIZATION:
  pix_integration: [apex_researcher, database_specialist]
  open_banking: [apex_researcher, apex_dev]
  bcb_regulations: [apex_researcher, code_reviewer]
  fintech_analysis: [apex_researcher, product_architect]

SECURITY_SENSITIVITY:
  critical: [apex_dev, code_reviewer, database_specialist]
  standard: [code_reviewer, database_specialist]
  data_protection: [apex_researcher, database_specialist, code_reviewer]  # apex_researcher prioritized for compliance
```

## 🚀 Parallel Execution Workflow

### Enhanced Orchestration Protocol
1. **Spec Mode Detection** → Check for spec trigger phrases (highest priority)
2. **Task Analysis** → Complexity assessment + requirement mapping
3. **Agent Discovery** → Capability matrix + availability check
4. **Dynamic Routing** → Optimal agent selection + fallback chains
5. **Parallel Coordination** → Multi-track execution + synchronization
6. **Quality Assurance** → Parallel validation + compliance checks
7. **Performance Optimization** → Resource monitoring + adaptive scheduling

### Spec Mode First Priority
When spec mode triggers are detected:
- **Skip Analysis Phase**: Direct routing to apex-researcher
- **Immediate Activation**: No queue waiting or resource contention
- **Full MCP Access**: Context7 + Tavily + Serena + Sequential Thinking
- **Parallel Execution**: Auto-enabled for maximum research efficiency
- **Brazilian Compliance**: Auto-activated for financial/payment systems

### Enhanced Dynamic Routing Examples
```yaml
SPEC_MODE_EXAMPLES:
  spec_research_plan_oauth:
    trigger: "spec - research and plan OAuth2 implementation"
    immediate_routing: "apex_researcher (spec mode override)"
    parallel_execution: "Context7 + Tavily + Serena simultaneously"
    brazilian_compliance: "Auto-activated LGPD + BCB analysis"
    deliverables: "Research Intelligence Report + Implementation Plan"
    
  spec_research_plan_pix:
    trigger: "research and plan PIX integration"
    immediate_routing: "apex_researcher (spec mode override)"
    parallel_execution: "Context7 + Tavily + Serena simultaneously"
    brazilian_compliance: "Auto-activated LGPD + BCB + PIX regulations"
    deliverables: "Research Intelligence Report + Implementation Plan"

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
  route: [apex_researcher → code_reviewer → database_specialist]  # apex_researcher prioritized for compliance
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
  spec_mode_request: "IMMEDIATE routing to apex_researcher - bypass all escalation"
  research_planning_needs: "apex_researcher takes precedence over all other agents"
  brazilian_regulatory_questions: "apex_researcher as primary authority for LGPD/BCB"
```

## 📊 Performance Metrics

### Enhanced Time Savings
- **Spec Mode Immediate Activation**: <30 seconds to research initiation
- **Parallel Research Execution**: 60% faster through MCP orchestration
- **Sequential Development**: 20-30 hours for complex features
- **Parallel Development**: 8-12 hours for complex features (60% reduction)
- **Quality Assurance**: 50% faster through parallel validation
- **Context Transfer Loss**: <5% information loss between agent transitions
- **Decision Latency**: <2 minutes for intelligent routing decisions

### Resource Optimization
- **Spec Mode Priority**: Immediate apex-researcher access with full MCP orchestration
- **Agent Specialization**: Each agent works on core competencies
- **Dynamic Load Balancing**: Optimal agent utilization across all tracks
- **Intelligent Routing**: 95% accuracy with spec mode override for apex-researcher
- **Performance Monitoring**: Real-time optimization and resource allocation
- **Brazilian Compliance Acceleration**: Auto-activated regulatory research for fintech

---

**Note**: This document complements the main AGENTS.md with factory-specific orchestration details. Refer to main AGENTS.md for comprehensive development standards, principles, and detailed workflows.

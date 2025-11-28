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

## Task Routing Matrix

### Complexity-Based Routing
| Complexity | Primary | Parallel | Brazilian Focus |
|------------|---------|----------|----------------|
| **1-3** (Simple) | database-specialist | code-reviewer | Basic validation |
| **4-6** (Moderate) | database-specialist | code-reviewer + apex-ui-ux-designer | Accessibility, compliance |
| **7-8** (Complex) | apex-dev | code-reviewer + database-specialist | Performance, security |
| **9-10** (Mission) | apex-researcher → apex-dev | code-reviewer | Full research → implementation |

### Specialized Routing Triggers

**Brazilian Compliance** (auto-routed):
- LGPD/privacy → apex-researcher → code-reviewer  
- PIX/financial → apex-researcher → code-reviewer + database-specialist
- Accessibility → apex-ui-ux-designer → code-reviewer

**Security Sensitivity**:
- Critical → apex-dev + code-reviewer + database-specialist
- Standard → code-reviewer + database-specialist
- Data protection → apex-researcher (compliance priority)

### Multi-Dimensional Analysis
- **Technical complexity**: 1-10 implementation difficulty
- **Integration complexity**: System dependencies and touch points  
- **Compliance complexity**: Brazilian regulatory requirements
- **Security sensitivity**: Data protection and vulnerability risks

## Parallel Execution Coordination

### Orchestration Protocol
1. **Spec Mode Detection** → Highest priority trigger check
2. **Task Analysis** → Complexity + requirements assessment  
3. **Agent Discovery** → Capability matrix + availability
4. **Dynamic Routing** → Optimal selection + fallback chains
5. **Parallel Coordination** → Multi-track execution + sync
6. **Quality Assurance** → Parallel validation + compliance
7. **Performance Optimization** → Resource monitoring

### Spec Mode First Priority
When spec mode triggers are detected:
- **Skip Analysis Phase**: Direct routing to apex-researcher
- **Immediate Activation**: No queue waiting or resource contention
- **Full MCP Access**: Context7 + Tavily + Serena + Sequential Thinking
- **Parallel Execution**: Auto-enabled for maximum research efficiency
- **Brazilian Compliance**: Auto-activated for financial/payment systems

### Real-World Routing Examples

**PIX Payment Feature** (Complexity: 9)
- Route: apex-researcher → apex-dev → database-specialist
- Parallel: code-reviewer (security) + apex-ui-ux-designer (Brazilian UX)
- Compliance: LGPD + BCB specs + accessibility + PIX security

**User Profile Page** (Complexity: 4)
- Route: database-specialist → apex-ui-ux-designer
- Parallel: code-reviewer (security validation)  
- Compliance: Portuguese interface + LGPD + accessibility

**Security Audit** (Complexity: 8)
- Route: apex-researcher → code-reviewer → database-specialist
- Parallel: apex-ui-ux-designer (accessibility security)
- Compliance: OWASP + LGPD + Brazilian security standards

## Parallel vs Sequential Execution

**Can Execute in Parallel**:
- **Research Phase**: apex-researcher + database-specialist + apex-ui-ux-designer + code-reviewer
- **Design Phase**: apex-ui-ux-designer + database-specialist + code-reviewer (architecture validation)
- **Quality Assurance**: code-reviewer + database-specialist + apex-ui-ux-designer (integrated validation)

**Must Execute Sequentially**:
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

---

> **For complete development standards**: See root `AGENTS.md` for comprehensive rules, agent definitions, testing requirements, and Brazilian compliance details.

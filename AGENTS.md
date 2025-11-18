# AegisWallet Development Rules & Standards - Version: 2.0.0

## Purpose & Scope

This document establishes comprehensive rules and standards for AI-assisted development.

## Core Principles

**Mantra**: _"Think → Research → Decompose with atomic tasks → Plan → Implement → Validate"_

**KISS Principle**: Choose the simplest solution that meets requirements. Prioritize readable code over clever optimizations. Reduce cognitive load and avoid over-engineering.

**YAGNI Principle**: Build only what requirements specify. Resist "just in case" features. Refactor when requirements emerge. Focus on current user stories and remove unused, redundant and dead code immediately.

**Chain of Thought**: Break problems into sequential steps and atomic subtasks. Verbalize reasoning process. Show intermediate decisions. Validate against requirements.

**Avoid Never Used**: Make sure every file, route, hook, component is being use correctly, avoid errors like "Variable is declared but never used", "Import is never used", "Function is declared but never used". Make sure to remove unused code immediately and create components, hooks, routes only when they are needed. If you create something new, make sure it is being used correctly creating the necessary references.

**ULTRATHINK**: ALWAYS Use the tool `think` to think deeply about the user's request and organize your thoughts. Use each 5 steps to outline next steps and strategies. This helps improve response quality by allowing the model to consider the request carefully, brainstorm solutions, and plan complex tasks.
**⚠️ IMPORTANT:** Execute entire workflow without interruption. If you unsure about any step, consult the documentation in `/docs` and do a research using `context7` for official docs and best practices. Dont keep asking the user to clarify or provide more info, use your tools to research and fill in the gaps.
**GOAL-ORIENTED EXECUTION**: Strive to work through all steps toward problem resolution.
**RIGHT TOOL FOR JOB**: Understand full context before implementation. Choose appropriate technology and mcp tools. Plan carefully, implement systematically.
**MANDATORY** use of `serena mcp` to search codebase and semantic code analysis, _DO NOT USE NATIVE SEARCH CODEBASE tool_
**MANDATORY** use of `desktop-commander mcp` for file and terminal operations and system management
**MANDATORY** invoke `sequential-thinking` first and then the `think` native tool before any other action; under ULTRATHINK, always use `think` to produce a 5‑step breakdown of next steps/strategies to clarify order and purpose.

- Maintain task descriptions with atomic subtasks and add implementation notes
- DO NOT MAKE ASSUMPTIONS - check project documentation for questions

```yaml
CORE_STANDARDS:
  research_driven: "Multi-source validation for all complex implementations"
  vibecoder_integration: "Constitutional excellence with one-shot resolution philosophy"
  core_principle: "Simple systems that work over complex systems that don't"
  preserve_context: "Maintain complete context across all agent and thinking transitions"
  incorporate_always: "Incorporate what we already have, avoid creating new files, enhance the existing structure"
  always_audit: "Never assume the error is fixed, always audit and validate"
  COGNITIVE_ARCHITECTURE:
  meta_cognition: "Think about the thinking process, identify biases, apply constitutional analysis"
COMMUNICATION_FRAMEWORK:
  intent_layer: "Clearly state what you're doing and why"
  process_layer: "Explain thinking methodology and approach"
  evolution_layer: "Describe how understanding is evolving"
  constitutional_transparency: "Explain ethical and quality reasoning"
  adversarial_honesty: "Acknowledge potential issues and limitations"
  meta_cognitive_sharing: "Explain thinking about thinking process"
  uncertainty_acknowledgment: "Acknowledge uncertainty and evolving understanding"
  knowledge_optimization: "Optimize knowledge base based on task requirements"
```

### **Coordination Principles**

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
  purpose: "Decompose task into manageable components"
  output: "Structured task plan with MCP selection strategy"
trigger: "ALWAYS before any action - NO EXCEPTIONS"
primary_tool: "sequential-thinking + native think tool"
process:
  - Understand requirements completely
  - Identify constraints and dependencies
  - Assess complexity level (1-10)
  - Define strategic approach
  - Break down into manageable components
quality_gate: "Requirements clarity ≥9/10"

PHASE_2_Reasearch:
ONE_SHOT_TEMPLATE:
  role: "[Specific: Frontend Developer | Backend Engineer | Full-Stack]"
  context: "#workspace + #codebase"
  task: "[Specific, measurable, actionable requirement]"
  constraints: "[Technical limitations, performance requirements]"
  output: "[Code | Documentation | Architecture | Analysis]"
  success_criteria: "[Measurable outcomes, quality thresholds]"
  trigger: "ALWAYS DURING PLAN MODE or before planning or insufficient knowledge"
process:
  investigation: "Define 3-5 key questions"
  documentation: "context7 → Official docs and best practices"
  synthesis: "Cross-reference multiple sources"
TASK_PLANNING:
    structure:
    - Break down into atomic executable tasks
    - Assign optimal tools for each task
    - Define validation checkpoints
    - Create dependency mapping
    - Set measurable success criteria
THINK_AND_PLAN:
  inner_monologue: "What is user asking? Best approach? Challenges?"
  high_level_plan: "Outline major steps to solve problem"

PHASE_3_COORDINATED_EXECUTION:
DEVELOPMENT_FLOW:
  planning: "sequential-thinking → Architecture design"
  research: "context7 → Framework documentation"
  implementation: "desktop-commander → File operations"
  backend: "supabase-mcp → Database operations"
  frontend: "shadcn-ui → Component library"
  validation: "Think tool → Quality checks every 5 api request"
  parallel_execution:
    trigger: "Independent operations without shared resources"
    examples: ["serena + context7 research", "independent file operations"]
    efficiency: "40-60% time reduction"
  sequential_execution:
    trigger: "Dependent operations or shared resources"
    examples: ["desktop-commander → serena", "implementation → testing"]
    safety: "Eliminates race conditions"

CODE_QUALITY_STANDARDS:
  - Follow established coding conventions
  - Maintain or improve test coverage
  - Preserve existing functionality
  - Use meaningful commit messages
  - Optimize imports and dependencies

PHASE_4_VALIDATION:
  checkpoints: ["Immediate validation", "Integration validation", "Final validation"]
  criteria: ["Functional correctness", "Resource efficiency", "Standard compliance"]
QA_MANDATORY:
  post_modification_checks:
    - Syntax errors verification
    - Duplicates/orphans detection
    - Feature validation
    - Requirements compliance
    - Security vulnerabilities
    - Test coverage ≥90%
verification_rule: "Never assume changes complete without explicit verification"
TERMINATION_CRITERIA:
  only_stop_when:
    - User query 100% resolved
    - No remaining execution steps
    - All success criteria met
    - Quality validated ≥9.5/10
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

## Development Workflow Standards

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

### Quality Metrics

- **Code Quality**: Biome validation with zero errors
- **Type Safety**: Zero TypeScript errors in strict mode
- **Test Coverage**: 90%+ for critical business logic
- **Performance**: Core Web Vitals ≥ 90
- **Security**: Zero high-severity vulnerabilities
- **User Adoption**: Active users and feature utilization
- **Automation Rate**: Percentage of financial tasks automated
- **Technical Excellence**: Code quality and system reliability
- **Compliance**: LGPD and financial regulation adherence

---

## ADAPTIVE EXECUTION MODES

The agent automatically switches between modes based on task complexity and triggers:

### Standard Mode (Default)

**Trigger**: Regular development tasks, feature implementation, bug fixes
**Process**: Follow standard A.P.T.E methodology (Analyze → Plan → Think → Execute) execution workflow
**Confidence Threshold**: ≥85% before implementation

### Architecture Mode

**Trigger**: Complex system design, major architectural decisions, "design", "architecture", "system"
**Confidence Threshold**: ≥90% before implementation
**FOLLOW** [Architecture](../../.claude/agents/code-review/architect-review.md) - Arquitetura de sistema
**Process**:

1. **Requirements Analysis** (≥90% confidence)
   - Extract functional and non-functional requirements
   - Identify implied requirements and assumptions
   - Determine performance, security, scalability needs
   - Ask clarifying questions for ambiguities

2. **System Context Examination**
   - Examine existing codebase structure if available
   - Identify integration points and external systems
   - Define system boundaries and responsibilities
   - Create high-level system context overview

3. **Architecture Design**
   - Propose 2-3 architecture patterns with trade-offs
   - Recommend optimal solution with justification
   - Define core components and interfaces
   - Address security, performance, and scalability concerns
   - Design database schema if applicable

4. **Technical Specification**
   - Recommend specific technologies with justification
   - Break down implementation into phases
   - Identify risks and mitigation strategies
   - Create detailed component specifications
   - Define technical success criteria

5. **Transition Decision**
   - Summarize architectural recommendation
   - Present implementation roadmap
   - State final confidence level
   - If ≥90%: Ready to implement
   - If <90%: Request additional clarification

### Refactor Mode

**Trigger**: Code improvement, technical debt reduction, optimization, "refactor", "improve", "optimize"
**Focus**: Safe, systematic code improvement while preserving functionality
**Follow**: [Code Review](../../.claude/agents/code-review/code-reviewer.md) - Qualidade de código
**Process**:

1. **Refactoring Assessment (Analysis)**
   - **Code Analysis**: Examine for code smells, design patterns, performance bottlenecks
   - **Risk Assessment**: Evaluate impact scope, breaking change potential, test coverage
   - **Refactoring Categorization**: Extract Method/Class, Rename, Move, Simplify, Optimize, Modernize
   - **Priority Assessment**: Critical → High → Medium → Low based on impact
   - **Confidence Check**: Must reach ≥85% confidence before proceeding

2. **Refactoring Strategy (Planning)**
   - Create refactoring plan with logical, atomic steps
   - Identify dependencies between refactoring steps
   - Plan rollback strategy for each step
   - Determine testing approach for validation
   - Start with lowest-risk, highest-impact changes

3. **Refactoring Execution (Implementation)**
   - Make one logical change at a time
   - Maintain functionality at each step
   - Test after each logical step
   - Provide clear commit messages
   - Update documentation as needed

**Safety Guidelines**:

- **MUST NOT** remove tests without equivalent coverage
- **MUST NOT** remove existing functionality without approval
- **MUST** preserve public APIs unless breaking change approved
- **MUST** maintain backward compatibility when possible
- **MUST** test after each logical step

**Refactoring Techniques**:

- Extract Method/Function for long, complex functions
- Extract Class/Module for separation of concerns
- Rename for clarity and consistency
- Move code to appropriate locations
- Simplify complex conditionals and logic
- Optimize performance based on measurements

**Quality Metrics**:

- Cyclomatic Complexity reduction
- Code Duplication percentage decrease
- Test Coverage maintenance or improvement
- Performance improvements (when applicable)

### Audit Mode

**Trigger**: Security review, vulnerability assessment, "security", "audit", "vulnerability", "compliance"
**Focus**: Comprehensive security analysis with actionable findings
**FOLLOW** [Security](../../.claude/agents/code-review/test-auditor.md) - Auditoria de segurança
**Audit Methodology**:

1. **Code Review**
   - Static analysis for vulnerability patterns
   - Architecture review of security design decisions
   - Configuration check of security settings
   - Dependency audit for vulnerable packages

2. **Security Testing**
   - Authentication testing (login, session, access controls)
   - Input validation testing (injection, XSS vulnerabilities)
   - API security testing (endpoint vulnerabilities)
   - Error handling testing (sensitive data leakage)

## UNIVERSAL RESTRICTIONS

**MUST NOT**:

- Change functionality without explicit approval
- Introduce breaking changes without clear documentation
- Implement features not in requirements
- Proceed with <85% confidence in Standard Mode (<90% in Architecture Mode)
- Assume changes are complete without explicit verification
- Delete `/docs` files without approval

**MUST ALWAYS**:

- Start with sequential-thinking tool
- Research before critical implementations
- Follow KISS and YAGNI principles
- Update task status in Archon throughout process
- Validate solution quality before completion
- Continue until absolute completion

*Remember*: Your primary value is systematic analysis and implementation that prevents costly mistakes. Take time to understand and design correctly using the appropriate mode for each task.

---

---
title: "NeonPro Code Quality Control - Planning-First Approach"
last_updated: 2025-10-01
form: reference
tags: [quality, healthcare, bun, oxlint, lgpd, compliance, research-driven, planning-first]
related:
  - ../architecture/tech-stack.md
  - ../architecture/frontend-architecture.md
  - frontend-testing.md
  - research.md
  - ../agents/apex-researcher.md
---

# 🔍 NeonPro Code Quality Control - Planning-First Approach

**Research-driven quality control with comprehensive planning, atomic task decomposition, and healthcare compliance**

## 🎯 Core Philosophy

**Mantra**: _"Detect → Research → Plan → Decompose → Implement → Validate"_

**Mission**: Research-first quality control that prioritizes authoritative solutions over quick fixes, ensuring all code improvements are based on official documentation, best practices, and healthcare compliance standards.

**Quality Standard**: ≥9.5/10 rating with ≥95% cross-validation accuracy for all quality improvements

## 📋 Overview: 4-Phase Planning-First Workflow

This enhanced quality control workflow integrates research-driven methodologies to ensure that all code quality improvements are based on authoritative sources and best practices rather than assumptions.

```yaml
QUALITY_CONTROL_PHASES:
  phase_1_detection:
    name: "Error Detection & Analysis"
    tools: ["OXLint", "Serena MCP", "TypeScript", "Biome"]
    output: "Comprehensive error catalog with severity classification"

  phase_2_research:
    name: "Research-Driven Solution Planning"
    tools: ["apex-researcher", "Context7 MCP", "Tavily MCP", "Archon MCP"]
    output: "Research intelligence report with authoritative solutions"

  phase_3_planning:
    name: "Atomic Task Decomposition"
    tools: ["Sequential Thinking", "Archon Task Management", "Augment Tasks"]
    output: "Detailed atomic subtasks with implementation roadmap"

  phase_4_execution:
    name: "Systematic Implementation"
    tools: ["Desktop Commander", "Serena MCP", "Quality Gates"]
    output: "Validated fixes with healthcare compliance verification"
```

## 🧭 Phase 0: Workflow Discovery & Evidence Gathering

**Purpose**: Mirror real user workflows before validating fixes so diagnostics and validation commands stay aligned with production behavior.

- **Source mapping**: Read README, AGENTS/CLAUDE rules, docs/, and onboarding guides to extract end-to-end user journeys (what users actually do, not just APIs).
- **Pattern scan** (codebase-analyst): Identify architecture, naming, testing patterns, and existing validation commands/scripts so remediation reuses established approaches.
- **External integration inventory**: List dependent CLIs/APIs (e.g., Supabase, Playwright, GitHub/GitLab, messaging) and note required credentials or sandboxing needs.
- **Workflow catalog**: Convert each documented journey into an E2E scenario (happy path + failure cases) that will be exercised in validation (see Diagnostics → Validation Bridge).
- **Evidence log**: Keep URLs/paths and snippets that justify each scenario; attach to error catalogs and atomic tasks to maintain auditability.

### Codebase Analyst Integration (pattern capture)

- **When**: Run before Phase 1 to anchor detection and validation to project conventions.
- **How**: Use the codebase-analyst template to report project structure, naming, architecture, testing patterns, libraries, and existing validation commands with file/line references.
- **Deliverable** (store with the workflow catalog):
  ```yaml
  codebase_analysis:
    project:
      language: "<detected>"
      framework: "<detected>"
      structure: "<concise overview>"
    patterns:
      naming: { files: "", functions: "", classes: "" }
      architecture: { services: "", models: "", api: "" }
      testing: { framework: "", structure: "", commands: [] }
    similar_implementations:
      - file: "<path>"
        relevance: "<why relevant>"
        pattern: "<what to reuse>"
    libraries:
      - name: "<lib>"
        usage: "<how used>"
        patterns: "<integration pattern>"
    validation_commands:
      syntax: []
      test: []
      run: []
  ```
- **Usage**: Link the findings to diagnostics entries and reuse patterns in atomic tasks (avoid inventing new file layouts or command shapes).

## Tech Stack (2025-10-01)

- **Package Manager**: **Bun** (3-5x faster than pnpm/npm)
- **Frontend**: React 19 + Vite + TanStack Router/Query v5 + TypeScript strict
- **Backend**: **Hono (Edge-first)** + tRPC v11 + TypeScript strict
- **Data**: **Supabase** (Postgres + Auth + Realtime + RLS) + Audit logging
- **QA & Testing**: Vitest, Playwright, OXLint, Biome, TypeScript strict
- **Quality Tools**: **OXLint** (50-100x faster), Biome (formatter), Dprint, Sentry
- **Diagnostic Tools**: **Zed Context** (real-time validation), **Native Diagnostics** (project-wide scanning), **Project Diagnostics Suite**
- **Research Tools**: **Serena MCP**, **Context7 MCP**, **Tavily MCP**, **Archon MCP**
- **LGPD Focus**: Healthcare compliance, data protection, security validation

## Performance Optimizations

### **Bun Package Manager Integration**
- **Installation**: 50%+ faster dependency resolution
- **Script Execution**: 3-5x faster npm scripts
- **Memory Usage**: 30% lower memory footprint
- **Type Safety**: Native TypeScript integration

---

## 🔍 PHASE 1: Error Detection & Analysis

**Objective**: Comprehensive identification and cataloging of all code quality issues using automated tools and semantic analysis.

### **1.1 Detection Tools & Usage**

```yaml
PRIMARY_DETECTION_TOOLS:
  oxlint:
    purpose: "Primary linter with 570+ rules and healthcare compliance"
    performance: "50-100x faster than ESLint"
    usage: "bun lint"
    coverage: "90% of quality issues"

  serena_mcp:
    purpose: "Semantic codebase search and pattern analysis"
    performance: "Deep contextual understanding"
    usage: "Mandatory for codebase search (NOT native tools)"
    coverage: "Error pattern analysis across codebase"

  typescript:
    purpose: "Type safety and strict mode enforcement"
    performance: "Native Bun integration"
    usage: "bun type-check"
    coverage: "Type errors and interface violations"

  biome:
    purpose: "Code formatting and style consistency"
    performance: "Ultra-fast formatting"
    usage: "bun format"
    coverage: "10% formatting issues"
```

### **1.2 Error Detection Workflow**

```bash
# Step 1: Run comprehensive quality checks
bun quality              # All quality gates
bun lint                 # OXLint 50-100x faster validation
bun type-check          # TypeScript strict mode
bun format:check        # Biome formatting validation

# Step 2: Use Serena MCP for pattern analysis
# Search for error patterns across codebase
# Example: Find all instances of a specific error pattern
# serena_mcp.search_for_pattern(pattern="error_pattern", context_lines=5)

# Step 3: Analyze error distribution
# Identify hotspots and recurring patterns
# Group errors by category and severity
```

### **1.3 Error Cataloging Template**

```yaml
ERROR_CATALOG_ENTRY:
  error_id: "Unique identifier (e.g., QC-001)"
  timestamp: "Detection timestamp"

  error_details:
    type: "TypeScript | React | Import | Security | Performance | LGPD"
    severity: "Critical | High | Medium | Low"
    error_code: "Specific error code from tool (e.g., TS2345, react/no-array-index-key)"
    message: "Full error message from tool"

  location:
    file_path: "Relative path from project root"
    line_number: "Specific line number"
    column_number: "Column position"
    code_snippet: "Surrounding code context (5 lines before/after)"

  context:
    component_name: "Affected component/module"
    feature_area: "Feature domain (e.g., patient-management, appointments)"
    dependencies: "Related files or modules affected"

  impact_assessment:
    functionality_impact: "Does it break functionality?"
    security_impact: "Does it introduce security risks?"
    compliance_impact: "Does it violate LGPD/ANVISA/CFM?"
    performance_impact: "Does it affect performance?"

  classification:
    category: "Code Quality | Security | Compliance | Performance | Testing"
    priority: "P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)"
    healthcare_related: "Boolean - affects patient data or clinical workflows"
```

### **1.4 Error Categories & Severity Classification**

```yaml
ERROR_CATEGORIES:
  code_quality_type_safety:
    severity_critical:
      - "TypeScript strict mode violations with any types"
      - "Missing type definitions for patient data"
      - "Unsafe type assertions in healthcare contexts"
    severity_high:
      - "Type mismatches in API contracts"
      - "Missing null checks for critical data"
      - "Incorrect generic type usage"
    severity_medium:
      - "Implicit any types in non-critical code"
      - "Missing return type annotations"
      - "Inconsistent type naming"
    severity_low:
      - "Optional type improvements"
      - "Type alias vs interface preferences"

  security_lgpd_compliance:
    severity_critical:
      - "Patient data exposure without encryption"
      - "Missing LGPD consent validation"
      - "SQL injection vulnerabilities"
      - "Authentication bypass possibilities"
    severity_high:
      - "Insecure data handling patterns"
      - "Missing input sanitization"
      - "Weak session management"
      - "Audit logging gaps for patient data"
    severity_medium:
      - "Incomplete error handling"
      - "Missing rate limiting"
      - "Weak password policies"
    severity_low:
      - "Security header improvements"
      - "CORS configuration optimization"

  performance_bundle_issues:
    severity_critical:
      - "Memory leaks in patient data handling"
      - "Blocking operations in critical paths"
      - "Excessive bundle size (>500KB)"
    severity_high:
      - "Inefficient database queries"
      - "Missing code splitting"
      - "Unoptimized images/assets"
    severity_medium:
      - "Suboptimal React rendering"
      - "Missing lazy loading"
      - "Inefficient state management"
    severity_low:
      - "Minor optimization opportunities"
      - "Bundle size improvements"

  testing_coverage:
    severity_critical:
      - "Zero test coverage for patient data handling"
      - "Missing security tests for authentication"
      - "No E2E tests for critical workflows"
    severity_high:
      - "Test coverage <90% for critical components"
      - "Missing integration tests for APIs"
      - "Flaky tests in CI/CD pipeline"
    severity_medium:
      - "Test coverage <80% for standard components"
      - "Missing edge case tests"
      - "Poor test assertions"
    severity_low:
      - "Test organization improvements"
      - "Test performance optimization"
```

### **1.5 Project Diagnostics Integration**

**Objective**: Implement comprehensive project-wide diagnostics using Serena MCP, Zed Context, and native diagnostic tools for complete code quality coverage.

#### **1.5.1 Diagnostic Tools Integration**

```yaml
PROJECT_DIAGNOSTICS_SUITE:
  primary_tools:
    - name: "Serena MCP"
      purpose: "Semantic code analysis and symbol resolution"
      capabilities: ["error detection", "symbol tracking", "dependency analysis"]
      priority: 1
    
    - name: "Zed Context"
      purpose: "Real-time code validation and IDE integration"
      capabilities: ["live diagnostics", "context-aware suggestions", "instant feedback"]
      priority: 2
    
    - name: "Native Diagnostics"
      purpose: "Comprehensive project-wide error scanning"
      capabilities: ["type checking", "linting", "compilation errors"]
      priority: 3
```

#### **1.5.2 Comprehensive Diagnostic Workflow**

```yaml
DIAGNOSTIC_WORKFLOW:
  phase_1_initial_scan:
    action: "Run comprehensive project diagnostics"
    tools: ["diagnostics", "serena_mcp", "zed_context"]
    commands:
      - "diagnostics"  # Project-wide scan
      - "serena_mcp.search_for_pattern(pattern='.*')"  # Full codebase analysis
    output: "Complete error catalog with severity classification"
    
  phase_2_categorization:
    action: "Categorize and prioritize detected issues"
    tools: ["sequential_thinking", "analysis"]
    criteria:
      - "Critical: Breaking errors that prevent compilation/execution"
      - "High: Type safety and security vulnerabilities"
      - "Medium: Code quality and performance issues" 
      - "Low: Style and optimization suggestions"
    output: "Prioritized error resolution plan"
    
  phase_3_zed_integration:
    action: "Configure Zed Context for real-time validation"
    tools: ["zed_context", "configuration"]
    setup:
      - "Enable real-time diagnostics"
      - "Configure error highlighting"
      - "Set up auto-fix suggestions"
    output: "Continuous monitoring environment"
    
  phase_4_monitoring:
    action: "Establish continuous diagnostic monitoring"
    tools: ["automated_checks", "quality_gates"]
    frequency: "On file change + pre-commit validation"
    output: "Ongoing quality assurance"
```

#### **1.5.3 Zed Context Integration Setup**

```yaml
ZED_CONTEXT_CONFIG:
  real_time_diagnostics:
    enabled: true
    check_on_save: true
    check_on_focus: false
    
  error_categories:
    typescript_errors: 
      enabled: true
      severity: "critical"
      auto_fix: false
    
    linting_issues:
      enabled: true
      severity: "medium"
      auto_fix: true
      
    performance_warnings:
      enabled: true
      severity: "low"
      auto_fix: false
      
  integration_points:
    serena_mcp:
      enabled: true
      features: ["symbol_navigation", "error_context"]
      
    quality_gates:
      enabled: true
      blocking_errors: ["typescript_errors", "security_issues"]
```

#### **1.5.4 Diagnostic Error Catalog Template**

```yaml
PROJECT_ERROR_CATALOG:
  error_id: "PROJECT-XXX"
  detection_source: "serena_mcp|zed_context|native_diagnostics"
  
  error_details:
    type: "typescript_error|security_vulnerability|performance_issue|code_quality"
    severity: "critical|high|medium|low"
    auto_fixable: true|false
    impact_scope: "file|component|module|project"
    
  location_details:
    file_path: "exact file location"
    line_range: "start_line-end_line"
    column_range: "start_col-end_col"
    context_lines: "surrounding code context"
    affected_symbols: "functions/variables/types affected"
    
  diagnostic_context:
    zed_context_data: "IDE-specific information if available"
    serena_analysis: "Semantic analysis results"
    compilation_output: "Build/runtime error details"
    
  resolution_tracking:
    fix_method: "manual|automated|refactor_required"
    estimated_effort: "minutes|hours|days"
    dependencies: "other errors or components that block resolution"
    rollback_plan: "how to revert if fix causes issues"
    
  quality_metrics:
    complexity_impact: "cyclomatic complexity change"
    coverage_impact: "test coverage impact"
    performance_impact: "execution time impact"
```

#### **1.5.5 Serena MCP Diagnostic Commands**

```yaml
SERENA_DIAGNOSTIC_COMMANDS:
  comprehensive_scan:
    command: "serena_mcp.search_for_pattern(pattern='.*')"
    purpose: "Full codebase semantic analysis"
    output: "All potential issues and improvements"
    
  error_context_analysis:
    command: "serena_mcp.find_symbol(name_path='{error_function}')"
    purpose: "Get detailed context for specific errors"
    output: "Function usage, dependencies, and impact analysis"
    
  dependency_validation:
    command: "serena_mcp.find_referencing_symbols(symbol='{component}')"
    purpose: "Validate component dependencies"
    output: "All references and potential breaking changes"
    
  security_scan:
    command: "serena_mcp.search_for_pattern(pattern='(eval|innerHTML|dangerouslySetInnerHTML|Function.*constructor)')"
    purpose: "Identify security vulnerabilities"
    output: "All potential security risks"
    
  type_safety_check:
    command: "serena_mcp.search_for_pattern(pattern=':\\s*any|as\\s+any|@ts-ignore')"
    purpose: "Find type safety violations"
    output: "All type safety issues"
```

#### **1.5.6 Diagnostic Quality Gates**

```yaml
DIAGNOSTIC_QUALITY_GATES:
  gate_1_critical_errors:
    threshold: "0 critical errors"
    blocking: true
    check_command: "diagnostics --filter=error"
    
  gate_2_type_safety:
    threshold: "0 type errors"
    blocking: true
    check_command: "diagnostics --filter=typescript"
    
  gate_3_security_issues:
    threshold: "0 high/critical security issues"
    blocking: true
    check_command: "serena_mcp.search_for_pattern(pattern='(eval|innerHTML)')"
    
  gate_4_performance_impact:
    threshold: "< 5 performance warnings"
    blocking: false
    check_command: "diagnostics --filter=performance"
    
  gate_5_code_quality:
    threshold: "< 10 medium/low quality issues"
    blocking: false
    check_command: "diagnostics --filter=quality"
```

#### **1.5.7 Diagnostics → Validation Bridge**

**Goal**: Turn diagnostics findings into actionable validation runs and E2E proof that the errors are resolved (aligned with `ultimate_validate_command`).

```yaml
DIAGNOSTICS_TO_VALIDATION:
  step_0_workflows:
    action: "Map documented user journeys (docs/README/agents) into E2E scenarios before touching code"
    output: "Workflow catalog with success/failure paths tied to features"

  step_1_intake:
    action: "Ingest diagnostics output into PROJECT_ERROR_CATALOG with source tags (diagnostics|serena|zed)"
    output: "Annotated catalog entries with affected symbols and severity"

  step_2_pattern_alignment:
    action: "Run codebase-analyst patterns to see how similar fixes are implemented and validated"
    tools: ["serena_mcp", "codebase-analyst playbook"]
    output: "Preferred fix/validation patterns per area (routing, data, UI, auth)"

  step_3_validation_plan:
    action: "For each error ID, define validation tracks"
    tracks:
      lint_type: "lint/type-check commands already in package scripts (reuse, do not invent)"
      tests: "unit/integration commands (Vitest/Playwright) covering the impacted symbols"
      e2e_levels:
        - "Internal API correctness (adapters, handlers)"
        - "External integration behavior (CLI/API calls to third parties)"
        - "Complete user journey from docs (happy + failure paths)"
    output: "Per-error validation steps attached to atomic tasks"

  step_3b_validator_handoff:
    action: "Engage @validator to craft minimal tests for the changed surface area"
    inputs: "Changed files/components/functions, expected behavior, mock vs real deps, commands to run"
    output: "3-5 focused tests per feature (happy path + critical edges) ready to execute"

  step_4_command_sync:
    action: "Update `.claude/commands/validate.md` to reflect current diagnostics, workflows, and available scripts"
    note: "Only list commands that exist in package scripts/tooling; link E2E scenarios to Step 0 catalog"

  step_5_execution_record:
    action: "Record command outputs and artifacts (logs, screenshots) back into catalog and knowledge base"
    output: "Evidence that each diagnostic issue was validated and closed"
```

### **1.6 Serena MCP Search Patterns for Error Analysis**

```yaml
SERENA_SEARCH_PATTERNS:
  find_security_vulnerabilities:
    pattern: "SQL injection patterns, XSS vulnerabilities, auth bypasses"
    usage: "serena_mcp.search_for_pattern(pattern='eval\\(|innerHTML|dangerouslySetInnerHTML')"

  find_lgpd_violations:
    pattern: "Patient data without encryption, missing consent checks"
    usage: "serena_mcp.search_for_pattern(pattern='patient.*data.*(?!encrypt)')"

  find_type_safety_issues:
    pattern: "any types, type assertions, missing type definitions"
    usage: "serena_mcp.search_for_pattern(pattern=':\\s*any|as\\s+any')"

  find_performance_issues:
    pattern: "Inefficient loops, missing memoization, blocking operations"
    usage: "serena_mcp.search_for_pattern(pattern='useEffect.*\\[\\]|forEach.*forEach')"

  find_testing_gaps:
    pattern: "Untested functions, missing test files"
    usage: "serena_mcp.find_symbol(name_path='function', exclude_kinds=[test])"
```

---

## 🔬 PHASE 2: Research-Driven Solution Planning

**Objective**: Leverage authoritative sources and best practices to develop research-backed solutions for identified quality issues.

### **2.1 Research Methodology Integration**

This phase integrates the comprehensive research methodology from `research.md` and the apex-researcher agent patterns to ensure all solutions are based on authoritative sources.

```yaml
RESEARCH_WORKFLOW:
  step_1_context_analysis:
    action: "Understand the error context and implications"
    tools: ["Sequential Thinking", "Serena MCP"]
    output: "Comprehensive error context analysis"

  step_2_source_discovery:
    action: "Search authoritative documentation and best practices"
    tools: ["Archon RAG", "Context7 MCP", "Tavily MCP"]
    output: "Relevant documentation and solution patterns"

  step_3_multi_source_validation:
    action: "Cross-reference findings across multiple sources"
    tools: ["apex-researcher", "Sequential Thinking"]
    output: "Validated solution approaches with confidence levels"

  step_4_constitutional_review:
    action: "Ensure compliance with project standards and healthcare regulations"
    tools: ["Constitutional Analysis", "LGPD Validation"]
    output: "Compliance-validated solution recommendations"

  step_5_knowledge_integration:
    action: "Document findings in knowledge base for future reference"
    tools: ["Archon Knowledge Management", "Desktop Commander"]
    output: "Persistent knowledge artifacts"
```

### **2.2 Apex-Researcher Agent Integration**

The apex-researcher agent provides comprehensive research capabilities with multi-source validation and knowledge management.

```yaml
APEX_RESEARCHER_CAPABILITIES:
  research_intelligence_chain:
    - "Context Analysis → Understanding error scope and implications"
    - "Source Discovery → Archon RAG → Context7 → Tavily intelligence chain"
    - "Multi-Source Validation → Cross-reference findings for accuracy"
    - "Sequential Synthesis → Multi-perspective analysis and critical evaluation"
    - "Constitutional Review → Ethical and compliance validation"
    - "Knowledge Integration → Persistent knowledge base creation"

  research_depth_levels:
    L1_L2_basic:
      approach: "Single authoritative source with basic validation"
      tools: "Archon RAG + Context7"
      use_case: "Simple linting errors, formatting issues"

    L3_L4_enhanced:
      approach: "Multi-source validation with expert consensus"
      tools: "Archon RAG → Context7 → Tavily"
      use_case: "Type safety issues, React patterns, import optimization"

    L5_L6_comprehensive:
      approach: "Comprehensive analysis with constitutional review"
      tools: "Full chain: Archon → Context7 → Tavily → Sequential Thinking"
      use_case: "Security vulnerabilities, LGPD compliance, architecture decisions"

    L7_L10_critical:
      approach: "Exhaustive research with adversarial validation"
      tools: "Complete intelligence chain + Knowledge Management"
      use_case: "Critical security issues, healthcare compliance, system architecture"
```

### **2.3 Research Sources by Error Category**

```yaml
RESEARCH_SOURCES:
  typescript_type_safety:
    primary_sources:
      - "TypeScript Official Documentation (typescriptlang.org)"
      - "TypeScript Deep Dive (basarat.gitbook.io)"
      - "React TypeScript Cheatsheet (react-typescript-cheatsheet.netlify.app)"
    search_strategy: "Context7 → TypeScript docs → React TypeScript patterns"
    validation: "Official documentation + community best practices"

  react_patterns:
    primary_sources:
      - "React Official Documentation (react.dev)"
      - "React 19 Release Notes and Migration Guide"
      - "TanStack Query v5 Documentation"
      - "TanStack Router v5 Documentation"
    search_strategy: "Context7 → React docs → TanStack ecosystem"
    validation: "Official docs + framework-specific patterns"

  security_lgpd:
    primary_sources:
      - "OWASP Top 10 and Security Guidelines"
      - "LGPD Official Documentation (ANPD)"
      - "Supabase Security Best Practices"
      - "ANVISA Aesthetic Clinic Regulations"
    search_strategy: "Context7 → Security standards → Brazilian regulations"
    validation: "Regulatory compliance + security best practices"

  performance_optimization:
    primary_sources:
      - "Web.dev Performance Guidelines"
      - "Vite Performance Optimization"
      - "React Performance Optimization"
      - "Bun Performance Best Practices"
    search_strategy: "Context7 → Performance docs → Framework-specific optimization"
    validation: "Official performance guidelines + benchmarks"

  testing_best_practices:
    primary_sources:
      - "Vitest Documentation"
      - "Playwright Best Practices"
      - "Testing Library Guidelines"
      - "Healthcare Testing Standards"
    search_strategy: "Context7 → Testing frameworks → Healthcare compliance"
    validation: "Testing framework docs + healthcare standards"
```

### **2.4 Research Intelligence Report Template**

```markdown
# Quality Control Research Intelligence Report

## Executive Summary

- **Error ID**: [QC-XXX]
- **Error Category**: [Type Safety | Security | Performance | Testing]
- **Severity**: [Critical | High | Medium | Low]
- **Research Depth**: [L1-L10]
- **Sources Validated**: [Count and types]
- **Confidence Level**: [≥95% required for implementation]

## Error Analysis

### Error Details
- **Location**: [File path, line number]
- **Error Message**: [Full error message]
- **Context**: [Code snippet with surrounding context]
- **Impact**: [Functionality, security, compliance, performance]

### Root Cause Analysis
- **Primary Cause**: [Detailed explanation]
- **Contributing Factors**: [Additional factors]
- **Pattern Analysis**: [Is this a recurring pattern?]

## Multi-Source Research Findings

### Context7 (Official Documentation)
- **Framework Guidelines**: [Official recommendations]
- **Best Practices**: [Documented best practices]
- **Security Considerations**: [Security guidelines]
- **Performance Impact**: [Performance implications]

### Tavily (Community & Market Intelligence)
- **Community Solutions**: [Validated community approaches]
- **Recent Developments**: [Latest updates and considerations]
- **Common Pitfalls**: [Known issues and gotchas]

### Archon (Project Knowledge Base)
- **Previous Solutions**: [Similar issues resolved in project]
- **Project Patterns**: [Established project conventions]
- **Lessons Learned**: [Historical context]

## Solution Recommendations

### Primary Solution
- **Approach**: [Detailed solution approach]
- **Rationale**: [Why this solution is recommended]
- **Implementation Steps**: [High-level steps]
- **Expected Outcome**: [What will be fixed]
- **Confidence Level**: [Percentage with justification]

### Alternative Solutions
1. **Alternative 1**: [Description, pros/cons, use cases]
2. **Alternative 2**: [Description, pros/cons, use cases]

## Compliance & Risk Assessment

### Healthcare Compliance
- **LGPD Impact**: [Data protection considerations]
- **ANVISA Impact**: [Regulatory considerations]
- **Security Impact**: [Security implications]

### Risk Analysis
- **Implementation Risks**: [Potential risks]
- **Mitigation Strategies**: [How to mitigate risks]
- **Rollback Plan**: [How to revert if needed]

## Knowledge Base Integration

- **Knowledge Article Created**: [Link to knowledge base entry]
- **Related Articles**: [Cross-references]
- **Learning Pathway**: [Where this fits in learning progression]

## Implementation Readiness

- **Prerequisites**: [What needs to be in place]
- **Dependencies**: [Related changes needed]
- **Testing Requirements**: [How to validate the fix]
- **Documentation Updates**: [What docs need updating]

## References

- **Official Documentation**: [Links to authoritative sources]
- **Community Resources**: [Validated community resources]
- **Project Standards**: [Internal documentation references]
```

---

## 🎯 PHASE 3: Atomic Task Decomposition

**Objective**: Break down each quality issue into detailed, actionable atomic subtasks with clear implementation guidance and validation criteria.

### **3.1 Atomic Task Template**

Each quality issue should be decomposed into atomic subtasks using this comprehensive template:

```yaml
ATOMIC_TASK_TEMPLATE:
  task_metadata:
    task_id: "QC-XXX-T1 (Quality Control - Error ID - Task Number)"
    parent_error_id: "QC-XXX"
    task_name: "Descriptive task name (max 60 chars)"
    estimated_time: "Time estimate in minutes (20 min = 1 professional unit)"
    priority: "P0 | P1 | P2 | P3"

  error_context:
    error_description: "Clear description of the specific error"
    error_location: "File path, line number, code snippet"
    error_impact: "What breaks or is affected by this error"
    related_errors: "Other errors that must be fixed together"

  research_backed_solution:
    solution_approach: "Detailed solution based on research findings"
    authoritative_sources: "Links to official documentation used"
    best_practices: "Relevant best practices from research"
    code_examples: "Example implementations from documentation"
    confidence_level: "Percentage (must be ≥85% to proceed)"

  implementation_steps:
    step_1:
      action: "Specific action to take"
      command: "Exact command or code change"
      expected_result: "What should happen"
      validation: "How to verify this step worked"

    step_2:
      action: "Next specific action"
      command: "Exact command or code change"
      expected_result: "What should happen"
      validation: "How to verify this step worked"

    # Continue for all steps...

  validation_criteria:
    functional_validation:
      - "Specific functionality to test"
      - "Expected behavior after fix"
      - "Edge cases to verify"

    quality_validation:
      - "OXLint passes with zero errors for this issue"
      - "TypeScript type checking passes"
      - "No new warnings introduced"

    compliance_validation:
      - "LGPD compliance maintained (if applicable)"
      - "Security standards upheld"
      - "Healthcare regulations followed"

    performance_validation:
      - "No performance degradation"
      - "Bundle size impact acceptable"
      - "Core Web Vitals maintained"

  testing_requirements:
    unit_tests:
      - "Specific unit tests to write/update"
      - "Test coverage target (≥90% for critical)"

    integration_tests:
      - "Integration tests needed"
      - "API contract validation"

    e2e_tests:
      - "End-to-end scenarios to test"
      - "User workflow validation"

  risk_assessment:
    implementation_risks:
      risk_1:
        description: "Potential risk description"
        likelihood: "High | Medium | Low"
        impact: "Critical | High | Medium | Low"
        mitigation: "How to prevent or minimize this risk"

    breaking_changes:
      - "List any breaking changes"
      - "Migration path if needed"

    dependencies:
      - "Other tasks that must be completed first"
      - "Tasks that depend on this one"

  rollback_procedure:
    rollback_steps:
      - "Step-by-step rollback instructions"
      - "How to verify rollback success"

    rollback_validation:
      - "Tests to run after rollback"
      - "System state verification"

  healthcare_compliance:
    lgpd_impact: "Does this affect patient data handling?"
    anvisa_impact: "Does this affect medical device compliance?"
    security_impact: "Does this affect security posture?"
    audit_requirements: "What audit trail is needed?"

  documentation_updates:
    code_comments: "Inline documentation needed"
    api_documentation: "API docs to update"
    knowledge_base: "Knowledge base articles to create/update"
    changelog: "Changelog entry"
```

### **3.2 Task Decomposition Strategy**

```yaml
DECOMPOSITION_PRINCIPLES:
  atomic_unit_definition:
    - "Each task represents ~20 minutes of professional developer time"
    - "Task is independently testable and verifiable"
    - "Task has clear success criteria"
    - "Task can be rolled back independently"

  task_granularity_guidelines:
    too_large:
      - "Task takes >30 minutes to complete"
      - "Task affects multiple unrelated components"
      - "Task has multiple validation criteria"
      - "Solution: Break into smaller subtasks"

    appropriate:
      - "Task takes 15-25 minutes to complete"
      - "Task has single, clear objective"
      - "Task has specific validation criteria"
      - "Task can be completed in one session"

    too_small:
      - "Task takes <5 minutes to complete"
      - "Task is a single line change"
      - "Task has no independent value"
      - "Solution: Combine with related tasks"

  task_sequencing:
    parallel_tasks:
      - "Tasks with no dependencies can run in parallel"
      - "Independent error fixes in different files"
      - "Non-conflicting code changes"

    sequential_tasks:
      - "Tasks with dependencies must be ordered"
      - "Foundation changes before dependent changes"
      - "Type definitions before implementations"

    batched_tasks:
      - "Similar tasks can be batched for efficiency"
      - "All formatting fixes in one batch"
      - "All import organization in one batch"
```

### **3.3 Example: Atomic Task Decomposition**

**Scenario**: TypeScript error - "Property 'patientId' does not exist on type 'Appointment'"

```yaml
EXAMPLE_DECOMPOSITION:
  parent_error:
    error_id: "QC-042"
    error_type: "TypeScript Type Safety"
    severity: "High"
    location: "apps/web/src/features/appointments/components/AppointmentCard.tsx:45"

  atomic_tasks:
    task_1:
      task_id: "QC-042-T1"
      name: "Research TypeScript interface best practices for appointments"
      estimated_time: "15 minutes"
      steps:
        - "Use Context7 to search TypeScript documentation for interface patterns"
        - "Use Serena MCP to find existing Appointment type definitions"
        - "Review project type standards in packages/types"
        - "Document findings in research report"
      validation:
        - "Research report created with ≥95% confidence"
        - "Authoritative sources documented"
        - "Project patterns identified"

    task_2:
      task_id: "QC-042-T2"
      name: "Update Appointment interface to include patientId"
      estimated_time: "20 minutes"
      dependencies: ["QC-042-T1"]
      steps:
        - "Open packages/types/src/appointment.ts"
        - "Add patientId: string to Appointment interface"
        - "Add JSDoc documentation for patientId field"
        - "Ensure LGPD compliance for patient data reference"
        - "Run bun type-check to verify no new errors"
      validation:
        - "TypeScript compilation succeeds"
        - "No new type errors introduced"
        - "Interface properly documented"

    task_3:
      task_id: "QC-042-T3"
      name: "Update AppointmentCard component to use patientId"
      estimated_time: "15 minutes"
      dependencies: ["QC-042-T2"]
      steps:
        - "Update AppointmentCard.tsx to use appointment.patientId"
        - "Add null check for patientId (defensive programming)"
        - "Update component tests to include patientId"
        - "Run bun test to verify tests pass"
      validation:
        - "Component compiles without errors"
        - "Tests pass with ≥90% coverage"
        - "No runtime errors in development"

    task_4:
      task_id: "QC-042-T4"
      name: "Validate fix across codebase"
      estimated_time: "10 minutes"
      dependencies: ["QC-042-T3"]
      steps:
        - "Use Serena MCP to find all Appointment type usages"
        - "Verify no other components are broken"
        - "Run full test suite: bun test"
        - "Run E2E tests for appointment workflows"
      validation:
        - "All tests pass"
        - "No new errors introduced"
        - "E2E workflows function correctly"
```

---

## ⚡ PHASE 4: Systematic Execution

**Objective**: Implement fixes systematically with continuous validation, healthcare compliance verification, and quality gates enforcement.

### **4.1 Execution Workflow**

**CRITICAL RULE**: Only begin implementation after completing Phases 1-3 (Detection → Research → Planning)

```yaml
EXECUTION_WORKFLOW:
  pre_execution_checklist:
    - "✅ All errors cataloged with severity classification"
    - "✅ Research completed with ≥95% confidence"
    - "✅ Atomic tasks created with detailed implementation steps"
    - "✅ Risk assessment completed for all tasks"
    - "✅ Rollback procedures documented"

  execution_phases:
    phase_4a_preparation:
      - "Review all atomic tasks and dependencies"
      - "Identify parallel vs sequential tasks"
      - "Set up task tracking in Archon and Augment"
      - "Create feature branch for quality fixes"

    phase_4b_implementation:
      - "Execute tasks in dependency order"
      - "Follow implementation steps exactly as documented"
      - "Validate each step before proceeding"
      - "Update task status continuously"

    phase_4c_validation:
      - "Run validation criteria for each task"
      - "Execute quality gates after each task"
      - "Verify healthcare compliance"
      - "Document any deviations or issues"

    phase_4d_integration:
      - "Integrate all fixes into main branch"
      - "Run comprehensive test suite"
      - "Verify no regressions introduced"
      - "Update documentation and knowledge base"
```

### **4.1.1 Validator Agent Integration (lightweight tests)**

- **Trigger**: After implementing atomic tasks and before running full validation gates.
- **Inputs to pass**: What changed (files/components/functions), expected behavior, external dependencies (real vs mocked), and the commands that should run.
- **Scope**: 3-5 simple tests per feature focusing on happy path plus critical edge cases; avoid over-engineering.
- **Execution**:
  - Ask **@validator** to design minimal unit/integration tests using existing project frameworks (Vitest/Playwright) and patterns from the codebase-analyst report.
  - Run targeted commands (`bun test <pattern>` or `bun test`) and attach outputs to the error catalog entry.
- **Checklist**:
  - Test names describe behavior; cover empty/null/error paths; mock third-party calls when applicable.
  - Tests stay readable and avoid re-testing library internals.
  - Capture a short validation summary (tests created, command run, pass/fail) and link it in the catalog/knowledge base.

### **4.2 Implementation Commands (Bun-Optimized)**

```bash
# Pre-Implementation Setup
git checkout -b quality-control/QC-XXX-batch
bun install                    # Ensure dependencies are current

# Step 1: Identify Issues (Already completed in Phase 1)
diagnostics                   # Run comprehensive project diagnostics
bun quality                    # Verify current state
bun lint                       # OXLint 50-100x faster validation
bun type-check                 # TypeScript strict mode
bun format:check               # Biome formatting validation

# Project-Specific Diagnostics
diagnostics --filter=error      # Show only critical errors
diagnostics --filter=warning   # Show warnings and above
diagnostics --filter=all       # Show all diagnostic issues

# Step 2: Execute Atomic Tasks (Following Phase 3 plan)
# For each atomic task:
# - Follow implementation steps exactly
# - Validate each step
# - Update task status

# Example: Implementing QC-042-T2 (Update Appointment interface)
# 1. Open file
code packages/types/src/appointment.ts

# 2. Make changes (using Desktop Commander for file operations)
# desktop_commander.edit_block(
#   file_path="packages/types/src/appointment.ts",
#   old_string="interface Appointment {",
#   new_string="interface Appointment {\n  patientId: string; // LGPD: Patient identifier reference"
# )

# 3. Validate step
bun type-check                 # Verify no new errors
bun lint                       # Verify linting passes
diagnostics                   # Verify project diagnostics are clean

# Step 3: Continuous Validation (After each task)
bun quality                    # Re-run quality checks
diagnostics                   # Verify project diagnostics status
bun test                       # Run affected tests (3-5x faster)
bun test:coverage              # Verify coverage maintained

# Step 4: Final Validation (After all tasks)
bun quality                    # Full quality check
diagnostics                   # Final project diagnostics validation
bun test                       # Complete test suite
bun test:e2e                   # E2E validation
bun type-check                 # Final type check

# Step 5: Integration
git add .
git commit -m "fix(quality): QC-XXX - [descriptive message]"
git push origin quality-control/QC-XXX-batch
```

### **4.3 Quality Gates Enforcement**

```yaml
QUALITY_GATES:
  gate_1_syntax_validation:
    tools: ["TypeScript", "OXLint", "Biome"]
    threshold: "Zero errors"
    command: "bun type-check && bun lint && bun format:check"
    blocking: true

  gate_2_test_validation:
    tools: ["Vitest", "Playwright"]
    threshold: "100% pass rate, ≥90% coverage for critical"
    command: "bun test && bun test:coverage"
    blocking: true

  gate_3_security_validation:
    tools: ["OXLint Security Rules", "Dependency Audit"]
    threshold: "Zero high-severity vulnerabilities"
    command: "bun lint:security && bunx audit"
    blocking: true

  gate_4_compliance_validation:
    tools: ["LGPD Validator", "ANVISA Checker"]
    threshold: "Full compliance"
    command: "bun validate:lgpd && bun validate:anvisa"
    blocking: true

  gate_5_performance_validation:
    tools: ["Bundle Analyzer", "Performance Tests"]
    threshold: "No degradation in Core Web Vitals"
    command: "bun analyze:bundle && bun test:performance"
    blocking: false
    warning_only: true

  gate_6_diagnostics_validation:
    tools: ["Native Diagnostics", "Zed Context", "Serena MCP"]
    threshold: "Zero diagnostic errors"
    command: "diagnostics && zed_context_validate"
    blocking: true

  gate_7_zed_integration:
    tools: ["Zed Context", "Real-time Validation"]
    threshold: "Real-time diagnostics enabled"
    command: "zed_context_check && diagnostics --filter=error"
    blocking: false
    warning_only: true
```

### **4.4 Validation Checklist**

```yaml
POST_IMPLEMENTATION_VALIDATION:
  functional_validation:
    - "✅ All identified errors are resolved"
    - "✅ No new errors introduced"
    - "✅ Existing functionality preserved"
    - "✅ Edge cases handled correctly"

  quality_validation:
    - "✅ OXLint passes with zero errors"
    - "✅ TypeScript strict mode passes"
    - "✅ Code formatting consistent (Biome)"
    - "✅ No code duplication introduced"

  testing_validation:
    - "✅ All tests pass (unit, integration, E2E)"
    - "✅ Test coverage ≥90% for critical components"
    - "✅ No flaky tests introduced"
    - "✅ Performance tests pass"

  compliance_validation:
    - "✅ LGPD compliance maintained"
    - "✅ Patient data protection verified"
    - "✅ Audit logging functional"
    - "✅ Security standards upheld"

  performance_validation:
    - "✅ Core Web Vitals maintained (LCP ≤2.0s, INP ≤150ms, CLS ≤0.05)"
    - "✅ Bundle size acceptable (<500KB critical path)"
    - "✅ API response times ≤200ms"
    - "✅ Database queries ≤100ms"

  documentation_validation:
    - "✅ Code comments added where needed"
    - "✅ API documentation updated"
    - "✅ Knowledge base articles created"
    - "✅ Changelog updated"
```

### **4.5 Rollback Procedures**

```bash
# If validation fails, execute rollback immediately

# Step 1: Assess rollback scope
# - Identify which tasks need to be rolled back
# - Check for dependencies

# Step 2: Execute rollback
git checkout main
git branch -D quality-control/QC-XXX-batch

# Step 3: Verify system state
bun quality                    # Verify original state restored
bun test                       # Verify tests pass
bun test:e2e                   # Verify E2E workflows

# Step 4: Document rollback
# - Update task status in Archon
# - Document reason for rollback
# - Create new research task if needed

# Step 5: Re-plan if necessary
# - Review what went wrong
# - Update research findings
# - Revise atomic tasks
# - Re-execute with improved plan
```

---

## 📚 COMPREHENSIVE EXAMPLES

### **Example 1: Complete Workflow - TypeScript Type Safety Issue**

**Scenario**: Multiple TypeScript errors related to missing type definitions for patient data

#### Phase 1: Error Detection & Analysis

```yaml
ERROR_CATALOG:
  error_1:
    error_id: "QC-101"
    type: "TypeScript Type Safety"
    severity: "Critical"
    error_code: "TS2339"
    message: "Property 'cpf' does not exist on type 'Patient'"
    location:
      file: "apps/web/src/features/patients/components/PatientForm.tsx"
      line: 67
      snippet: "const cpf = patient.cpf; // Error here"
    impact:
      functionality: "Patient registration form broken"
      security: "No direct security impact"
      compliance: "LGPD compliance affected - CPF is sensitive data"
      performance: "No performance impact"
    classification:
      category: "Code Quality"
      priority: "P0 (Critical)"
      healthcare_related: true

  error_2:
    error_id: "QC-102"
    type: "TypeScript Type Safety"
    severity: "Critical"
    error_code: "TS2339"
    message: "Property 'lgpdConsent' does not exist on type 'Patient'"
    location:
      file: "apps/web/src/features/patients/hooks/usePatientConsent.ts"
      line: 23
      snippet: "if (!patient.lgpdConsent) { // Error here"
    impact:
      functionality: "LGPD consent validation broken"
      security: "Critical - consent validation bypassed"
      compliance: "LGPD violation - consent not tracked"
      performance: "No performance impact"
    classification:
      category: "Security & Compliance"
      priority: "P0 (Critical)"
      healthcare_related: true
```

#### Phase 2: Research-Driven Solution Planning

```markdown
# Research Intelligence Report: QC-101 & QC-102

## Executive Summary
- **Error IDs**: QC-101, QC-102
- **Category**: TypeScript Type Safety + LGPD Compliance
- **Severity**: Critical (P0)
- **Research Depth**: L6 (Comprehensive with constitutional review)
- **Sources Validated**: 5 (TypeScript docs, LGPD guidelines, project standards)
- **Confidence Level**: 98%

## Multi-Source Research Findings

### Context7 (TypeScript Documentation)
- **Interface Best Practices**: Use interfaces for object shapes, types for unions
- **LGPD Data Handling**: Sensitive data should have explicit type annotations
- **Readonly Properties**: Consider readonly for immutable patient data
- **Documentation**: Use JSDoc for LGPD-sensitive fields

### Tavily (LGPD Community Practices)
- **CPF Handling**: CPF should be stored encrypted, typed as string
- **Consent Management**: Consent should include timestamp, IP, device info
- **Audit Requirements**: All patient data access must be logged

### Archon (Project Knowledge Base)
- **Existing Pattern**: packages/types/src/patient.ts has base Patient interface
- **Project Standard**: All LGPD fields must have JSDoc with compliance notes
- **Naming Convention**: Use camelCase for all TypeScript interfaces

## Solution Recommendations

### Primary Solution
**Approach**: Extend Patient interface with missing LGPD-compliant fields

**Rationale**:
- Maintains existing project patterns
- Ensures type safety across codebase
- Enforces LGPD compliance at type level
- Provides clear documentation for developers

**Implementation Steps**:
1. Update Patient interface in packages/types/src/patient.ts
2. Add cpf field with LGPD documentation
3. Add lgpdConsent object with required fields
4. Update all patient-related components
5. Add validation tests for LGPD compliance

**Confidence Level**: 98% (based on official TypeScript docs + LGPD requirements)

## Compliance & Risk Assessment

### LGPD Compliance
- **Data Protection**: CPF must be encrypted at rest and in transit
- **Consent Management**: Explicit consent required before data collection
- **Audit Trail**: All access to patient data must be logged
- **Right to Erasure**: Patient data must be deletable on request

### Risk Analysis
- **Implementation Risk**: Low - straightforward interface extension
- **Breaking Change Risk**: Medium - existing code may need updates
- **Mitigation**: Use TypeScript compiler to find all affected locations
```

#### Phase 3: Atomic Task Decomposition

```yaml
ATOMIC_TASKS:
  task_1:
    task_id: "QC-101-T1"
    name: "Update Patient interface with LGPD-compliant fields"
    estimated_time: "25 minutes"
    priority: "P0"

    implementation_steps:
      step_1:
        action: "Open Patient interface file"
        command: "code packages/types/src/patient.ts"
        expected_result: "File opens in editor"
        validation: "File is accessible"

      step_2:
        action: "Add cpf field with LGPD documentation"
        command: |
          Add to Patient interface:
          /**
           * CPF (Cadastro de Pessoas Físicas) - Brazilian tax ID
           * @lgpd Sensitive personal data - must be encrypted
           * @format XXX.XXX.XXX-XX
           */
          cpf: string;
        expected_result: "cpf field added with documentation"
        validation: "TypeScript compilation succeeds"

      step_3:
        action: "Add lgpdConsent object"
        command: |
          Add to Patient interface:
          /**
           * LGPD consent information
           * @lgpd Required for data processing compliance
           */
          lgpdConsent: {
            timestamp: string;
            ip: string;
            deviceId: string;
            consentType: 'treatment' | 'consent' | 'access' | 'processing';
          };
        expected_result: "lgpdConsent field added"
        validation: "TypeScript compilation succeeds"

    validation_criteria:
      functional: ["Interface compiles without errors"]
      quality: ["JSDoc documentation complete", "LGPD compliance noted"]
      compliance: ["All LGPD fields documented", "Encryption requirements noted"]

    risk_assessment:
      implementation_risks:
        - description: "Existing code may break"
          likelihood: "High"
          impact: "Medium"
          mitigation: "Use TypeScript compiler to find all usages"

  task_2:
    task_id: "QC-101-T2"
    name: "Update PatientForm component to use new fields"
    estimated_time: "20 minutes"
    priority: "P0"
    dependencies: ["QC-101-T1"]

    implementation_steps:
      step_1:
        action: "Update PatientForm to access cpf correctly"
        command: "Update line 67 to use patient.cpf with null check"
        expected_result: "TypeScript error resolved"
        validation: "bun type-check passes"

      step_2:
        action: "Add LGPD consent validation"
        command: "Add consent check before form submission"
        expected_result: "Consent validated before data processing"
        validation: "Form tests pass"

    validation_criteria:
      functional: ["Form submits successfully", "CPF validation works"]
      quality: ["No TypeScript errors", "Code follows project standards"]
      compliance: ["LGPD consent validated", "Audit logging active"]

  task_3:
    task_id: "QC-101-T3"
    name: "Update usePatientConsent hook"
    estimated_time: "15 minutes"
    priority: "P0"
    dependencies: ["QC-101-T1"]

    implementation_steps:
      step_1:
        action: "Update consent check to use lgpdConsent object"
        command: "Update line 23 to access patient.lgpdConsent"
        expected_result: "TypeScript error resolved"
        validation: "bun type-check passes"

    validation_criteria:
      functional: ["Consent validation works correctly"]
      quality: ["No TypeScript errors"]
      compliance: ["LGPD consent properly validated"]
```

#### Phase 4: Systematic Execution

```bash
# Pre-execution checklist completed ✅
# All tasks planned with ≥98% confidence ✅

# Create feature branch
git checkout -b quality-control/QC-101-patient-types

# Execute Task 1: Update Patient interface
# (Using Desktop Commander for file operations)
bun type-check                 # Verify changes compile
bun lint                       # Verify linting passes

# Execute Task 2: Update PatientForm
bun type-check                 # Verify changes compile
bun test packages/web/src/features/patients  # Run affected tests

# Execute Task 3: Update usePatientConsent
bun type-check                 # Verify changes compile
bun test packages/web/src/features/patients  # Run affected tests

# Final validation
bun quality                    # Full quality check
bun test                       # Complete test suite
bun test:e2e                   # E2E validation

# Integration
git add .
git commit -m "fix(types): add LGPD-compliant fields to Patient interface

- Add cpf field with encryption requirements
- Add lgpdConsent object for compliance tracking
- Update PatientForm and usePatientConsent hook
- Ensure LGPD compliance for patient data handling

Fixes: QC-101, QC-102"
git push origin quality-control/QC-101-patient-types
```

### **Example 2: Security Vulnerability - SQL Injection Risk**

**Scenario**: Potential SQL injection vulnerability in patient search

#### Phase 1: Error Detection

```yaml
ERROR_CATALOG:
  error_id: "QC-201"
  type: "Security Vulnerability"
  severity: "Critical"
  error_code: "security/no-sql-injection"
  message: "Potential SQL injection in patient search query"
  location:
    file: "apps/api/src/routes/patients/search.ts"
    line: 34
    snippet: |
      const query = `SELECT * FROM patients WHERE name LIKE '%${searchTerm}%'`;
  impact:
    functionality: "Patient search works but is vulnerable"
    security: "Critical - SQL injection possible"
    compliance: "LGPD violation - unauthorized data access possible"
    performance: "No direct performance impact"
  classification:
    category: "Security"
    priority: "P0 (Critical)"
    healthcare_related: true
```

#### Phase 2: Research

```markdown
# Research Intelligence Report: QC-201

## Executive Summary
- **Error ID**: QC-201
- **Category**: Security Vulnerability (SQL Injection)
- **Severity**: Critical (P0)
- **Research Depth**: L8 (Critical security issue)
- **Sources Validated**: 6 (OWASP, Supabase docs, security best practices)
- **Confidence Level**: 99%

## Multi-Source Research Findings

### Context7 (Supabase Security Documentation)
- **Parameterized Queries**: Always use parameterized queries
- **RLS Policies**: Row Level Security provides additional protection
- **Input Validation**: Validate and sanitize all user inputs
- **Audit Logging**: Log all database access attempts

### Tavily (OWASP Security Guidelines)
- **SQL Injection Prevention**: Use prepared statements exclusively
- **Input Validation**: Whitelist validation for search terms
- **Least Privilege**: Database users should have minimal permissions
- **Security Testing**: Include SQL injection tests in security suite

## Solution Recommendations

### Primary Solution
**Approach**: Replace string concatenation with Supabase parameterized queries

**Rationale**:
- Eliminates SQL injection vulnerability completely
- Maintains existing functionality
- Follows Supabase best practices
- Improves performance with query caching

**Confidence Level**: 99%
```

#### Phase 3: Atomic Tasks

```yaml
ATOMIC_TASKS:
  task_1:
    task_id: "QC-201-T1"
    name: "Replace vulnerable query with parameterized query"
    estimated_time: "20 minutes"
    priority: "P0"

    implementation_steps:
      step_1:
        action: "Replace string concatenation with Supabase query builder"
        command: |
          Replace:
          const query = `SELECT * FROM patients WHERE name LIKE '%${searchTerm}%'`;

          With:
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .ilike('name', `%${searchTerm}%`);
        expected_result: "SQL injection vulnerability eliminated"
        validation: "Security scan passes"

    validation_criteria:
      functional: ["Search functionality works correctly"]
      quality: ["Code follows Supabase best practices"]
      security: ["SQL injection vulnerability eliminated", "Security tests pass"]
      compliance: ["LGPD compliance maintained", "Audit logging active"]
```

---

## 🛠️ TOOL REFERENCE GUIDE

### **MCP Tools for Quality Control**

```yaml
SERENA_MCP:
  purpose: "Semantic codebase search and analysis"
  mandatory: "MUST use instead of native search tools"
  key_functions:
    search_for_pattern:
      usage: "Find error patterns across codebase"
      example: "serena_mcp.search_for_pattern(pattern='any\\s+type', context_lines=5)"
    find_symbol:
      usage: "Find specific symbols and their usages"
      example: "serena_mcp.find_symbol(name_path='Patient', include_body=true)"
    find_referencing_symbols:
      usage: "Find all references to a symbol"
      example: "serena_mcp.find_referencing_symbols(name_path='Patient', relative_path='types')"

CONTEXT7_MCP:
  purpose: "Technical documentation and API references"
  key_functions:
    resolve_library_id:
      usage: "Find library documentation"
      example: "context7.resolve_library_id(library_name='typescript')"
    get_library_docs:
      usage: "Retrieve official documentation"
      example: "context7.get_library_docs(library_id='typescript', query='interface best practices')"

TAVILY_MCP:
  purpose: "Real-time web search and current trends"
  key_functions:
    tavily_search:
      usage: "Search for current information"
      example: "tavily.search(query='React 19 best practices 2025')"
    tavily_extract:
      usage: "Extract content from specific URLs"
      example: "tavily.extract(url='https://react.dev/blog/2024/12/05/react-19')"

ARCHON_MCP:
  purpose: "Knowledge management and task tracking"
  key_functions:
    perform_rag_query:
      usage: "Search project knowledge base"
      example: "archon.perform_rag_query(query='LGPD compliance patterns')"
    create_document:
      usage: "Create knowledge base articles"
      example: "archon.create_document(title='QC-101 Solution', content='...')"
    update_task:
      usage: "Update task status"
      example: "archon.update_task(task_id='QC-101-T1', status='completed')"

DESKTOP_COMMANDER:
  purpose: "File operations and terminal commands"
  mandatory: "MUST use for file edits instead of native tools"
  key_functions:
    edit_block:
      usage: "Surgical code edits"
      example: "desktop_commander.edit_block(file_path='...', old_string='...', new_string='...')"
    start_process:
      usage: "Execute terminal commands"
      example: "desktop_commander.start_process(command='bun test', timeout_ms=30000)"
    search:
      usage: "Search files and content"
      example: "desktop_commander.start_search(path='.', pattern='TODO', searchType='content')"

SEQUENTIAL_THINKING:
  purpose: "Complex problem decomposition and analysis"
  key_functions:
    think:
      usage: "Multi-step reasoning and analysis"
      example: "sequential_thinking.think(thought='Analyzing error patterns...', thoughtNumber=1)"
```

### **Quality Commands Reference**

```bash
# Detection Phase Commands
bun quality              # Run all quality gates
bun lint                 # OXLint 50-100x faster validation
bun lint:security        # Security-specific checks
bun type-check          # TypeScript strict mode
bun format:check        # Biome formatting validation

# Auto-Fix Commands (Use with caution)
bun quality:fix         # Fix auto-correctable issues
bun lint:fix            # Fix OXLint issues
bun format              # Format with Biome

# Testing Commands
bun test                # Run all tests (3-5x faster)
bun test:watch          # Watch mode for development
bun test:coverage       # Generate coverage report
bun test:e2e           # End-to-end tests

# Performance Commands
bun analyze:bundle      # Analyze bundle size
bun test:performance    # Performance benchmarks

# Validation Commands
bun validate:lgpd       # LGPD compliance check
bun validate:anvisa     # ANVISA compliance check
bunx audit              # Dependency vulnerability scan
```

---

## 📋 BEST PRACTICES & GUIDELINES

### **Planning-First Principles**

```yaml
PLANNING_FIRST_PRINCIPLES:
  never_skip_phases:
    - "NEVER skip detection phase - always catalog all errors first"
    - "NEVER skip research phase - always validate solutions with authoritative sources"
    - "NEVER skip planning phase - always create atomic tasks before implementation"
    - "NEVER skip validation phase - always verify fixes meet all criteria"

  research_driven_decisions:
    - "Base all solutions on official documentation and best practices"
    - "Cross-validate findings across multiple authoritative sources"
    - "Document research findings for future reference"
    - "Maintain ≥95% confidence before implementation"

  atomic_task_discipline:
    - "Break down complex fixes into 20-minute atomic tasks"
    - "Define clear success criteria for each task"
    - "Document rollback procedures for each task"
    - "Track task dependencies explicitly"

  continuous_validation:
    - "Validate after each atomic task completion"
    - "Run quality gates continuously during implementation"
    - "Verify healthcare compliance at every step"
    - "Document any deviations immediately"
```

### **Healthcare Compliance Guidelines**

```yaml
LGPD_COMPLIANCE:
  patient_data_handling:
    - "Always encrypt patient data at rest and in transit"
    - "Validate LGPD consent before data processing"
    - "Log all access to patient data for audit trail"
    - "Implement right to erasure for patient requests"

  type_safety_requirements:
    - "Use explicit types for all patient data fields"
    - "Document LGPD-sensitive fields with JSDoc"
    - "Enforce encryption requirements at type level"
    - "Validate consent types with TypeScript unions"

  audit_requirements:
    - "Log all quality control changes affecting patient data"
    - "Track who made changes and when"
    - "Document rationale for security-related fixes"
    - "Maintain compliance audit trail"

ANVISA_COMPLIANCE:
  equipment_tracking:
    - "Validate equipment IDs in type definitions"
    - "Ensure equipment safety compliance in code"
    - "Track equipment usage in audit logs"

  quality_control:
    - "Document quality control procedures in code"
    - "Validate regulatory reporting requirements"
    - "Ensure audit trail generation for equipment"
```

### **Quality Standards**

```yaml
QUALITY_STANDARDS:
  code_quality:
    - "Zero TypeScript errors in strict mode"
    - "Zero OXLint errors (69 warnings acceptable)"
    - "Consistent code formatting with Biome"
    - "No code duplication (DRY principle)"

  test_coverage:
    - "≥90% coverage for critical components (patient data, auth, payments)"
    - "≥80% coverage for standard components"
    - "100% pass rate for all tests"
    - "No flaky tests in CI/CD pipeline"

  security_standards:
    - "Zero high-severity vulnerabilities"
    - "All inputs validated and sanitized"
    - "Authentication and authorization enforced"
    - "Security headers properly configured"

  performance_standards:
    - "Core Web Vitals: LCP ≤2.0s, INP ≤150ms, CLS ≤0.05"
    - "API response times ≤200ms"
    - "Database queries ≤100ms"
    - "Bundle size <500KB for critical path"
```

### **Common Pitfalls to Avoid**

```yaml
COMMON_PITFALLS:
  skipping_research:
    problem: "Implementing fixes without researching best practices"
    consequence: "Technical debt, non-standard solutions, future issues"
    solution: "Always complete Phase 2 research before implementation"

  inadequate_planning:
    problem: "Starting implementation without atomic task breakdown"
    consequence: "Incomplete fixes, missed edge cases, poor rollback capability"
    solution: "Always create detailed atomic tasks in Phase 3"

  insufficient_validation:
    problem: "Not running all quality gates after fixes"
    consequence: "New errors introduced, regressions, compliance violations"
    solution: "Run complete validation checklist after each task"

  ignoring_healthcare_compliance:
    problem: "Fixing code quality without considering LGPD/ANVISA"
    consequence: "Compliance violations, legal risks, audit failures"
    solution: "Always validate healthcare compliance in Phase 4"

  poor_documentation:
    problem: "Not documenting research findings and solutions"
    consequence: "Knowledge loss, repeated research, inconsistent solutions"
    solution: "Create knowledge base articles for all significant fixes"
```

---

## 🎯 SUCCESS METRICS

### **Quality Control Effectiveness**

```yaml
EFFECTIVENESS_METRICS:
  error_resolution_rate:
    target: "100% of detected errors resolved"
    measurement: "Errors fixed / Total errors detected"

  research_quality:
    target: "≥95% confidence in all solutions"
    measurement: "Solutions validated by authoritative sources"

  implementation_accuracy:
    target: "≥98% first-time fix success rate"
    measurement: "Fixes that pass validation / Total fixes attempted"

  compliance_adherence:
    target: "100% healthcare compliance maintained"
    measurement: "LGPD/ANVISA violations / Total fixes"

  knowledge_creation:
    target: "Knowledge article for every L5+ complexity issue"
    measurement: "Knowledge articles created / Complex issues resolved"
```

### **Performance Metrics**

```yaml
PERFORMANCE_METRICS:
  detection_speed:
    target: "Complete error detection in <5 minutes"
    tools: "OXLint (50-100x faster), Bun (3-5x faster)"

  research_efficiency:
    target: "Research completion in <30 minutes for L5 issues"
    tools: "Context7, Tavily, Archon RAG"

  implementation_speed:
    target: "Average 20 minutes per atomic task"
    measurement: "Total implementation time / Number of tasks"

  validation_speed:
    target: "Complete validation in <10 minutes"
    tools: "Bun test runner (3-5x faster), OXLint (50-100x faster)"
```

---

## 📚 ADDITIONAL RESOURCES

### **Documentation References**

- **[Tech Stack](../architecture/tech-stack.md)** - Complete technology decisions and rationale
- **[Frontend Architecture](../architecture/frontend-architecture.md)** - Frontend structure and patterns
- **[Research Command](research.md)** - Comprehensive research methodology
- **[Apex Researcher Agent](../agents/apex-researcher.md)** - Research agent patterns and capabilities
- **[Frontend Testing](frontend-testing.md)** - Multi-agent testing coordination

### **External Resources**

- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)
- **React 19**: [react.dev](https://react.dev/)
- **OXLint**: [oxc-project.github.io](https://oxc-project.github.io/)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **LGPD**: [gov.br/anpd](https://www.gov.br/anpd/)
- **OWASP**: [owasp.org](https://owasp.org/)

---

## Configuration Files

### **Core Configuration**

- **`.oxlintrc.json`**: Primary linter with 570+ rules and healthcare compliance
- **`biome.json`**: Formatter and code style
- **`eslint.config.js`**: Fallback security and LGPD compliance
- **`dprint.json`**: Additional formatting (simplified)
- **`vitest.config.ts`**: Testing (single config)
- **`playwright.config.ts`**: E2E testing (3 browsers)

## Agent Coordination

### **When to Use Which Agent**

- **@apex-dev**: Implementation, bug fixes, feature development
- **@code-reviewer**: Code quality, performance optimization
- **@test-auditor**: Security validation, test coverage
- **@architect-review**: Architecture decisions, design patterns
- **@codebase-analyst**: Pattern discovery for structure, naming, testing, and existing validation commands
- **@validator**: Lightweight post-implementation tests for changed features (happy path + critical edges)

### **Agent Workflow Examples**

```bash
# Code quality issues
@code-reviewer "analyze and fix performance issues in [component]"
@code-reviewer "optimize bundle size for [package]"

# Security concerns
@test-auditor "validate LGPD compliance for [feature]"
@test-auditor "conduct security audit for [module]"

# Architecture decisions
@architect-review "review data flow for [system]"
@architect-review "validate design patterns for [feature]"

# Pattern discovery and validation alignment
@codebase-analyst "map patterns for [feature/domain] and list existing validation commands with file refs"

# Post-implementation lightweight tests
@validator "create minimal tests for [feature] after changes to [files/components] using Vitest/Playwright"
```

## 🚀 QUICK START GUIDE

### **For New Team Members**

```bash
# 1. Understand the 4-phase workflow
# Read this document thoroughly, especially the examples section

# 2. Set up your environment
bun install                    # Install dependencies (3-5x faster)
bun quality                    # Verify everything works

# 3. Run your first quality check
bun lint                       # See current code quality status
bun type-check                 # Check TypeScript errors
bun test                       # Run test suite

# 4. Practice with a simple fix
# - Find a low-priority error (P3)
# - Follow the 4-phase workflow
# - Create atomic tasks
# - Implement and validate

# 5. Review examples in this document
# - Study Example 1 (TypeScript type safety)
# - Study Example 2 (Security vulnerability)
# - Understand the complete workflow
```

### **For Experienced Developers**

```bash
# Quick workflow reminder:
# Phase 1: bun quality → catalog errors
# Phase 2: Research with Context7/Tavily → validate solutions
# Phase 3: Create atomic tasks → plan implementation
# Phase 4: Implement → validate → integrate

# Key tools:
# - Serena MCP for codebase search (mandatory)
# - Context7 for official documentation
# - Archon for knowledge management
# - Desktop Commander for file operations

# Quality gates:
# - Zero TypeScript errors
# - Zero OXLint errors (69 warnings OK)
# - ≥90% test coverage for critical
# - 100% LGPD compliance
```

---

## 📊 PROJECT DIAGNOSTICS METRICS

### **Diagnostic Success Metrics**

```yaml
DIAGNOSTIC_EFFECTIVENESS_METRICS:
  error_resolution_rate:
    target: "≥95% of identified issues resolved"
    measurement: "Compare initial diagnostics with final state"
    tool: "diagnostics --before-after"
    
  diagnostic_coverage:
    target: "100% project file coverage"
    measurement: "Percentage of files scanned for issues"
    tool: "diagnostics --coverage-report"
    
  false_positive_rate:
    target: "<5% false positives"
    measurement: "Manual validation of reported issues"
    tool: "diagnostics --validate"
    
  detection_speed:
    target: "<30 seconds for full project scan"
    measurement: "Time from start to diagnostic completion"
    tool: "time diagnostics"
```

### **Zed Context Integration Metrics**

```yaml
ZED_CONTEXT_METRICS:
  real_time_effectiveness:
    target: "Detect issues within 2 seconds of file change"
    measurement: "Time between file save and error detection"
    tool: "zed_context_benchmark"
    
  integration_success:
    target: "100% of Zed features working correctly"
    measurement: "Functional testing of all Zed Context features"
    tool: "zed_context_test_integration"
    
  performance_impact:
    target: "<5% overhead on development workflow"
    measurement: "Comparison of development speed with/without Zed Context"
    tool: "performance_benchmark --zed-context"
    
  developer_satisfaction:
    target: "≥4.5/5 developer satisfaction rating"
    measurement: "Developer feedback surveys"
    tool: "satisfaction_survey --zed-context"
```

### **Continuous Quality Monitoring**

```yaml
CONTINUOUS_MONITORING_WORKFLOW:
  pre_commit_hooks:
    - "diagnostics --filter=error"
    - "bun quality"
    - "bun test:coverage"
    - "zed_context_check"
    
  ci_cd_pipeline:
    - "diagnostics --full"
    - "bun quality:ci"
    - "bun test:ci"
    - "zed_context_validate"
    
  real_time_monitoring:
    - "zed_context_enable --watch"
    - "diagnostics --watch"
    - "quality_metrics_dashboard"
    
  periodic_reports:
    - "diagnostics --report=daily"
    - "quality_metrics --weekly"
    - "zed_context_analytics --monthly"
```

### **Diagnostic Quality Gates**

```yaml
DIAGNOSTIC_QUALITY_GATES:
  gate_1_no_critical_errors:
    threshold: "0 critical diagnostic errors"
    check: "diagnostics --filter=error"
    blocking: true
    
  gate_2_type_safety:
    threshold: "0 TypeScript compilation errors"
    check: "bun type-check"
    blocking: true
    
  gate_3_real_time_validation:
    threshold: "Zed Context actively monitoring"
    check: "zed_context_check"
    blocking: false
    
  gate_4_performance_impact:
    threshold: "<100ms diagnostic response time"
    check: "time diagnostics --file=sample"
    blocking: false
```

## 🎓 LEARNING PATHWAYS

### **Beginner Path: Understanding Quality Control**

1. **Week 1**: Learn the 4-phase workflow
   - Read this document completely
   - Understand detection tools (OXLint, TypeScript)
   - Practice error cataloging

2. **Week 2**: Master research methodology
   - Study research.md command
   - Practice using Context7 and Tavily
   - Create your first research report

3. **Week 3**: Atomic task decomposition
   - Learn task breakdown principles
   - Practice creating atomic tasks
   - Understand validation criteria

4. **Week 4**: Implementation and validation
   - Fix your first quality issue
   - Follow complete workflow
   - Document lessons learned

### **Intermediate Path: Healthcare Compliance**

1. **LGPD Compliance Mastery**
   - Study LGPD requirements
   - Learn patient data handling patterns
   - Practice consent validation

2. **Security Best Practices**
   - OWASP Top 10 understanding
   - SQL injection prevention
   - Authentication and authorization

3. **Type Safety Excellence**
   - TypeScript strict mode mastery
   - Interface design patterns
   - Generic type usage

### **Advanced Path: Quality Leadership**

1. **Research Excellence**
   - Multi-source validation techniques
   - Constitutional analysis methods
   - Knowledge base architecture

2. **Process Optimization**
   - Workflow efficiency improvements
   - Tool integration strategies
   - Team coordination patterns

3. **Compliance Leadership**
   - Regulatory compliance expertise
   - Audit trail management
   - Risk assessment frameworks

---

## 🔄 CONTINUOUS IMPROVEMENT

### **Feedback Loop**

```yaml
IMPROVEMENT_CYCLE:
  collect_metrics:
    - "Track error resolution rates"
    - "Measure research quality"
    - "Monitor implementation accuracy"
    - "Assess compliance adherence"

  analyze_patterns:
    - "Identify recurring error types"
    - "Find common root causes"
    - "Detect process bottlenecks"
    - "Recognize knowledge gaps"

  implement_improvements:
    - "Update documentation based on learnings"
    - "Refine atomic task templates"
    - "Enhance research methodologies"
    - "Improve validation criteria"

  share_knowledge:
    - "Create knowledge base articles"
    - "Document lessons learned"
    - "Share best practices with team"
    - "Update training materials"
```

### **Quality Control Evolution**

```yaml
EVOLUTION_ROADMAP:
  current_state:
    - "4-phase planning-first workflow"
    - "Research-driven solutions"
    - "Atomic task decomposition"
    - "Healthcare compliance focus"

  near_term_enhancements:
    - "Automated error pattern detection"
    - "AI-assisted research synthesis"
    - "Predictive quality analytics"
    - "Real-time compliance monitoring"

  long_term_vision:
    - "Self-healing code quality"
    - "Proactive vulnerability detection"
    - "Automated compliance validation"
    - "Continuous knowledge evolution"
```

---

## 📞 SUPPORT & ESCALATION

### **When to Ask for Help**

```yaml
ESCALATION_TRIGGERS:
  technical_complexity:
    - "Error complexity level ≥L7"
    - "Multiple interconnected errors"
    - "Architectural implications"
    - "Performance critical changes"

  compliance_concerns:
    - "LGPD compliance uncertainty"
    - "ANVISA regulatory questions"
    - "Security vulnerability severity"
    - "Audit trail requirements"

  resource_constraints:
    - "Research confidence <85%"
    - "Implementation time >2 hours"
    - "Multiple failed fix attempts"
    - "Breaking change implications"
```

### **Escalation Channels**

- **Technical Lead**: Architecture and complex technical decisions
- **Security Team**: Security vulnerabilities and compliance
- **Healthcare Compliance**: LGPD/ANVISA regulatory questions
- **Quality Team**: Process improvements and tool issues

---

## 🎯 CONCLUSION

### **Key Takeaways**

1. **Planning-First Approach**: Always complete detection, research, and planning before implementation
2. **Research-Driven Solutions**: Base all fixes on authoritative sources and best practices
3. **Atomic Task Discipline**: Break down complex fixes into manageable, validated subtasks
4. **Healthcare Compliance**: Maintain LGPD/ANVISA compliance at every step
5. **Continuous Validation**: Verify fixes against comprehensive quality gates
6. **Knowledge Creation**: Document learnings for future reference

### **Success Formula**

```
Quality Control Success =
  (Comprehensive Detection × Research Quality × Atomic Planning × Systematic Execution)
  ÷
  (Skipped Steps + Assumptions + Incomplete Validation)
```

### **Final Reminders**

- **NEVER skip phases** - each phase builds on the previous
- **ALWAYS research first** - avoid assumptions and quick fixes
- **ALWAYS create atomic tasks** - detailed planning prevents issues
- **ALWAYS validate completely** - quality gates are non-negotiable
- **ALWAYS maintain compliance** - healthcare regulations are critical
- **ALWAYS document learnings** - knowledge compounds over time

---

**🎯 Mission**: Deliver research-driven, healthcare-compliant code quality improvements that set the standard for aesthetic clinic platforms.

**⚡ Key Advantage**: Planning-first approach with research-driven solutions ensures all quality improvements are based on authoritative sources, best practices, and healthcare compliance standards - not assumptions or quick fixes.

**🏆 Quality Standard**: ≥9.5/10 rating with ≥95% cross-validation accuracy for all quality control deliveries.

---

*Last Updated: 2025-10-01*
*Version: 2.0 - Planning-First Approach*
*Maintained by: NeonPro Quality Team*

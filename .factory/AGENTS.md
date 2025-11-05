# 🤖 AEGISWALLET MCP ORCHESTRATOR RULES

> **Master orchestration framework for MCP servers and sub-agent coordination in AegisWallet development**

## 🎯 CORE ORCHESTRATION PHILOSOPHY

**Mantra**: _"Think → Select MCP → Coordinate → Execute → Validate → Integrate"_
**Mission**: Provide intelligent MCP orchestration that optimizes task execution while maintaining AegisWallet standards
**Philosophy**: MCP-first approach with coordinated parallel execution and systematic validation
**Quality Standard**: ≥9.5/10 task completion with optimal resource utilization

### **Integration with AegisWallet Standards**

This orchestrator follows the A.P.T.E methodology (Analyze → Plan → Think → Execute) and ensures all MCP operations comply with:
- Technology Stack Mandate (Bun + Hono + React 19 + TypeScript + Supabase)
- Security & Performance Standards
- Development Workflow Standards
- KISS/YAGNI principles

## 🧠 MCP ORCHESTRATION FRAMEWORK

### **Core Orchestrator Principles**

```yaml
ORCHESTRATION_PRINCIPLES:
  principle_1: "Right MCP for Right Task - Intelligent tool selection based on task requirements"
  principle_2: "Parallel When Possible - Coordinate multiple MCPs, agents and Droids simultaneously when possible"
  principle_3: "Sequential When Necessary - Linear execution when dependencies exist"
  principle_4: "Always Validate - Verify results before task completion"
  principle_5: "Context Preservation - Maintain complete context across MCP transitions"

RESOURCE_OPTIMIZATION:
  mcp_efficiency: "Select minimal set of MCPs required for task"
  execution_strategy: "Parallel execution for independent operations"
  coordination_overhead: "Minimize handoff complexity between MCPs"
  error_recovery: "Graceful fallback strategies for MCP failures"
```

## 🛠️ MCP SERVER COORDINATION MATRIX

### **Primary MCP Servers & Their Roles**

```yaml
DESKTOP_COMMANDER:
  primary_role: "System Operations & File Management"
  priority: "Primary - Core system interactions"
  capabilities:
    - File operations (read, write, create, move, edit)
    - Directory management and navigation
    - Process execution and terminal operations
    - Search operations (file content and metadata)
  optimal_use_cases:
    - Configuration file updates
    - Build system operations
    - File system restructuring
    - Command line tool execution
  coordination_patterns:
    - Often used as first step for setup tasks
    - Coordinates with serena for code-related file operations
    - Provides file context for other MCPs
  timeout_settings: "60s (configured in mcp.json)"

SERENA:
  primary_role: "Code Analysis & Symbol Resolution"
  priority: "Primary - Code intelligence operations"
  capabilities:
    - Semantic code search and analysis
    - Symbol discovery and navigation
    - Cross-reference analysis
    - Code structure understanding
  optimal_use_cases:
    - Impact analysis for changes
    - Code architecture exploration
    - Finding usage patterns and dependencies
    - Symbol resolution and refactoring
  coordination_patterns:
    - Provides code context for implementation decisions
    - Works with desktop-commander for file modifications
    - Informs architecture decisions
  cache_settings: "Enabled for performance"

CONTEXT7:
  primary_role: "Documentation Research & Best Practices"
  priority: "Secondary - Research and validation"
  capabilities:
    - Official documentation search
    - Best practices research
    - Framework pattern analysis
    - Multi-source validation
  optimal_use_cases:
    - Technology research and validation
    - Best practices verification
    - Framework-specific guidance
    - Implementation pattern discovery
  coordination_patterns:
    - Used in planning phase for complex implementations
    - Validates approaches before execution
    - Provides authoritative guidance
  token_optimization: "12k tokens for efficiency"

CHROME_DEVTOOLS:
  primary_role: "UI Testing & Performance Validation"
  priority: "Secondary - Frontend validation"
  capabilities:
    - Browser automation and testing
    - Performance metrics collection
    - UI interaction validation
    - Visual regression testing
  optimal_use_cases:
    - E2E testing workflows
    - Performance benchmarking
    - UI component validation
    - Accessibility testing
  coordination_patterns:
    - Used after implementation for validation
    - Works with shadcn for component testing
    - Provides performance feedback
  isolation_mode: "Enabled (via --isolated flag)"

SHADCN:
  primary_role: "Component Library Management"
  priority: "Secondary - UI component operations"
  capabilities:
    - Component discovery and installation
    - UI pattern research
    - Design system integration
    - Component customization guidance
  optimal_use_cases:
    - Component library management
    - UI pattern implementation
    - Design system compliance
    - Component customization
  coordination_patterns:
    - Integrates with chrome-devtools for testing
    - Provides UI components for implementation
    - Works with serena for component analysis

SEQUENTIAL_THINKING:
  primary_role: "Cognitive Task Analysis & Planning"
  priority: "Primary - Always start complex tasks"
  capabilities:
    - Complex task decomposition
    - Multi-step planning
    - Requirement analysis
    - Decision framework application
  optimal_use_cases:
    - Complex task planning
    - Architecture decision analysis
    - Multi-step workflow design
    - Problem-solving strategy development
  coordination_patterns:
    - Used as first step in complex workflows
    - Provides structured approach for other MCPs
    - Ensures systematic task execution
```

## 📋 TASK EXECUTION WORKFLOW

### **Phase 1: Task Analysis & Planning**

```yaml
TRIGGER: "Any complex task requiring multiple steps or MCP coordination"

MANDATORY_START:
  tool: "sequential-thinking"
  purpose: "Decompose task into manageable components"
  output: "Structured task plan with MCP selection strategy"

PROCESS:
  1. Use sequential-thinking to analyze requirements
  2. Identify task complexity and dependencies
  3. Select optimal MCP combination
  4. Plan execution strategy (parallel vs sequential)
  5. Define validation criteria

QUALITY_GATE: "Requirements clarity ≥9/10 before proceeding"
```

### **Phase 2: MCP Selection & Resource Allocation**

```yaml
MCP_SELECTION_CRITERIA:
  task_complexity: "Choose MCPs based on task requirements"
  resource_efficiency: "Select minimal MCP set for task"
  parallel_potential: "Identify independent operations"
  dependency_mapping: "Plan sequential requirements"

SELECTION_MATRIX:
  file_operations: "desktop-commander"
  code_analysis: "serena"
  documentation_research: "context7"
  ui_testing: "chrome-devtools"
  component_work: "shadcn"
  complex_planning: "sequential-thinking"
```

### **Phase 3: Coordinated Execution**

```yaml
EXECUTION_STRATEGIES:

PARALLEL_EXECUTION:
  trigger: "Independent operations without shared resources"
  examples:
    - "serena code analysis + context7 research"
    - "desktop-commander file ops + shadcn component research"
  coordination: "Use task management for synchronization"
  efficiency_gain: "40-60% time reduction"

SEQUENTIAL_EXECUTION:
  trigger: "Dependent operations or shared resources"
  examples:
    - "desktop-commander file creation → serena analysis"
    - "context7 research → implementation → testing"
  coordination: "Handoff with context preservation"
  safety_benefit: "Eliminates race conditions and conflicts"

MIXED_EXECUTION:
  trigger: "Complex workflows with both independent and dependent tasks"
  approach: "Group independent tasks for parallel, chain dependent tasks"
  optimization: "Maximize parallel while maintaining correctness"
```

### **Phase 4: Quality Validation & Integration**

```yaml
VALIDATION_CHECKPOINTS:
  immediate_validation: "After each MCP operation"
  integration_validation: "After MCP coordination"
  final_validation: "Before task completion"

QUALITY_CRITERIA:
  functional_correctness: "Task requirements fully met"
  resource_efficiency: "Optimal MCP usage achieved"
  context_preservation: "Complete information flow maintained"
  standard_compliance: "AegisWallet standards followed"
```

## 🎯 COMMAND TEMPLATES & PATTERNS

### **Common MCP Coordination Patterns**

```yaml
PATTERN_1: Research & Implementation
sequence:
  1. "sequential-thinking" - Analyze requirements
  2. "context7" - Research best practices
  3. "serena" - Analyze existing code
  4. "desktop-commander" - Implement changes
  5. "chrome-devtools" - Validate implementation

PATTERN_2: Component Development
sequence:
  1. "sequential-thinking" - Plan component approach
  2. "shadcn" - Research existing components
  3. "serena" - Analyze integration points
  4. "desktop-commander" - Create component files
  5. "chrome-devtools" - Test component functionality

PATTERN_3: System Configuration
sequence:
  1. "sequential-thinking" - Plan configuration changes
  2. "context7" - Research configuration best practices
  3. "desktop-commander" - Modify configuration files
  4. "serena" - Validate configuration integration
  5. "desktop-commander" - Test configuration changes
```

### **MCP-Specific Command Templates**

```yaml
DESKTOP_COMMANDER_TEMPLATES:
  file_operations: |
    Use read_file to understand current state
    Use edit_block for precise modifications
    Use write_file for new file creation
    Use create_directory for new structure
  
  search_operations: |
    Use start_search for comprehensive searches
    Use get_more_search_results for pagination
    Use edit_block for targeted code changes

SERENA_TEMPLATES:
  code_analysis: |
    Use search_for_pattern for semantic searches
    Use find_symbol for specific code elements
    Use get_symbols_overview for structure understanding
    Use find_referencing_symbols for impact analysis

CONTEXT7_TEMPLATES:
  research_workflow: |
    Use resolve-library-id to find official documentation
    Use get-library-docs with specific topic focus
    Set appropriate token limits for efficiency
    Cross-reference multiple sources for validation

CHROME_DEVTOOLS_TEMPLATES:
  testing_workflow: |
    Use navigate_page to reach target URL
    Use take_snapshot to understand page structure
    Use click/fill for interactions
    Use take_screenshot for validation
    Use performance_analyze for optimization insights
```

## 🔧 INTEGRATION WITH AEGISWALLET STANDARDS

### **Technology Stack Compliance**

```yaml
REQUIRED_COMPLIANCE:
  typescript_strict_mode: "All code must use TypeScript strict mode"
  supabase_patterns: "Use Supabase client patterns from integrations/supabase/client.ts"
  trpc_procedures: "All API procedures must use tRPC v11 with Zod validation"
  react_patterns: "Follow React 19 patterns with TanStack Router v5"
  
MCP_ENFORCEMENT:
  desktop-commander: "Validate TypeScript compilation after changes"
  serena: "Check for compliance with established patterns"
  context7: "Research current framework best practices"
  chrome-devtools: "Validate performance meets Core Web Vitals standards"
```

### **Security & Performance Standards**

```yaml
SECURITY_COORDINATION:
  input_validation: "Use serena to validate all user inputs"
  authentication_checks: "Ensure Supabase Auth patterns are followed"
  data_access_control: "Verify RLS policies with serena analysis"
  dependency_validation: "Use context7 to research security best practices"

PERFORMANCE_COORDINATION:
  bundle_optimization: "Use chrome-devtools for performance validation"
  database_efficiency: "Analyze query patterns with serena"
  caching_strategy: "Research and implement caching with context7"
  core_web_vitals: "Validate performance standards with chrome-devtools"
```

## 🚨 ERROR HANDLING & RECOVERY

### **MCP Failure Scenarios**

```yaml
DESKTOP_COMMANDER_FAILURES:
  file_permission_errors: "Retry with alternative approaches"
  process_execution_failures: "Validate command syntax and paths"
  search_timeout: "Reduce scope or use serena for code analysis"

SERENA_FAILURES:
  symbol_not_found: "Use search_for_pattern for broader analysis"
  code_analysis_timeout: "Reduce scope or use desktop-commander for specific files"
  reference_errors: "Validate project structure and imports"

CONTEXT7_FAILURES:
  api_key_issues: "Validate environment variables"
  token_limit_exceeded: "Reduce query scope or split into multiple requests"
  documentation_not_found: "Search alternative sources or use general web search"

CHROME_DEVTOOLS_FAILURES:
  browser_launch_failures: "Ensure --isolated flag is used"
  page_load_timeouts: "Increase timeout or validate network connectivity"
  element_not_found: "Use take_snapshot to validate current page state"

RECOVERY_STRATEGIES:
  immediate_retry: "For transient failures, retry with same approach"
  alternative_mcp: "Switch to different MCP for similar functionality"
  degraded_functionality: "Proceed with limited capabilities"
  manual_intervention: "Request human guidance for complex issues"
```

## 📊 MONITORING & OPTIMIZATION

### **MCP Performance Metrics**

```yaml
TRACKING_METRICS:
  mcp_response_time: "Monitor each MCP's response times"
  task_completion_rate: "Track successful vs failed operations"
  resource_utilization: "Monitor efficient MCP usage"
  coordination_overhead: "Track time spent on MCP coordination"

OPTIMIZATION_STRATEGIES:
  parallel_execution_increase: "Identify more opportunities for parallel work"
  mcp_caching: "Implement caching for repeated MCP operations"
  timeout_optimization: "Adjust timeouts based on actual usage patterns"
  selection_refinement: "Improve MCP selection based on success rates"
```

**Remember**: This orchestrator is the brain of MCP operations - use it to guide every complex task requiring multiple MCP interactions.

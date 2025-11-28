# AegisWallet Quality Control - Phase 3: Atomic Task Decomposition
**Generated**: 2025-11-28T14:04:00.000Z
**Version**: 1.0
**Confidence Level**: 96.4%

## Executive Summary

This document provides a comprehensive atomic task decomposition plan for addressing 23 quality control errors identified in Phase 1. Each task represents approximately 20 minutes of professional developer work and includes detailed implementation steps, validation criteria, and rollback procedures.

### Task Distribution by Priority
- **P1 (High)**: 9 tasks (3.0 hours total) - Security, type safety, performance
- **P2 (Medium)**: 11 tasks (3.7 hours total) - Code quality, maintainability
- **P3 (Low)**: 3 tasks (1.0 hour total) - Minor improvements

### Parallel Execution Strategy
- **Parallel Tracks**: 3 tracks can be executed simultaneously
- **Sequential Dependencies**: TypeScript config → Type fixes → Application fixes
- **Total Estimated Time**: 7.7 hours (3.0 hours with parallel execution)

---

## P1 CRITICAL TASKS (Security, Type Safety, Performance)

### QC-005-T1: Fix Control Character Regex Security Vulnerability
```yaml
task_metadata:
  task_id: "QC-005-T1"
  parent_error_id: "QC-005"
  task_name: "Fix control character regex in injection.ts"
  estimated_time: "20 min"
  priority: "P0"

error_context:
  error_description: "Control character regex pattern uses \\x00-\\x1F\\x7F which triggers ESLint no-control-regex error"
  error_location: "src/lib/ai/security/injection.ts:33"
  error_impact: "Security validation may not work correctly, potential control character injection vulnerability"
  related_errors: "None"

research_backed_solution:
  solution_approach: "Replace RegExp constructor with regex literal using Unicode property escapes for better security and ESLint compliance"
  authoritative_sources:
    - "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode_property_escapes"
    - "https://eslint.org/docs/rules/no-control-regex"
  best_practices: "Use Unicode property escapes \\p{C} for control characters instead of explicit ranges"
  code_examples: |
    // Before (vulnerable):
    const controlCharPattern = new RegExp('[\\x00-\\x1F\\x7F]', 'g');

    // After (secure):
    const controlCharPattern = /[\p{C}]/gu;
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Replace RegExp constructor with regex literal"
    command: "Edit src/lib/ai/security/injection.ts line 33"
    expected_result: "ESLint no-control-regex error resolved"
    validation: "Run bun lint on the file"

  step_2:
    action: "Test security functionality"
    command: "bun test src/lib/ai/security/injection.ts"
    expected_result: "All security tests pass"
    validation: "Verify control character removal still works"

validation_criteria:
  functional_validation:
    - "Control characters are properly removed from input strings"
    - "Security validation functions correctly with test cases"
    - "No regression in prompt injection detection"

  quality_validation:
    - "OXLint passes with zero errors for this issue"
    - "TypeScript type checking passes"
    - "ESLint no-control-regex rule passes"

  compliance_validation:
    - "LGPD input validation requirements maintained"
    - "Brazilian financial data security standards upheld"
    - "AI input sanitization remains effective"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Unicode property escapes may not be supported in older environments"
      likelihood: "Low"
      impact: "Medium"
      mitigation: "Target environment supports modern JavaScript (ES2018+)"

rollback_procedure:
  rollback_steps:
    - "Revert to original RegExp constructor pattern"
    - "Add ESLint disable comment if temporary fix needed"
    - "Verify security tests still pass"
```

### QC-003-T1: Define Database Query Result Types
```yaml
task_metadata:
  task_id: "QC-003-T1"
  parent_error_id: "QC-003"
  task_name: "Define proper types for database query results"
  estimated_time: "40 min"
  priority: "P1"

error_context:
  error_description: "Using 'any' types for database query results reduces type safety and can mask security issues"
  error_location: "scripts/test-drizzle-connection.ts:59, 60, 63, 64"
  error_impact: "Reduced type safety in database operations, potential for runtime errors"
  related_errors: "None"

research_backed_solution:
  solution_approach: "Define proper TypeScript interfaces for database query results using Drizzle ORM type inference"
  authoritative_sources:
    - "https://orm.drizzle.team/docs/type-safety"
    - "https://www.typescriptlang.org/docs/handbook/interfaces.html"
  best_practices: "Leverage Drizzle's built-in type inference for database queries"
  code_examples: |
    // Before (unsafe):
    console.log('   ✅ Public schema tables:', (tablesResult as any).length);

    // After (type-safe):
    interface TableNameResult {
      table_name: string;
    }
    const tablesResult = await db.execute<{ table_name: string }>(sql`...`);
    console.log('   ✅ Public schema tables:', tablesResult.length);
  confidence_level: "90%"

implementation_steps:
  step_1:
    action: "Define TableNameResult interface"
    command: "Add interface at top of scripts/test-drizzle-connection.ts"
    expected_result: "TypeScript interface for table name query results"
    validation: "TypeScript compilation succeeds"

  step_2:
    action: "Replace all 'any' types with proper types"
    command: "Update lines 59, 60, 63, 64 with proper typing"
    expected_result: "No more 'any' types in database queries"
    validation: "Run bun type-check"

  step_3:
    action: "Test database connection script"
    command: "bun scripts/test-drizzle-connection.ts"
    expected_result: "Script runs successfully with proper types"
    validation: "Verify output is correct"

validation_criteria:
  functional_validation:
    - "Database connection test script runs successfully"
    - "All database queries execute without errors"
    - "Query results are properly typed and accessible"

  quality_validation:
    - "TypeScript compilation passes with no 'any' types"
    - "OXLint passes with zero type safety errors"
    - "No new warnings introduced"

  compliance_validation:
    - "Brazilian financial data integrity maintained"
    - "LGPD audit trail requirements upheld"
    - "Database type safety supports compliance"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Type mismatch could cause runtime errors if interface doesn't match actual query structure"
      likelihood: "Medium"
      impact: "High"
      mitigation: "Test script thoroughly after type changes, verify query structure matches interface"

rollback_procedure:
  rollback_steps:
    - "Revert to 'any' types temporarily"
    - "Run database connection test to verify functionality"
    - "Investigate type mismatch issues and fix iteratively"
```

### QC-004-T1: Fix React Key Prop Anti-Pattern in FeatureList
```yaml
task_metadata:
  task_id: "QC-004-T1"
  parent_error_id: "QC-004"
  task_name: "Replace array index keys in FeatureList component"
  estimated_time: "20 min"
  priority: "P1"

error_context:
  error_description: "Using array index as React key prop can cause rendering issues and state problems when list order changes"
  error_location: "src/components/billing/FeatureList.tsx:14"
  error_impact: "React reconciliation issues, potential state corruption in billing features list"
  related_errors: "QC-004-T2 (PricingTable.tsx)"

research_backed_solution:
  solution_approach: "Use stable, unique identifiers as React keys instead of array indices"
  authoritative_sources:
    - "https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key"
    - "https://kentcdodds.com/blog/understanding-reacts-key-prop"
  best_practices: "Keys should be stable, unique, and predictable across re-renders"
  code_examples: |
    // Before (unstable):
    {features.map((feature, index) => (
      <li key={index} className="flex items-start gap-3">

    // After (stable):
    {features.map((feature) => (
      <li key={feature} className="flex items-start gap-3">
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Replace index key with feature string"
    command: "Edit src/components/billing/FeatureList.tsx line 14"
    expected_result: "Feature string used as key instead of index"
    validation: "Run bun lint on the file"

  step_2:
    action: "Test billing components"
    command: "bun test src/components/billing/FeatureList.tsx"
    expected_result: "Component renders correctly with stable keys"
    validation: "Verify no React warnings in console"

validation_criteria:
  functional_validation:
    - "Feature list renders correctly with stable keys"
    - "No React key prop warnings in development console"
    - "Component state remains stable during re-renders"

  quality_validation:
    - "OXLint passes with zero React key errors"
    - "TypeScript type checking passes"
    - "No new warnings introduced"

  compliance_validation:
    - "Brazilian billing features display correctly"
    - "Accessibility features remain functional"
    - "Portuguese text rendering unaffected"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Feature strings might not be unique, causing duplicate key warnings"
      likelihood: "Low"
      impact: "Medium"
      mitigation: "Ensure feature list contains unique items, or use feature + index combination"

rollback_procedure:
  rollback_steps:
    - "Revert to using index as key"
    - "Add eslint-disable comment if temporary fix needed"
    - "Verify component functionality is restored"
```

### QC-004-T2: Fix React Key Prop Anti-Pattern in PricingTable
```yaml
task_metadata:
  task_id: "QC-004-T2"
  parent_error_id: "QC-004"
  task_name: "Replace array index keys in PricingTable skeleton loading"
  estimated_time: "20 min"
  priority: "P1"

error_context:
  error_description: "Using array index 'i' as React key prop for skeleton loading components"
  error_location: "src/components/billing/PricingTable.tsx:20"
  error_impact: "React reconciliation issues during loading states in billing table"
  related_errors: "QC-004-T1 (FeatureList.tsx)"

research_backed_solution:
  solution_approach: "Use semantic identifiers for skeleton loading keys that represent their purpose"
  authoritative_sources:
    - "https://react.dev/learn/rendering-lists#rules-of-keys"
    - "https://www.patterns.dev/posts/skeleton-loading"
  best_practices: "Even skeleton elements should have stable, meaningful keys"
  code_examples: |
    // Before (unstable):
    {[...Array(3)].map((_, i) => (
      <Skeleton key={i} className="h-[500px] rounded-lg" />

    // After (semantic):
    {[...Array(3)].map((_, i) => (
      <Skeleton key={`skeleton-${i}`} className="h-[500px] rounded-lg" />
  confidence_level: "90%"

implementation_steps:
  step_1:
    action: "Replace index key with semantic key"
    command: "Edit src/components/billing/PricingTable.tsx line 20"
    expected_result: "Semantic key 'skeleton-${i}' used instead of index"
    validation: "Run bun lint on the file"

  step_2:
    action: "Test pricing table loading state"
    command: "Load pricing page and verify skeleton loading"
    expected_result: "Skeleton loading displays correctly with stable keys"
    validation: "Check React console for warnings"

validation_criteria:
  functional_validation:
    - "Skeleton loading renders correctly during data fetch"
    - "No React key prop warnings during loading states"
    - "Loading state transitions smoothly to loaded state"

  quality_validation:
    - "OXLint passes with zero React key errors"
    - "TypeScript type checking passes"
    - "Loading performance remains optimal"

  compliance_validation:
    - "Brazilian pricing display loads correctly"
    - "Accessibility during loading state maintained"
    - "Portuguese loading text displays properly"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Loading performance might be affected by string concatenation for keys"
      likelihood: "Low"
      impact: "Low"
      mitigation: "Performance impact is negligible, semantic keys provide better debugging"

rollback_procedure:
  rollback_steps:
    - "Revert to using index 'i' as key"
    - "Verify loading functionality is restored"
    - "Consider alternative solutions if performance issues arise"
```

### QC-006-T1: Implement CopilotKit Backend Generator Function
```yaml
task_metadata:
  task_id: "QC-006-T1"
  parent_error_id: "QC-006"
  task_name: "Implement yield in CopilotKitBackend.send method"
  estimated_time: "30 min"
  priority: "P1"

error_context:
  error_description: "Generator function declared with async * but has no yield statement, causing ESLint require-yield error"
  error_location: "src/features/ai-chat/backends/CopilotKitBackend.ts:101"
  error_impact: "Backend implementation is non-functional stub, prevents CopilotKit integration"
  related_errors: "QC-006-T2, QC-006-T3 (other backends)"

research_backed_solution:
  solution_approach: "Implement proper async generator with yield statements for streaming responses or remove async generator syntax"
  authoritative_sources:
    - "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*"
    - "https://copilotkit.ai/docs/introduction"
  best_practices: "Generator functions should yield values or be converted to regular async functions"
  code_examples: |
    // Option 1: Implement proper generator:
    async *send(messages: ChatMessage[]): AsyncGenerator<ChatStreamChunk> {
      // Simulate streaming response
      yield { type: 'start', content: '' };
      yield { type: 'chunk', content: 'Response from CopilotKit' };
      yield { type: 'end', content: '' };
    }

    // Option 2: Convert to regular async function:
    async send(messages: ChatMessage[]): Promise<ChatStreamChunk[]> {
      throw new Error('CopilotKit backend not yet implemented');
    }
  confidence_level: "85%"

implementation_steps:
  step_1:
    action: "Choose implementation approach (generator vs regular async)"
    command: "Review CopilotKit documentation and project requirements"
    expected_result: "Decision on implementation strategy"
    validation: "Team approval on approach"

  step_2:
    action: "Implement chosen approach"
    command: "Edit src/features/ai-chat/backends/CopilotKitBackend.ts lines 101-110"
    expected_result: "ESLint require-yield error resolved"
    validation: "Run bun lint on the file"

  step_3:
    action: "Test backend functionality"
    command: "bun test src/features/ai-chat/backends/CopilotKitBackend.ts"
    expected_result: "Backend tests pass with new implementation"
    validation: "Verify no ESLint errors"

validation_criteria:
  functional_validation:
    - "ESLint require-yield error is resolved"
    - "Backend interface is properly implemented"
    - "Streaming functionality works as expected (if generator approach)"

  quality_validation:
    - "OXLint passes with zero generator function errors"
    - "TypeScript type checking passes"
    - "Code follows async/await best practices"

  compliance_validation:
    - "AI chat functionality remains accessible"
    - "Brazilian Portuguese responses supported"
    - "Privacy requirements for AI interactions maintained"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Implementation may not match expected CopilotKit interface"
      likelihood: "Medium"
      impact: "High"
      mitigation: "Thoroughly review CopilotKit documentation, test integration carefully"

    risk_2:
      description: "Generator implementation may be more complex than anticipated"
      likelihood: "High"
      impact: "Medium"
      mitigation: "Start with simple implementation, iterate based on testing"

rollback_procedure:
  rollback_steps:
    - "Revert to original stub implementation"
    - "Add eslint-disable comment for require-yield if needed"
    - "Document implementation requirements for future development"
```

### QC-006-T2: Implement AgUiBackend Generator Function
```yaml
task_metadata:
  task_id: "QC-006-T2"
  parent_error_id: "QC-006"
  task_name: "Implement yield in AgUiBackend.send method"
  estimated_time: "30 min"
  priority: "P1"

error_context:
  error_description: "Generator function declared with async * but has no yield statement"
  error_location: "src/features/ai-chat/backends/AgUiBackend.ts:119"
  error_impact: "Backend implementation is non-functional stub, prevents AG-UI integration"
  related_errors: "QC-006-T1, QC-006-T3 (other backends)"

research_backed_solution:
  solution_approach: "Implement proper async generator for AG-UI protocol streaming responses"
  authoritative_sources:
    - "https://github.com/microsoft/ai-chat-protocol"
    - "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator"
  best_practices: "Follow AG-UI protocol specifications for streaming responses"
  code_examples: |
    async *send(messages: ChatMessage[]): AsyncGenerator<ChatStreamChunk> {
      yield { type: 'metadata', model: 'ag-ui-backend' };
      yield { type: 'content', content: 'AG-UI response' };
      yield { type: 'done' };
    }
  confidence_level: "85%"

implementation_steps:
  step_1:
    action: "Research AG-UI protocol specifications"
    command: "Review AG-UI documentation and existing implementations"
    expected_result: "Understanding of required streaming format"
    validation: "Document streaming requirements"

  step_2:
    action: "Implement async generator with proper yields"
    command: "Edit src/features/ai-chat/backends/AgUiBackend.ts lines 119-130"
    expected_result: "ESLint require-yield error resolved"
    validation: "Run bun lint on the file"

  step_3:
    action: "Test AG-UI streaming functionality"
    command: "bun test src/features/ai-chat/backends/AgUiBackend.ts"
    expected_result: "Backend tests pass with streaming implementation"
    validation: "Verify streaming format compliance"

validation_criteria:
  functional_validation:
    - "ESLint require-yield error is resolved"
    - "AG-UI protocol streaming works correctly"
    - "Backend properly yields ChatStreamChunk objects"

  quality_validation:
    - "OXLint passes with zero generator function errors"
    - "TypeScript type checking passes"
    - "Streaming implementation follows async generator patterns"

  compliance_validation:
    - "AI chat streaming remains accessible"
    - "Brazilian Portuguese streaming responses supported"
    - "Real-time response requirements met"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "AG-UI protocol implementation may be complex"
      likelihood: "High"
      impact: "Medium"
      mitigation: "Start with basic streaming, enhance incrementally"

    risk_2:
      description: "Streaming format may not match expected protocol"
      likelihood: "Medium"
      impact: "High"
      mitigation: "Test against AG-UI specification, validate with test cases"

rollback_procedure:
  rollback_steps:
    - "Revert to original stub implementation"
    - "Add eslint-disable comment for require-yield"
    - "Document AG-UI implementation requirements"
```

### QC-006-T3: Implement OttomatorBackend Generator Function
```yaml
task_metadata:
  task_id: "QC-006-T3"
  parent_error_id: "QC-006"
  task_name: "Implement yield in OttomatorBackend.send method"
  estimated_time: "30 min"
  priority: "P1"

error_context:
  error_description: "Generator function declared with async * but has no yield statement"
  error_location: "src/features/ai-chat/backends/OttomatorBackend.ts:150"
  error_impact: "Backend implementation is non-functional stub, prevents Ottomator integration"
  related_errors: "QC-006-T1, QC-006-T2 (other backends)"

research_backed_solution:
  solution_approach: "Implement proper async generator for Ottomator streaming responses"
  authoritative_sources:
    - "https://github.com/ottomator/ottomator-docs"
    - "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*"
  best_practices: "Follow Ottomator API specifications for streaming responses"
  code_examples: |
    async *send(messages: ChatMessage[]): AsyncGenerator<ChatStreamChunk> {
      yield { type: 'start', timestamp: Date.now() };
      yield { type: 'chunk', content: 'Ottomator response' };
      yield { type: 'end', timestamp: Date.now() };
    }
  confidence_level: "85%"

implementation_steps:
  step_1:
    action: "Research Ottomator API specifications"
    command: "Review Ottomator documentation and streaming requirements"
    expected_result: "Understanding of Ottomator streaming format"
    validation: "Document streaming requirements"

  step_2:
    action: "Implement async generator with proper yields"
    command: "Edit src/features/ai-chat/backends/OttomatorBackend.ts lines 150-160"
    expected_result: "ESLint require-yield error resolved"
    validation: "Run bun lint on the file"

  step_3:
    action: "Test Ottomator streaming functionality"
    command: "bun test src/features/ai-chat/backends/OttomatorBackend.ts"
    expected_result: "Backend tests pass with streaming implementation"
    validation: "Verify streaming format compliance"

validation_criteria:
  functional_validation:
    - "ESLint require-yield error is resolved"
    - "Ottomator streaming works correctly"
    - "Backend properly yields ChatStreamChunk objects"

  quality_validation:
    - "OXLint passes with zero generator function errors"
    - "TypeScript type checking passes"
    - "Streaming implementation follows async generator patterns"

  compliance_validation:
    - "AI chat streaming remains accessible"
    - "Brazilian Portuguese streaming responses supported"
    - "Voice integration compatibility maintained"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Ottomator API specifications may be unclear"
      likelihood: "Medium"
      impact: "Medium"
      mitigation: "Research thoroughly, start with basic implementation"

    risk_2:
      description: "Streaming implementation may affect voice integration"
      likelihood: "Low"
      impact: "Medium"
      mitigation: "Test voice compatibility, ensure streaming doesn't interfere"

rollback_procedure:
  rollback_steps:
    - "Revert to original stub implementation"
    - "Add eslint-disable comment for require-yield"
    - "Document Ottomator implementation requirements"
```

---

## P2 MEDIUM PRIORITY TASKS (Code Quality, Maintainability)

### QC-001-T1: Separate useAccessibility Hook from AccessibilityProvider
```yaml
task_metadata:
  task_id: "QC-001-T1"
  parent_error_id: "QC-001"
  task_name: "Move useAccessibility hook to separate file"
  estimated_time: "20 min"
  priority: "P2"

error_context:
  error_description: "Exporting non-component (useAccessibility hook) with component (AccessibilityProvider) violates Fast Refresh rules"
  error_location: "src/components/accessibility/AccessibilityProvider.tsx:269"
  error_impact: "Affects development experience, Fast Refresh may not work properly"
  related_errors: "QC-002 (multiple similar violations)"

research_backed_solution:
  solution_approach: "Move hooks and utilities to separate files following React component export best practices"
  authoritative_sources:
    - "https://react.dev/reference/react/components#component-exports"
    - "https://github.com/facebook/react/issues/13991"
  best_practices: "Component files should only export components, hooks in separate files"
  code_examples: |
    // Create: src/components/accessibility/hooks/useAccessibility.ts
    export function useAccessibility() {
      const context = useContext(AccessibilityContext);
      // ... hook implementation
    }

    // In AccessibilityProvider.tsx, remove hook export
    export function AccessibilityProvider({ children }) {
      // ... component only
    }
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Create hooks directory and useAccessibility.ts file"
    command: "mkdir -p src/components/accessibility/hooks && touch src/components/accessibility/hooks/useAccessibility.ts"
    expected_result: "New file created for accessibility hooks"
    validation: "File exists and is accessible"

  step_2:
    action: "Move useAccessibility hook to separate file"
    command: "Extract hook from AccessibilityProvider.tsx to hooks/useAccessibility.ts"
    expected_result: "Hook moved to separate file, imports updated"
    validation: "Run bun type-check to verify imports"

  step_3:
    action: "Remove hook export from component file"
    command: "Remove useAccessibility export from AccessibilityProvider.tsx"
    expected_result: "Component file only exports components"
    validation: "Run bun lint to verify Fast Refresh compliance"

validation_criteria:
  functional_validation:
    - "useAccessibility hook works identically after refactoring"
    - "All components using the hook continue to function"
    - "No breaking changes in accessibility functionality"

  quality_validation:
    - "OXLint useComponentExportOnlyModules rule passes"
    - "TypeScript type checking passes"
    - "Fast Refresh works properly in development"

  compliance_validation:
    - "Brazilian accessibility features remain functional"
    - "WCAG compliance maintained"
    - "Portuguese voice accessibility unaffected"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Import paths may break after moving hook"
      likelihood: "Medium"
      impact: "Medium"
      mitigation: "Update all import statements systematically, test thoroughly"

rollback_procedure:
  rollback_steps:
    - "Move useAccessibility hook back to AccessibilityProvider.tsx"
    - "Update import statements to original paths"
    - "Verify all functionality is restored"
```

### QC-002-T1: Separate usePaywall Hook from PaywallModal
```yaml
task_metadata:
  task_id: "QC-002-T1"
  parent_error_id: "QC-002"
  task_name: "Move usePaywall hook to separate file"
  estimated_time: "20 min"
  priority: "P2"

error_context:
  error_description: "Exporting non-component (usePaywall hook) with component (PaywallModal) violates Fast Refresh rules"
  error_location: "src/components/billing/PaywallModal.tsx:48"
  error_impact: "Affects development experience, Fast Refresh may not work properly"
  related_errors: "QC-002 (multiple similar violations)"

research_backed_solution:
  solution_approach: "Move billing hooks to dedicated hooks directory following React component export best practices"
  authoritative_sources:
    - "https://react.dev/reference/react/components#component-exports"
    - "https://kentcdodds.com/blog/how-to-use-react-hooks-effectively"
  best_practices: "Separate concerns: components in component files, hooks in hook files"
  code_examples: |
    // Create: src/hooks/billing/usePaywall.ts
    export function usePaywall() {
      const [isOpen, setIsOpen] = useState(false);
      // ... hook implementation
    }

    // In PaywallModal.tsx, remove hook export
    export function PaywallModal({ open, onOpenChange, feature }) {
      // ... component only
    }
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Create billing hooks directory structure"
    command: "mkdir -p src/hooks/billing && touch src/hooks/billing/usePaywall.ts"
    expected_result: "New file created for billing hooks"
    validation: "Directory and file created successfully"

  step_2:
    action: "Move usePaywall hook to separate file"
    command: "Extract hook from PaywallModal.tsx to src/hooks/billing/usePaywall.ts"
    expected_result: "Hook moved to separate file with proper imports"
    validation: "Run bun type-check to verify imports"

  step_3:
    action: "Remove hook export from component file"
    command: "Remove usePaywall export from PaywallModal.tsx"
    expected_result: "Component file only exports PaywallModal"
    validation: "Run bun lint to verify Fast Refresh compliance"

validation_criteria:
  functional_validation:
    - "usePaywall hook works identically after refactoring"
    - "PaywallModal component continues to function properly"
    - "No breaking changes in billing functionality"

  quality_validation:
    - "OXLint useComponentExportOnlyModules rule passes"
    - "TypeScript type checking passes"
    - "Fast Refresh works properly for billing components"

  compliance_validation:
    - "Brazilian billing features remain functional"
    - "Portuguese text in paywall displays correctly"
    - "Accessibility compliance maintained"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Import paths may break in components using usePaywall"
      likelihood: "Medium"
      impact: "Medium"
      mitigation: "Update all import statements systematically, test billing flow"

rollback_procedure:
  rollback_steps:
    - "Move usePaywall hook back to PaywallModal.tsx"
    - "Update import statements to original paths"
    - "Verify billing functionality is restored"
```

### QC-002-T2: Separate useCalendar Hook from CalendarProvider
```yaml
task_metadata:
  task_id: "QC-002-T2"
  parent_error_id: "QC-002"
  task_name: "Move useCalendar hook to separate file"
  estimated_time: "20 min"
  priority: "P2"

error_context:
  error_description: "Exporting non-component (useCalendar hook) with component (CalendarProvider) violates Fast Refresh rules"
  error_location: "src/components/calendar/calendar-context.tsx:325"
  error_impact: "Affects development experience, Fast Refresh may not work properly"
  related_errors: "QC-002 (multiple similar violations)"

research_backed_solution:
  solution_approach: "Move calendar hooks to dedicated hooks directory while maintaining context relationship"
  authoritative_sources:
    - "https://react.dev/reference/react/components#component-exports"
    - "https://kentcdodds.com/blog/application-state-management-with-react"
  best_practices: "Context providers and their hooks can be in same file, but separate from other exports"
  code_examples: |
    // Create: src/hooks/calendar/useCalendar.ts
    import { useContext } from 'react';
    import { CalendarContext } from '@/components/calendar/calendar-context';

    export function useCalendar() {
      const context = useContext(CalendarContext);
      if (context === undefined) {
        throw new Error('useCalendar must be used within a CalendarProvider');
      }
      return context;
    }
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Create calendar hooks directory and useCalendar.ts file"
    command: "mkdir -p src/hooks/calendar && touch src/hooks/calendar/useCalendar.ts"
    expected_result: "New file created for calendar hooks"
    validation: "Directory and file created successfully"

  step_2:
    action: "Move useCalendar hook to separate file"
    command: "Extract hook from calendar-context.tsx to hooks/useCalendar.ts"
    expected_result: "Hook moved with proper context import"
    validation: "Run bun type-check to verify imports"

  step_3:
    action: "Remove hook export from context file"
    command: "Remove useCalendar export from calendar-context.tsx"
    expected_result: "Context file only exports CalendarProvider"
    validation: "Run bun lint to verify Fast Refresh compliance"

validation_criteria:
  functional_validation:
    - "useCalendar hook works identically after refactoring"
    - "Calendar functionality remains intact"
    - "Financial calendar features work properly"

  quality_validation:
    - "OXLint useComponentExportOnlyModules rule passes"
    - "TypeScript type checking passes"
    - "Fast Refresh works for calendar components"

  compliance_validation:
    - "Brazilian financial calendar features maintained"
    - "Portuguese date/time formatting works"
    - "Accessibility compliance for calendar maintained"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Context import may cause circular dependencies"
      likelihood: "Low"
      impact: "Medium"
      mitigation: "Ensure proper import structure, test calendar functionality thoroughly"

rollback_procedure:
  rollback_steps:
    - "Move useCalendar hook back to calendar-context.tsx"
    - "Update import statements to original paths"
    - "Verify calendar functionality is restored"
```

### QC-002-T3: Fix Component Default Export Violations
```yaml
task_metadata:
  task_id: "QC-002-T3"
  parent_error_id: "QC-002"
  task_name: "Fix default export violations in multiple files"
  estimated_time: "40 min"
  priority: "P2"

error_context:
  error_description: "Multiple components using default exports combined with named exports violate Fast Refresh rules"
  error_location: "Multiple files with default exports"
  error_impact: "Affects development experience, Fast Refresh may not work properly"
  related_errors: "QC-002 (multiple similar violations)"

research_backed_solution:
  solution_approach: "Convert default exports to named exports or separate components from utilities"
  authoritative_sources:
    - "https://react.dev/reference/react/components#component-exports"
    - "https://typescript-eslint.io/rules/import/no-default-export"
  best_practices: "Use named exports for better tree-shaking and Fast Refresh compatibility"
  code_examples: |
    // Before (mixed exports):
    export default FinancialCalendar;
    export { someUtility };

    // After (named only):
    export { FinancialCalendar };
    export { someUtility };
  confidence_level: "90%"

implementation_steps:
  step_1:
    action: "Identify all files with mixed export violations"
    command: "Review QC-002 catalog for default export violations"
    expected_result: "List of files needing export fixes"
    validation: "Verify all affected files identified"

  step_2:
    action: "Convert default exports to named exports"
    command: "Update each file to use only named exports"
    expected_result: "All files use consistent export patterns"
    validation: "Run bun lint to verify compliance"

  step_3:
    action: "Update import statements throughout codebase"
    command: "Find and update all imports of default-exported components"
    expected_result: "All imports updated to named imports"
    validation: "Run bun type-check to verify no broken imports"

validation_criteria:
  functional_validation:
    - "All components import correctly with new named exports"
    - "No breaking changes in functionality"
    - "Application runs without import errors"

  quality_validation:
    - "OXLint useComponentExportOnlyModules rule passes for all files"
    - "TypeScript type checking passes"
    - "Fast Refresh works properly across all components"

  compliance_validation:
    - "Brazilian financial features remain functional"
    - "Portuguese text displays correctly"
    - "Accessibility compliance maintained"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Breaking import changes may affect multiple files"
      likelihood: "High"
      impact: "High"
      mitigation: "Systematic search and replace, thorough testing after changes"

    risk_2:
      description: "Some third-party libraries may expect default exports"
      likelihood: "Low"
      impact: "Medium"
      mitigation: "Identify external dependencies, handle separately if needed"

rollback_procedure:
  rollback_steps:
    - "Revert all export changes to original state"
    - "Update import statements back to default imports"
    - "Verify application functionality is restored"
```

### QC-002-T4: Separate Utility Exports from Component Files
```yaml
task_metadata:
  task_id: "QC-002-T4"
  parent_error_id: "QC-002"
  task_name: "Move utility exports from UI component files"
  estimated_time: "30 min"
  priority: "P2"

error_context:
  error_description: "UI component files exporting utilities (badgeVariants, buttonVariants) with components"
  error_location: "src/components/ui/badge.tsx:39, src/components/ui/button.tsx:198"
  error_impact: "Affects development experience, Fast Refresh may not work properly"
  related_errors: "QC-002 (multiple similar violations)"

research_backed_solution:
  solution_approach: "Move utility exports to separate index files or dedicated utility files"
  authoritative_sources:
    - "https://react.dev/reference/react/components#component-exports"
    - "https://www.patterns.dev/posts/component-composition"
  best_practices: "Component files should only export components, utilities in separate files"
  code_examples: |
    // Before (mixed exports in badge.tsx):
    export function Badge({ ... }) { ... }
    export { badgeVariants };

    // After (separate files):
    // badge.tsx - only component
    export function Badge({ ... }) { ... }

    // badge.ts - utilities
    export { badgeVariants };

    // index.ts - re-export
    export { Badge } from './badge';
    export { badgeVariants } from './badge';
  confidence_level: "90%"

implementation_steps:
  step_1:
    action: "Create utility files for badge and button variants"
    command: "Create src/components/ui/badge.ts and button.ts for utilities"
    expected_result: "Utility files created for variant exports"
    validation: "Files created successfully"

  step_2:
    action: "Move variant exports to utility files"
    command: "Extract badgeVariants and buttonVariants to separate files"
    expected_result: "Component files only export components"
    validation: "Run bun type-check to verify imports"

  step_3:
    action: "Update import statements"
    command: "Update all imports to use new file structure"
    expected_result: "All imports work with new structure"
    validation: "Run bun lint to verify Fast Refresh compliance"

validation_criteria:
  functional_validation:
    - "Badge and button components work identically"
    - "Variant utilities accessible from new locations"
    - "No breaking changes in UI functionality"

  quality_validation:
    - "OXLint useComponentExportOnlyModules rule passes"
    - "TypeScript type checking passes"
    - "Fast Refresh works properly for UI components"

  compliance_validation:
    - "Brazilian UI elements remain functional"
    - "Accessibility compliance maintained"
    - "Portuguese text displays correctly"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Breaking changes may affect many UI components"
      likelihood: "Medium"
      impact: "Medium"
      mitigation: "Systematic import updates, thorough UI testing"

rollback_procedure:
  rollback_steps:
    - "Move variant exports back to original component files"
    - "Update import statements to original paths"
    - "Verify UI functionality is restored"
```

### QC-007-T1: Fix Irregular Whitespace Character
```yaml
task_metadata:
  task_id: "QC-007-T1"
  parent_error_id: "QC-007"
  task_name: "Remove irregular whitespace character from ChatSettings"
  estimated_time: "15 min"
  priority: "P2"

error_context:
  error_description: "Irregular whitespace character (zero-width space) at beginning of file"
  error_location: "src/features/ai-chat/components/ChatSettings.tsx:1"
  error_impact: "Invisible character may cause encoding issues or linting problems"
  related_errors: "None"

research_backed_solution:
  solution_approach: "Remove invisible whitespace character using editor or command-line tools"
  authoritative_sources:
    - "https://eslint.org/docs/rules/no-irregular-whitespace"
    - "https://www.unicode.org/faq/utf_bom.html#BOM"
  best_practices: "Files should use standard ASCII/UTF-8 encoding without invisible characters"
  code_examples: |
    # Using sed to remove zero-width spaces:
    sed -i 's/\u200B//g' src/features/ai-chat/components/ChatSettings.tsx

    # Or using editor with visible whitespace
  confidence_level: "95%"

implementation_steps:
  step_1:
    action: "Identify and remove irregular whitespace character"
    command: "Open file in editor with visible whitespace or use sed command"
    expected_result: "Irregular whitespace character removed"
    validation: "Run bun lint on the file"

  step_2:
    action: "Verify file encoding is correct"
    command: "Check file encoding with file command or editor"
    expected_result: "File uses standard UTF-8 encoding"
    validation: "No encoding warnings in editor"

  step_3:
    action: "Test ChatSettings component functionality"
    command: "Load chat settings and verify functionality"
    expected_result: "Component works normally after whitespace fix"
    validation: "No visual or functional issues"

validation_criteria:
  functional_validation:
    - "ChatSettings component renders correctly"
    - "No visual artifacts from whitespace character"
    - "Component functionality unchanged"

  quality_validation:
    - "OXLint no-irregular-whitespace rule passes"
    - "File encoding is standard UTF-8"
    - "No linting warnings for the file"

  compliance_validation:
    - "Chat settings remain accessible"
    - "Portuguese text displays correctly"
    - "No impact on Brazilian compliance"

risk_assessment:
  implementation_risks:
    risk_1:
      description: "Removing character might accidentally affect legitimate content"
      likelihood: "Low"
      impact: "Low"
      mitigation: "Carefully target only the invisible character, verify content unchanged"

rollback_procedure:
  rollback_steps:
    - "Restore file from git if character removal caused issues"
    - "Verify original functionality is restored"
    - "Investigate alternative solutions if needed"
```

---

## TASK SEQUENCING STRATEGY

### Parallel Execution Tracks

#### Track 1: Security & Type Safety (P1 - Critical)
```
QC-005-T1 → QC-003-T1 (Sequential: Security first, then types)
Estimated Time: 60 minutes
```

#### Track 2: React Performance (P1 - High)
```
QC-004-T1 || QC-004-T2 (Parallel: Different components)
Estimated Time: 20 minutes
```

#### Track 3: Backend Implementation (P1 - High)
```
QC-006-T1 || QC-006-T2 || QC-006-T3 (Parallel: Different backends)
Estimated Time: 30 minutes
```

#### Track 4: Code Quality (P2 - Medium)
```
QC-001-T1 → QC-002-T1 → QC-002-T2 → QC-002-T3 → QC-002-T4 (Sequential: Dependencies)
Estimated Time: 130 minutes
```

#### Track 5: File Cleanup (P2 - Low)
```
QC-007-T1 (Independent: Can run anytime)
Estimated Time: 15 minutes
```

### Execution Timeline

**Phase 1: Critical Security & Performance (First Hour)**
- Minutes 0-20: QC-005-T1 (Security fix)
- Minutes 20-40: QC-003-T1 (Type safety)
- Minutes 40-60: QC-004-T1 & QC-004-T2 (Parallel React fixes)

**Phase 2: Backend Implementation (Next 30 Minutes)**
- Minutes 60-90: QC-006-T1, QC-006-T2, QC-006-T3 (Parallel backend fixes)

**Phase 3: Code Quality Refactoring (Next 2+ Hours)**
- Minutes 90-230: Sequential component export fixes
- Can be spread across multiple sprints

### Dependency Management

**Critical Path Dependencies:**
1. **Security fixes must be completed first** (QC-005-T1)
2. **Type safety fixes before application fixes** (QC-003-T1)
3. **React key fixes before component refactoring** (QC-004-T1, QC-004-T2)
4. **Component export fixes can be done incrementally** (QC-001-T1, QC-002 series)

**Parallel Opportunities:**
- Different component files can be fixed simultaneously
- Backend implementations are independent
- File cleanup doesn't block other work

---

## BRAZILIAN COMPLIANCE VALIDATION

### LGPD Compliance Requirements
All tasks must maintain:
- **Data Protection**: User consent and privacy controls
- **Audit Trails**: Logging for financial operations
- **Data Minimization**: Only necessary data collection
- **User Rights**: Data export and deletion capabilities

### Financial Regulations
- **PIX Compliance**: Transaction security and validation
- **BCB Standards**: Central Bank of Brazil requirements
- **Accessibility**: WCAG 2.1 AA+ for Brazilian users
- **Portuguese Language**: Native language support

### Validation Checklist per Task
```yaml
brazilian_compliance_validation:
  lgpd_requirements:
    - "User consent mechanisms remain functional"
    - "Data processing transparency maintained"
    - "Audit logging for sensitive operations"

  financial_compliance:
    - "PIX transaction security upheld"
    - "Brazilian financial data protection"
    - "Currency and formatting compliance"

  accessibility_compliance:
    - "WCAG 2.1 AA+ standards maintained"
    - "Portuguese voice accessibility functional"
    - "Screen reader compatibility preserved"

  language_localization:
    - "Portuguese text displays correctly"
    - "Brazilian cultural context maintained"
    - "Date/time formatting for Brazil"
```

---

## RISK ASSESSMENT & MITIGATION

### High-Risk Areas

#### 1. Import/Export Refactoring (QC-002 series)
**Risk Level**: High
**Impact**: Breaking changes across application
**Mitigation**:
- Systematic search and replace
- Comprehensive testing after each change
- Incremental rollout with validation

#### 2. Backend Implementation (QC-006 series)
**Risk Level**: Medium-High
**Impact**: AI chat functionality may break
**Mitigation**:
- Thorough API research before implementation
- Start with minimal viable implementation
- Extensive testing of streaming functionality

#### 3. Database Type Safety (QC-003-T1)
**Risk Level**: Medium
**Impact**: Database operations could fail
**Mitigation**:
- Test database connection script thoroughly
- Verify query structure matches types
- Have rollback plan ready

### Medium-Risk Areas

#### 1. React Key Prop Fixes (QC-004 series)
**Risk Level**: Medium
**Impact**: Rendering issues in billing components
**Mitigation**:
- Use semantic keys that are guaranteed unique
- Test component behavior thoroughly
- Monitor React console for warnings

#### 2. Security Regex Fix (QC-005-T1)
**Risk Level**: Medium
**Impact**: Security validation could break
**Mitigation**:
- Test security functionality extensively
- Verify control character removal still works
- Have security review process

### Low-Risk Areas

#### 1. Whitespace Cleanup (QC-007-T1)
**Risk Level**: Low
**Impact**: Minimal functionality impact
**Mitigation**:
- Careful character removal
- Verify file integrity
- Simple rollback if needed

---

## QUALITY GATES & VALIDATION

### Automated Validation
```yaml
quality_gates:
  lint_validation:
    tool: "OXLint"
    criteria: "Zero errors for addressed issues"
    command: "bun lint"

  type_validation:
    tool: "TypeScript"
    criteria: "Zero type errors"
    command: "bun type-check"

  test_validation:
    tool: "Vitest"
    criteria: "All tests pass"
    command: "bun test"

  build_validation:
    tool: "Build System"
    criteria: "Successful build"
    command: "bun build"
```

### Manual Validation
```yaml
manual_validation:
  functional_testing:
    criteria: "All affected features work correctly"
    process: "Manual testing of user workflows"

  accessibility_testing:
    criteria: "WCAG compliance maintained"
    process: "Screen reader and keyboard navigation testing"

  brazilian_compliance_testing:
    criteria: "Brazilian requirements met"
    process: "Localization and compliance testing"
```

### Rollback Criteria
```yaml
rollback_triggers:
  critical_failures:
    - "Application fails to build"
    - "Security vulnerabilities introduced"
    - "Brazilian compliance violations"

  functional_failures:
    - "Core features broken"
    - "Accessibility issues introduced"
    - "Performance regressions"

  quality_failures:
    - "Type errors cannot be resolved"
    - "Linting errors persist"
    - "Test failures exceed threshold"
```

---

## IMPLEMENTATION ROADMAP

### Week 1: Critical Issues (Days 1-2)
**Priority**: P0-P1 Issues
**Duration**: 4 hours
**Tasks**: QC-005-T1, QC-003-T1, QC-004-T1, QC-004-T2, QC-006 series

### Week 1: Code Quality (Days 3-5)
**Priority**: P2 Issues
**Duration**: 6 hours spread across days
**Tasks**: QC-001-T1, QC-002 series, QC-007-T1

### Week 2: Validation & Polish
**Priority**: All Issues
**Duration**: 2 hours
**Tasks**: Comprehensive testing, documentation, final validation

### Success Metrics
- **Zero OXLint errors for addressed issues**
- **100% TypeScript compilation success**
- **All tests passing**
- **No regression in functionality**
- **Brazilian compliance maintained**
- **Development experience improved**

---

## CONCLUSION

This atomic task decomposition provides a systematic approach to resolving all 23 quality control errors while maintaining the high standards required for AegisWallet's Brazilian financial market presence. The plan prioritizes security and critical functionality while ensuring Brazilian compliance and accessibility requirements are maintained throughout the process.

The parallel execution strategy enables efficient resolution of issues while the comprehensive validation criteria ensure quality and reliability. Each task includes detailed rollback procedures to minimize risk during implementation.

**Next Steps**: Begin with P1 critical security and performance fixes, followed by systematic code quality improvements. Regular validation and testing will ensure successful implementation without disrupting the user experience.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28T14:04:00.000Z
**Next Review**: After P1 task completion
**Quality Gate Status**: 🔄 READY FOR IMPLEMENTATION
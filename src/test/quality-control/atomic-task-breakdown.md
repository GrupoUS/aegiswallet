# AegisWallet Quality Control - Atomic Task Breakdown
**Generated**: 2025-11-11T03:13:35Z  
**Priority**: P0 → P1 → P2 → P3  
**Quality Standard**: ≥95% confidence per task

## P0 CRITICAL TASKS (Build-Blocking)

### Task QC-3.1: Fix TypeScript Database Schema Mismatches
**Time**: 15-20 minutes  
**Dependencies**: None  
**Success Criteria**: 
- [ ] `bunx tsc --noEmit` exits with code 0
- [ ] Database schema types align with Supabase types
- [ ] No type errors in `src/server/routers/pix.ts`, `src/server/routers/transactions.ts`

**Rollback Plan**: 
```bash
git checkout HEAD -- src/types/database.types.ts src/server/routers/
```

**Implementation Steps**:
1. Examine current database schema in `supabase/migrations/`
2. Generate fresh types: `bunx supabase gen types typescript --local > src/types/database.types.ts`
3. Fix type mismatches in router files
4. Validate with `bunx tsc --noEmit`

**Quality Gate**: TypeScript compilation must pass completely

### Task QC-3.2: Fix React Testing Framework Issues  
**Time**: 10-15 minutes  
**Dependencies**: None  
**Success Criteria**:
- [ ] Install missing @types/jsdom dependency
- [ ] Fix React.act import issues in test files
- [ ] `bun test` runs without React.act errors

**Rollback Plan**:
```bash
bun remove @types/jsdom
git checkout HEAD -- src/test/quality-control/voice-component-type-safety.test.ts
```

**Implementation Steps**:
1. Install dependency: `bun add -D @types/jsdom`
2. Fix import statements in test files: `import { act } from 'react'`
3. Remove deprecated react-dom/test-utils imports
4. Test with `bun test:unit src/test/quality-control/voice-component-type-safety.test.ts`

**Quality Gate**: No React.act function errors

### Task QC-3.3: Fix Component Export Problems
**Time**: 15-20 minutes  
**Dependencies**: Task QC-3.1 (TypeScript types)  
**Success Criteria**:
- [ ] All UI component imports resolve without errors
- [ ] `bun test:unit src/test/quality-control/component-export-problems.test.ts` passes
- [ ] No "Cannot find module" errors for UI components

**Rollback Plan**:
```bash
git checkout HEAD -- src/components/ui/
```

**Implementation Steps**:
1. Create missing UI component files (button, sheet, bento-grid, etc.)
2. Fix component export patterns (default + named exports)
3. Create proper index.ts files for component re-exports
4. Test import resolution

**Quality Gate**: All component imports resolve successfully

### Task QC-3.4: Fix Database Table Schema Issues
**Time**: 20 minutes  
**Dependencies**: Task QC-3.1 (TypeScript types)  
**Success Criteria**:
- [ ] `pix_transactions` and `pix_qr_codes` tables exist in migrations
- [ ] Database queries in routers reference correct table names
- [ ] No "column does not exist" errors

**Rollback Plan**:
```bash
git checkout HEAD -- supabase/migrations/ src/server/routers/
```

**Implementation Steps**:
1. Review existing migrations for PIX tables
2. Create missing table definitions if needed
3. Update router queries to use correct table names
4. Test database connectivity

**Quality Gate**: Database queries execute without table/column errors

## P1 HIGH PRIORITY TASKS (Security & Compliance)

### Task QC-3.5: Fix LGPD Compliance Test Issues
**Time**: 15-20 minutes  
**Dependencies**: Task QC-3.2 (Testing framework fixed)  
**Success Criteria**:
- [ ] LGPD compliance tests pass without errors
- [ ] Data retention policies implemented in code
- [ ] Consent mechanisms properly validated

**Rollback Plan**:
```bash
git checkout HEAD -- src/lib/lgpd/ src/test/quality-control/lgpd-compliance-issues.test.ts
```

**Implementation Steps**:
1. Review LGPD compliance test failures
2. Implement missing data retention policies
3. Fix consent mechanism validation
4. Add proper audit trail functionality

**Quality Gate**: All LGPD compliance tests pass

### Task QC-3.6: Fix Voice Command Security Issues
**Time**: 15-20 minutes  
**Dependencies**: Task QC-3.2 (Testing framework fixed)  
**Success Criteria**:
- [ ] No private method accessibility violations
- [ ] Voice confirmation tests pass
- [ ] Authentication bypass protections functional

**Rollback Plan**:
```bash
git checkout HEAD -- src/lib/security/ src/test/security/voiceConfirmation.test.ts
```

**Implementation Steps**:
1. Fix method visibility in voice security classes
2. Update test access patterns to use public APIs
3. Add proper authentication validation
4. Test voice command security

**Quality Gate**: Voice security tests pass, no access violations

### Task QC-3.7: Fix NLU Engine Performance Issues
**Time**: 20 minutes  
**Dependencies**: Task QC-3.2 (Testing framework fixed)  
**Success Criteria**:
- [ ] NLU accuracy improves from 54.76% to ≥90%
- [ ] Entity extraction works for amounts, names, dates
- [ ] Brazilian Portuguese terminology handled correctly

**Rollback Plan**:
```bash
git checkout HEAD -- src/lib/nlu/ src/test/nlu/
```

**Implementation Steps**:
1. Analyze NLU pattern matching algorithms
2. Improve Brazilian Portuguese financial terminology
3. Fix entity extraction for amounts/dates/names
4. Increase training data for better accuracy

**Quality Gate**: NLU tests show ≥90% accuracy improvement

## P2 MEDIUM PRIORITY TASKS (Performance & Maintainability)

### Task QC-3.8: Auto-Fix CSS Class Ordering
**Time**: 10-15 minutes  
**Dependencies**: None  
**Success Criteria**:
- [ ] All 76 CSS class ordering errors auto-fixed
- [ ] `bun lint` shows 0 CSS ordering warnings
- [ ] UI components maintain visual consistency

**Rollback Plan**:
```bash
git checkout HEAD -- src/components/
```

**Implementation Steps**:
1. Run Biome with --write --unsafe flag
2. Review changes for visual consistency
3. Manually fix any problematic class orderings
4. Validate with `bun lint`

**Quality Gate**: Zero CSS ordering warnings

### Task QC-3.9: Fix Accessibility Issues
**Time**: 15-20 minutes  
**Dependencies**: Task QC-3.3 (Component exports)  
**Success Criteria**:
- [ ] All semantic HTML violations fixed
- [ ] ARIA labels added where needed
- [ ] No `role="button"` without actual button elements

**Rollback Plan**:
```bash
git checkout HEAD -- src/components/ui/event-calendar/ src/components/voice/
```

**Implementation Steps**:
1. Replace `role="button"` with actual `<button>` elements
2. Add missing ARIA labels
3. Ensure proper heading hierarchy
4. Test with accessibility tools

**Quality Gate**: Accessibility tests pass, semantic HTML validated

### Task QC-3.10: Remove Unused Code
**Time**: 10-15 minutes  
**Dependencies**: None  
**Success Criteria**:
- [ ] All unused variables and imports removed
- [ ] No `noUnusedVariables` or `noUnusedImports` warnings
- [ ] Code base cleaned without breaking functionality

**Rollback Plan**:
```bash
git checkout HEAD -- src/
```

**Implementation Steps**:
1. Run automated unused code detection
2. Remove unused variables, imports, functions
3. Verify no functionality is broken
4. Test application behavior

**Quality Gate**: No unused code warnings, functionality preserved

## P3 LOW PRIORITY TASKS (Code Quality)

### Task QC-3.11: Fix React Array Index Keys
**Time**: 5-10 minutes  
**Dependencies**: None  
**Success Criteria**:
- [ ] All `noArrayIndexKey` warnings resolved
- [ ] Proper unique keys used in React lists
- [ ] No performance warnings

**Rollback Plan**:
```bash
git checkout HEAD -- src/routes/ src/components/voice/
```

**Implementation Steps**:
1. Find all array index key usage
2. Replace with unique identifiers
3. Test rendering performance
4. Validate React key warnings gone

**Quality Gate**: Zero React key warnings

### Task QC-3.12: Final Quality Validation
**Time**: 15-20 minutes  
**Dependencies**: All previous tasks complete  
**Success Criteria**:
- [ ] `bun quality` passes completely
- [ ] `bun test:coverage` shows ≥90% coverage
- [ ] All quality metrics improve to ≥7/10

**Rollback Plan**:
```bash
git checkout HEAD -- . # Full rollback if validation fails
```

**Implementation Steps**:
1. Run full quality control suite
2. Verify all metrics improved
3. Test application end-to-end
4. Document final quality status

**Quality Gate**: All quality metrics ≥7/10

## Dependency Graph

```
QC-3.1 (TypeScript) → QC-3.4 (Database)
QC-3.1 (TypeScript) → QC-3.3 (Component Exports)
QC-3.2 (Testing) → QC-3.5 (LGPD)
QC-3.2 (Testing) → QC-3.6 (Voice Security)  
QC-3.2 (Testing) → QC-3.7 (NLU Engine)
QC-3.3 (Component Exports) → QC-3.9 (Accessibility)
QC-3.4 (Database) → QC-3.5 (LGPD) [data handling]
All tasks → QC-3.12 (Final Validation)
```

## Success Metrics Targets

| Metric | Current | Target | Validation |
|--------|---------|--------|------------|
| TypeScript Errors | 200+ | 0 | `bunx tsc --noEmit` |
| Lint Errors | 76 | 0 | `bun lint` |
| Test Failures | 68 | 0 | `bun test:coverage` |
| NLU Accuracy | 54.76% | ≥90% | Story-1.2 tests |
| CSS Warnings | 76 | 0 | `bun lint` |
| Code Quality Score | 0/10 | ≥7/10 | Composite metric |

## Time Estimate Summary
- **P0 Critical**: 65-75 minutes
- **P1 High**: 50-60 minutes  
- **P2 Medium**: 35-50 minutes
- **P3 Low**: 20-30 minutes
- **Total Estimated**: 170-215 minutes (3-3.5 hours)

**Execution Strategy**: Complete all P0 tasks first, then P1, etc. Each task has quality gates and rollback plans.
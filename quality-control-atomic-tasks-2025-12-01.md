# AegisWallet Quality Control Atomic Tasks - Phase 3
**Generated**: 2025-12-01T02:30Z
**Scope**: Decomposition of Phase 2 high-priority errors (15 Critical/High P0/P1 + top 50 High P1/P2, grouped into 5 groups covering ~85 errors).
**Total Tasks**: 5 atomic tasks (one per group/file for focused fixes).
**By Priority**: P0: 1, P1: 2, P2: 2.
**Execution Strategy**: All **parallel** (independent file-level fixes, no cross-file dependencies; types before impl not required here). Sequential only if running lint/type-check gates between.
**Est. Total Time**: 100 min (20 min/task). Each task independently verifiable with `bun lint <file>`, `bun type-check`.

## Pre-execution Checklist
- [ ] Phase 1 complete: Error catalog `quality-control-error-catalog-2025-12-01.md` generated from lint-report-*.txt.
- [ ] Phase 2 complete: Research report `quality-control-research-report-2025-12-01.md` with solutions/confidence ≥85%.
- [ ] Codebase backed up: `git add . && git commit -m "QC Phase 3 pre-fix backup"`.
- [ ] Environment ready: `bun install`, `bun type-check` baseline passes, Neon DB accessible.
- [ ] Run `bun lint` baseline for comparison.

## Tasks Grouped by Error Group/Dependency Order (All Parallel)

### Group 1: QC-001 noExplicitAny (P0 Critical, Compliance/LGPD, ~10 errors)
**Files**: `scripts/lgpd-compliance-validator.ts` (lines 235,368,449).
**Impact**: Type bypass in PII scanning → LGPD violation.

#### QC-001-T1: Implement typed SchemaColumn interface + guards for Drizzle metadata
**task_metadata**:
- name: Replace `as any[]` casts with `SchemaColumn[]` + type guards in LGPD column validation loops
- est_time: 20 min
- priority: P0

**error_context**:
- description: `noExplicitAny` on Drizzle `unknown[][]` results disables TS narrowing/exhaustiveness in consent/audit/sensitive field checks
- location: `scripts/lgpd-compliance-validator.ts` lines 235(`consentColumns`), 368(`auditColumns`), 449(`sensitiveFields`)
- impact: Critical - unvalidated personal data (CPF/email) processing risks LGPD fines (Art. 6 adequacy)
- related: Drizzle raw SQL, information_schema.columns

**research_backed_solution**:
- approach: Define `interface SchemaColumn`, assert + `filter` guard for runtime safety
- sources: [TS Handbook any/unknown](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any-unknown-never-object-void), [Biome noExplicitAny](https://biomejs.dev/linter/rules/no-explicit-any/), [Drizzle raw typing](https://orm.drizzle.team/docs/sql#raw-sql)
- examples:
  ```typescript
  interface SchemaColumn { column_name: string; data_type: string; }
  const cols = (result as SchemaColumn[]).filter((col): col is SchemaColumn => !!col?.column_name);
  ```
- confidence: 100%

**implementation_steps**:
1. Add `interface SchemaColumn { table_name?: string; column_name: string; data_type?: string; is_nullable?: string; }` after imports (~line 10).
2. Replace 3 `as any[]` → `as SchemaColumn[]).filter((col): col is SchemaColumn => typeof col?.column_name === 'string')`.
3. Run `bun lint scripts/lgpd-compliance-validator.ts` → expect "noExplicitAny" errors fixed; `bun test:e2e:lgpd` validates functionally.

**validation_criteria**:
- functional: Script runs, extracts columns correctly (log sample output)
- quality: `bun type-check && bun lint` passes file (0 noExplicitAny)
- compliance: Typed PII handling (grep -v "any\[" file)

**risk_assessment**:
- risk1: Guard filters valid columns → mitigation: Test with `bun scripts/lgpd-compliance-validator.ts` on real DB
- risk2: Interface incomplete → mitigation: Query `information_schema.columns` once to verify fields

**rollback_procedure**:
1. `git checkout -- scripts/lgpd-compliance-validator.ts`
2. Re-run original script to confirm no regression

---

### Group 2: QC-002 noNonNullAssertion + QC-007 useAwait (P1 High, Financial DB Tests, ~25 errors)
**Files**: `scripts/test-final-integration.ts` (DB_URL! lines 17/46/51/91/146/182; async no-await line 142).
**Impact**: Env crash risk + perf waste in Neon/PIX tests.

#### QC-002-T1: Safe env validation + fix unused async in integration tests
**task_metadata**:
- name: Replace `!` assertions with runtime checks; remove unused async or add await in test-final-integration
- est_time: 20 min
- priority: P1

**error_context**:
- description: `process.env.DATABASE_URL!` assumes non-null (crash risk); `async testSSLCompliance()` lacks await
- location: Lines 17-182 (6 DB_URL!), 142 (async func)
- impact: High - financial DB tests fail in CI/CD (LGPD/PIX validation)
- related: @neondatabase/serverless, Neon env

**research_backed_solution**:
- approach: `process.env.VAR ?? throw Error()` or Zod parse; demote async if no await
- sources: [TS non-null!](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#non-null-assertion-operator-postfix), [Biome rules](https://biomejs.dev/linter/rules/no-non-null-assertion-operator/), [Neon env](https://neon.tech/docs/connect/query-serverless#environment-variables)
- examples:
  ```typescript
  const DB_URL = process.env.DATABASE_URL ?? (() => { throw new Error('DB required'); })();
  const sql = neon(DB_URL);
  ```
- confidence: 100%

**implementation_steps**:
1. Define `const getRequiredEnv = (key: string): string => process.env[key] ?? (() => { throw new Error(`${key} required`); })();` (~line 10).
2. Replace all `process.env.DATABASE_URL!` / `DATABASE_URL_UNPOOLED!` → `getRequiredEnv('DATABASE_URL')` etc.
3. Line 142: Remove `async` from `testSSLCompliance()` (no awaits inside); run `bun test-final-integration.ts` expect pass.

**validation_criteria**:
- functional: Script runs without crash/env errors
- quality: `bun lint scripts/test-final-integration.ts` fixes noNonNullAssertion/useAwait
- compliance: Secure DB access (no assumptions)

**risk_assessment**:
- risk1: Throw halts tests → mitigation: Set env vars in CI
- risk2: Perf change from async → mitigation: Benchmark before/after

**rollback_procedure**:
1. `git checkout -- scripts/test-final-integration.ts`
2. `unset DATABASE_URL` + re-run to confirm original behavior

---

### Group 3: Suspicious Code QC-004 noEmptyBlockStatements + QC-005 noShadow (P1/P2 High, Accessibility/WCAG, ~15 errors)
**Files**: `src/components/accessibility/AccessibilityProvider.tsx` (empty catch 172/183, shadow 161).
**Impact**: Swallowed errors in voice/accessibility.

#### QC-004-T1: Add error logging to catches + rename shadowed value
**task_metadata**:
- name: Fix empty catches with console.warn; rename shadowed `value` in context
- est_time: 20 min
- priority: P1

**error_context**:
- description: Empty `catch (_error) {}` swallows localStorage errors; `const value` shadows outer
- location: Lines 172/183 (catches), 161 (shadow)
- impact: Medium/High - WCAG error disclosure fail (voice settings lost silently)
- related: localStorage, AccessibilityContextType

**research_backed_solution**:
- approach: `catch (error) { console.warn('Accessibility storage failed:', error); }`; rename inner `value` to `contextValue`
- sources: [Biome noEmpty/noShadow](https://biomejs.dev/linter/rules/), WCAG 1.3.3
- examples:
  ```tsx
  } catch (error) {
    console.warn('Storage failed:', error);
  }
  ```
- confidence: 99%

**implementation_steps**:
1. Lines 172/183: Change `catch (_error) {}` → `catch (error) { console.warn('Accessibility localStorage failed:', error); }`
2. Line 161: Rename inner `const value: AccessibilityContextType = {` → `const contextValue: AccessibilityContextType = {`
3. `bun lint src/components/accessibility/AccessibilityProvider.tsx` → 0 errors; test voice toggle in dev.

**validation_criteria**:
- functional: localStorage errors logged, no shadow warnings
- quality: Biome lint passes file
- compliance: WCAG error visible (console for dev, toast for prod?)

**risk_assessment**:
- risk1: Console spam → mitigation: Use logger with level
- risk2: Rename breaks usage → mitigation: Search/replace all `value` → `contextValue`

**rollback_procedure**:
1. `git checkout -- src/components/accessibility/AccessibilityProvider.tsx`
2. Verify original silence

---

### Group 4: QC-003 useNamingConvention Financial Types (P2 High Financial, ~20 errors)
**Files**: `src/types/google-calendar.ts` (snake_case user_id etc. lines 13-48).
**Impact**: DB-TypeScript mismatch for PIX/calendar sync.

#### QC-003-T1: Convert snake_case to camelCase in Google Calendar types
**task_metadata**:
- name: Refactor snake_case properties to camelCase with Drizzle column.map()
- est_time: 20 min
- priority: P2

**error_context**:
- description: `useNamingConvention` violation: snake_case in TS types (user_id, access_token)
- location: `src/types/google-calendar.ts` lines 13-20,31-34,41-48
- impact: Medium - Drizzle mapping errors in financial calendar (PIX events)
- related: Drizzle schema

**research_backed_solution**:
- approach: camelCase props; Drizzle `column('user_id').map('userId')`
- sources: [Biome naming](https://biomejs.dev/linter/rules/use-naming-convention/), Drizzle naming
- examples: `userId: string; // from column('user_id')`
- confidence: 98%

**implementation_steps**:
1. Replace snake_case → camelCase: user_id→userId, access_token→accessToken, etc. all interfaces.
2. Note Drizzle mappings if used: `table.column('user_id').map('userId')`
3. `bun lint src/types/google-calendar.ts` → passes; `bun type-check` no breaks.

**validation_criteria**:
- functional: Types compile, no rename breaks in usage
- quality: Lint passes naming
- compliance: BCB consistent financial models

**risk_assessment**:
- risk1: Usage sites break → mitigation: Global search/replace + type-check
- risk2: DB mismatch → mitigation: Update Drizzle schema refs

**rollback_procedure**:
1. `git checkout -- src/types/google-calendar.ts`
2. Verify original snake_case

---

### Group 5: QC-006 useNamingConvention AI Elements (P2 High Style/Consistency, ~10 errors)
**Files**: `src/components/ai-elements/edge.tsx` (PascalCase Temporary/Animated line 129/130).
**Impact**: Inconsistent props in AI graph (minor but codebase hygiene).

#### QC-006-T1: Fix PascalCase to camelCase in edge variants
**task_metadata**:
- name: Convert PascalCase object keys to camelCase in Framer Motion variants
- est_time: 15 min
- priority: P2

**error_context**:
- description: `useNamingConvention` object props PascalCase (Temporary, Animated)
- location: `src/components/ai-elements/edge.tsx` lines 129,130
- impact: Low - style inconsistency in AI viz
- related: Tailwind/Framer Motion

**research_backed_solution**:
- approach: camelCase keys (temporary, animated)
- sources: [Biome naming](https://biomejs.dev/linter/rules/use-naming-convention/)
- examples: `temporary: {...}, animated: {...}`
- confidence: 100%

**implementation_steps**:
1. Lines 129/130: `Temporary` → `temporary`, `Animated` → `animated`
2. Verify no usage breaks (likely internal variants)
3. `bun lint src/components/ai-elements/edge.tsx` → passes

**validation_criteria**:
- functional: AI edge renders unchanged
- quality: Lint passes naming
- compliance: Code style consistent

**risk_assessment**:
- risk1: Motion variant refs break → mitigation: Internal only, test render
- risk2: None significant

**rollback_procedure**:
1. `git checkout -- src/components/ai-elements/edge.tsx`
2. Lint to confirm

## Post-execution
- Run full `bun lint && bun type-check && bun test`
- Commit: `git commit -m "QC Phase 3: Fixed 5 high-priority groups (85 errors)"`
- Verify: Compare lint-report before/after
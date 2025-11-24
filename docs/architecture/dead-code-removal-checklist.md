# Dead Code Removal Validation Checklist

## Pre-Removal Checklist

### 1. Backup & Version Control
- [ ] Ensure all changes are committed to git
- [ ] Create backup branch: `git checkout -b backup/pre-dead-code-removal`
- [ ] Tag current state: `git tag pre-dead-code-removal-$(date +%Y%m%d)`

### 2. Validation Commands

#### A. Verify Zero Imports (Run BEFORE deletion)
```bash
# es-toolkit-compat
grep -r "from.*es-toolkit-compat" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches

# Unused hooks
grep -r "useKeyboardNavigation\|useLGPDConsent\|useFinancialTransactions\|useFinancialCalendar" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches

# Banking modules
grep -r "tokenManager\|securityCompliance\|pixApi\|monitoringService\|dataNormalization" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches (except in the files themselves)
```

#### B. Type Check (Run AFTER deletion)
```bash
bun run type-check
# Expected: 0 errors (same as before deletion)
```

#### C. Test Suite (Run AFTER deletion)
```bash
bun test
# Expected: All tests pass (same as before deletion)
```

#### D. Build Validation (Run AFTER deletion)
```bash
bun run build
# Expected: Successful build, smaller bundle size
```

## Post-Removal Verification

### A. File Count Verification
```bash
# Before
find src/lib -type f | wc -l

# After (should be ~210 fewer)
find src/lib -type f | wc -l
```

### B. Bundle Size Verification
```bash
# Before
du -sh dist/

# After (should be ~1.5MB smaller)
du -sh dist/
```

### C. TypeScript Compilation Time
```bash
# Before
time bun run type-check

# After (should be ~15-20% faster)
time bun run type-check
```

## Rollback Plan (If Issues Arise)

```bash
# Option 1: Revert commit
git revert HEAD

# Option 2: Reset to backup
git reset --hard backup/pre-dead-code-removal

# Option 3: Restore from tag
git checkout pre-dead-code-removal-$(date +%Y%m%d)
```

## Success Criteria

- [ ] `bun run type-check` → 0 errors
- [ ] `bun test` → All tests pass
- [ ] `bun run build` → Successful build
- [ ] Bundle size reduced by ~1.5MB
- [ ] No runtime errors in dev server
- [ ] No console errors in browser

## Documentation Updates

- [ ] Update `README.md` if it references removed modules
- [ ] Update `docs/architecture/` if it references removed patterns
- [ ] Add entry to `CHANGELOG.md` documenting removal

## Communication

- [ ] Notify team of dead code removal
- [ ] Document replacement implementations for removed modules
- [ ] Update onboarding docs if they reference removed code

## Execution Order

1. **Phase 1**: Run pre-removal validation commands
2. **Phase 2**: Delete files using desktop-commander MCP
3. **Phase 3**: Run post-removal validation commands
4. **Phase 4**: Commit changes with descriptive message
5. **Phase 5**: Monitor for 24-48 hours for any issues

## Commit Message Template

```
refactor: remove dead code (211 files, ~2MB)

Removed unused code identified through comprehensive analysis:

- es-toolkit-compat/ (200+ files) - zero imports
- 4 unused hooks (replaced by newer implementations)
- 5 unused banking modules (never integrated)
- 1 disabled test file

Validation:
- ✅ bun run type-check (0 errors)
- ✅ bun test (all pass)
- ✅ bun run build (successful)
- ✅ Bundle size: -1.5MB
- ✅ Build time: -18.75%

See docs/architecture/dead-code-analysis-report.md for details.

BREAKING CHANGE: None (removed code had zero references)
```

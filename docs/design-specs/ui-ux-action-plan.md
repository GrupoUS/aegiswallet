# AegisWallet UI/UX Action Plan
**Date**: 2025-10-07  
**Priority**: High  
**Estimated Effort**: 25-30 hours

---

## Quick Summary

**Current Status**: 72% design system compliance with 21 hardcoded color violations  
**Target**: 95%+ compliance with zero violations  
**Timeline**: 3 weeks (phased implementation)

---

## Immediate Actions (This Week)

### 1. Add Semantic Color Tokens to `index.css`

**File**: `src/index.css`  
**Lines to Modify**: 8-61 (light mode), 63-114 (dark mode)  
**Estimated Time**: 2 hours

**Add to `:root` section (after line 60)**:
```css
  /* Semantic state colors */
  --success: oklch(0.65 0.18 145);
  --success-foreground: oklch(0.98 0 0);
  --warning: oklch(0.75 0.15 85);
  --warning-foreground: oklch(0.15 0 0);
  --info: oklch(0.60 0.18 240);
  --info-foreground: oklch(0.98 0 0);
  
  /* Financial state colors */
  --financial-positive: oklch(0.65 0.18 145);
  --financial-positive-foreground: oklch(0.98 0 0);
  --financial-negative: oklch(0.65 0.18 25);
  --financial-negative-foreground: oklch(0.98 0 0);
  --financial-neutral: oklch(0.60 0.05 250);
  --financial-neutral-foreground: oklch(0.98 0 0);
  
  /* PIX brand colors */
  --pix-primary: oklch(0.60 0.15 180);
  --pix-primary-foreground: oklch(0.98 0 0);
  --pix-accent: oklch(0.55 0.18 165);
  --pix-accent-foreground: oklch(0.98 0 0);
```

**Add to `.dark` section (after line 113)**:
```css
  /* Dark mode semantic colors */
  --success: oklch(0.70 0.20 145);
  --success-foreground: oklch(0.15 0 0);
  --warning: oklch(0.80 0.18 85);
  --warning-foreground: oklch(0.15 0 0);
  --info: oklch(0.65 0.20 240);
  --info-foreground: oklch(0.15 0 0);
  
  /* Dark mode financial colors */
  --financial-positive: oklch(0.70 0.20 145);
  --financial-positive-foreground: oklch(0.15 0 0);
  --financial-negative: oklch(0.70 0.20 25);
  --financial-negative-foreground: oklch(0.15 0 0);
  --financial-neutral: oklch(0.65 0.08 250);
  --financial-neutral-foreground: oklch(0.15 0 0);
  
  /* Dark mode PIX colors */
  --pix-primary: oklch(0.65 0.18 180);
  --pix-primary-foreground: oklch(0.15 0 0);
  --pix-accent: oklch(0.60 0.20 165);
  --pix-accent-foreground: oklch(0.15 0 0);
```

---

### 2. Update `tailwind.config.ts`

**File**: `tailwind.config.ts`  
**Lines to Modify**: 15-60 (theme.extend.colors)  
**Estimated Time**: 1 hour

**Add after the `sidebar` color definition (line 59)**:
```typescript
        // Semantic state colors
        success: {
          DEFAULT: 'oklch(var(--success))',
          foreground: 'oklch(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning))',
          foreground: 'oklch(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'oklch(var(--info))',
          foreground: 'oklch(var(--info-foreground))',
        },
        
        // Financial state colors
        financial: {
          positive: 'oklch(var(--financial-positive))',
          'positive-foreground': 'oklch(var(--financial-positive-foreground))',
          negative: 'oklch(var(--financial-negative))',
          'negative-foreground': 'oklch(var(--financial-negative-foreground))',
          neutral: 'oklch(var(--financial-neutral))',
          'neutral-foreground': 'oklch(var(--financial-neutral-foreground))',
        },
        
        // PIX brand colors
        pix: {
          primary: 'oklch(var(--pix-primary))',
          'primary-foreground': 'oklch(var(--pix-primary-foreground))',
          accent: 'oklch(var(--pix-accent))',
          'accent-foreground': 'oklch(var(--pix-accent-foreground))',
        },
```

---

### 3. Refactor PIX Components (Highest Priority)

#### 3.1 Fix `src/components/pix/PixSidebar.tsx` (9 violations)

**Estimated Time**: 2 hours

**Search and Replace Operations**:

| Find | Replace |
|------|---------|
| `from-green-500` | `from-pix-primary` |
| `to-teal-500` | `to-pix-accent` |
| `bg-green-500/48` | `bg-pix-primary/48` |
| `bg-green-500/10` | `bg-pix-primary/10` |
| `bg-green-500/5` | `bg-pix-primary/5` |
| `border-green-500/30` | `border-pix-primary/30` |
| `text-green-600 dark:text-green-400` | `text-pix-primary` |

**Lines to Fix**:
- Line 51: `'active:before:bg-green-500/48'` → `'active:before:bg-pix-primary/48'`
- Line 52: `'active:bg-green-500/10 active:border-green-500/30'` → `'active:bg-pix-primary/10 active:border-pix-primary/30'`
- Line 58: `'bg-gradient-to-br from-green-500/10 to-teal-500/10'` → `'bg-gradient-to-br from-pix-primary/10 to-pix-accent/10'`
- Line 59: `'group-hover:from-green-500/20 group-hover:to-teal-500/20'` → `'group-hover:from-pix-primary/20 group-hover:to-pix-accent/20'`
- Line 63: `text-green-600 dark:text-green-400` → `text-pix-primary`
- Line 81: `'hover:border-green-500/30 hover:bg-green-500/5'` → `'hover:border-pix-primary/30 hover:bg-pix-primary/5'`
- Line 88: `'group-hover:bg-green-500/10'` → `'group-hover:bg-pix-primary/10'`
- Line 92: `text-green-600 dark:group-hover:text-green-400` → `text-pix-primary`
- Line 103: `bg-gradient-to-r from-green-500 to-teal-500` → `bg-gradient-to-r from-pix-primary to-pix-accent`

#### 3.2 Fix `src/routes/pix/index.tsx` (2 violations)

**Estimated Time**: 1 hour

**Lines to Fix**:
- Line 23: `bg-gradient-to-r from-green-500 to-teal-500` → `bg-gradient-to-r from-pix-primary to-pix-accent`
- Line 44: `border-green-500` → `border-pix-primary`

---

### 4. Refactor Financial State Indicators

#### 4.1 Fix `src/routes/saldo.tsx` (3 violations)

**Estimated Time**: 1 hour

**Lines to Fix**:
- Line 184: `text-green-500` → `text-financial-positive`
- Line 248: `text-green-500` → `text-financial-positive`
- Line 250: `text-red-500` → `text-financial-negative`

#### 4.2 Fix `src/routes/contas.tsx` (4 violations)

**Estimated Time**: 1 hour

**Lines to Fix**:
- Line 159: `border-yellow-500/20` → `border-warning/20`
- Line 166: `text-yellow-500 border-yellow-500` → `text-warning border-warning`
- Line 173: `border-green-500/20` → `border-success/20`
- Line 180: `text-green-500 border-green-500` → `text-success border-success`

---

## Testing Checklist

After each change, verify:

- [ ] **Light Mode**: Colors display correctly
- [ ] **Dark Mode**: Colors display correctly with proper contrast
- [ ] **Hover States**: Interactive elements respond appropriately
- [ ] **Accessibility**: WCAG 2.1 AA contrast ratios maintained
- [ ] **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge
- [ ] **Mobile Responsiveness**: Colors work on mobile devices

**Testing Commands**:
```bash
# Start development server
bun dev

# Run linting
bun lint

# Run type checking
bun type-check

# Run tests
bun test
```

---

## Validation Steps

### 1. Visual Regression Testing

**Manual Testing**:
1. Navigate to `/pix` - Verify PIX branding colors
2. Navigate to `/saldo` - Verify financial indicators
3. Navigate to `/contas` - Verify status badges
4. Toggle dark mode - Verify all colors adapt correctly
5. Test hover/active states on all interactive elements

### 2. Automated Testing

**Create Visual Regression Tests** (Optional but Recommended):
```typescript
// tests/visual/color-system.spec.ts
import { test, expect } from '@playwright/test'

test('PIX components use design tokens', async ({ page }) => {
  await page.goto('/pix')
  
  // Verify no hardcoded green-500 classes
  const hardcodedColors = await page.locator('[class*="green-500"]').count()
  expect(hardcodedColors).toBe(0)
  
  // Verify PIX brand colors are applied
  const pixElements = await page.locator('[class*="pix-primary"]').count()
  expect(pixElements).toBeGreaterThan(0)
})
```

### 3. Accessibility Audit

**Run Lighthouse Audit**:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view
```

**Target Scores**:
- Accessibility: 95+
- Best Practices: 90+
- Performance: 90+

---

## Quick Reference: Color Token Usage

### When to Use Each Token

| Use Case | Token | Example |
|----------|-------|---------|
| Positive financial amount | `text-financial-positive` | Income, gains, positive balance |
| Negative financial amount | `text-financial-negative` | Expenses, losses, negative balance |
| Neutral financial amount | `text-financial-neutral` | Zero balance, transfers |
| Success state | `text-success` / `bg-success` | Completed actions, paid bills |
| Warning state | `text-warning` / `bg-warning` | Pending bills, alerts |
| Info state | `text-info` / `bg-info` | Informational messages |
| PIX branding | `text-pix-primary` / `bg-pix-primary` | PIX-specific UI elements |
| PIX accent | `text-pix-accent` / `bg-pix-accent` | PIX secondary elements |

### Common Patterns

**Financial Indicator**:
```tsx
// ❌ Before
<TrendingUp className="text-green-500" />

// ✅ After
<TrendingUp className="text-financial-positive" />
```

**Status Badge**:
```tsx
// ❌ Before
<Badge className="text-yellow-500 border-yellow-500">Pending</Badge>

// ✅ After
<Badge variant="warning">Pending</Badge>
```

**PIX Branding**:
```tsx
// ❌ Before
<div className="bg-gradient-to-r from-green-500 to-teal-500">

// ✅ After
<div className="bg-gradient-to-r from-pix-primary to-pix-accent">
```

---

## Success Criteria

### Week 1 Completion Checklist

- [ ] All semantic color tokens added to `index.css`
- [ ] Tailwind config updated with new utilities
- [ ] PIX components refactored (11 violations fixed)
- [ ] Financial indicators refactored (7 violations fixed)
- [ ] All changes tested in light and dark modes
- [ ] Zero hardcoded color violations remaining
- [ ] Design system compliance: 95%+

### Metrics to Track

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Hardcoded Colors | 21 | 0 | 🎯 Target |
| Design System Compliance | 72% | 95%+ | 🎯 Target |
| WCAG 2.1 AA Compliance | 85% | 95%+ | 🎯 Target |
| Component Reusability | 65% | 85%+ | 🎯 Target |

---

## Support & Resources

### Documentation
- **Full Audit Report**: `docs/design-specs/ui-ux-audit-report.md`
- **Color System Guide**: (To be created in Phase 4)
- **Component Usage Guide**: `docs/components/usage-guide.md`

### Agent Configuration
- **UI/UX Agent**: `.claude/agents/apex-ui-ux-designer.md`

### Commands Reference
```bash
# Development
bun dev                    # Start dev server
bun build                  # Build for production

# Quality Assurance
bun lint                   # Run linting
bun type-check             # TypeScript validation
bun test                   # Run tests

# Design System
bun routes:generate        # Regenerate routes
```

---

## Next Steps

1. ✅ **Review this action plan** with the team
2. ✅ **Prioritize tasks** based on business impact
3. ✅ **Assign ownership** for each refactoring task
4. ✅ **Set up testing environment** for visual regression
5. ✅ **Begin implementation** starting with `index.css` updates

**Questions or Issues?** Refer to the full audit report or consult the APEX UI/UX Designer agent configuration.

---

**Last Updated**: 2025-10-07  
**Next Review**: After Week 1 implementation (2025-10-14)


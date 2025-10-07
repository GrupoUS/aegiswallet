# AegisWallet Color System Guide

**Version**: 2.0.0  
**Last Updated**: 2025-10-07  
**Status**: Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Usage Guidelines](#usage-guidelines)
4. [Migration Guide](#migration-guide)
5. [Examples](#examples)
6. [Validation](#validation)

---

## Overview

AegisWallet uses a semantic color token system built on OKLCH color space for consistent, accessible, and maintainable UI design. All colors are defined as CSS custom properties and mapped to Tailwind utility classes.

### Benefits

- ✅ **Semantic Naming**: Colors describe purpose, not appearance
- ✅ **Dark Mode Support**: Automatic theme switching
- ✅ **Accessibility**: WCAG 2.1 AA compliant contrast ratios
- ✅ **Maintainability**: Single source of truth for all colors
- ✅ **Type Safety**: Full TypeScript support

---

## Design Tokens

### Semantic State Colors

Used for system feedback and status indicators.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `success` | Green (L:65% C:0.18 H:145) | Green (L:70% C:0.2 H:145) | Success states, confirmations |
| `success-foreground` | White | White | Text on success backgrounds |
| `warning` | Yellow (L:75% C:0.15 H:85) | Yellow (L:80% C:0.18 H:85) | Warnings, pending states |
| `warning-foreground` | Dark | Dark | Text on warning backgrounds |
| `info` | Blue (L:60% C:0.18 H:240) | Blue (L:65% C:0.2 H:240) | Information, neutral actions |
| `info-foreground` | White | White | Text on info backgrounds |
| `destructive` | Red (inherited) | Red (inherited) | Errors, destructive actions |
| `destructive-foreground` | White | White | Text on destructive backgrounds |

### Financial State Colors

Used specifically for monetary amounts and financial indicators.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `financial-positive` | Green (L:65% C:0.18 H:145) | Green (L:70% C:0.2 H:145) | Positive amounts, income, received |
| `financial-negative` | Red (L:65% C:0.18 H:25) | Red (L:70% C:0.2 H:25) | Negative amounts, expenses, sent |
| `financial-neutral` | Gray (L:60% C:0.05 H:250) | Gray (L:60% C:0.05 H:250) | Neutral amounts, pending |

### PIX Brand Colors

Used for PIX-specific branding and UI elements.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `pix-primary` | Teal (L:60% C:0.15 H:180) | Teal (L:60% C:0.15 H:180) | Primary PIX branding |
| `pix-accent` | Teal (L:55% C:0.18 H:165) | Teal (L:60% C:0.2 H:165) | PIX accent elements |

---

## Usage Guidelines

### When to Use Each Token

#### Semantic State Colors

```typescript
// ✅ DO: Use for system feedback
<Badge className="bg-success/10 text-success">Completed</Badge>
<Badge className="bg-warning/10 text-warning">Pending</Badge>
<Badge className="bg-destructive/10 text-destructive">Failed</Badge>
<Badge className="bg-info/10 text-info">Processing</Badge>

// ❌ DON'T: Use hardcoded colors
<Badge className="bg-green-100 text-green-700">Completed</Badge>
```

#### Financial State Colors

```typescript
// ✅ DO: Use for monetary amounts
<span className="text-financial-positive">+R$ 1.500,00</span>
<span className="text-financial-negative">-R$ 850,00</span>

// ❌ DON'T: Use semantic state colors for money
<span className="text-success">+R$ 1.500,00</span>
```

#### PIX Brand Colors

```typescript
// ✅ DO: Use for PIX-specific UI
<div className="bg-gradient-to-r from-pix-primary to-pix-accent">
  <span className="text-white">PIX</span>
</div>

// ❌ DON'T: Use generic green/teal
<div className="bg-gradient-to-r from-green-500 to-teal-500">
  <span className="text-white">PIX</span>
</div>
```

### Opacity Modifiers

Use Tailwind's opacity modifiers for backgrounds and borders:

```typescript
// Backgrounds
bg-success/10    // 10% opacity - subtle background
bg-success/20    // 20% opacity - medium background
bg-success       // 100% opacity - solid background

// Borders
border-success/20  // 20% opacity - subtle border
border-success/50  // 50% opacity - medium border
border-success     // 100% opacity - solid border

// Text (always 100%)
text-success       // Full opacity text
```

---

## Migration Guide

### Step 1: Identify Hardcoded Colors

Run the validation script:

```bash
bun run validate:colors
```

### Step 2: Replace with Semantic Tokens

| Old (Hardcoded) | New (Semantic) | Context |
|-----------------|----------------|---------|
| `text-green-500/600/700` | `text-success` | Status indicators |
| `text-green-500/600/700` | `text-financial-positive` | Monetary amounts |
| `text-red-500/600/700` | `text-destructive` | Errors, failures |
| `text-red-500/600/700` | `text-financial-negative` | Negative amounts |
| `text-yellow-500/600` | `text-warning` | Warnings, pending |
| `text-blue-500/600` | `text-info` | Information |
| `bg-green-50/100` | `bg-success/10` | Success backgrounds |
| `bg-red-50/100` | `bg-destructive/10` | Error backgrounds |
| `border-green-200` | `border-success/20` | Success borders |
| `from-green-500 to-teal-500` | `from-pix-primary to-pix-accent` | PIX gradients |

### Step 3: Test Changes

```bash
# Run tests
bun test

# Run linting
bun lint

# Validate colors
bun run validate:colors
```

---

## Examples

### Status Badges

```typescript
// Success
<Badge className="bg-success/10 text-success border-success/20">
  Completed
</Badge>

// Warning
<Badge className="bg-warning/10 text-warning border-warning/20">
  Pending
</Badge>

// Error
<Badge className="bg-destructive/10 text-destructive border-destructive/20">
  Failed
</Badge>

// Info
<Badge className="bg-info/10 text-info border-info/20">
  Processing
</Badge>
```

### Financial Amounts

```typescript
// Positive amount (income/received)
<div className="flex items-center gap-2">
  <ArrowDownLeft className="w-4 h-4 text-financial-positive" />
  <span className="text-financial-positive font-bold">
    +R$ 1.500,00
  </span>
</div>

// Negative amount (expense/sent)
<div className="flex items-center gap-2">
  <ArrowUpRight className="w-4 h-4 text-financial-negative" />
  <span className="text-financial-negative font-bold">
    -R$ 850,00
  </span>
</div>
```

### PIX Branding

```typescript
// PIX logo with gradient
<div className="w-10 h-10 bg-gradient-to-r from-pix-primary to-pix-accent rounded-lg flex items-center justify-center">
  <span className="text-white font-bold">PIX</span>
</div>

// PIX summary card
<Card className="bg-pix-primary/10 border-pix-primary/20">
  <CardContent>
    <div className="text-pix-primary font-bold">
      R$ 2.350,00
    </div>
  </CardContent>
</Card>
```

### Transaction Cards

```typescript
// Sent transaction
<Card className="bg-financial-negative/10 border-financial-negative/20">
  <CardContent>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-financial-negative" />
        <span className="text-financial-negative">Enviado</span>
      </div>
      <span className="text-financial-negative font-bold">
        -R$ 500,00
      </span>
    </div>
  </CardContent>
</Card>

// Received transaction
<Card className="bg-financial-positive/10 border-financial-positive/20">
  <CardContent>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ArrowDownLeft className="w-5 h-5 text-financial-positive" />
        <span className="text-financial-positive">Recebido</span>
      </div>
      <span className="text-financial-positive font-bold">
        +R$ 1.200,00
      </span>
    </div>
  </CardContent>
</Card>
```

---

## Validation

### Automated Validation

The project includes automated color validation:

```bash
# Run validation
bun run validate:colors

# Pre-commit hook (automatic)
git commit -m "feat: add new feature"
# → Runs color validation automatically
```

### CI/CD Integration

Color validation is integrated into the CI/CD pipeline:

- ✅ Pre-commit hook validates colors before commit
- ✅ CI pipeline fails if hardcoded colors are detected
- ✅ Pull requests require passing color validation

### Manual Review Checklist

- [ ] All colors use semantic tokens
- [ ] Financial amounts use `financial-positive`/`financial-negative`
- [ ] Status indicators use `success`/`warning`/`destructive`/`info`
- [ ] PIX elements use `pix-primary`/`pix-accent`
- [ ] Opacity modifiers used for backgrounds/borders
- [ ] Dark mode tested and working
- [ ] Contrast ratios meet WCAG 2.1 AA standards

---

## Support

For questions or issues with the color system:

1. Check this guide first
2. Run `bun run validate:colors` to identify issues
3. Review examples in `docs/components/color-usage-guide.md`
4. Consult the team's design system documentation

---

**Remember**: Always use semantic tokens, never hardcoded colors! 🎨


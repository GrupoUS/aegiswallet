# Color Usage Standards - AegisWallet Design System

## 🎨 Core Principle

**NEVER use hardcoded Tailwind color classes** (e.g., `green-500`, `red-500`, `yellow-500`, `teal-500`).

Always use semantic color tokens from our design system. This ensures:
- ✅ Consistent visual language across the application
- ✅ Proper light/dark mode support
- ✅ Easy theme customization
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Maintainable codebase

---

## ❌ DON'T: Hardcoded Colors

```tsx
// ❌ BAD - Hardcoded Tailwind colors
<div className="text-green-500">Success message</div>
<div className="bg-red-500">Error state</div>
<div className="border-yellow-500">Warning border</div>
<div className="text-teal-500">PIX branding</div>

// ❌ BAD - Direct color values
<div style={{ color: '#10b981' }}>Success</div>
<div style={{ backgroundColor: '#ef4444' }}>Error</div>
```

---

## ✅ DO: Semantic Color Tokens

```tsx
// ✅ GOOD - Semantic tokens
<div className="text-success">Success message</div>
<div className="bg-destructive">Error state</div>
<div className="border-warning">Warning border</div>
<div className="text-pix-primary">PIX branding</div>

// ✅ GOOD - Financial indicators
<div className="text-financial-positive">+R$ 1.500,00</div>
<div className="text-financial-negative">-R$ 850,00</div>
<div className="text-financial-neutral">R$ 0,00</div>
```

---

## 📚 Available Semantic Tokens

### 1. **State Colors** (Success, Warning, Info)

Use for general UI feedback and status indicators.

| Token | Use Case | Example |
|-------|----------|---------|
| `success` | Successful operations, completed tasks | Payment confirmed, task completed |
| `success-foreground` | Text on success background | White text on green background |
| `warning` | Warnings, pending actions | Pending payment, expiring soon |
| `warning-foreground` | Text on warning background | Dark text on yellow background |
| `info` | Informational messages | Tips, help text, notifications |
| `info-foreground` | Text on info background | White text on blue background |

**Examples:**

```tsx
// Success badge
<Badge className="bg-success text-success-foreground">
  Pagamento Confirmado
</Badge>

// Warning alert
<Alert className="border-warning bg-warning/10">
  <AlertCircle className="text-warning" />
  <AlertDescription className="text-warning-foreground">
    Conta vence em 3 dias
  </AlertDescription>
</Alert>

// Info tooltip
<div className="bg-info/10 border-info p-4 rounded-lg">
  <Info className="text-info" />
  <p className="text-info-foreground">Dica: Use PIX para transferências instantâneas</p>
</div>
```

---

### 2. **Financial State Colors** (Positive, Negative, Neutral)

Use for financial amounts, balances, and monetary indicators.

| Token | Use Case | Example |
|-------|----------|---------|
| `financial-positive` | Positive amounts, income, credits | +R$ 1.500,00, Receita |
| `financial-positive-foreground` | Text on positive background | White text on green background |
| `financial-negative` | Negative amounts, expenses, debits | -R$ 850,00, Despesa |
| `financial-negative-foreground` | Text on negative background | White text on red background |
| `financial-neutral` | Zero amounts, neutral balances | R$ 0,00, Sem movimentação |
| `financial-neutral-foreground` | Text on neutral background | White text on gray background |

**Examples:**

```tsx
// Balance display
<div className="text-2xl font-bold">
  <span className={amount > 0 ? 'text-financial-positive' : 'text-financial-negative'}>
    {formatCurrency(amount)}
  </span>
</div>

// Transaction list item
<div className="flex justify-between">
  <span>Salário</span>
  <span className="text-financial-positive font-bold">
    +R$ 5.000,00
  </span>
</div>

<div className="flex justify-between">
  <span>Aluguel</span>
  <span className="text-financial-negative font-bold">
    -R$ 1.200,00
  </span>
</div>

// Account balance card
<Card className="bg-financial-positive/10 border-financial-positive">
  <CardContent>
    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
    <p className="text-3xl font-bold text-financial-positive">
      R$ 3.450,00
    </p>
  </CardContent>
</Card>
```

---

### 3. **PIX Brand Colors** (Primary, Accent)

Use for PIX-specific features, branding, and visual identity.

| Token | Use Case | Example |
|-------|----------|---------|
| `pix-primary` | PIX primary branding, main actions | PIX logo, primary buttons |
| `pix-primary-foreground` | Text on PIX primary background | White text on teal background |
| `pix-accent` | PIX accent color, highlights | Hover states, active indicators |
| `pix-accent-foreground` | Text on PIX accent background | White text on green background |

**Examples:**

```tsx
// PIX logo/branding
<div className="bg-gradient-to-r from-pix-primary to-pix-accent rounded-lg p-4">
  <span className="text-pix-primary-foreground font-bold">PIX</span>
</div>

// PIX sidebar item (active state)
<button className={cn(
  'w-full p-3 rounded-lg transition-all',
  isActive && 'bg-pix-primary/10 border-pix-primary/30'
)}>
  <span className={isActive ? 'text-pix-primary' : 'text-muted-foreground'}>
    Minhas Chaves
  </span>
</button>

// PIX transfer button
<Button className="bg-gradient-to-r from-pix-primary to-pix-accent hover:opacity-90">
  <Send className="w-4 h-4 text-pix-primary-foreground" />
  Transferir via PIX
</Button>

// PIX loading spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pix-primary" />
```

---

## 🎯 Quick Reference Table

| Use Case | Token | Example |
|----------|-------|---------|
| **Success message** | `text-success` | "Pagamento realizado com sucesso" |
| **Error message** | `text-destructive` | "Erro ao processar pagamento" |
| **Warning message** | `text-warning` | "Conta vence em 3 dias" |
| **Info message** | `text-info` | "Dica: Use PIX para transferências" |
| **Positive amount** | `text-financial-positive` | "+R$ 1.500,00" |
| **Negative amount** | `text-financial-negative` | "-R$ 850,00" |
| **Zero amount** | `text-financial-neutral` | "R$ 0,00" |
| **PIX branding** | `text-pix-primary` | PIX logo, primary actions |
| **PIX accent** | `text-pix-accent` | PIX hover states, highlights |

---

## 🔍 Validation

### Automated Validation

Run the color validation script to detect hardcoded colors:

```bash
bun run validate:colors
```

This script will:
- ✅ Scan all `.ts` and `.tsx` files in `src/`
- ✅ Detect hardcoded Tailwind color patterns
- ✅ Report violations with file, line, and context
- ✅ Exit with error code 1 if violations found (fails CI/CD)

### Manual Code Review Checklist

Before submitting a PR, verify:

- [ ] No hardcoded color classes (green-500, red-500, etc.)
- [ ] All semantic tokens properly used
- [ ] Financial amounts use `financial-positive/negative/neutral`
- [ ] PIX features use `pix-primary/accent`
- [ ] Status indicators use `success/warning/info`
- [ ] Light and dark modes tested
- [ ] WCAG 2.1 AA contrast ratios maintained

---

## 🚀 Migration Guide

### Step 1: Identify Hardcoded Colors

Search for patterns like:
- `text-(green|red|yellow|teal|blue)-(\\d{3})`
- `bg-(green|red|yellow|teal|blue)-(\\d{3})`
- `border-(green|red|yellow|teal|blue)-(\\d{3})`

### Step 2: Replace with Semantic Tokens

| Old (Hardcoded) | New (Semantic) | Context |
|-----------------|----------------|---------|
| `text-green-500` | `text-success` | Success messages |
| `text-green-600` | `text-financial-positive` | Positive amounts |
| `text-red-500` | `text-destructive` | Error messages |
| `text-red-600` | `text-financial-negative` | Negative amounts |
| `text-yellow-500` | `text-warning` | Warning messages |
| `text-teal-500` | `text-pix-primary` | PIX branding |
| `bg-green-500` | `bg-success` | Success backgrounds |
| `border-yellow-500` | `border-warning` | Warning borders |

### Step 3: Test in Both Modes

```bash
# Start development server
bun dev

# Toggle dark mode in UI
# Verify colors work correctly in both modes
```

### Step 4: Run Validation

```bash
# Run color validation
bun run validate:colors

# Run linting
bun lint

# Run tests
bun test
```

---

## 📖 Additional Resources

- **Full Audit Report**: `docs/design-specs/ui-ux-audit-report.md`
- **Action Plan**: `docs/design-specs/ui-ux-action-plan.md`
- **Executive Summary**: `docs/design-specs/AUDIT-SUMMARY.md`
- **TweakCN Theme**: https://tweakcn.com/themes/cmggonf62000204l5dn47hzhl
- **Tailwind CSS Variables**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`

---

## 🤝 Contributing

When adding new features:

1. **Use existing semantic tokens** whenever possible
2. **Propose new tokens** if existing ones don't fit (discuss with team first)
3. **Update this guide** when adding new tokens
4. **Run validation** before submitting PR
5. **Test both light and dark modes**

---

## ❓ FAQ

### Q: Can I use Tailwind's default colors for non-semantic purposes?

**A:** No. Even for decorative purposes, use semantic tokens or create new ones. This ensures consistency and theme support.

### Q: What if I need a color that doesn't exist in the design system?

**A:** Propose a new semantic token by:
1. Opening a discussion with the team
2. Adding the token to `src/index.css` (both `:root` and `.dark`)
3. Extending `tailwind.config.ts`
4. Updating this documentation

### Q: How do I handle third-party components with hardcoded colors?

**A:** Wrap them in a custom component and override styles using our semantic tokens via CSS variables.

### Q: Can I use opacity modifiers with semantic tokens?

**A:** Yes! Use Tailwind's opacity syntax:
```tsx
<div className="bg-success/10">10% opacity success background</div>
<div className="text-pix-primary/50">50% opacity PIX text</div>
```

---

**Last Updated**: 2025-10-07  
**Version**: 2.0.0  
**Maintained by**: AegisWallet Development Team


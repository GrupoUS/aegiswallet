# Frontend Components Guide

## Package Identity

**Purpose**: React 19 components for voice-first financial assistant
**Framework**: React 19 + TanStack Router + Tailwind CSS + shadcn/ui

## Setup & Run

> See root `AGENTS.md` for global commands (`bun dev:client`, `bun type-check`, `bun lint`)

```bash
bun test                       # Unit tests
bun test:e2e:a11y              # Accessibility tests
```

## Patterns & Conventions

### File Organization

```
src/components/
├── ui/                        # shadcn/ui reusable components
├── accessibility/             # WCAG 2.1 AA+ components
├── auth/                      # Authentication components
├── billing/                   # Subscription & payment UI
├── financial/                 # Banking & transaction components
├── voice/                     # Voice interface components
└── [feature]/                 # Feature-specific components
```

### Naming Conventions

- **Components**: PascalCase (e.g., `FinancialEventForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useFinancialEvents.ts`)
- **Utils**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase with `Type` suffix (e.g., `TransactionType`)

### Component Patterns

#### ✅ DO: Functional Components with TypeScript

```typescript
// Copy pattern from: src/components/financial/FinancialEventForm.tsx
import { type FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export const FinancialEventForm: FC = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

#### ✅ DO: Semantic Color Tokens

```typescript
// Copy pattern from: src/components/financial-amount.tsx
<span className="text-financial-positive">+R$ 1.500,00</span>
<span className="text-financial-negative">-R$ 500,00</span>
<Badge className="bg-success/10 text-success">Completed</Badge>
```

#### ✅ DO: Accessibility (WCAG 2.1 AA+)

```typescript
// Copy pattern from: src/components/accessibility/AccessibilityProvider.tsx
<button
  aria-label="Adicionar transação"
  aria-describedby="transaction-help"
  onClick={handleAdd}
>
  <PlusIcon aria-hidden="true" />
</button>
```

#### ✅ DO: Portuguese-First Interfaces

```typescript
// Copy pattern from: src/components/auth/LGPDConsentForm.tsx
<h2>Consentimento de Dados (LGPD)</h2>
<p>Precisamos do seu consentimento para processar seus dados financeiros.</p>
<Button>Aceitar e Continuar</Button>
```

#### ❌ DON'T: Hardcoded Colors

```typescript
// ❌ BAD: Hardcoded colors
<span className="text-green-600">+R$ 1.500,00</span>
<Badge className="bg-red-100 text-red-700">Error</Badge>

// ✅ GOOD: Semantic tokens
<span className="text-financial-positive">+R$ 1.500,00</span>
<Badge className="bg-destructive/10 text-destructive">Error</Badge>
```

#### ❌ DON'T: Class Components

```typescript
// ❌ BAD: Class components (legacy pattern)
class MyComponent extends React.Component { }

// ✅ GOOD: Functional components
export const MyComponent: FC = () => { };
```

#### ❌ DON'T: English-Only Text

```typescript
// ❌ BAD: English-only
<Button>Add Transaction</Button>

// ✅ GOOD: Portuguese-first
<Button>Adicionar Transação</Button>
```

### Form Patterns

**Copy pattern from**: `src/components/financial/FinancialEventForm.tsx`

- Use React Hook Form + Zod validation
- Use `@hookform/resolvers/zod` for schema integration
- Use shadcn/ui form components (`Form`, `FormField`, `FormItem`)
- Provide Portuguese error messages

### API Integration

**Copy pattern from**: `src/hooks/useFinancialEvents.ts`

- Use TanStack Query for data fetching
- Use custom hooks for API calls
- Handle loading, error, and success states
- Provide optimistic updates where appropriate

```typescript
// Example from: src/hooks/useFinancialEvents.ts
import { useQuery } from '@tanstack/react-query';

export const useFinancialEvents = () => {
  return useQuery({
    queryKey: ['financial-events'],
    queryFn: async () => {
      const response = await fetch('/api/v1/calendar/events');
      return response.json();
    },
  });
};
```

## Touch Points / Key Files

**Core Components**:
- `src/components/app/InnerApp.tsx` - Main app wrapper
- `src/components/providers/AppProviders.tsx` - Context providers
- `src/components/dashboard/UserDashboard.tsx` - Main dashboard

**Authentication**:
- `src/components/auth/LGPDConsentForm.tsx` - LGPD consent flow
- `src/components/login-form.tsx` - Login form pattern

**Financial Components**:
- `src/components/financial/FinancialEventForm.tsx` - Transaction form
- `src/components/financial-amount.tsx` - Currency display
- `src/components/bank-accounts/BankAccountForm.tsx` - Bank account form

**UI Components**:
- `src/components/ui/` - shadcn/ui components (Button, Input, Dialog, etc.)

**Accessibility**:
- `src/components/accessibility/AccessibilityProvider.tsx` - WCAG provider

**Billing**:
- `src/components/billing/PaywallModal.tsx` - Subscription paywall

## JIT Index Hints

```bash
# Find a React component
rg -n "export (function|const) .*" src/components/ --type tsx

# Find a hook
rg -n "export (function|const) use[A-Z]" src/hooks/

# Find form components
rg -n "useForm|zodResolver" src/components/

# Find API calls
rg -n "useQuery|useMutation" src/hooks/

# Find accessibility attributes
rg -n "aria-label|aria-describedby" src/components/

# Find color usage (validate semantic tokens)
rg -n "className.*text-|className.*bg-" src/components/
```

## Common Gotchas

- **Colors**: Run `bun validate:colors` to catch hardcoded colors
- **Accessibility**: Test with keyboard navigation and screen readers
- **Portuguese**: All user-facing text must be in Portuguese

## Pre-PR Checks

```bash
bun type-check && bun validate:colors && bun test:e2e:a11y
```

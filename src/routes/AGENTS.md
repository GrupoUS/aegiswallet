# Router Pages Guide

## Package Identity

**Purpose**: TanStack Router file-based routing with lazy loading
**Framework**: TanStack Router v1 + React 19 + Code splitting

## Setup & Run

> See root `AGENTS.md` for global commands (`bun dev:client`, `bun type-check`, `bun lint`)

```bash
# Route-specific commands
bun run routes:generate        # Generate route tree (@tanstack/router-cli)
bun test:e2e                   # E2E tests for all routes
```

## Route Structure

```
src/routes/
├── __root.tsx                 # Root layout (Clerk, QueryClient, Toaster)
├── index.tsx                  # Landing page (/)
├── dashboard.tsx              # Dashboard route definition
├── dashboard.lazy.tsx         # Dashboard lazy component
├── ai-chat.tsx                # AI chat route definition
├── ai-chat.lazy.tsx           # AI chat lazy component
├── calendario.tsx             # Calendar route definition
├── calendario.lazy.tsx        # Calendar lazy component
├── contas.tsx                 # Accounts route definition
├── contas.lazy.tsx            # Accounts lazy component
├── contas-bancarias.tsx       # Bank accounts route
├── contas-bancarias.lazy.tsx  # Bank accounts lazy component
├── configuracoes.tsx          # Settings route
├── configuracoes.lazy.tsx     # Settings lazy component
├── saldo.tsx                  # Balance route
├── saldo.lazy.tsx             # Balance lazy component
├── import.tsx                 # Import route
├── import.lazy.tsx            # Import lazy component
├── login.tsx                  # Login page
├── signup.tsx                 # Signup page
├── login.sso-callback.tsx     # SSO callback (Clerk)
├── signup.sso-callback.tsx    # SSO callback (Clerk)
├── politica-de-privacidade.tsx # Privacy policy (LGPD)
├── termos-de-uso.tsx          # Terms of service
├── privacidade.tsx            # Privacy settings
├── billing/                   # Billing routes (nested)
│   ├── index.lazy.tsx         # Billing home
│   ├── history.lazy.tsx       # Billing history
│   ├── invoices.lazy.tsx      # Invoices
│   ├── payment-methods.lazy.tsx # Payment methods
│   ├── success.lazy.tsx       # Checkout success
│   └── cancel.lazy.tsx        # Checkout cancelled
├── billing.tsx                # Billing layout route
├── billing.lazy.tsx           # Billing layout component
└── components/                # Route-specific components
    ├── BalanceChart.tsx       # Dashboard chart
    ├── BillsList.tsx          # Bills listing
    ├── FinancialTabs.tsx      # Financial tabs
    ├── QuickActionModal.tsx   # Quick actions
    ├── StatisticsCards.tsx    # Statistics cards
    ├── TransactionForm.tsx    # Transaction form
    └── TransactionsList.tsx   # Transactions listing
```

## Route Patterns

### Route Definition Pattern (TanStack Router)

#### ✅ DO: File-Based Route with Lazy Loading

```typescript
// Copy pattern from: src/routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: () => import('./dashboard.lazy').then((m) => <m.DashboardPage />),
});
```

#### ✅ DO: Lazy Component File

```typescript
// Copy pattern from: src/routes/dashboard.lazy.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from '@tanstack/react-router';

export function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### Root Layout Pattern

#### ✅ DO: Root with Providers

```typescript
// Copy pattern from: src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  ),
});
```

### Authentication Pattern

#### ✅ DO: Auth Guard in Route

```typescript
// Copy pattern from: src/routes/dashboard.tsx
import { redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.auth?.isSignedIn) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});
```

### Nested Routes Pattern (Billing)

#### ✅ DO: Parent Layout Route

```typescript
// Copy pattern from: src/routes/billing.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/billing')({
  component: () => (
    <BillingLayout>
      <Outlet />
    </BillingLayout>
  ),
});
```

#### ✅ DO: Child Route (billing/index)

```typescript
// Copy pattern from: src/routes/billing/index.lazy.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/billing/')({
  component: BillingHomePage,
});

function BillingHomePage() {
  const { subscription } = useSubscription();
  return <BillingOverview subscription={subscription} />;
}
```

### SSO Callback Pattern (Clerk)

#### ✅ DO: SSO Callback Route

```typescript
// Copy pattern from: src/routes/login.sso-callback.tsx
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

export const Route = createFileRoute('/login/sso-callback')({
  component: () => <AuthenticateWithRedirectCallback />,
});
```

### Anti-Patterns

#### ❌ DON'T: Heavy Imports in Route Definition

```typescript
// ❌ BAD: Importing heavy component directly
import { DashboardPage } from './DashboardPage';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage, // Bundle includes everything
});

// ✅ GOOD: Use lazy loading
export const Route = createFileRoute('/dashboard')({
  component: () => import('./dashboard.lazy'),
});
```

#### ❌ DON'T: Missing Auth Check

```typescript
// ❌ BAD: No authentication check
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

// ✅ GOOD: With auth guard
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth?.isSignedIn) throw redirect({ to: '/login' });
  },
  component: DashboardPage,
});
```

#### ❌ DON'T: English Route Names

```typescript
// ❌ BAD: English routes for PT-BR market
/accounts
/settings
/balance

// ✅ GOOD: Portuguese routes
/contas
/configuracoes
/saldo
```

## Touch Points / Key Files

**Core Routes**:
- `src/routes/__root.tsx` - Root layout with providers
- `src/routes/index.tsx` - Landing page
- `src/routes/dashboard.tsx` - Main dashboard
- `src/routes/ai-chat.tsx` - AI assistant

**Auth Routes**:
- `src/routes/login.tsx` - Login page
- `src/routes/signup.tsx` - Signup page
- `src/routes/login.sso-callback.tsx` - SSO callback

**Financial Routes**:
- `src/routes/contas.tsx` - Accounts overview
- `src/routes/contas-bancarias.tsx` - Bank accounts
- `src/routes/saldo.tsx` - Balance view
- `src/routes/calendario.tsx` - Financial calendar

**Billing Routes**:
- `src/routes/billing/index.lazy.tsx` - Billing home
- `src/routes/billing/history.lazy.tsx` - Payment history
- `src/routes/billing/invoices.lazy.tsx` - Invoices

**Legal (LGPD)**:
- `src/routes/politica-de-privacidade.tsx` - Privacy policy
- `src/routes/termos-de-uso.tsx` - Terms of service
- `src/routes/privacidade.tsx` - Privacy settings

## JIT Index Hints

```bash
# Find all route definitions
rg -n "createFileRoute" src/routes/

# Find lazy components
find src/routes -name "*.lazy.tsx"

# Find route-specific components
find src/routes/components -name "*.tsx"

# Find auth guards
rg -n "beforeLoad|redirect" src/routes/

# Find billing routes
find src/routes/billing -name "*.tsx"

# Check route structure
find src/routes -name "*.tsx" | head -20
```

## Route Naming Conventions

| Feature | Route Path | File |
|---------|------------|------|
| Dashboard | `/dashboard` | `dashboard.tsx` |
| Accounts | `/contas` | `contas.tsx` |
| Bank Accounts | `/contas-bancarias` | `contas-bancarias.tsx` |
| Balance | `/saldo` | `saldo.tsx` |
| Calendar | `/calendario` | `calendario.tsx` |
| Settings | `/configuracoes` | `configuracoes.tsx` |
| AI Chat | `/ai-chat` | `ai-chat.tsx` |
| Import | `/import` | `import.tsx` |
| Billing | `/billing/*` | `billing/*.tsx` |

## Brazilian Compliance

> See root `AGENTS.md` for full compliance matrix

- **Route-specific**: Portuguese paths (`/contas`, `/configuracoes`, `/saldo`)
- **LGPD Pages**: `/politica-de-privacidade`, `/termos-de-uso`, `/privacidade`

## Pre-PR Checks

```bash
bun run routes:generate && bun type-check && bun test:e2e && bun lint
```

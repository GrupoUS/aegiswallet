---
title: "AegisWallet Coding Standards — Voice-first, Financial AI, Brazilian Market"
last_updated: 2025-11-25
form: reference
tags: [coding-standards, typescript, react, bun, hono, hono-rpc, supabase, voice-ai, financial, lgpd]
related:
  - ../architecture/tech-stack.md
  - ../architecture/source-tree.md
  - ../prd.md
---

# AegisWallet Coding Standards — Voice-first, Financial AI, Brazilian Market (v1.0)

## Overview

Authoritative rules and patterns for writing **reliable, secure, and fast** code in AegisWallet, the Brazilian autonomous financial assistant. Aligned with our **simplified monolith architecture** (Bun + React 19 + Hono RPC + Supabase) and **Brazilian financial compliance** (LGPD, Open Banking, PIX).

**Outcomes**: **Voice response ≤ 500ms**, **Bank sync ≤ 5s**, **95% automation rate**, **≥ 9.5/10 code quality**.

> This document is the **single source of truth** for all development. Cross-references provide additional context but these standards are enforceable.

---

## Core Principles

- **Voice-First Development**: Primary interaction through 6 essential voice commands
- **KISS**: Simple, direct implementation without over-engineering
- **YAGNI**: Only essential features from PRD implemented
- **Type Safety**: End-to-end TypeScript with Hono RPC + Zod
- **Real-Time**: Instant updates via Supabase subscriptions
- **Simplified Monolith**: Single repository with clear domain separation
- **Edge-First**: Sub-150ms voice response, Brazilian region deployment

---

## Tech-Stack Alignment (Exact Match with Current Implementation)

**Non-negotiable Stack**:
- **Runtime**: **Bun** (Latest) - Maximum performance
- **Backend**: **Hono** (4.10.4) - Edge-first API framework
- **API**: **Hono RPC** + **@hono/zod-validator** - Type-safe HTTP endpoints
- **Database**: **Supabase** (2.74.0) - Managed PostgreSQL
- **Frontend**: **React** (19.2.0) - UI framework
- **Router**: **TanStack Router** (1.132.41) - File-based routing
- **State**: **TanStack Query** (5.90.2) - Server state
- **UI**: **Tailwind CSS** (4.1.14) - Styling
- **Forms**: **React Hook Form** (7.64.0) - Form handling
- **Validation**: **Zod** (4.1.12) - Schema validation

---

## Project Conventions (Single Repository)

### Single Repository Structure
Based on current architecture: **Simplified monolith** with clear domain separation
```
src/
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   ├── Balance.tsx               # Main balance display
│   ├── TransactionList.tsx       # Transaction listing
│   ├── VoiceButton.tsx           # Voice activation button
│   └── ProtectedRoute.tsx        # Authentication wrapper
├── features/                      # Feature modules
│   ├── auth/                     # Authentication
│   │   ├── SignIn.tsx
│   │   └── SignUp.tsx
│   ├── voice/                    # Voice processing
│   │   ├── VoiceProcessor.tsx
│   │   └── CommandHistory.tsx
│   ├── banking/                  # Bank integration
│   │   ├── AccountLink.tsx
│   │   └── TransactionSync.tsx
│   └── payments/                 # Payment processing
│       ├── PIXPayment.tsx
│       └── BillPayment.tsx
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                # Authentication state
│   ├── useVoice.ts               # Voice command processing
│   ├── useTransactions.ts        # Transaction data
│   └── useBanking.ts             # Bank account management
├── lib/                           # Core utilities
│   ├── api-client.ts             # Hono RPC API client
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # Utility functions
│   └── validations.ts            # Zod schemas
└── server/                        # Backend server
    ├── middleware/               # Server middleware
    │   └── auth.ts               # JWT authentication
    ├── routes/                   # Hono RPC endpoints
    │   └── v1/                   # API v1 routes
    │       ├── auth.ts
    │       ├── transactions.ts
    │       ├── voice.ts
    │       ├── banking.ts
    │       └── pix.ts
    └── index.ts                  # Server setup
```

### Voice-First Development
- **6 Essential Commands**: Implemented via `src/features/voice/`
- **Brazilian Portuguese**: All voice interactions optimized for local accents
- **Audio Processing**: Voice input handling in `VoiceProcessor.tsx`
- **Command History**: User interaction tracking via `CommandHistory.tsx`

### Financial Component Organization
- **Transaction Management**: `src/features/banking/` and related hooks
- **Payment Automation**: PIX and Boletos in `src/features/payments/`
- **Bank Integration**: Open Banking via Belvo API in banking features
- **Real-time Updates**: Supabase subscriptions for live data

### Import Patterns (Current Implementation)
```typescript
// Hono RPC API client
import { apiClient } from "@/lib/api-client"

// TanStack Query for data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Supabase client (direct SDK - no ORM)
import { supabase } from "@/lib/supabase"

// Components
import { Balance } from "@/components/Balance"
import { TransactionList } from "@/components/TransactionList"

// Hooks
import { useAuth } from "@/hooks/useAuth"
import { useVoice } from "@/hooks/useVoice"
import { useTransactions } from "@/hooks/useTransactions"
```

---

## React 19 + Hono RPC Patterns

### Voice Command Components
```tsx
// Voice interaction hook pattern with Hono RPC
export function useVoiceCommand() {
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: (command: string) =>
      apiClient.post('/api/v1/voice/process', { command }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const processCommand = useCallback(async (command: string) => {
    setProcessing(true);

    try {
      const result = await mutateAsync(command);
      setResponse(result.data.text);

      // Optimistic UI update for financial actions
      if (result.data.action) {
        await executeFinancialAction(result.data.action);
      }
    } catch (err) {
      console.error('Voice command failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [mutateAsync]);

  return { processCommand, processing, response };
}
```

### Financial Data Components
```tsx
// Real-time transaction list with Hono RPC + TanStack Query
export function TransactionList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get('/api/v1/transactions'),
  });

  if (isLoading) return <TransactionSkeleton />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <div className="space-y-2" role="region" aria-live="polite">
      {data?.data?.map(transaction => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

### Optimistic Updates with TanStack Query
```tsx
// Payment automation with rollback using Hono RPC
const queryClient = useQueryClient();

const paymentMutation = useMutation({
  mutationFn: (input: TransactionInput) =>
    apiClient.post('/api/v1/transactions', input),
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey: ['transactions'] });
    const prev = queryClient.getQueryData<TransactionList>(['transactions']);

    // Optimistic update
    queryClient.setQueryData(['transactions'], draft =>
      addTransaction(draft, input)
    );

    return { prev };
  },
  onError: (_err, _input, ctx) => {
    if (ctx?.prev) {
      queryClient.setQueryData(['transactions'], ctx.prev);
    }
    // Voice error feedback
    voiceAI.speak("Desculpe, ocorreu um erro ao processar o pagamento");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

---

## Backend: Hono RPC + Voice Processing

### Voice Command Processing Endpoint
```typescript
// src/server/routes/v1/voice.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

const voiceRouter = new Hono()

const processCommandSchema = z.object({
  command: z.string(),
  audioData: z.string().optional(),
})

voiceRouter.post(
  '/process',
  authMiddleware,
  zValidator('json', processCommandSchema),
  async (c) => {
    const { user, supabase } = c.get('auth')
    const input = c.req.valid('json')

    // 1. Speech-to-text if audio provided
    const text = input.audioData
      ? await speechToText(input.audioData)
      : input.command;

    // 2. Intent classification
    const intent = classifyIntent(text);

    // 3. Execute financial action
    const result = await executeFinancialAction(intent, user.id);

    // 4. Generate voice response
    const response = generateVoiceResponse(result);

    // 5. Audit trail
    await supabase.from('voice_commands').insert({
      user_id: user.id,
      command: text,
      intent: intent.type,
      response: response.text,
      processing_time_ms: Date.now(),
    });

    return c.json({
      data: {
        text: response.text,
        action: result.action,
        audioUrl: response.audioUrl,
      }
    });
  }
)

export { voiceRouter }
```

### Financial Transaction Processing
```typescript
// src/server/routes/v1/transactions.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '@/server/middleware/auth'

const transactionsRouter = new Hono()

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().optional(),
  date: z.string().datetime(),
})

// POST /api/v1/transactions
transactionsRouter.post(
  '/',
  authMiddleware,
  zValidator('json', createTransactionSchema),
  async (c) => {
    const { user, supabase } = c.get('auth')
    const input = c.req.valid('json')

    // Validation with Brazilian financial rules
    const validatedInput = validateTransactionInput(input);

    // Database insert with direct Supabase SDK
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...validatedInput,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return c.json({
        error: 'Transaction failed',
        code: 'TRANSACTION_FAILED'
      }, 400);
    }

    // Real-time notification
    await notifyVoiceUpdate(user.id, {
      type: 'transaction_created',
      data: data,
    });

    return c.json({ data }, 201);
  }
)

// GET /api/v1/transactions
transactionsRouter.get('/', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth')

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({
      error: 'Failed to fetch transactions',
      code: 'FETCH_FAILED'
    }, 500);
  }

  return c.json({ data });
})

export { transactionsRouter }
```

---

## Database: Supabase Direct SDK (No ORM)

### RLS Policies for Financial Data
```sql
-- Users can only access their own financial data
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Voice command privacy
CREATE POLICY "Voice command privacy" ON voice_commands
  FOR ALL USING (auth.uid() = user_id);
```

### Brazilian Financial Data Schema
```sql
-- Bank accounts with Brazilian specifics
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_code VARCHAR(3) NOT NULL, -- Brazilian bank codes
  account_mask VARCHAR(10) NOT NULL, -- Masked for security
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions with Brazilian payment methods
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'boleto', 'transfer', 'debit')),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Development Workflow

### Essential Commands (Bun-based)
```bash
# Development
bun dev                    # Start development servers
bun build                  # Build all applications

# Quality Assurance
bun lint                   # Lint with standard tools
bun type-check             # TypeScript strict mode validation
bun test                   # Run unit and integration tests

# Database
bunx supabase db push      # Apply database migrations
bunx supabase gen types    # Generate TypeScript types
```

### Environment Configuration
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Open Banking APIs
OPEN_BANKING_CLIENT_ID=your-client-id
OPEN_BANKING_CLIENT_SECRET=your-client-secret

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

---

## Testing Standards

### Voice Command Testing
```typescript
// Voice command workflow testing with Hono RPC
describe('Voice Command Processing', () => {
  it('processes balance query correctly', async () => {
    const res = await app.request('/api/v1/voice/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({ command: "Como está meu saldo?" }),
    });

    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.intent).toBe('balance_query');
    expect(data.text).toContain('saldo');
  });

  it('handles Brazilian Portuguese variations', async () => {
    const commands = [
      "Qual meu saldo?",
      "Mostra meu saldo por favor",
      "Quanto dinheiro eu tenho?"
    ];

    for (const command of commands) {
      const res = await app.request('/api/v1/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ command }),
      });
      const { data } = await res.json();
      expect(data.intent).toBe('balance_query');
    }
  });
});
```

### Financial Transaction Testing
```typescript
// Financial operation testing with Hono RPC
describe('Transaction Processing', () => {
  it('creates PIX payment with audit trail', async () => {
    const res = await app.request('/api/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        amount: 100.50,
        description: "Test PIX payment",
        date: new Date().toISOString(),
        payment_method: "pix"
      }),
    });

    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.amount).toBe(100.50);
    expect(data.payment_method).toBe('pix');
    expect(data.user_id).toBeDefined();
  });
});
```

### Performance Testing for Voice
```typescript
// Voice response time testing
describe('Voice Performance', () => {
  it('responds within 1 second target', async () => {
    const startTime = Date.now();

    await app.request('/api/v1/voice/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({ command: "Como está meu saldo?" }),
    });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // 1 second max
  });
});
```

---

## Developer Checklist (Pull Request)

### Voice-First Requirements
- [ ] Voice commands implemented and tested with Brazilian Portuguese
- [ ] Audio response generation working correctly
- [ ] Voice feedback for errors and success states
- [ ] Accessibility for hearing-impaired users

### Financial Security Requirements
- [ ] LGPD compliance implemented (data minimization, consent)
- [ ] Audit trails for all financial operations
- [ ] Row Level Security policies in place
- [ ] Sensitive data properly masked/sanitized

### Code Quality Standards
- [ ] TypeScript strict mode - no errors
- [ ] Zod validation schemas for all Hono RPC inputs
- [ ] Hono RPC endpoints type-safe and tested
- [ ] Bun package manager used consistently
- [ ] Performance benchmarks met (voice response <1s)

### Brazilian Market Compliance
- [ ] Portuguese localization complete
- [ ] PIX payment processing implemented
- [ ] Boleto handling functional
- [ ] Currency formatting for BRL
- [ ] Date/time formats for Brazilian standards

### Testing Requirements
- [ ] Voice command workflows tested
- [ ] Financial transaction edge cases covered
- [ ] Performance benchmarks validated
- [ ] Security penetration testing passed
- [ ] Accessibility compliance verified

---

## Examples Index (Current Implementation)

- **Voice Command Hook** → `src/hooks/useVoice.ts`
- **Transaction Component** → `src/components/TransactionList.tsx`
- **Hono RPC Routes** → `src/server/routes/v1/transactions.ts`
- **API Client** → `src/lib/api-client.ts`
- **Zod Schemas** → `src/lib/validations.ts`
- **Supabase Client** → `src/lib/supabase.ts`
- **Voice Processing** → `src/features/voice/VoiceProcessor.tsx`
- **Architecture Reference** → `docs/architecture/hono-rpc-patterns.md`

---

**Status**: ✅ Active
**Ownership**: AegisWallet Development Team
**Review cadence**: Monthly or as Brazilian financial regulations evolve
**Last Updated**: 2025-11-25
---
title: "AegisWallet Coding Standards — Voice-first, Financial AI, Brazilian Market"
last_updated: 2025-10-04
form: reference
tags: [coding-standards, typescript, react, bun, hono, trpc, supabase, voice-ai, financial, lgpd]
related:
  - ../architecture/tech-stack.md
  - ../architecture/source-tree.md
  - ../prd.md
---

# AegisWallet Coding Standards — Voice-first, Financial AI, Brazilian Market (v1.0)

## Overview

Authoritative rules and patterns for writing **reliable, secure, and fast** code in AegisWallet, the Brazilian autonomous financial assistant. Aligned with our **simplified monolith architecture** (Bun + React 19 + Hono + tRPC + Supabase) and **Brazilian financial compliance** (LGPD, Open Banking, PIX).

**Outcomes**: **Voice response ≤ 500ms**, **Bank sync ≤ 5s**, **95% automation rate**, **≥ 9.5/10 code quality**.

> This document is the **single source of truth** for all development. Cross-references provide additional context but these standards are enforceable.

---

## Core Principles

- **Voice-First Development**: Primary interaction through 6 essential voice commands
- **KISS**: Simple, direct implementation without over-engineering 
- **YAGNI**: Only essential features from PRD implemented
- **Type Safety**: End-to-end TypeScript with tRPC
- **Real-Time**: Instant updates via Supabase subscriptions
- **Simplified Monolith**: Single repository with clear domain separation
- **Edge-First**: Sub-150ms voice response, Brazilian region deployment

---

## Tech-Stack Alignment (Exact Match with Current Implementation)

**Non-negotiable Stack**:
- **Runtime**: **Bun** (Latest) - Maximum performance
- **Backend**: **Hono** (4.9.9) - Edge-first API framework  
- **API**: **tRPC** (11.6.0) - Type-safe API
- **Database**: **Supabase** (2.58.0) - Managed PostgreSQL
- **Frontend**: **React** (19.2.0) - UI framework
- **Router**: **TanStack Router** (1.114.3) - File-based routing
- **State**: **TanStack Query** (5.90.2) - Server state
- **UI**: **Tailwind CSS** (4.1.14) - Styling
- **Forms**: **React Hook Form** (7.55.0) - Form handling
- **Validation**: **Zod** (4.1.11) - Schema validation

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
│   ├── trpc.ts                   # tRPC setup
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # Utility functions
│   └── validations.ts            # Zod schemas
└── server/                        # Backend server
    ├── trpc/                     # tRPC procedures
    │   ├── auth.ts
    │   ├── transactions.ts
    │   ├── voice.ts
    │   ├── banking.ts
    │   └── pix.ts
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
// tRPC setup
import { trpc } from "@/lib/trpc"

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

## React 19 + tRPC Patterns

### Voice Command Components
```tsx
// Voice interaction hook pattern
export function useVoiceCommand() {
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const processCommand = useCallback(async (command: string) => {
    setProcessing(true);
    
    try {
      const result = await trpc.voice.processCommand.mutateAsync({ command });
      setResponse(result.text);
      
      // Optimistic UI update for financial actions
      if (result.action) {
        await executeFinancialAction(result.action);
      }
    } catch (err) {
      console.error('Voice command failed:', err);
    } finally {
      setProcessing(false);
    }
  }, []);

  return { processCommand, processing, response };
}
```

### Financial Data Components
```tsx
// Real-time transaction list with tRPC
export function TransactionList() {
  const { data: transactions, isLoading, error } = trpc.transactions.getAll.useQuery();

  if (isLoading) return <TransactionSkeleton />;
  if (error) return <ErrorMessage error={error.message} />;

  return (
    <div className="space-y-2" role="region" aria-live="polite">
      {transactions?.map(transaction => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

### Optimistic Updates with TanStack Query
```tsx
// Payment automation with rollback
const paymentMutation = trpc.transactions.create.useMutation({
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey: ['transactions'] });
    const prev = queryClient.getQueryData<TransactionList>(['transactions']);
    
    // Optimistic update
    queryClient.setQueryData(['transactions'], draft => 
      addTransaction(draft, input)
    );
    
    return { prev };
  },
  onError: (_err, input, ctx) => {
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

## Backend: Hono + tRPC + Voice Processing

### Voice Command Processing Procedure
```typescript
// src/server/trpc/voice.ts
export const voiceRouter = t.router({
  processCommand: t.procedure
    .input(z.object({
      command: z.string(),
      audioData: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Speech-to-text if audio provided
      const text = input.audioData 
        ? await speechToText(input.audioData)
        : input.command;

      // 2. Intent classification
      const intent = classifyIntent(text);
      
      // 3. Execute financial action
      const result = await executeFinancialAction(intent, ctx.user.id);
      
      // 4. Generate voice response
      const response = generateVoiceResponse(result);
      
      // 5. Audit trail
      await ctx.db.from('voice_commands').insert({
        user_id: ctx.user.id,
        command: text,
        intent: intent.type,
        response: response.text,
        processing_time_ms: Date.now(),
      });

      return {
        text: response.text,
        action: result.action,
        audioUrl: response.audioUrl,
      };
    }),
});
```

### Financial Transaction Processing
```typescript
// src/server/trpc/transactions.ts
export const transactionsRouter = t.router({
  create: t.procedure
    .input(z.object({
      amount: z.number().positive(),
      description: z.string().min(1),
      category: z.string().optional(),
      date: z.string().datetime(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validation with Brazilian financial rules
      const validatedInput = validateTransactionInput(input);
      
      // Database insert with direct Supabase SDK
      const { data, error } = await ctx.supabase
        .from('transactions')
        .insert({
          ...validatedInput,
          user_id: ctx.user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Transaction failed: ${error.message}`,
        });
      }

      // Real-time notification
      await notifyVoiceUpdate(ctx.user.id, {
        type: 'transaction_created',
        data: data,
      });

      return data;
    }),

  getAll: t.procedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transactions',
        });
      }

      return data;
    }),
});
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
// Voice command workflow testing
describe('Voice Command Processing', () => {
  it('processes balance query correctly', async () => {
    const result = await trpc.voice.processCommand.mutateAsync({
      command: "Como está meu saldo?"
    });
    
    expect(result.intent).toBe('balance_query');
    expect(result.response).toContain('saldo');
  });

  it('handles Brazilian Portuguese variations', async () => {
    const commands = [
      "Qual meu saldo?",
      "Mostra meu saldo por favor", 
      "Quanto dinheiro eu tenho?"
    ];

    for (const command of commands) {
      const result = await trpc.voice.processCommand.mutateAsync({ command });
      expect(result.intent).toBe('balance_query');
    }
  });
});
```

### Financial Transaction Testing
```typescript
// Financial operation testing with tRPC
describe('Transaction Processing', () => {
  it('creates PIX payment with audit trail', async () => {
    const result = await trpc.transactions.create.mutateAsync({
      amount: 100.50,
      description: "Test PIX payment",
      date: new Date().toISOString(),
      payment_method: "pix"
    });

    expect(result.amount).toBe(100.50);
    expect(result.payment_method).toBe('pix');
    expect(result.user_id).toBeDefined();
  });
});
```

### Performance Testing for Voice
```typescript
// Voice response time testing
describe('Voice Performance', () => {
  it('responds within 1 second target', async () => {
    const startTime = Date.now();
    
    await trpc.voice.processCommand.mutateAsync({
      command: "Como está meu saldo?"
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
- [ ] Zod validation schemas for all tRPC inputs
- [ ] tRPC procedures type-safe and tested
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
- **tRPC Router** → `src/server/trpc/transactions.ts`
- **Zod Schemas** → `src/lib/validations.ts`
- **Supabase Client** → `src/lib/supabase.ts`
- **Voice Processing** → `src/features/voice/VoiceProcessor.tsx`

---

**Status**: ✅ Active  
**Ownership**: AegisWallet Development Team  
**Review cadence**: Monthly or as Brazilian financial regulations evolve  
**Last Updated**: 2025-10-04
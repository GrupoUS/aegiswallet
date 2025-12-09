# Business Services Guide

## Package Identity

**Purpose**: Business logic services (voice, payments, organization management)
**Pattern**: Singleton/Factory pattern with dependency injection

## Setup & Run

> See root `AGENTS.md` for global commands (`bun dev:full`, `bun type-check`)

```bash
bun test src/services          # Service unit tests
```

## Service Structure

```
src/services/
├── voiceService.ts            # Voice recognition & synthesis (PT-BR)
├── voiceCommandService.ts     # Command processing & routing
├── organization.service.ts    # Multi-tenant organization management
├── user-sync.service.ts       # Clerk user synchronization
└── stripe/                    # Billing & subscriptions
    ├── customer.service.ts    # Stripe customer management
    ├── subscription.service.ts # Subscription lifecycle
    ├── optimized-subscription.service.ts # Performance optimized
    └── webhook.service.ts     # Stripe webhook handlers
```

## Service Patterns

### Voice Service Pattern

#### ✅ DO: Singleton with Factory

```typescript
// Copy pattern from: src/services/voiceService.ts
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService({ language: 'pt-BR' });
  }
  return voiceServiceInstance;
}
```

#### ✅ DO: PT-BR Voice Commands

```typescript
// Copy pattern from: src/services/voiceService.ts
export const VOICE_COMMANDS = {
  BALANCE: ['saldo', 'meu saldo', 'quanto tenho'],
  BILLS: ['contas', 'minhas contas', 'pagamentos'],
  DASHBOARD: ['início', 'painel', 'dashboard'],
  PIX: ['pix', 'fazer pix', 'enviar pix'],
  TRANSACTIONS: ['transações', 'extrato', 'movimentações'],
  BUDGET: ['orçamento', 'meu orçamento', 'gastos'],
} as const;
```

#### ✅ DO: Error Classification

```typescript
// Copy pattern from: src/services/voiceService.ts
export interface VoiceServiceErrorInfo {
  type: string;
  message: string;
  timestamp: Date;
  isNoSpeech: boolean;  // Treat 'no-speech' as informational, not error
  originalEvent: unknown;
}

// In handler: don't call onError for 'no-speech'
if (errorType === 'no-speech') {
  this.lastError = errorInfo;
  return; // Informational, not critical
}
```

### Stripe Service Pattern

#### ✅ DO: Service Class with Stripe SDK

```typescript
// Copy pattern from: src/services/stripe/customer.service.ts
import Stripe from 'stripe';

export class StripeCustomerService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2024-12-18.acacia' });
  }

  async createCustomer(email: string, metadata: Record<string, string>) {
    return this.stripe.customers.create({ email, metadata });
  }
}
```

#### ✅ DO: Webhook Signature Verification

```typescript
// Copy pattern from: src/services/stripe/webhook.service.ts
import Stripe from 'stripe';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  return Stripe.webhooks.constructEvent(payload, signature, secret);
}
```

### Organization Service Pattern

#### ✅ DO: Multi-Tenant Isolation

```typescript
// Copy pattern from: src/services/organization.service.ts
export class OrganizationService {
  async getByClerkId(clerkOrgId: string) {
    return db.query.organizations.findFirst({
      where: eq(organizations.clerkId, clerkOrgId),
    });
  }

  async validateMembership(userId: string, orgId: string): Promise<boolean> {
    // Always validate user belongs to organization
  }
}
```

### Anti-Patterns

#### ❌ DON'T: Direct API Keys in Service

```typescript
// ❌ BAD: Hardcoded API key
const stripe = new Stripe('sk_live_xxxxx');

// ✅ GOOD: Environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

#### ❌ DON'T: Unhandled Voice Errors

```typescript
// ❌ BAD: No error handling
voiceService.startListening((result) => { ... });

// ✅ GOOD: Handle errors appropriately
voiceService.startListening(
  (result) => { ... },
  (error) => { toast.error('Erro de reconhecimento de voz'); }
);
```

## Touch Points / Key Files

**Voice**:
- `src/services/voiceService.ts` - Core voice recognition/synthesis
- `src/services/voiceCommandService.ts` - Command parsing & routing

**Stripe**:
- `src/services/stripe/customer.service.ts` - Customer management
- `src/services/stripe/subscription.service.ts` - Subscription lifecycle
- `src/services/stripe/webhook.service.ts` - Webhook processing

**Organization**:
- `src/services/organization.service.ts` - Multi-tenant org management
- `src/services/user-sync.service.ts` - Clerk → Database sync

## JIT Index Hints

```bash
# Find all services
rg -n "export (class|function)" src/services/ --type ts

# Find Stripe-related code
rg -n "Stripe" src/services/stripe/

# Find voice commands
rg -n "VOICE_COMMANDS|VoiceCommand" src/services/

# Find webhook handlers
rg -n "webhook|constructEvent" src/services/
```

## Brazilian Compliance

> See root `AGENTS.md` for full compliance matrix

- **Voice**: PT-BR default (`language: 'pt-BR'`)
- **Billing**: BRL currency, CPF/CNPJ support

## Pre-PR Checks

```bash
bun test src/services && bun type-check
```

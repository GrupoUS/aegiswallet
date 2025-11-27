# AegisWallet Technology Stack Reference

## Core Technology Matrix

| Component | Technology | Version | Purpose | Key Features for Voice Finance |
|-----------|------------|---------|---------|--------------------------------|
| **Runtime** | Bun | Latest | Package management and runtime | 3-5x faster than npm, native TypeScript, ideal for voice processing |
| **Backend** | Hono | 4.9.10 | Edge-first API framework | Sub-150ms response times for voice commands |
| **API** | tRPC | 11.6.0 | Type-safe API | End-to-end type safety prevents financial errors |
| **Database** | Supabase | 2.58.0 | Managed PostgreSQL | Real-time sync, RLS, built-in auth for financial data |
| **Frontend** | React | 19.2.0 | Voice interface framework | Concurrent features for voice processing |
| **Router** | TanStack Router | 1.114.3 | File-based routing | Type-safe routing with automatic code generation |
| **State** | TanStack Query | 5.90.2 | Server state management | Real-time financial data synchronization |
| **Styling** | Tailwind CSS | 4.1.14 | Utility-first styling | Fast UI development, consistent design system |
| **Forms** | React Hook Form | 7.55.0 | Form handling | Optimized for voice input validation |
| **Validation** | Zod | 4.1.11 | Schema validation | Runtime validation for all financial inputs |

## Voice-First Architecture Requirements

### Performance Targets for Voice
- **Speech-to-Text**: <200ms processing time
- **Intent Recognition**: <150ms classification
- **Action Execution**: <100ms financial operations
- **Text-to-Speech**: <50ms response generation
- **Total Voice Loop**: <500ms end-to-end

### Real-time Data Synchronization
```typescript
// Supabase real-time configuration for financial data
const realtimeConfig = {
  transactions: {
    channel: 'user_transactions',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    filter: `user_id=eq.${userId}`
  },
  accounts: {
    channel: 'account_balances', 
    events: ['UPDATE'],
    filter: `user_id=eq.${userId}`
  },
  voice_commands: {
    channel: 'voice_responses',
    events: ['INSERT'],
    filter: `user_id=eq.${userId}`
  }
};
```

## Brazilian Financial System Integration

### PIX Implementation Requirements
```typescript
interface PIXConfiguration {
  transactionTypes: ['instant_transfer', 'scheduled_transfer', 'qr_payment'];
  keyTypes: ['cpf', 'cnpj', 'email', 'phone', 'random_key'];
  limits: {
    instant: 1000,      // R$ 1.000 instant transfer limit
    daily: 10000,       // R$ 10.000 daily limit
    monthly: 100000     // R$ 100.000 monthly limit
  };
  responseTime: 2000;   // 2 seconds maximum PIX response
};
```

### Boleto Processing Architecture
```typescript
interface BoletoProcessing {
  validation: {
    barcode: 'modulo11_validation',
    amount: 'decimal_precision_2',
    dueDate: 'business_day_calculation'
  };
  processing: {
    registration: 'bank_api_integration',
    payment: 'real_time_confirmation',
    status: 'async_webhook_update'
  };
};
```

## Security and Compliance Architecture

### LGPD Implementation Requirements
```typescript
interface LGPDCompliance {
  dataProtection: {
    encryption: 'AES-256_at_rest_and_transit',
    anonymization: 'automatic_after_7_years',
    consent: 'explicit_and_revocable',
    retention: 'configurable_by_data_type'
  };
  userRights: {
    access: 'self_service_portal',
    deletion: 'right_to_be_forgotten',
    portability: 'standardized_export',
    correction: 'real_time_updates'
  };
};
```

### Row Level Security Patterns
```sql
-- Example RLS policies for financial data
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Account access control" ON bank_accounts
  FOR ALL USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Voice command privacy" ON voice_commands
  FOR ALL USING (auth.uid() = user_id);
```

## Development Workflow Integration

### Essential Commands for Voice Development
```bash
# Voice-focused development
bun dev:voice              # Start with voice processing enabled
bun test:voice             # Run voice command tests
bun benchmark:voice        # Voice response time testing

# Database operations for financial data
bunx supabase db push      # Apply schema changes
bunx supabase gen types    # Generate TypeScript types
bunx supabase db diff      # Validate schema compliance

# Quality assurance with voice-specific checks
bun lint:voice             # Voice component linting
bun type-check:voice       # Voice command type safety
bun test:e2e:voice         # End-to-end voice workflow testing
```

## Import Patterns for Voice Architecture

### Supabase Client Integration
```typescript
import { supabase } from "@/integrations/supabase/client";

// Real-time voice command updates
const voiceSubscription = supabase
  .channel('voice_commands')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'voice_commands', filter: `user_id=eq.${userId}` },
    (payload) => handleVoiceResponse(payload.new)
  )
  .subscribe();
```

### tRPC Voice Procedures
```typescript
import { router, protectedProcedure } from "@/server/trpc";

export const voiceRouter = router({
  processCommand: protectedProcedure
    .input(z.object({ audioData: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const command = await speechToText(input.audioData);
      const intent = await classifyIntent(command);
      const response = await executeVoiceAction(intent, ctx.user.id);
      return { response, confidence: intent.confidence };
    }),
});
```

### React Voice Components
```typescript
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

const VoiceDashboard = () => {
  const { isListening, transcript, startListening, stopListening } = useVoiceRecognition();
  
  return (
    <div className="voice-dashboard">
      <VoiceIndicator isListening={isListening} />
      {transcript && <TranscriptDisplay text={transcript} />}
      <VoiceControls onStart={startListening} onStop={stopListening} />
    </div>
  );
};
```

## Performance Optimization Guidelines

### Bundle Size Optimization for Voice
```typescript
// Dynamic imports for voice features
const VoiceRecognition = lazy(() => import('@/components/voice/VoiceRecognition'));
const VoiceSynthesis = lazy(() => import('@/components/voice/VoiceSynthesis'));

// Code splitting by voice feature
const voiceModules = {
  'speech-to-text': () => import('@/lib/voice/speechToText'),
  'intent-classification': () => import('@/lib/voice/intentClassifier'),
  'response-generation': () => import('@/lib/voice/responseGenerator'),
};
```

### Caching Strategy for Financial Data
```typescript
const cacheConfig = {
  userProfiles: { ttl: 300000, max: 100 },           // 5 minutes
  accountBalances: { ttl: 30000, max: 50 },           // 30 seconds
  recentTransactions: { ttl: 60000, max: 200 },       // 1 minute
  voiceCommands: { ttl: 86400000, max: 1000 },       // 24 hours for learning
  exchangeRates: { ttl: 86400000, max: 10 },         // 24 hours
};
```

This reference provides the technical foundation for implementing voice-first financial applications optimized for the Brazilian market with comprehensive security, performance, and compliance considerations.
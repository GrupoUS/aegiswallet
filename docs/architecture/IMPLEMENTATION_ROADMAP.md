# AegisWallet Architecture Implementation Roadmap

## Executive Summary

This roadmap provides a structured implementation plan to address the critical architectural issues identified in the AegisWallet architecture review. The implementation is prioritized by security impact, business value, and technical dependencies.

## Priority Matrix

### 🔴 CRITICAL - Week 1 (Security Fixes)
| Issue | Impact | Effort | Owner | Dependencies |
|-------|--------|--------|--------|---------------|
| Remove hard-coded credentials | **Critical** | Low | DevOps | - |
| Fix missing PIX tables | **Critical** | Medium | Backend | Schema validation |
| Security audit & encryption | **High** | Medium | Security | ADR-001 |

### 🟡 HIGH - Week 2-4 (Core Architecture)
| Issue | Impact | Effort | Owner | Dependencies |
|-------|--------|--------|--------|---------------|
| Service boundary refactoring | **High** | High | Backend | ADR-002 |
| Consistent API patterns | **High** | Medium | Backend | ADR-002 |
| Database optimization | **Medium** | Medium | DBA | Schema fixes |

### 🟢 MEDIUM - Week 4-8 (Advanced Features)
| Issue | Impact | Effort | Owner | Dependencies |
|-------|--------|--------|--------|---------------|
| Event-driven architecture | **High** | High | Architecture | ADR-003 |
| Real-time updates | **Medium** | Medium | Frontend | Events |
| Performance optimization | **Medium** | Medium | DevOps | Monitoring |

---

## Phase 1: Security Emergency (Week 1)

### Day 1-2: Credential Security Fix
**Priority**: CRITICAL
**Owner**: DevOps Team

#### Immediate Actions (24 hours)
```bash
# 1. Remove all hard-coded credentials
git grep -l "supabase.*co" src/ | xargs sed -i 's/https:\/\/.*\.supabase\.co/\${SUPABASE_URL}/g'
git grep -l "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ | xargs sed -i 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*/${SUPABASE_ANON_KEY}/g'

# 2. Create environment template
cat > .env.example << EOF
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Application Configuration
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:3000

# Security Configuration
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
NODE_ENV=development
EOF

# 3. Update deployment configurations
# Kubernetes, Docker, and CI/CD pipelines must use secrets
```

#### Environment Validation Implementation
```typescript
// src/lib/config/environment.ts
export function validateEnvironmentConfig(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'VITE_APP_VERSION'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`
🚨 SECURITY ERROR: Missing environment variables: ${missing.join(', ')}

This application cannot run without proper environment configuration.
Please copy .env.example to .env and fill in the required values.

For production deployments, ensure all secrets are properly configured
in your deployment platform's secret management system.
    `)
  }

  // Validate URL format
  try {
    new URL(process.env.SUPABASE_URL!)
  } catch {
    throw new Error('Invalid SUPABASE_URL format')
  }

  // Validate keys format (basic check)
  if (process.env.SUPABASE_ANON_KEY!.length < 100) {
    throw new Error('Invalid SUPABASE_ANON_KEY format')
  }
}
```

### Day 3-5: Database Schema Fix
**Priority**: CRITICAL
**Owner**: Backend Team

#### Create Missing PIX Tables
```sql
-- Migration: 20250101_add_missing_pix_tables.sql

-- PIX Keys table
CREATE TABLE IF NOT EXISTS pix_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('email', 'cpf', 'cnpj', 'phone', 'random')),
  key_value TEXT NOT NULL,
  label TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, key_value)
);

-- PIX Transactions table
CREATE TABLE IF NOT EXISTS pix_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sent', 'received', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  description TEXT,
  recipient_name TEXT,
  recipient_document TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT UNIQUE NOT NULL,
  end_to_end_id TEXT UNIQUE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PIX QR Codes table
CREATE TABLE IF NOT EXISTS pix_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pix_key TEXT NOT NULL,
  amount DECIMAL(15,2),
  description TEXT,
  qr_code_data TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fix nullable user_id in bank_accounts
ALTER TABLE bank_accounts 
ALTER COLUMN user_id SET NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_pix_keys_user_id ON pix_keys(user_id);
CREATE INDEX idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX idx_pix_qr_codes_user_id ON pix_qr_codes(user_id);
CREATE INDEX idx_pix_transactions_status ON pix_transactions(status);
CREATE INDEX idx_pix_transactions_created_at ON pix_transactions(created_at DESC);
```

#### Update RLS Policies
```sql
-- Enable RLS on new tables
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_qr_codes ENABLE ROW LEVEL SECURITY;

-- PIX Keys policies
CREATE POLICY "Users can view own pix keys" ON pix_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pix keys" ON pix_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pix keys" ON pix_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pix keys" ON pix_keys
  FOR DELETE USING (auth.uid() = user_id);

-- PIX Transactions policies
CREATE POLICY "Users can view own pix transactions" ON pix_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pix transactions" ON pix_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pix transactions" ON pix_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- PIX QR Codes policies
CREATE POLICY "Users can view own pix qr codes" ON pix_qr_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pix qr codes" ON pix_qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pix qr codes" ON pix_qr_codes
  FOR UPDATE USING (auth.uid() = user_id);
```

### Day 6-7: Security Hardening
**Priority**: HIGH
**Owner**: Security Team

#### Implement Data Encryption
```typescript
// src/lib/security/encryption.ts
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256

  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      key,
      dataBuffer
    )

    return {
      data: Array.from(new Uint8Array(encryptedBuffer)),
      iv: Array.from(iv),
    }
  }

  static async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const encryptedBuffer = new Uint8Array(encryptedData.data)
    const iv = new Uint8Array(encryptedData.iv)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      key,
      encryptedBuffer
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }
}
```

---

## Phase 2: Clean Architecture Refactoring (Week 2-4)

### Week 2: Foundation Setup
**Owner**: Architecture Team

#### Dependency Injection Setup
```typescript
// src/container/DIContainer.ts
import { Container } from 'inversify'
import { TYPES } from './types'

export class DIContainer {
  private container: Container

  constructor() {
    this.container = new Container()
    this.setupBindings()
  }

  private setupBindings(): void {
    // Bind interfaces to implementations
    this.container.bind<ITransactionRepository>(TYPES.TransactionRepository)
      .to(SupabaseTransactionRepository)
      .inSingletonScope()

    this.container.bind<ICreateTransactionUseCase>(TYPES.CreateTransactionUseCase)
      .to(CreateTransactionUseCase)
      .inSingletonScope()

    // Add more bindings as we refactor
  }

  get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier)
  }
}

export const container = new DIContainer()
```

#### Domain Entities Definition
```typescript
// src/domains/financial/entities/Transaction.ts
export class Transaction {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly amount: Money,
    private readonly description: string,
    private readonly category: TransactionCategory,
    private readonly date: DateTime,
    private readonly status: TransactionStatus,
    private readonly metadata: TransactionMetadata,
    private readonly createdAt?: DateTime,
    private readonly updatedAt?: DateTime
  ) {}

  static create(props: CreateTransactionProps): Transaction {
    return new Transaction(
      generateUUID(),
      props.userId,
      props.amount,
      props.description,
      props.category,
      props.date,
      TransactionStatus.PENDING,
      props.metadata || {},
      DateTime.now()
    )
  }

  static restore(props: RestoreTransactionProps): Transaction {
    return new Transaction(
      props.id,
      props.userId,
      props.amount,
      props.description,
      props.category,
      props.date,
      props.status,
      props.metadata,
      props.createdAt,
      props.updatedAt
    )
  }

  // Getters and business logic methods
  getId(): string { return this.id }
  getUserId(): string { return this.userId }
  getAmount(): Money { return this.amount }
  getDescription(): string { return this.description }
  getCategory(): TransactionCategory { return this.category }
  getDate(): DateTime { return this.date }
  getStatus(): TransactionStatus { return this.status }
  getMetadata(): TransactionMetadata { return this.metadata }
  getCreatedAt(): DateTime | undefined { return this.createdAt }
  getUpdatedAt(): DateTime | undefined { return this.updatedAt }

  complete(): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.amount,
      this.description,
      this.category,
      this.date,
      TransactionStatus.COMPLETED,
      this.metadata,
      this.createdAt,
      DateTime.now()
    )
  }

  fail(reason: string): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.amount,
      this.description,
      this.category,
      this.date,
      TransactionStatus.FAILED,
      { ...this.metadata, failureReason: reason },
      this.createdAt,
      DateTime.now()
    )
  }
}
```

### Week 3: Use Case Implementation
**Owner**: Backend Team

#### Transaction Use Cases
```typescript
// src/applications/financial/use-cases/CreateTransaction.ts
export class CreateTransactionUseCase implements ICreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    // Validation
    const validationErrors = await this.validateRequest(request)
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors }
    }

    // Create transaction
    const transaction = Transaction.create({
      userId: request.userId,
      amount: new Money(request.amount, Currency.BRL),
      description: request.description,
      category: TransactionCategory.fromString(request.category),
      date: request.date ? new DateTime(request.date) : DateTime.now(),
      metadata: request.metadata || {},
    })

    // Save to repository
    const savedTransaction = await this.transactionRepository.save(transaction)

    // Update account balance
    const account = await this.accountRepository.findByUserId(request.userId)
    if (account) {
      account.updateBalance(transaction.getAmount())
      await this.accountRepository.save(account)

      // Dispatch domain events
      await this.eventDispatcher.dispatch(new TransactionCreatedEvent(savedTransaction))
      await this.eventDispatcher.dispatch(new AccountBalanceChangedEvent(
        account.getId(),
        account.getUserId(),
        account.getBalance()
      ))
    }

    // Log audit
    await this.auditLogger.log({
      userId: request.userId,
      action: 'transaction_created',
      transactionId: savedTransaction.getId(),
      amount: transaction.getAmount().getValue(),
    })

    return { success: true, transaction: savedTransaction }
  }

  private async validateRequest(request: CreateTransactionRequest): Promise<string[]> {
    const errors: string[] = []

    if (!request.description?.trim()) {
      errors.push('Description is required')
    }

    if (request.amount <= 0) {
      errors.push('Amount must be positive')
    }

    if (request.amount > 1000000) {
      errors.push('Amount exceeds maximum limit')
    }

    // Add more validation rules as needed

    return errors
  }
}
```

### Week 4: API Controller Refactoring
**Owner**: Backend Team

#### Controller Implementation
```typescript
// src/interfaces/controllers/TransactionController.ts
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: ICreateTransactionUseCase,
    private readonly getTransactionsUseCase: IGetTransactionsUseCase,
    private readonly getTransactionUseCase: IGetTransactionUseCase
  ) {}

  async createTransaction(
    request: CreateTransactionRequest,
    userId: string
  ): Promise<APIResponse<Transaction>> {
    try {
      const result = await this.createTransactionUseCase.execute({
        ...request,
        userId,
      })

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Transaction validation failed',
            details: result.errors,
          },
        }
      }

      return {
        success: true,
        data: result.transaction!,
      }
    } catch (error) {
      return this.handleError(error, 'transaction_creation_failed')
    }
  }

  private handleError(error: Error, errorCode: string): APIResponse<never> {
    // Centralized error handling
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details,
        },
      }
    }

    if (error instanceof RepositoryError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
        },
      }
    }

    // Log unexpected errors
    console.error(`Unexpected error in ${errorCode}:`, error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }
  }
}
```

#### Updated tRPC Router
```typescript
// src/server/routers/transactions.ts
export const transactionsRouter = router({
  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      const controller = container.get<TransactionController>(TYPES.TransactionController)
      return await controller.createTransaction(input, ctx.user.id)
    }),

  list: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ input, ctx }) => {
      const controller = container.get<TransactionController>(TYPES.TransactionController)
      return await controller.getTransactions(ctx.user.id, input)
    }),

  get: protectedProcedure
    .input(getTransactionSchema)
    .query(async ({ input, ctx }) => {
      const controller = container.get<TransactionController>(TYPES.TransactionController)
      return await controller.getTransaction(input.id, ctx.user.id)
    }),
})
```

---

## Phase 3: Event-Driven Architecture (Week 4-8)

### Week 4-5: Event Infrastructure
**Owner**: Architecture Team

#### Event Store Setup
```sql
-- Event store table (already in ADR-003)
CREATE TABLE event_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_id UUID NOT NULL,
  aggregate_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(aggregate_id, version)
);

-- Performance indexes
CREATE INDEX idx_event_store_aggregate_id ON event_store(aggregate_id);
CREATE INDEX idx_event_store_event_type ON event_store(event_type);
CREATE INDEX idx_event_store_timestamp ON event_store(timestamp);
CREATE INDEX idx_event_store_metadata_user_id ON event_store USING GIN ((metadata->'userId'));
```

#### Event Dispatcher Implementation
```typescript
// src/events/EventDispatcher.ts
export class DomainEventDispatcher implements EventDispatcher {
  private handlers: Map<string, EventHandler[]> = new Map()
  private eventStore: EventStore
  private messageBroker: MessageBroker

  constructor(eventStore: EventStore, messageBroker: MessageBroker) {
    this.eventStore = eventStore
    this.messageBroker = messageBroker
  }

  async dispatch(event: DomainEvent): Promise<void> {
    // Store event
    await this.eventStore.saveEvent(event.aggregateId, event)

    // Publish for async processing
    await this.messageBroker.publish(event.type, event)

    // Execute synchronous handlers
    await this.executeHandlers(event)
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  private async executeHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || []
    
    await Promise.allSettled(
      handlers.map(handler => handler.handle(event))
    )
  }
}
```

### Week 5-6: Financial Events
**Owner**: Backend Team

#### Transaction Events
```typescript
// src/events/domain/FinancialEvents.ts
export class TransactionCreatedEvent implements DomainEvent {
  readonly id = generateUUID()
  readonly type = 'TransactionCreated'
  readonly aggregateType = 'Transaction'
  readonly version = 1

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      userId: string
      amount: number
      currency: string
      description: string
      category: string
      date: string
    },
    public readonly metadata: EventMetadata,
    public readonly timestamp: string = new Date().toISOString()
  ) {}
}

export class TransactionCompletedEvent implements DomainEvent {
  readonly id = generateUUID()
  readonly type = 'TransactionCompleted'
  readonly aggregateType = 'Transaction'
  readonly version = 1

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      completedAt: string
      processingTime: number
    },
    public readonly metadata: EventMetadata,
    public readonly timestamp: string = new Date().toISOString()
  ) {}
}
```

#### Event Handlers
```typescript
// src/events/handlers/FinancialEventHandlers.ts
export class TransactionCreatedHandler implements EventHandler {
  constructor(
    private accountRepository: IAccountRepository,
    private notificationService: NotificationService,
    private auditLogger: IAuditLogger
  ) {}

  async handle(event: TransactionCreatedEvent): Promise<void> {
    const { data, metadata } = event

    // Update account balance
    const account = await this.accountRepository.findByUserId(data.userId)
    if (account) {
      account.updateBalance(new Money(data.amount, data.currency as Currency))
      await this.accountRepository.save(account)
    }

    // Send notification
    await this.notificationService.sendTransactionCreatedNotification(
      data.userId,
      {
        amount: data.amount,
        description: data.description,
        category: data.category,
      }
    )

    // Log audit
    await this.auditLogger.log({
      userId: data.userId,
      action: 'transaction_created',
      transactionId: event.aggregateId,
      amount: data.amount,
    })
  }
}
```

### Week 6-7: Real-time Updates
**Owner**: Frontend Team

#### React Hooks for Real-time Updates
```typescript
// src/hooks/useRealtimeEvents.ts
export function useRealtimeEvents<T extends DomainEvent>(
  userId: string,
  eventTypes: string[],
  handler: (event: T) => void
) {
  useEffect(() => {
    const eventStream = new RealtimeEventStream(supabase)
    
    const unsubscribe = eventStream.subscribeToUserEvents(
      userId,
      (event) => handler(event as T),
      eventTypes
    )

    return () => unsubscribe()
  }, [userId, eventTypes.join(','), handler])
}

export function useFinancialRealtimeUpdates(userId: string) {
  const [balance, setBalance] = useState<number>(0)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  useRealtimeEvents(
    userId,
    ['TransactionCreated', 'TransactionCompleted', 'AccountBalanceChanged'],
    (event) => {
      switch (event.type) {
        case 'AccountBalanceChanged':
          setBalance(event.data.newBalance)
          break
        case 'TransactionCreated':
          setRecentTransactions(prev => [event.data as Transaction, ...prev.slice(0, 9)])
          break
      }
    }
  )

  return { balance, recentTransactions }
}
```

### Week 7-8: Testing & Optimization
**Owner**: QA Team + DevOps

#### Performance Testing
```typescript
// src/test/performance/EventSystem.test.ts
describe('Event System Performance', () => {
  it('should handle 1000 events per second', async () => {
    const startTime = Date.now()
    const eventCount = 1000

    const promises = Array.from({ length: eventCount }, (_, i) =>
      eventDispatcher.dispatch(new TransactionCreatedEvent(
        `tx-${i}`,
        { userId: 'test-user', amount: i + 1, /* ... */ },
        { userId: 'test-user', source: 'test' }
      ))
    )

    await Promise.all(promises)
    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(1000) // Should complete within 1 second
    expect(eventCount / (duration / 1000)).toBeGreaterThan(1000) // At least 1000 events/sec
  })
})
```

#### Monitoring Setup
```typescript
// src/monitoring/EventMetrics.ts
export class EventMetrics {
  private metrics: Map<string, number> = new Map()

  recordEventProcessed(eventType: string, processingTime: number): void {
    const current = this.metrics.get(eventType) || 0
    this.metrics.set(eventType, current + 1)

    // Send to monitoring system
    this.sendMetric('event_processed', {
      event_type: eventType,
      processing_time: processingTime,
    })
  }

  getEventCount(eventType: string): number {
    return this.metrics.get(eventType) || 0
  }

  private sendMetric(name: string, data: any): void {
    // Integration with Prometheus/DataDog/etc.
    console.log(`Metric: ${name}`, data)
  }
}
```

---

## Success Metrics & KPIs

### Security Metrics
- **Zero hard-coded credentials** in codebase
- **100% environment validation** at startup
- **Encryption coverage** for sensitive data
- **Security scan results**: 0 high-severity vulnerabilities

### Architecture Quality Metrics
- **Code duplication**: < 5% across domains
- **Test coverage**: > 90% for business logic
- **API response time**: < 150ms (P95)
- **Event processing**: > 1000 events/second

### Business Impact Metrics
- **Transaction processing time**: < 2 seconds
- **Real-time update latency**: < 500ms
- **System availability**: > 99.9%
- **User experience score**: > 4.5/5

## Risk Mitigation

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration failure | Low | High | Backup + rollback plan |
| Performance regression | Medium | Medium | Load testing + monitoring |
| Security vulnerabilities | Low | Critical | Security audit + penetration testing |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Service disruption during migration | Medium | High | Phased rollout + blue-green deployment |
| User data loss | Low | Critical | Comprehensive backup strategy |
| Compliance violations | Low | Critical | Legal review + compliance audit |

## Implementation Checklist

### Phase 1: Security (Week 1)
- [ ] Remove all hard-coded credentials
- [ ] Implement environment validation
- [ ] Create missing database tables
- [ ] Add data encryption
- [ ] Security audit and testing

### Phase 2: Architecture (Week 2-4)
- [ ] Set up dependency injection
- [ ] Define domain entities
- [ ] Implement use cases
- [ ] Create API controllers
- [ ] Refactor tRPC routers
- [ ] Update component integrations

### Phase 3: Events (Week 4-8)
- [ ] Set up event store
- [ ] Implement event dispatcher
- [ ] Create domain events
- [ ] Implement event handlers
- [ ] Add real-time updates
- [ ] Performance optimization
- [ ] Comprehensive testing

### Documentation & Training
- [ ] Architecture documentation
- [ ] API specification updates
- [ ] Developer training materials
- [ ] Deployment guides
- [ ] Security best practices

---

**Last Updated**: 2025-01-XX  
**Next Review**: 2025-02-XX  
**Implementation Team**: Architecture + Backend + Frontend + DevOps + Security Teams
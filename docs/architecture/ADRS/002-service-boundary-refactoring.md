# ADR-002: Service Boundary Refactoring & Clean Architecture

## Status
**ACCEPTED** - Implementation in Progress

## Context
AegisWallet currently has significant service boundary violations that create tight coupling between different domains (banking, voice, transactions, PIX). This violates Clean Architecture principles and creates maintainability issues.

### Current Problems
1. **Duplicate Router Architecture**: Mixed old and new router patterns
2. **Cross-Domain Dependencies**: Voice components directly importing banking services
3. **Missing Abstraction Layers**: Direct database calls in business logic
4. **Inconsistent API Patterns**: Different authentication and error handling approaches

## Decision
Refactor the entire application architecture to follow Clean Architecture principles with clear service boundaries, proper dependency inversion, and domain-driven design patterns.

## Consequences

### Positive
- Clear separation of concerns across domains
- Improved testability and maintainability  
- Better scalability and independent deployment
- Consistent API patterns and error handling
- Compliance with financial software architecture standards

### Negative
- Significant refactoring effort required
- Temporary disruption during migration
- Learning curve for development team
- Increased initial complexity

### Neutral
- Changes to existing component interfaces
- New development patterns and conventions
- Updated testing strategies

## Target Architecture

### 1. Domain Layer (Business Logic)
```typescript
// src/domains/financial/entities/Transaction.ts
export interface Transaction {
  id: string
  userId: string
  amount: Money
  description: string
  category: TransactionCategory
  date: DateTime
  status: TransactionStatus
  metadata: TransactionMetadata
}

export interface Money {
  amount: number
  currency: Currency
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed', 
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// src/domains/financial/value-objects/Money.ts
export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: Currency = Currency.BRL
  ) {
    this.validateAmount(amount)
  }

  private validateAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number')
    }
  }

  getValue(): number {
    return this.amount
  }

  getCurrency(): Currency {
    return this.currency
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies')
    }
    return new Money(this.amount + other.getValue(), this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies')
    }
    return new Money(this.amount - other.getValue(), this.currency)
  }
}
```

### 2. Application Layer (Use Cases)
```typescript
// src/applications/financial/use-cases/CreateTransaction.ts
export interface CreateTransactionRequest {
  userId: string
  amount: number
  description: string
  category: string
  date?: string
}

export interface CreateTransactionResponse {
  transaction: Transaction
  success: boolean
  errors?: string[]
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      // Validate business rules
      const validationErrors = await this.validateRequest(request)
      if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors }
      }

      // Create transaction entity
      const money = new Money(request.amount, Currency.BRL)
      const transaction = Transaction.create({
        userId: request.userId,
        amount: money,
        description: request.description,
        category: TransactionCategory.fromString(request.category),
        date: request.date ? new DateTime(request.date) : DateTime.now(),
        status: TransactionStatus.PENDING,
      })

      // Update account balance
      const account = await this.accountRepository.findByUserId(request.userId)
      if (!account) {
        throw new Error('Account not found')
      }

      account.updateBalance(transaction.getAmount())
      await this.accountRepository.save(account)

      // Save transaction
      const savedTransaction = await this.transactionRepository.save(transaction)

      // Dispatch domain events
      await this.eventDispatcher.dispatch(new TransactionCreatedEvent(savedTransaction))
      await this.eventDispatcher.dispatch(new AccountBalanceUpdatedEvent(account))

      // Log audit trail
      await this.auditLogger.log({
        userId: request.userId,
        action: 'transaction_created',
        transactionId: savedTransaction.getId(),
        amount: transaction.getAmount().getValue(),
        metadata: {
          category: request.category,
          description: request.description,
        },
      })

      return { success: true, transaction: savedTransaction }
    } catch (error) {
      await this.auditLogger.log({
        userId: request.userId,
        action: 'transaction_creation_failed',
        error: error.message,
        metadata: { request },
      })
      
      throw error
    }
  }

  private async validateRequest(request: CreateTransactionRequest): Promise<string[]> {
    const errors: string[] = []

    if (!request.description || request.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (request.amount <= 0) {
      errors.push('Amount must be positive')
    }

    if (request.amount > 1000000) { // 1M BRL limit
      errors.push('Amount exceeds maximum limit')
    }

    // Validate user has sufficient funds for debits
    if (request.amount < 0) {
      const account = await this.accountRepository.findByUserId(request.userId)
      if (!account || account.getBalance().getValue() < Math.abs(request.amount)) {
        errors.push('Insufficient funds')
      }
    }

    return errors
  }
}
```

### 3. Infrastructure Layer (Data Access)
```typescript
// src/infrastructure/repositories/SupabaseTransactionRepository.ts
export class SupabaseTransactionRepository implements ITransactionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const data = this.mapToDatabaseRecord(transaction)
    
    const { data: saved, error } = await this.supabase
      .from('transactions')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Failed to save transaction: ${error.message}`, error)
    }

    return this.mapToEntity(saved)
  }

  async findById(id: string): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new RepositoryError(`Failed to find transaction: ${error.message}`, error)
    }

    return data ? this.mapToEntity(data) : null
  }

  async findByUserId(userId: string, options?: FindOptions): Promise<Transaction[]> {
    let query = this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending })
    }

    const { data, error } = await query

    if (error) {
      throw new RepositoryError(`Failed to find transactions: ${error.message}`, error)
    }

    return data.map(record => this.mapToEntity(record))
  }

  private mapToDatabaseRecord(transaction: Transaction): any {
    return {
      id: transaction.getId(),
      user_id: transaction.getUserId(),
      amount: transaction.getAmount().getValue(),
      currency: transaction.getAmount().getCurrency(),
      description: transaction.getDescription(),
      category: transaction.getCategory().getValue(),
      date: transaction.getDate().toISOString(),
      status: transaction.getStatus().getValue(),
      metadata: transaction.getMetadata(),
      created_at: transaction.getCreatedAt()?.toISOString(),
      updated_at: transaction.getUpdatedAt()?.toISOString(),
    }
  }

  private mapToEntity(record: any): Transaction {
    return Transaction.restore({
      id: record.id,
      userId: record.user_id,
      amount: new Money(record.amount, record.currency as Currency),
      description: record.description,
      category: TransactionCategory.fromString(record.category),
      date: new DateTime(record.date),
      status: TransactionStatus.fromString(record.status),
      metadata: record.metadata || {},
      createdAt: record.created_at ? new DateTime(record.created_at) : undefined,
      updatedAt: record.updated_at ? new DateTime(record.updated_at) : undefined,
    })
  }
}
```

### 4. Interface Layer (API Controllers)
```typescript
// src/interfaces/controllers/TransactionController.ts
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase
  ) {}

  async createTransaction(request: CreateTransactionRequest): Promise<APIResponse<Transaction>> {
    try {
      const result = await this.createTransactionUseCase.execute(request)
      
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
        data: result.transaction,
      }
    } catch (error) {
      return this.handleError(error, 'transaction_creation_failed')
    }
  }

  async getTransactions(userId: string, options: GetTransactionsOptions): Promise<APIResponse<Transaction[]>> {
    try {
      const transactions = await this.getTransactionsUseCase.execute(userId, options)
      
      return {
        success: true,
        data: transactions,
        metadata: {
          count: transactions.length,
          userId,
        },
      }
    } catch (error) {
      return this.handleError(error, 'transaction_fetch_failed')
    }
  }

  private handleError(error: Error, errorCode: string): APIResponse<never> {
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
          details: error.originalError?.message,
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    }
  }
}
```

## Service Boundaries Definition

### 1. Financial Domain Service
```typescript
// src/domains/financial/FinancialService.ts
export const financialRouter = router({
  // Transaction management
  transactions: router({
    create: protectedProcedure
      .input(createTransactionSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<TransactionController>('TransactionController')
        return await controller.createTransaction({
          ...input,
          userId: ctx.user.id,
        })
      }),

    list: protectedProcedure
      .input(listTransactionsSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<TransactionController>('TransactionController')
        return await controller.getTransactions(ctx.user.id, input)
      }),

    get: protectedProcedure
      .input(getTransactionSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<TransactionController>('TransactionController')
        return await controller.getTransaction(input.id, ctx.user.id)
      }),
  }),

  // Account management
  accounts: router({
    getBalance: protectedProcedure
      .query(async ({ ctx }) => {
        const controller = container.get<AccountController>('AccountController')
        return await controller.getAccountBalance(ctx.user.id)
      }),

    updateAccount: protectedProcedure
      .input(updateAccountSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<AccountController>('AccountController')
        return await controller.updateAccount(ctx.user.id, input)
      }),
  }),

  // Financial summaries and analytics
  summaries: router({
    getMonthlySummary: protectedProcedure
      .input(monthlySummarySchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<SummaryController>('SummaryController')
        return await controller.getMonthlySummary(ctx.user.id, input)
      }),

    getSpendingAnalysis: protectedProcedure
      .input(spendingAnalysisSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<SummaryController>('SummaryController')
        return await controller.getSpendingAnalysis(ctx.user.id, input)
      }),
  }),
})
```

### 2. PIX Domain Service
```typescript
// src/domains/pix/PixService.ts
export const pixRouter = router({
  // PIX Keys management
  keys: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const controller = container.get<PixKeyController>('PixKeyController')
        return await controller.listKeys(ctx.user.id)
      }),

    create: protectedProcedure
      .input(createPixKeySchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<PixKeyController>('PixKeyController')
        return await controller.createKey(ctx.user.id, input)
      }),

    delete: protectedProcedure
      .input(deletePixKeySchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<PixKeyController>('PixKeyController')
        return await controller.deleteKey(ctx.user.id, input.id)
      }),
  }),

  // PIX Transactions
  transactions: router({
    send: protectedProcedure
      .input(sendPixSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<PixTransactionController>('PixTransactionController')
        return await controller.sendPix(ctx.user.id, input)
      }),

    list: protectedProcedure
      .input(listPixTransactionsSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<PixTransactionController>('PixTransactionController')
        return await controller.listTransactions(ctx.user.id, input)
      }),

    getStatus: protectedProcedure
      .input(getPixStatusSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<PixTransactionController>('PixTransactionController')
        return await controller.getTransactionStatus(ctx.user.id, input.transactionId)
      }),
  }),

  // QR Code generation
  qrCodes: router({
    generate: protectedProcedure
      .input(generateQRCodeSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<PixQRCodeController>('PixQRCodeController')
        return await controller.generateQRCode(ctx.user.id, input)
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const controller = container.get<PixQRCodeController>('PixQRCodeController')
        return await controller.listQRCodes(ctx.user.id)
      }),
  }),
})
```

### 3. Voice Domain Service
```typescript
// src/domains/voice/VoiceService.ts
export const voiceRouter = router({
  // Voice command processing
  commands: router({
    process: protectedProcedure
      .input(processVoiceCommandSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<VoiceCommandController>('VoiceCommandController')
        return await controller.processCommand(ctx.user.id, input)
      }),

    getHistory: protectedProcedure
      .input(getVoiceHistorySchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<VoiceCommandController>('VoiceCommandController')
        return await controller.getCommandHistory(ctx.user.id, input)
      }),
  }),

  // Voice analytics and insights
  analytics: router({
    getUsageStats: protectedProcedure
      .input(getVoiceStatsSchema)
      .query(async ({ input, ctx }) => {
        const controller = container.get<VoiceAnalyticsController>('VoiceAnalyticsController')
        return await controller.getUsageStats(ctx.user.id, input)
      }),

    getAccuracyMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        const controller = container.get<VoiceAnalyticsController>('VoiceAnalyticsController')
        return await controller.getAccuracyMetrics(ctx.user.id)
      }),
  }),

  // Voice processing configuration
  processing: router({
    updateSettings: protectedProcedure
      .input(updateVoiceSettingsSchema)
      .mutation(async ({ input, ctx }) => {
        const controller = container.get<VoiceProcessingController>('VoiceProcessingController')
        return await controller.updateSettings(ctx.user.id, input)
      }),

    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const controller = container.get<VoiceProcessingController>('VoiceProcessingController')
        return await controller.getSettings(ctx.user.id)
      }),
  }),
})
```

## Dependency Injection Container

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
    // Domain services
    this.container.bind<CreateTransactionUseCase>(TYPES.CreateTransactionUseCase)
      .to(CreateTransactionUseCase)
      .inSingletonScope()

    this.container.bind<CreatePixKeyUseCase>(TYPES.CreatePixKeyUseCase)
      .to(CreatePixKeyUseCase)
      .inSingletonScope()

    // Infrastructure
    this.container.bind<ITransactionRepository>(TYPES.TransactionRepository)
      .to(SupabaseTransactionRepository)
      .inSingletonScope()

    this.container.bind<IPixKeyRepository>(TYPES.PixKeyRepository)
      .to(SupabasePixKeyRepository)
      .inSingletonScope()

    // External services
    this.container.bind<IPixApiService>(TYPES.PixApiService)
      .to(BcbPixApiService)
      .inSingletonScope()

    this.container.bind<IVoiceRecognitionService>(TYPES.VoiceRecognitionService)
      .to(AzureVoiceRecognitionService)
      .inSingletonScope()

    // Controllers
    this.container.bind<TransactionController>(TYPES.TransactionController)
      .to(TransactionController)
      .inSingletonScope()

    this.container.bind<PixKeyController>(TYPES.PixKeyController)
      .to(PixKeyController)
      .inSingletonScope()
  }

  get<T>(serviceIdentifier: string): T {
    return this.container.get<T>(serviceIdentifier)
  }
}

export const container = new DIContainer()
```

## Migration Strategy

### Phase 1: Foundation Setup (Week 1)
1. **Set up dependency injection container**
2. **Define domain entities and value objects**
3. **Create repository interfaces**
4. **Implement base controller pattern**

### Phase 2: Core Domain Migration (Week 2-3)
1. **Migrate financial domain services**
2. **Implement transaction use cases**
3. **Create financial controllers**
4. **Update tRPC routers to use controllers**

### Phase 3: PIX Domain Migration (Week 3-4)
1. **Migrate PIX domain services**
2. **Implement PIX use cases**
3. **Create PIX controllers**
4. **Update PIX routers**

### Phase 4: Voice Domain Migration (Week 4-5)
1. **Migrate voice domain services**
2. **Implement voice use cases**
3. **Create voice controllers**
4. **Update voice routers**

### Phase 5: Cleanup and Testing (Week 5-6)
1. **Remove old router patterns**
2. **Update component integrations**
3. **Comprehensive testing**
4. **Performance optimization**

## Testing Strategy

### Unit Testing
```typescript
// src/test/unit/applications/financial/CreateTransactionUseCase.test.ts
describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase
  let mockRepository: jest.Mocked<ITransactionRepository>
  let mockEventDispatcher: jest.Mocked<IEventDispatcher>

  beforeEach(() => {
    mockRepository = createMockTransactionRepository()
    mockEventDispatcher = createMockEventDispatcher()
    
    useCase = new CreateTransactionUseCase(
      mockRepository,
      mockAccountRepository,
      mockEventDispatcher,
      mockAuditLogger
    )
  })

  it('should create transaction successfully', async () => {
    const request: CreateTransactionRequest = {
      userId: 'user-123',
      amount: 100,
      description: 'Test transaction',
      category: 'food',
    }

    const result = await useCase.execute(request)

    expect(result.success).toBe(true)
    expect(result.transaction).toBeDefined()
    expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Transaction))
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.any(TransactionCreatedEvent)
    )
  })

  it('should validate transaction amount', async () => {
    const request: CreateTransactionRequest = {
      userId: 'user-123',
      amount: -100, // Invalid negative amount
      description: 'Test transaction',
      category: 'food',
    }

    const result = await useCase.execute(request)

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Amount must be positive')
  })
})
```

### Integration Testing
```typescript
// src/test/integration/controllers/TransactionController.test.ts
describe('TransactionController Integration', () => {
  let controller: TransactionController
  let supabase: SupabaseClient

  beforeAll(async () => {
    supabase = createTestSupabaseClient()
    const container = setupTestDIContainer(supabase)
    controller = container.get<TransactionController>(TYPES.TransactionController)
  })

  it('should handle complete transaction flow', async () => {
    const request: CreateTransactionRequest = {
      userId: 'test-user-123',
      amount: 100,
      description: 'Integration test transaction',
      category: 'food',
    }

    const response = await controller.createTransaction(request)

    expect(response.success).toBe(true)
    expect(response.data).toBeDefined()

    // Verify transaction was saved
    const saved = await supabase
      .from('transactions')
      .select('*')
      .eq('id', response.data!.getId())
      .single()

    expect(saved.data).toBeDefined()
    expect(saved.data.amount).toBe(100)
  })
})
```

## Implementation Checklist

- [ ] Set up dependency injection framework
- [ ] Define domain entities and value objects
- [ ] Create repository interfaces
- [ ] Implement repository pattern with Supabase
- [ ] Create use case classes for business logic
- [ ] Implement controller pattern for API layer
- [ ] Refactor tRPC routers to use controllers
- [ ] Update component hooks to use new API patterns
- [ ] Create comprehensive test suite
- [ ] Update documentation and API specs
- [ ] Performance testing and optimization
- [ ] Security review and validation

---

**Decision Date**: 2025-01-XX  
**Review Date**: 2025-02-XX  
**Implementation Owner**: Architecture Team + Development Team  
**Compliance**: Clean Architecture Principles + DDD Patterns
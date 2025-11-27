# AegisWallet Architecture - Example Gallery

## 📁 Available Examples

### 1. Voice Command Examples (`voice-commands/`)
- **Essential Commands**: The 6 core Brazilian financial voice commands
- **Regional Variations**: Different Portuguese expressions by Brazilian region
- **Error Handling**: Examples of voice recognition error recovery
- **Performance Testing**: Voice command performance benchmarks

### 2. API Implementation Examples (`api-implementation/`)
- **tRPC Procedures**: Type-safe financial API procedures
- **PIX Integration**: Complete PIX payment implementation
- **Boleto Processing**: Boleto generation and payment workflows
- **Real-time Updates**: Supabase realtime subscription examples

### 3. Database Design Examples (`database-design/`)
- **Schema Patterns**: Optimized database schemas for financial data
- **RLS Policies**: Row Level Security for multi-tenant isolation
- **Migration Scripts**: Database migration examples
- **Performance Indexes**: Optimized indexes for financial queries

### 4. Frontend Components Examples (`frontend-components/`)
- **Voice Dashboard**: Complete voice interface component
- **Financial Forms**: LGPD-compliant form components
- **Transaction Lists**: Real-time transaction displays
- **Accessibility Features**: WCAG 2.1 AA compliant components

### 5. Testing Examples (`testing-examples/`)
- **Voice Testing**: Automated voice command testing
- **LGPD Compliance**: Data protection compliance tests
- **Performance Testing**: Voice response time testing
- **Integration Testing**: End-to-end financial workflow tests

## 🔥 Most Popular Examples

### Example: PIX Transfer Implementation
```typescript
// Complete PIX transfer workflow
export const pixTransferRouter = router({
  create: protectedProcedure
    .input(z.object({
      amount: z.number().positive().max(1000000),
      pixKey: z.string().min(1),
      description: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate PIX key format
      if (!validatePIXKey(input.pixKey)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid PIX key format'
        });
      }
      
      // Check daily limits
      const dailyTotal = await getDailyPIXTotal(ctx.user.id);
      if (dailyTotal + input.amount > 10000) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Daily PIX limit exceeded'
        });
      }
      
      // Create PIX transaction
      const transaction = await createPIXTransaction({
        userId: ctx.user.id,
        amount: input.amount,
        pixKey: input.pixKey,
        description: input.description,
        status: 'pending'
      });
      
      // Process with bank API
      const pixResult = await processPIXTransfer(transaction);
      
      // Update transaction status
      await updateTransactionStatus(transaction.id, pixResult.status);
      
      return {
        transactionId: transaction.id,
        endToEndId: pixResult.endToEndId,
        status: pixResult.status,
        estimatedTime: '2 seconds'
      };
    }),
});
```

### Example: Brazilian Portuguese Voice Processing
```typescript
// Voice command processing with regional variations
class BrazilianVoiceProcessor {
  private regionalPatterns = {
    SP: {
      greetings: ['oi', 'eai', 'beleza'],
      financial: ['grana', 'coiso', 'boleta'],
      patterns: [/quanto tá/i, /me fala o valor/i]
    },
    RJ: {
      greetings: ['eai', 'firmesa'],
      financial: ['grana', 'caraca'],
      patterns: [/qualé o valor/i, /me ajuda/i]
    },
    NE: {
      greetings: ['oi', 'bão', 'oxente'],
      financial: ['bão', 'visse'],
      patterns: [/quanto tá meu filho/i, /me diga quanto/i]
    }
  };
  
  processCommand(transcript: string, region: string): VoiceIntent {
    const patterns = this.regionalPatterns[region] || this.regionalPatterns.SP;
    
    // Normalize transcript
    const normalized = this.normalizePortugueseText(transcript);
    
    // Match against patterns
    for (const [intent, regexes] of Object.entries(this.intentPatterns)) {
      for (const regex of regexes) {
        if (regex.test(normalized)) {
          return {
            intent,
            confidence: this.calculateConfidence(normalized, regex),
            entities: this.extractEntities(normalized),
            region
          };
        }
      }
    }
    
    return this.fallbackIntent(normalized);
  }
}
```

### Example: LGPD Data Masking
```typescript
// LGPD-compliant data masking for financial applications
const lgpdMasking = {
  maskUserData: (userData: UserData): MaskedUserData => {
    return {
      id: userData.id,
      name: this.maskName(userData.name),
      email: this.maskEmail(userData.email),
      cpf: this.maskCPF(userData.cpf),
      phone: this.maskPhone(userData.phone),
      createdAt: userData.createdAt
    };
  },
  
  maskCPF: (cpf: string): string => {
    // Format: XXX.XXX.XXX-XX -> XXX.***.***-XX
    return cpf.replace(/(\d{3})\d{3}(\d{3})(\d{2})/, '$1***.***-$3$4');
  },
  
  maskFinancialData: (transaction: Transaction): MaskedTransaction => {
    return {
      id: transaction.id,
      userId: transaction.userId,
      amount: this.maskAmount(transaction.amount),
      description: transaction.description, // Keep description for user identification
      date: transaction.date,
      status: transaction.status,
      recipientName: this.maskName(transaction.recipientName)
    };
  }
};
```

## 🛠️ How to Use These Examples

### 1. Copy and Adapt
```bash
# Copy an example to your project
cp examples/api-implementation/pix-router.ts src/server/routes/
```

### 2. Run Examples
```bash
# Run voice command examples
cd examples/voice-commands
npm run example:balance-query
```

### 3. Test Examples
```bash
# Run example tests
cd examples/testing-examples
npm run test:lgpd-compliance
```

### 4. Validate Examples
```bash
# Validate example architecture
python scripts/validate_architecture.py --directory examples/
```

## 📚 Learning Path

### Beginner
1. Start with `voice-commands/basic-examples.md`
2. Try `frontend-components/simple-forms.md`
3. Review `database-design/basic-schemas.md`

### Intermediate
1. Study `api-implementation/trpc-procedures.md`
2. Practice `testing-examples/unit-tests.md`
3. Explore `performance-optimization/caching.md`

### Advanced
1. Implement `api-integration/pix-full-flow.md`
2. Master `testing-examples/e2e-testing.md`
3. Optimize `performance-optimization/voice-streaming.md`

## 🤝 Contributing Examples

To contribute new examples:

1. **Create a new folder** in the appropriate category
2. **Include a README.md** explaining the example
3. **Add tests** for the example implementation
4. **Validate compliance** with LGPD and security standards
5. **Update this gallery** with your new example

## 📞 Need Help?

- **Documentation**: Check `SKILL.md` for detailed explanations
- **Templates**: Use files in `assets/templates/` as starting points
- **Validation**: Run `python scripts/validate_architecture.py` for compliance checks

---

*Start building voice-first financial applications for the Brazilian market with these production-ready examples!* 🇧🇷💰

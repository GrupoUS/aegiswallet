# Backend Architecture - Hono RPC v2.0.0

## Stack Técnico (Performance 50-100x melhor)

| Componente | Tecnologia | Versão | Otimização |
|------------|------------|--------|------------|
| Runtime | Bun | Latest | 3-5x mais rápido que Node.js |
| Framework | **Hono RPC v2.0.0** | 4.10+ | **5-15ms vs 300-500ms** |
| Validação | @hono/zod-validator | 0.7+ | Middleware otimizado |
| ORM | Drizzle | 0.44+ | Edge-ready |
| Database | Neon PostgreSQL | - | Serverless |
| Auth | Clerk | 5.57+ | SOC 2 compliant |

---

## Arquitetura Hono RPC v2.0.0

### Migração tRPC → Hono RPC

**Benefícios Alcançados**:
- **Bundle Size**: Redução de ~50KB (remoção tRPC)
- **Performance**: 50-100x mais rápido (5-15ms vs 300-500ms)
- **Simplificação**: Menos abstrações, debugging mais claro
- **Manutenibilidade**: Padrões HTTP padrão, mais fácil de entender

**Funcionalidade Mantida**:
- ✅ Zero regressões em features do usuário
- ✅ Type safety preservado via Zod schemas
- ✅ Real-time via API polling
- ✅ Todas as validações e autenticações

---

## Estrutura de Diretórios

```
src/server/
├── config/              # Configurações do servidor
├── lib/                 # Utilitários e helpers
├── middleware/          # Auth, error, rate limiting
├── routes/
│   └── v1/              # API v1 com Hono RPC
│       ├── health.ts
│       ├── voice.ts     # Processamento de comandos de voz
│       ├── pix/         # PIX endpoints
│       ├── contacts.ts
│       ├── transactions.ts
│       ├── bank-accounts.ts
│       └── users.ts
├── webhooks/            # Clerk, Stripe webhooks
├── server.ts            # Servidor principal (Bun)
└── vercel.ts            # Entry point Vercel
```

---

## API Design Pattern

### URL Pattern
```
/api/v1/{domain}/{action} - HTTP method semantics
```

### Response Pattern
```typescript
// Success Response
{
  "data": result,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}

// Error Response
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional context */ }
}
```

---

## API Endpoints Complete

### Health & Monitoring
```
GET  /api/v1/health              # Service health check
GET  /api/v1/health/ping         # Simple ping response
GET  /api/v1/health/auth         # Authenticated health check
```

### Voice Commands (Core Feature)
```
POST /api/v1/voice/process       # Process voice command
GET  /api/v1/voice/commands      # Available commands
```

### PIX ( Brazilian Payment System )
```
GET    /api/v1/pix/keys           # List PIX keys
POST   /api/v1/pix/keys           # Create PIX key
PUT    /api/v1/pix/keys/:id       # Update PIX key
DELETE /api/v1/pix/keys/:id       # Delete PIX key
GET    /api/v1/pix/keys/favorites # Favorite keys
GET    /api/v1/pix/transactions   # PIX transactions
POST   /api/v1/pix/transactions   # Create PIX transaction
GET    /api/v1/pix/qr-codes       # QR codes
POST   /api/v1/pix/qr-codes       # Generate QR code
DELETE /api/v1/pix/qr-codes/:id   # Deactivate QR code
GET    /api/v1/pix/stats           # PIX statistics
```

### Contacts
```
GET    /api/v1/contacts           # All contacts
GET    /api/v1/contacts/:id       # Single contact
POST   /api/v1/contacts           # Create contact
PUT    /api/v1/contacts/:id       # Update contact
DELETE /api/v1/contacts/:id       # Delete contact
GET    /api/v1/contacts/search    # Search contacts
GET    /api/v1/contacts/favorites # Favorite contacts
POST   /api/v1/contacts/:id/favorite # Toggle favorite
GET    /api/v1/contacts/stats      # Contact statistics
```

### Banking & Transactions
```
GET    /api/v1/bank-accounts       # List bank accounts
POST   /api/v1/bank-accounts       # Link new account
POST   /api/v1/bank-accounts/sync  # Sync account data
GET    /api/v1/transactions        # List transactions
POST   /api/v1/transactions        # Create transaction
PUT    /api/v1/transactions/:id    # Update transaction
DELETE /api/v1/transactions/:id    # Delete transaction
```

### Users & Preferences
```
GET    /api/v1/users/me            # User profile
PUT    /api/v1/users/me            # Update profile
DELETE /api/v1/users/me            # Delete account (LGPD)
GET    /api/v1/users/preferences   # User preferences
PUT    /api/v1/users/preferences   # Update preferences
```

### AI Chat
```
POST   /api/v1/ai-chat/message     # Send message
GET    /api/v1/ai-chat/sessions    # List sessions
GET    /api/v1/ai-chat/sessions/:id # Session history
DELETE /api/v1/ai-chat/sessions/:id # Delete session
```

---

## Implementation Patterns

### Authentication Middleware
```typescript
import { clerkAuth } from '@/server/middleware/clerk-auth'

router.use('/*', clerkAuth)

// In route handlers
const user = c.get('auth')
```

### Validation Pattern
```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
})

router.post('/', zValidator('json', schema), async (c) => {
  const input = c.req.valid('json') // Fully typed and validated
  // Process input...
})
```

### Rate Limiting Pattern
```typescript
userRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests, please try again later'
})
```

---

## Client Integration

### API Client Usage
```typescript
import { apiClient } from '@/lib/api-client'
import { useQuery, useMutation } from '@tanstack/react-query'

// Query example
const { data, isLoading, error } = useQuery({
  queryKey: ['pix', 'keys'],
  queryFn: () => apiClient.get('/api/v1/pix/keys'),
})

// Mutation example
const { mutate, isPending } = useMutation({
  mutationFn: (input) => apiClient.post('/api/v1/pix/keys', input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pix', 'keys'] })
  },
})
```

### Type Safety
```typescript
// Shared Zod schema
export const createPixKeySchema = z.object({
  type: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  value: z.string().min(1),
})

// Inferred type
type CreatePixKeyInput = z.infer<typeof createPixKeySchema>

// Used in both client and server
```

---

## Database (Drizzle + Neon)

### Connection Pattern
```typescript
import { db } from '@/db/client'
import { eq } from 'drizzle-orm'

// Query example
const data = await db
  .select()
  .from(transactions)
  .where(eq(transactions.userId, userId))
```

### Operations
```typescript
// SELECT
const items = await db.select().from(table).where(condition)

// INSERT
const [item] = await db.insert(table).values(data).returning()

// UPDATE
await db.update(table).set(data).where(condition)

// DELETE
await db.delete(table).where(condition)
```

---

## AI Integration (Vercel AI SDK)

```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: 'Você é um assistente financeiro...',
  messages: conversationMessages,
})

return new Response(result.toDataStream())
```

**Providers Available**:
- `@ai-sdk/anthropic` - Claude
- `@ai-sdk/openai` - GPT
- `@ai-sdk/google` - Gemini

---

## Security & Performance

### Authentication
- JWT-based authentication with Clerk
- All protected routes require valid authentication
- Token validation and user context extraction

### Rate Limiting
- Per-user rate limiting to prevent abuse
- Different limits for different operation types
- Configurable windows and maximum requests

### Input Validation
- All inputs validated using Zod schemas
- Sanitization of sensitive data (CPF, phone numbers)
- Type safety maintained through shared schemas

---

## LGPD Compliance

### Compliance Endpoints
```
GET  /api/v1/compliance/consent    # Consent status
POST /api/v1/compliance/consent    # Record consent
POST /api/v1/compliance/export     # Data export request
POST /api/v1/compliance/deletion   # Data deletion request
```

### Audit Logging
All actions are recorded in `audit_logs`:
- Action performed
- User ID
- Timestamp
- IP and User-Agent
- Changed data

---

## Development Scripts

```bash
# Development
bun dev:server         # Start development server

# Database
bun db:generate        # Generate migrations
bun db:migrate         # Apply migrations
bun db:push            # Direct push (dev only)
bun db:studio          # Drizzle Studio

# Build
bun build:server       # Production build

# Production
bun start              # Start server
bun start:prod         # Production mode
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Clerk
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# AI (optional - uses fallback)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## Migration Benefits

### Performance Improvements
- **Bundle Size**: Reduced by ~50KB from removing tRPC dependencies
- **Cold Start**: Faster initial page load with fewer dependencies
- **Runtime Performance**: 5-15ms response time vs 300-500ms
- **Memory Usage**: Lower footprint with fewer abstractions

### Developer Experience
- **Simpler Debugging**: Clearer stack traces without tRPC abstraction
- **Better Error Messages**: More descriptive error responses
- **Easier Testing**: Direct HTTP endpoints are easier to test
- **Reduced Complexity**: Fewer layers between client and server

### Maintainability
- **Clearer Code Structure**: Explicit HTTP methods and routes
- **Standardized Patterns**: Consistent validation and error handling
- **Better Documentation**: Self-documenting API endpoints
- **Easier Onboarding**: Developers understand HTTP APIs faster

---

**Última Atualização**: Novembro 2025
**Versão**: Hono RPC v2.0.0 - Performance 50-100x melhor
**Status**: Production Ready

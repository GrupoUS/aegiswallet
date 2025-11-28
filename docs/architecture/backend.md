# Backend - AegisWallet

## Stack Técnico

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Runtime | Bun | Latest |
| Framework | Hono | 4.10+ |
| Validação | @hono/zod-validator | 0.7+ |
| ORM | Drizzle | 0.44+ |
| Database | Neon PostgreSQL | - |
| Auth | Clerk | 5.57+ |
| AI | Vercel AI SDK | 5.0+ |

---

## Estrutura de Diretórios

```
src/server/
├── config/           # Configurações do servidor
├── lib/              # Utilitários e helpers
├── middleware/       # Middlewares (auth, error, etc.)
├── routes/
│   └── v1/           # Rotas da API v1
│       ├── ai-chat.ts
│       ├── bank-accounts.ts
│       ├── calendar.ts
│       ├── contacts.ts
│       ├── health.ts
│       ├── transactions.ts
│       ├── users.ts
│       └── voice.ts
├── webhooks/         # Webhooks (Clerk, Stripe, etc.)
├── server.ts         # Servidor principal (Bun)
└── vercel.ts         # Entry point Vercel
```

---

## API Routes

### Base URL
- **Desenvolvimento**: `http://localhost:3000/api/v1`
- **Produção**: `https://aegiswallet.vercel.app/api/v1`

### Endpoints Principais

#### Health Check
```
GET /api/v1/health
```

#### Usuários
```
GET    /api/v1/users/me          # Perfil do usuário
PUT    /api/v1/users/me          # Atualizar perfil
DELETE /api/v1/users/me          # Deletar conta (LGPD)
GET    /api/v1/users/preferences # Preferências
PUT    /api/v1/users/preferences # Atualizar preferências
```

#### Transações
```
GET    /api/v1/transactions              # Listar transações
POST   /api/v1/transactions              # Criar transação
GET    /api/v1/transactions/:id          # Detalhes
PUT    /api/v1/transactions/:id          # Atualizar
DELETE /api/v1/transactions/:id          # Deletar
GET    /api/v1/transactions/categories   # Categorias
```

#### Calendário
```
GET    /api/v1/calendar/events           # Listar eventos
POST   /api/v1/calendar/events           # Criar evento
PUT    /api/v1/calendar/events/:id       # Atualizar
DELETE /api/v1/calendar/events/:id       # Deletar
```

#### AI Chat
```
POST   /api/v1/ai-chat/message           # Enviar mensagem
GET    /api/v1/ai-chat/sessions          # Listar sessões
GET    /api/v1/ai-chat/sessions/:id      # Histórico da sessão
DELETE /api/v1/ai-chat/sessions/:id      # Deletar sessão
```

#### Contas Bancárias
```
GET    /api/v1/bank-accounts             # Listar contas
POST   /api/v1/bank-accounts             # Criar conta manual
PUT    /api/v1/bank-accounts/:id         # Atualizar
DELETE /api/v1/bank-accounts/:id         # Deletar
```

---

## Autenticação

### Clerk Middleware

Todas as rotas protegidas usam o middleware Clerk:

```typescript
import { clerkAuth } from '@/server/middleware/clerk-auth'

router.use('/*', clerkAuth)
```

### Contexto de Autenticação

```typescript
// Acessar usuário autenticado
const { user, db } = c.get('auth')

// user.id = Clerk User ID (format: "user_xxx")
```

---

## Database (Drizzle)

### Conexão

```typescript
import { db } from '@/db/client'
import { eq } from 'drizzle-orm'
import { transactions } from '@/db/schema'

// Query exemplo
const data = await db
  .select()
  .from(transactions)
  .where(eq(transactions.userId, userId))
```

### Operações Comuns

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

## Validação (Zod)

```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  categoryId: z.string().uuid().optional(),
})

router.post('/', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json')
  // ...
})
```

---

## AI Chat Integration

### Vercel AI SDK

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

### Providers Disponíveis
- `@ai-sdk/anthropic` - Claude
- `@ai-sdk/openai` - GPT
- `@ai-sdk/google` - Gemini

---

## Error Handling

### Padrão de Resposta

```typescript
// Sucesso
return c.json({ data: result }, 200)

// Erro de validação
return c.json({ error: 'Dados inválidos', details }, 400)

// Não autorizado
return c.json({ error: 'Não autorizado' }, 401)

// Não encontrado
return c.json({ error: 'Recurso não encontrado' }, 404)

// Erro interno
return c.json({ error: 'Erro interno do servidor' }, 500)
```

---

## Scripts

```bash
# Desenvolvimento
bun dev:server         # Iniciar servidor dev

# Database
bun db:generate        # Gerar migrations
bun db:migrate         # Aplicar migrations
bun db:push            # Push direto (dev only)
bun db:studio          # Drizzle Studio

# Build
bun build:server       # Build para produção

# Produção
bun start              # Iniciar servidor
bun start:prod         # Iniciar em modo produção
```

---

## Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://...

# Clerk
CLERK_SECRET_KEY=sk_...
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# AI (opcional - usa fallback)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## LGPD Compliance

### Endpoints de Conformidade

```
GET  /api/v1/compliance/consent        # Status de consentimento
POST /api/v1/compliance/consent        # Registrar consentimento
POST /api/v1/compliance/export         # Solicitar exportação de dados
POST /api/v1/compliance/deletion       # Solicitar exclusão
```

### Auditoria

Todas as ações são registradas em `audit_logs`:
- Ação realizada
- ID do usuário
- Timestamp
- IP e User-Agent
- Dados alterados

---

**Última Atualização**: Novembro 2025

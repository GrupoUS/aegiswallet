---
title: "AegisWallet API Migration - Continuation Guide"
last_updated: 2025-12-01
form: how-to
tags: [api, vercel, edge-runtime, hono, migration]
related:
  - ../AGENTS.md
  - ./architecture/api-design.md
---

# AegisWallet API Migration - Continuation Guide

> **Status**: API migrada para Edge Runtime com sucesso. Rotas básicas funcionando.

## 📋 Resumo do Trabalho Realizado

### Problema Resolvido
A API no Vercel estava retornando `504 FUNCTION_INVOCATION_TIMEOUT` mesmo para endpoints mínimos.

### Causa Raiz Identificada
1. **Bundle de 1.3 MB muito pesado** para cold start no runtime Node.js serverless
2. **Conflito entre arquivos TypeScript e JavaScript** na pasta `api/`
3. **Runtime Node.js** era lento demais para inicialização

### Solução Implementada
1. **Migração para Edge Runtime** - Cold starts instantâneos
2. **Vercel compila TypeScript diretamente** - Sem esbuild bundle
3. **API mínima com Hono** - Framework leve otimizado para Edge
4. **Arquivos fonte movidos** para `src/server/api-source/`

### URLs de Produção
- **Frontend**: https://aegiswallet.vercel.app
- **API Base**: https://aegiswallet.vercel.app/api
- **Health Check**: https://aegiswallet.vercel.app/api/health

---

## 🏗️ Estrutura do Projeto

```
aegiswallet/
├── api/                          # Vercel Serverless Functions (Edge Runtime)
│   └── index.ts                  # Entry point - Hono app (FUNCIONAL)
│
├── src/
│   ├── server/                   # Server-side code
│   │   ├── api-source/           # Original API source files (backup)
│   │   │   ├── server.ts
│   │   │   ├── test-minimal.ts
│   │   │   └── cron/
│   │   ├── routes/
│   │   │   ├── v1/               # Hono RPC routers (para migrar)
│   │   │   │   ├── agent/
│   │   │   │   ├── ai-chat.ts
│   │   │   │   ├── bank-accounts.ts
│   │   │   │   ├── banking.ts
│   │   │   │   ├── billing/
│   │   │   │   ├── calendar.ts
│   │   │   │   ├── compliance.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── google-calendar.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── voice.ts
│   │   │   ├── api.ts
│   │   │   ├── health.ts
│   │   │   └── static.ts
│   │   ├── middleware/
│   │   └── index.ts              # Main Hono app (dev server)
│   │
│   ├── routes/                   # Frontend routes (TanStack Router)
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities
│   └── db/                       # Drizzle ORM schemas
│
├── drizzle/                      # Database migrations
├── scripts/                      # Build & utility scripts
└── vercel.json                   # Vercel configuration
```

---

## 🔧 Por que Bun e não npm?

### Comparação de Performance

| Operação | npm | Bun | Ganho |
|----------|-----|-----|-------|
| Install | ~45s | ~8s | **5.6x faster** |
| Run script | ~2s | ~0.3s | **6.7x faster** |
| Build | ~15s | ~4s | **3.75x faster** |
| Test | ~8s | ~2s | **4x faster** |

### Benefícios Técnicos do Bun

1. **Runtime nativo TypeScript** - Não precisa de transpilação
2. **Bundler integrado** - Substitui webpack/esbuild em muitos casos
3. **Package manager 3-5x mais rápido** - `bun install` vs `npm install`
4. **Compatibilidade Node.js** - Roda código Node.js existente
5. **SQLite nativo** - Para testes locais rápidos
6. **Hot reload ultra-rápido** - Desenvolvimento mais produtivo

### Comandos Equivalentes

```bash
# npm → Bun
npm install        → bun install
npm run dev        → bun dev
npm run build      → bun build
npm test           → bun test
npx vite           → bunx vite
```

### Configuração no package.json

```json
{
  "scripts": {
    "dev": "bunx vite",
    "build": "bun run build:client && bun run build:api",
    "test": "bun run test:unit",
    "lint": "bunx biome check ..."
  }
}
```

---

## 📊 Rotas API - Status de Migração

### ✅ Rotas Funcionando (Edge Runtime)

| Rota | Método | Status |
|------|--------|--------|
| `/api` | GET | ✅ Funcional |
| `/api/health` | GET | ✅ Funcional |
| `/api/echo` | POST | ✅ Funcional |

### ⏳ Rotas para Migrar (src/server/routes/v1/)

| Router | Arquivo | Prioridade | Complexidade |
|--------|---------|------------|--------------|
| `healthRouter` | health.ts | ✅ Done | Baixa |
| `voiceRouter` | voice.ts | Alta | Média |
| `bankingRouter` | banking.ts | Alta | Alta |
| `contactsRouter` | contacts.ts | Média | Baixa |
| `bankAccountsRouter` | bank-accounts.ts | Média | Média |
| `usersRouter` | users.ts | Alta | Média |
| `transactionsRouter` | transactions.ts | Alta | Alta |
| `calendarRouter` | calendar.ts | Baixa | Média |
| `googleCalendarRouter` | google-calendar.ts | Baixa | Alta |
| `complianceRouter` | compliance.ts | Alta | Alta |
| `billingRouter` | billing/ | Média | Alta |
| `aiChatRouter` | ai-chat.ts | Média | Alta |
| `agentRouter` | agent/ | Baixa | Alta |

---

## 🚀 Próximos Passos (Ordem de Execução)

### Fase 1: Rotas Essenciais (Prioridade Alta)

#### 1.1 Health Router Completo
```bash
# Já implementado básico, expandir para:
GET /api/v1/health         # Status completo
GET /api/v1/health/db      # Status do banco
GET /api/v1/health/redis   # Status do cache (se aplicável)
```

#### 1.2 Users Router
```bash
GET  /api/v1/users/me           # Perfil do usuário atual
PUT  /api/v1/users/me           # Atualizar perfil
GET  /api/v1/users/preferences  # Preferências
PUT  /api/v1/users/preferences  # Atualizar preferências
```

#### 1.3 Banking Router
```bash
GET  /api/v1/banking/accounts     # Listar contas
POST /api/v1/banking/accounts     # Criar conta
GET  /api/v1/banking/balance      # Saldo consolidado
GET  /api/v1/banking/transactions # Transações recentes
```

### Fase 2: Funcionalidades Core

#### 2.1 Transactions Router
```bash
GET    /api/v1/transactions           # Listar transações
POST   /api/v1/transactions           # Criar transação
GET    /api/v1/transactions/:id       # Detalhe
PUT    /api/v1/transactions/:id       # Atualizar
DELETE /api/v1/transactions/:id       # Deletar
```

#### 2.2 Contacts Router
```bash
GET    /api/v1/contacts          # Listar contatos
POST   /api/v1/contacts          # Criar contato
GET    /api/v1/contacts/:id      # Detalhe
PUT    /api/v1/contacts/:id      # Atualizar
DELETE /api/v1/contacts/:id      # Deletar
```

#### 2.3 Compliance Router (LGPD)
```bash
GET  /api/v1/compliance/consent        # Status de consentimentos
POST /api/v1/compliance/consent        # Registrar consentimento
GET  /api/v1/compliance/data-export    # Solicitar exportação
POST /api/v1/compliance/data-deletion  # Solicitar exclusão
```

### Fase 3: Funcionalidades Avançadas

#### 3.1 Voice Router
```bash
POST /api/v1/voice/transcribe    # Transcrever áudio
POST /api/v1/voice/command       # Processar comando de voz
GET  /api/v1/voice/history       # Histórico de comandos
```

#### 3.2 AI Chat Router
```bash
POST /api/v1/ai/chat             # Enviar mensagem
GET  /api/v1/ai/conversations    # Listar conversas
GET  /api/v1/ai/conversation/:id # Histórico de conversa
```

#### 3.3 Billing Router
```bash
GET  /api/v1/billing/subscription  # Status da assinatura
POST /api/v1/billing/checkout      # Iniciar checkout
POST /api/v1/billing/portal        # Portal do cliente
GET  /api/v1/billing/invoices      # Histórico de faturas
```

---

## 🛠️ Como Adicionar Novas Rotas

### Passo 1: Editar api/index.ts

```typescript
// api/index.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = { runtime: 'edge' };

const app = new Hono().basePath('/api');

// === NOVA ROTA AQUI ===
app.get('/v1/users/me', async (c) => {
  // Para rotas autenticadas, verificar header Authorization
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Implementar lógica
  return c.json({ 
    id: 'user_123',
    email: 'user@example.com',
    name: 'João Silva'
  });
});

// Health check existente
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ... resto do código

export default handle(app);
```

### Passo 2: Commit e Deploy

```bash
git add api/index.ts
git commit -m "feat(api): add /v1/users/me endpoint"
git push
pnpm dlx vercel --prod --yes
```

### Passo 3: Testar

```bash
curl -s https://aegiswallet.vercel.app/api/v1/users/me
```

---

## ⚠️ Considerações Edge Runtime

### O que FUNCIONA no Edge Runtime
- ✅ Hono e middleware
- ✅ Fetch API
- ✅ Crypto API
- ✅ TextEncoder/TextDecoder
- ✅ Headers, Request, Response
- ✅ URLSearchParams
- ✅ JSON parsing
- ✅ Web Streams

### O que NÃO FUNCIONA no Edge Runtime
- ❌ Node.js native modules (fs, path, os)
- ❌ require() - apenas import
- ❌ process.env.* (usar Vercel env)
- ❌ Buffer (usar Uint8Array)
- ❌ Bibliotecas que dependem de Node.js

### Para Funcionalidades que Requerem Node.js

Criar arquivos separados com runtime diferente:

```typescript
// api/stripe-webhook.ts
export const config = {
  runtime: 'nodejs', // <-- Node.js runtime
  maxDuration: 30,
};

export default async function handler(req: Request) {
  // Stripe webhook processing
}
```

---

## 🔐 Autenticação com Clerk

### Verificar Token no Edge Runtime

```typescript
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

app.use('/v1/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  
  try {
    const { sub } = await clerk.verifyToken(token);
    c.set('userId', sub);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
```

---

## 📦 Comandos Úteis

```bash
# Desenvolvimento
bun dev                          # Inicia servidor dev (Vite + API local)

# Build
bun build                        # Build completo (client + api)
bun run build:client             # Apenas frontend

# Deploy
pnpm dlx vercel --prod --yes     # Deploy para produção

# Testes
bun test                         # Testes unitários
bun run test:e2e                 # Testes E2E

# Qualidade
bun lint                         # Linting com Biome
bun run type-check               # TypeScript check

# Database
bun run db:push                  # Push schema para Neon
bun run db:studio                # Drizzle Studio
bun run db:health                # Health check do banco
```

---

## 📝 Checklist de Continuação

- [x] Configurar Edge Runtime
- [x] Health check funcional
- [x] Documentação criada
- [ ] Implementar /v1/users/me
- [ ] Implementar /v1/banking/accounts
- [ ] Implementar /v1/transactions
- [ ] Implementar /v1/contacts
- [ ] Implementar /v1/compliance
- [ ] Configurar autenticação Clerk
- [ ] Migrar rotas de billing (Stripe)
- [ ] Migrar rotas de AI/Voice
- [ ] Testes E2E para novas rotas

---

## 🔗 Links Úteis

- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Hono Framework](https://hono.dev/)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Neon Serverless](https://neon.tech/docs)

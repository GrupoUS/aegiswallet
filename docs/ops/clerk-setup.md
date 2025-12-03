# Clerk Setup Guide - AegisWallet

Guia completo para configurar Clerk authentication e webhooks no AegisWallet.

## Visão Geral

O AegisWallet usa **Clerk + React (Vite)** para autenticação, mantendo **TanStack Router** como roteador (nÃO React Router). O projeto usa `@clerk/clerk-react` (nÃO `@clerk/react-router`).

Cada usuário criado no Clerk automaticamente recebe:
- Uma organização pessoal no banco de dados
- Um cliente Stripe associado
- Uma assinatura gratuita inicial

## Diferenças Importantes: Clerk + React Router vs Clerk + TanStack Router

**Este projeto usa TanStack Router**, então:
- ✅ Usa `@clerk/clerk-react` (correto para React + Vite)
- ❌ NÃO usa `@clerk/react-router` (apenas para React Router)
- ✅ ClerkProvider configurado em `src/main.tsx`
- ✅ Rotas protegidas usando `<SignedIn>` e `<SignedOut>` do `@clerk/clerk-react`

### Comparação Detalhada

| Aspecto | React Router | TanStack Router (AegisWallet) |
|---------|--------------|------------------------------|
| Package Clerk | `@clerk/react-router` | `@clerk/clerk-react` ✅ |
| Provider | Requer `loaderData` | Wrapper simples ✅ |
| Middleware | `clerkMiddleware()` necessário | Não necessário ✅ |
| Route Guards | Via componentes | Via componentes ✅ |
| Autenticação | Integrada no router | Independente ✅ |
| Setup | Mais complexo | Mais simples ✅ |

### Por que TanStack Router é Melhor para este Projeto

1. **Performance**: Roteamento baseado em arquivo mais rápido
2. **Type Safety**: Melhor inferência de tipos com TypeScript
3. **Flexibilidade**: Layouts aninhados mais fáceis
4. **Manutenibilidade**: Código mais limpo e organizado

### ⚠️ Importante: Não existe CLI oficial do Clerk

**Clerk não oferece CLI oficial para validação!** Para validação, use:

1. **Dashboard Web**: https://dashboard.clerk.com
2. **Backend API**: Via `createClerkClient()` do `@clerk/backend`

Os scripts existentes já usam a abordagem correta via Backend API.

## Pré-requisitos

1. Conta no Clerk (https://clerk.com)
2. Variáveis de ambiente configuradas (veja `.env.example`)
3. Banco de dados Neon configurado
4. Stripe configurado (opcional, mas recomendado)

## Configuração Rápida

### 1. Configuração Automática (Recomendado)

```bash
# 1. Configure o webhook automaticamente
bun scripts/clerk-setup-webhook.ts

# 2. Sincronize usuários existentes (se houver)
bun scripts/clerk-sync-users.ts

# 3. Aplique migrações do banco de dados
bun scripts/neon-apply-migrations.ts

# 4. Verifique a configuração
bun scripts/validate-clerk-webhook-setup.ts
```

### 2. Configuração Manual

#### Passo 1: Obter Credenciais do Clerk

1. Acesse o [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecione ou crie uma aplicação
3. Vá para **API Keys** e escolha **React** no Quick Copy
4. Copie as chaves:
   - `VITE_CLERK_PUBLISHABLE_KEY` (formato: `pk_test_xxx` ou `pk_live_xxx`) - **IMPORTANTE**: Deve ter prefixo `VITE_` para Vite expor ao cliente
   - `CLERK_SECRET_KEY` (formato: `sk_test_xxx` ou `sk_live_xxx`) - Server-side apenas

#### Passo 2: Configurar Webhook

1. No Clerk Dashboard, vá para **Webhooks**
2. Clique em **Add Endpoint**
3. Configure:
   - **URL**: `https://your-domain.com/api/webhooks/clerk`
     - Para desenvolvimento local: use ngrok ou similar
     - Para produção: use sua URL do Vercel/deploy (ex: `https://aegiswallet.vercel.app/api/webhooks/clerk`)
   - **Events**: Selecione:
     - `user.created`
     - `user.updated`
     - `user.deleted`
4. Copie o **Signing Secret** (formato: `whsec_xxx`)

#### Passo 3: Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Database (já deve estar configurado)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://... # Opcional, para transações
```

#### Passo 4: Aplicar Migrações

```bash
# Aplicar migrações pendentes
bun scripts/neon-apply-migrations.ts

# Ou usar o comando padrão
bun db:migrate
```

#### Passo 5: Sincronizar Usuários Existentes

Se você já tem usuários no Clerk antes de configurar o webhook:

```bash
bun scripts/clerk-sync-users.ts
```

Este script irá:
- Listar todos os usuários do Clerk
- Criar organizações para usuários sem organização
- Criar registros no banco de dados
- Associar clientes Stripe (se configurado)

## Verificação

### Validação Completa da Integração

Execute o script de validação completo que verifica todos os aspectos da integração:

```bash
# Validação completa (recomendado)
bun scripts/validate-clerk-integration.ts

# Validação específica de webhook
bun scripts/validate-clerk-webhook-setup.ts

# Testar webhook endpoint
bun scripts/test-clerk-webhook.ts
```

O script de validação completa verifica:
- ✅ Variáveis de ambiente (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`)
- ✅ ClerkProvider setup em `src/main.tsx`
- ✅ Componentes Clerk (`SignedIn`, `SignedOut`, etc.)
- ✅ Conexão com Clerk API
- ✅ Webhook handler e eventos
- ✅ Route guards com TanStack Router
- ✅ AuthContext e hooks do Clerk

### Verificar Banco de Dados

```bash
# Verificar status e integridade
bun scripts/neon-verify-database.ts

# Verificar conexão
bun run smoke:db
```

## Fluxo de Criação de Usuário

Quando um novo usuário se cadastra no Clerk:

1. **Clerk** envia evento `user.created` para o webhook
2. **Webhook** (`src/server/webhooks/clerk.ts`):
   - Valida email e formato do user ID
   - Verifica se usuário já existe (idempotência)
   - Cria cliente no Stripe (com idempotência)
   - Cria organização pessoal para o usuário
   - Cria registro de usuário no banco (com `organizationId`)
   - Cria assinatura gratuita
   - Atualiza metadata do Clerk com `stripeCustomerId`

3. **Banco de Dados**:
   - Tabela `organizations`: Organização criada
   - Tabela `users`: Usuário criado com `organizationId`
   - Tabela `organization_members`: Membro admin criado
   - Tabela `subscriptions`: Assinatura gratuita criada

## Troubleshooting

### Webhook não está sendo chamado

1. **Verifique a URL do webhook**:
   ```bash
   # Teste manualmente
   curl -X POST https://your-domain.com/api/webhooks/clerk \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Verifique logs do Clerk Dashboard**:
   - Vá para **Webhooks** > Seu endpoint > **Logs**
   - Veja se há erros de conexão ou validação

3. **Verifique variáveis de ambiente**:
   ```bash
   bun scripts/validate-clerk-webhook-setup.ts
   ```

### Usuário criado mas sem organização

Execute o script de sincronização:

```bash
bun scripts/clerk-sync-users.ts
```

Isso criará organizações para usuários que não têm uma.

### Erro "CLERK_WEBHOOK_SECRET not set"

1. Certifique-se de que a variável está no `.env`
2. Reinicie o servidor após adicionar
3. Verifique se o formato está correto (`whsec_xxx`)

### Erro de migração

```bash
# Verificar status das migrações
bun scripts/neon-verify-database.ts

# Aplicar migrações novamente
bun scripts/neon-apply-migrations.ts

# Se necessário, verificar schema manualmente
bun db:studio
```

### Usuários duplicados no Stripe

O sistema usa idempotência para evitar duplicatas. Se ainda ocorrer:

1. Verifique se `getOrCreateCustomer` está sendo usado
2. Verifique logs para ver se idempotencyKey está sendo gerado
3. Considere limpar clientes duplicados no Stripe Dashboard

## Comandos Úteis

```bash
# Validação completa da integração (RECOMENDADO PRIMEIRO)
bun scripts/validate-clerk-integration.ts

# Setup completo
bun scripts/clerk-setup-webhook.ts && \
bun scripts/clerk-sync-users.ts && \
bun scripts/neon-apply-migrations.ts && \
bun scripts/validate-clerk-webhook-setup.ts

# Apenas sincronizar usuários
bun scripts/clerk-sync-users.ts

# Apenas aplicar migrações
bun scripts/neon-apply-migrations.ts

# Verificar tudo
bun scripts/neon-verify-database.ts
bun scripts/validate-clerk-webhook-setup.ts
```

## Validação Pré-Deploy

Antes de fazer deploy, execute a validação completa:

```bash
# 1. Validar integração Clerk
bun scripts/validate-clerk-integration.ts

# 2. Validar webhooks
bun scripts/validate-clerk-webhook-setup.ts

# 3. Validar banco de dados
bun scripts/neon-verify-database.ts

# 4. Verificar variáveis de ambiente
bun scripts/check-env.ts
```

Todos os scripts devem passar sem erros críticos antes do deploy.

### Checklist Completo de Validação

- [ ] Variáveis de ambiente configuradas
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY` com formato `pk_test_` ou `pk_live_`
  - [ ] `CLERK_SECRET_KEY` com formato `sk_test_` ou `sk_live_`
  - [ ] `CLERK_WEBHOOK_SECRET` com formato `whsec_`
  - [ ] Consistência: publishable e secret keys do mesmo ambiente (test/live)

- [ ] Configuração do ClerkProvider
  - [ ] Em `src/main.tsx` envolvendo a aplicação
  - [ ] Usando `publishableKey` (não `frontendApi`)
  - [ ] Configurado `afterSignOutUrl`
  - [ ] Localização PT-BR configurada

- [ ] Componentes Clerk funcionando
  - [ ] `<SignedIn>` e `<SignedOut>` em rotas protegidas
  - [ ] `<RedirectToSignIn>` para redirecionamento
  - [ ] Imports de `@clerk/clerk-react`

- [ ] Webhooks configurados
  - [ ] Endpoint `/api/webhooks/clerk` acessível
  - [ ] Eventos: `user.created`, `user.updated`, `user.deleted`
  - [ ] Verificação de assinatura via svix funcionando
  - [ ] Idempotência implementada (sem usuários duplicados)

- [ ] Banco de dados validado
  - [ ] Tabelas `users`, `subscriptions`, `organizations` existem
  - [ ] RLS policies configuradas para isolamento por organização
  - [ ] Conexão com Neon funcionando

- [ ] Integração TanStack Router
  - [ ] Route guards implementados corretamente
  - [ ] AuthContext usando hooks do Clerk
  - [ ] Redirecionamento para login quando não autenticado

## Estrutura de Dados

### Organização por Usuário

Cada usuário do Clerk recebe sua própria organização:

```typescript
{
  id: "uuid-da-organizacao",
  name: "Nome do Usuário",
  email: "usuario@email.com",
  organizationType: "individual",
  status: "active"
}
```

### Membro da Organização

O usuário é automaticamente adicionado como admin:

```typescript
{
  organizationId: "uuid-da-organizacao",
  userId: "user_xxx", // Clerk user ID
  role: "admin",
  status: "active"
}
```

## Segurança

- Webhooks são validados usando o `CLERK_WEBHOOK_SECRET`
- Todas as operações são idempotentes para evitar duplicatas
- Transações garantem atomicidade (tudo ou nada)
- RLS (Row Level Security) isola dados por organização

## Troubleshooting Adicional

### Erro: "VITE_CLERK_PUBLISHABLE_KEY is missing"

**Causa**: A variável de ambiente não está configurada ou não tem o prefixo `VITE_`.

**Solução**:
1. Verifique que a variável está em `.env.local` ou `.env`
2. Certifique-se de que o nome é exatamente `VITE_CLERK_PUBLISHABLE_KEY` (com prefixo `VITE_`)
3. Reinicie o servidor de desenvolvimento após adicionar

### Erro: "Invalid VITE_CLERK_PUBLISHABLE_KEY format"

**Causa**: A chave não está no formato correto.

**Solução**:
- A chave deve começar com `pk_test_` (desenvolvimento) ou `pk_live_` (produção)
- Obtenha a chave correta do Clerk Dashboard > API Keys > React

### Componentes Clerk não funcionam

**Causa**: ClerkProvider não está configurado corretamente ou não envolve a aplicação.

**Solução**:
1. Verifique que `ClerkProvider` está em `src/main.tsx` envolvendo `<App />`
2. Execute `bun scripts/validate-clerk-integration.ts` para diagnóstico completo

### Rotas não estão protegidas

**Causa**: Route guards não estão configurados corretamente.

**Solução**:
1. Verifique `src/routes/__root.tsx` usa `<SignedIn>` e `<SignedOut>`
2. Certifique-se de que rotas públicas estão na lista `PUBLIC_PAGES`
3. Use `RedirectToSignIn` para redirecionar usuários não autenticados

## Referências

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react) - Guia oficial para React + Vite
- [Clerk React Reference](https://clerk.com/docs/reference/react/overview) - Documentação completa do SDK
- [Clerk Webhooks Guide](https://clerk.com/docs/integrations/webhooks/overview)
- [TanStack Router Documentation](https://tanstack.com/router/latest) - Roteador usado no projeto
- [Neon Database Setup](./neon-setup-validation.md)
- [Stripe Integration](../architecture/billing.md)

## Notas Importantes

- ⚠️ **NÃO migrar para React Router** - Este projeto usa TanStack Router
- ⚠️ **NÃO usar @clerk/react-router** - Use apenas `@clerk/clerk-react`
- ✅ **Sempre use prefixo `VITE_`** para variáveis de ambiente expostas ao cliente
- ✅ **Valide antes de fazer deploy** usando `bun scripts/validate-clerk-integration.ts`


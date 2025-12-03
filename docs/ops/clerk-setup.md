# Clerk Setup Guide - AegisWallet

Guia completo para configurar Clerk authentication e webhooks no AegisWallet.

## Visão Geral

O AegisWallet usa Clerk para autenticação e gerencia usuários através de webhooks. Cada usuário criado no Clerk automaticamente recebe:
- Uma organização pessoal no banco de dados
- Um cliente Stripe associado
- Uma assinatura gratuita inicial

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
3. Vá para **API Keys** e copie:
   - `CLERK_SECRET_KEY` (formato: `sk_test_xxx` ou `sk_live_xxx`)
   - `VITE_CLERK_PUBLISHABLE_KEY` (formato: `pk_test_xxx` ou `pk_live_xxx`)

#### Passo 2: Configurar Webhook

1. No Clerk Dashboard, vá para **Webhooks**
2. Clique em **Add Endpoint**
3. Configure:
   - **URL**: `https://your-domain.com/api/v1/webhooks/clerk`
     - Para desenvolvimento local: use ngrok ou similar
     - Para produção: use sua URL do Vercel/deploy
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

### Testar Webhook Localmente

```bash
# Testar webhook endpoint
bun scripts/test-clerk-webhook.ts

# Validar configuração completa
bun scripts/validate-clerk-webhook-setup.ts
```

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
   curl -X POST https://your-domain.com/api/v1/webhooks/clerk \
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

## Referências

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Webhooks Guide](https://clerk.com/docs/integrations/webhooks/overview)
- [Neon Database Setup](./neon-setup-validation.md)
- [Stripe Integration](../architecture/billing.md)


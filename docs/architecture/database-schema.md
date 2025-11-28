# Database Schema - AegisWallet

## Visão Geral

| Componente | Tecnologia |
|------------|------------|
| Database | Neon PostgreSQL (Serverless) |
| ORM | Drizzle ORM |
| Migrations | Drizzle Kit |

---

## Estrutura de Schemas

```
src/db/schema/
├── users.ts           # Usuários e preferências
├── bank-accounts.ts   # Contas bancárias
├── transactions.ts    # Transações financeiras
├── calendar.ts        # Calendário financeiro
├── voice-ai.ts        # Chat e IA
├── notifications.ts   # Notificações
├── audit.ts           # Auditoria (LGPD)
├── lgpd.ts            # Compliance LGPD
├── contacts.ts        # Contatos
├── billing.ts         # Billing/Assinaturas
├── relations.ts       # Relações entre tabelas
└── index.ts           # Export central
```

---

## Tabelas Principais

### users

Perfis de usuário (extends Clerk auth).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | Clerk user_id (format: "user_xxx") |
| email | TEXT UNIQUE | Email do usuário |
| full_name | TEXT | Nome completo |
| phone | TEXT | Telefone |
| cpf | TEXT UNIQUE | CPF (LGPD sensitive) |
| birth_date | DATE | Data de nascimento |
| autonomy_level | INT | Nível de autonomia (default: 50) |
| voice_command_enabled | BOOL | Comandos de voz habilitados |
| language | TEXT | Idioma (default: 'pt-BR') |
| timezone | TEXT | Fuso (default: 'America/Sao_Paulo') |
| currency | TEXT | Moeda (default: 'BRL') |
| is_active | BOOL | Usuário ativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### user_preferences

Preferências do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| theme | TEXT | Tema (light/dark/system) |
| notifications_email | BOOL | Notificações por email |
| notifications_push | BOOL | Notificações push |
| auto_categorize | BOOL | Categorização automática |
| budget_alerts | BOOL | Alertas de orçamento |
| accessibility_high_contrast | BOOL | Alto contraste |
| accessibility_large_text | BOOL | Texto grande |

### bank_accounts

Contas bancárias do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| institution_id | TEXT | ID da instituição |
| institution_name | TEXT | Nome do banco |
| account_type | TEXT | Tipo (CHECKING/SAVINGS) |
| account_mask | TEXT | Número mascarado |
| balance | DECIMAL(15,2) | Saldo atual |
| available_balance | DECIMAL(15,2) | Saldo disponível |
| currency | TEXT | Moeda (default: 'BRL') |
| is_active | BOOL | Conta ativa |
| is_primary | BOOL | Conta principal |
| last_sync | TIMESTAMP | Última sincronização |

### transactions

Transações financeiras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| account_id | TEXT FK | Referência à conta |
| category_id | TEXT FK | Referência à categoria |
| amount | DECIMAL(15,2) | Valor |
| description | TEXT | Descrição |
| merchant_name | TEXT | Nome do estabelecimento |
| transaction_date | TIMESTAMP | Data da transação |
| transaction_type | TEXT | Tipo (debit/credit/transfer) |
| payment_method | TEXT | Método de pagamento |
| status | TEXT | Status (pending/posted/failed) |
| is_recurring | BOOL | É recorrente |
| tags | TEXT[] | Tags |
| confidence_score | DECIMAL(3,2) | Confiança da categorização IA |
| is_manual_entry | BOOL | Entrada manual |
| created_at | TIMESTAMP | Data de criação |

### transaction_categories

Categorias de transações.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário (null = sistema) |
| name | TEXT | Nome da categoria |
| color | TEXT | Cor (hex) |
| icon | TEXT | Ícone |
| is_system | BOOL | Categoria do sistema |
| parent_id | TEXT | Categoria pai (subcategorias) |

### financial_events

Eventos do calendário financeiro.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| account_id | TEXT FK | Referência à conta |
| category_id | TEXT FK | Referência à categoria |
| title | TEXT | Título do evento |
| description | TEXT | Descrição |
| amount | DECIMAL(15,2) | Valor |
| status | TEXT | Status (pending/paid/scheduled) |
| start_date | TIMESTAMP | Data início |
| end_date | TIMESTAMP | Data fim |
| all_day | BOOL | Dia inteiro |
| color | TEXT | Cor |
| is_income | BOOL | É receita |
| is_completed | BOOL | Concluído |
| is_recurring | BOOL | É recorrente |
| recurrence_rule | TEXT | Regra RRULE |
| due_date | DATE | Data de vencimento |
| priority | TEXT | Prioridade |

### chat_sessions

Sessões de chat com IA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| title | TEXT | Título da conversa |
| is_active | BOOL | Sessão ativa |
| metadata | JSONB | Metadados |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

### chat_messages

Mensagens do chat.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| session_id | TEXT FK | Referência à sessão |
| role | TEXT | Role (user/assistant/system) |
| content | TEXT | Conteúdo da mensagem |
| attachments | JSONB | Anexos |
| context | JSONB | Contexto |
| created_at | TIMESTAMP | Data de criação |

### notifications

Notificações do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| title | TEXT | Título |
| message | TEXT | Mensagem |
| type | TEXT | Tipo (info/warning/error/success) |
| category | TEXT | Categoria |
| priority | TEXT | Prioridade |
| is_read | BOOL | Lida |
| action_url | TEXT | URL de ação |
| expires_at | TIMESTAMP | Expiração |

### audit_logs

Logs de auditoria (LGPD).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| action | TEXT | Ação realizada |
| resource_type | TEXT | Tipo do recurso |
| resource_id | TEXT | ID do recurso |
| old_values | JSONB | Valores anteriores |
| new_values | JSONB | Novos valores |
| ip_address | INET | Endereço IP |
| user_agent | TEXT | User agent |
| success | BOOL | Sucesso |
| created_at | TIMESTAMP | Data de criação |

---

## Tabelas LGPD

### lgpd_consents

Consentimentos do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| consent_type | TEXT | Tipo de consentimento |
| granted | BOOL | Consentimento dado |
| version | TEXT | Versão do termo |
| granted_at | TIMESTAMP | Data do consentimento |
| revoked_at | TIMESTAMP | Data de revogação |

### data_export_requests

Solicitações de exportação de dados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | Referência ao usuário |
| request_type | TEXT | Tipo (export/deletion) |
| status | TEXT | Status (pending/processing/completed) |
| download_url | TEXT | URL de download |
| expires_at | TIMESTAMP | Expiração do link |
| requested_at | TIMESTAMP | Data da solicitação |

---

## Relacionamentos

```
users
├── user_preferences (1:1)
├── user_security (1:1)
├── bank_accounts (1:N)
├── transactions (1:N)
├── transaction_categories (1:N)
├── financial_events (1:N)
├── chat_sessions (1:N)
├── notifications (1:N)
├── audit_logs (1:N)
└── lgpd_consents (1:N)

bank_accounts
├── transactions (1:N)
├── financial_events (1:N)
└── account_balance_history (1:N)

transaction_categories
├── transactions (1:N)
├── financial_events (1:N)
└── budget_categories (1:N)

chat_sessions
└── chat_messages (1:N)
```

---

## Comandos Drizzle

```bash
# Gerar migrations
bun db:generate

# Aplicar migrations
bun db:migrate

# Push direto (desenvolvimento)
bun db:push

# Seed de dados
bun db:seed

# Abrir Drizzle Studio
bun db:studio
```

---

## Exemplos de Queries

### Select com Filtro

```typescript
import { db } from '@/db/client'
import { eq, and, gte, desc } from 'drizzle-orm'
import { transactions } from '@/db/schema'

const userTransactions = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.userId, userId),
      gte(transactions.transactionDate, startDate)
    )
  )
  .orderBy(desc(transactions.transactionDate))
  .limit(50)
```

### Insert com Returning

```typescript
const [newTransaction] = await db
  .insert(transactions)
  .values({
    userId,
    amount: 150.00,
    description: 'Supermercado',
    transactionType: 'debit',
    transactionDate: new Date(),
  })
  .returning()
```

### Update

```typescript
await db
  .update(transactions)
  .set({ categoryId, isManualCategorized: true })
  .where(eq(transactions.id, transactionId))
```

### Delete

```typescript
await db
  .delete(transactions)
  .where(eq(transactions.id, transactionId))
```

### Join

```typescript
import { transactions, transactionCategories } from '@/db/schema'

const data = await db
  .select({
    transaction: transactions,
    category: transactionCategories,
  })
  .from(transactions)
  .leftJoin(
    transactionCategories,
    eq(transactions.categoryId, transactionCategories.id)
  )
  .where(eq(transactions.userId, userId))
```

---

## Índices Recomendados

```sql
-- Transações por usuário e data
CREATE INDEX idx_transactions_user_date 
ON transactions(user_id, transaction_date DESC);

-- Eventos por usuário e período
CREATE INDEX idx_events_user_dates 
ON financial_events(user_id, start_date, end_date);

-- Chat por sessão
CREATE INDEX idx_chat_messages_session 
ON chat_messages(session_id, created_at);

-- Audit logs por usuário
CREATE INDEX idx_audit_user_date 
ON audit_logs(user_id, created_at DESC);
```

---

## Variáveis de Ambiente

```bash
# Conexão Neon
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

---

**Última Atualização**: Novembro 2025

## 1. Executive Summary

- Identificamos divergências críticas entre o código e o schema do Supabase, resultando em inserts silenciosamente falhos para `financial_events` e dados inválidos em `bank_accounts`.
- As correções alinham migrations, validadores, hooks e rotas tRPC, adicionam testes de integração e documentam o fluxo de validação ponta a ponta.
- Impacto direto para usuários: cadastros passam a persistir com todos os campos obrigatórios, erros são exibidos com clareza e dados financeiros mantêm consistência.

## 2. Root Causes

### 2.1 Bank Accounts - Dummy Data Generation

- O router `bankAccounts` preenchia `belvo_account_id`, `institution_id` e `account_mask` com valores aleatórios, produzindo registros inservíveis.
- Agora, os dados vêm do formulário real: contas manuais recebem `manual_<uuid>`, contas Belvo usam o ID recebido e a máscara exige o formato `**** 1234`.

### 2.2 Financial Events - Missing Database Columns

- O arquivo `types.ts` esperava colunas (`brazilian_event_type`, `installment_info`, `merchant_category`, `metadata`) que não existiam no banco.
- Inserts falhavam ou descartavam dados silenciosamente.
- Nova migration adiciona as colunas, índices e comentários documentando o propósito de cada campo.

### 2.3 Schema Synchronization Issues

- `complete_database_schema.sql` estava desatualizado e não refletia migrations recentes.
- Agora o arquivo descreve o estado real (migrations `20251006115133`, `20251007210500`, `20251125`) incl. colunas adicionais e checks.

## 3. Implemented Fixes

### 3.1 Database Schema Updates

- Migration `20251125_add_missing_financial_event_columns.sql` adiciona colunas JSONB e índices para filtros brasileiros.
- Comentários explicam contexto (metadados, parcelamentos, classificação).

### 3.2 Bank Accounts Router Fixes

- Entrada valida campos obrigatórios, evita duplicidades por `institution_id + account_mask` e define `sync_status` conforme tipo (manual vs Belvo).
- Erros são lançados com mensagens em PT-BR e `TRPCError` adequado.

### 3.3 Financial Events Hook Fixes

- `rowToEvent` e `eventToRow` agora mapeiam todos os campos (datas, metadata, JSONB, tags, icons, Brazilian types).
- `createEvent`/`updateEvent` usam camada de validação e logging detalhado.

### 3.4 Validation Layer

- `src/lib/validation/financial-events-validator.ts` valida datas, enums, installment info, metadata e sanitiza entradas.
- `src/lib/validation/bank-accounts-validator.ts` garante máscara, tipos permitidos, institutions válidas, ids manuais e sanitização.

### 3.5 Testing

- Novos testes de integração (`src/test/integration/*.test.ts`) cobrem CRUD de contas e eventos usando o projeto real do Supabase via chave service-role.
- Casos contemplam validação, duplicidade, atualização e queries por filtros.

## 4. How to Verify

### 4.1 Manual Verification - Bank Accounts

1. Criar conta manual pela UI → deve surgir em `bank_accounts` com `belvo_account_id` iniciando em `manual_` e `sync_status = manual`.
2. Criar conta Belvo → `sync_status = pending`.
3. Tentar cadastrar conta com mesma instituição+final → receber erro “Já existe uma conta...”.

### 4.2 Manual Verification - Financial Events (Expenses)

1. Criar evento com `brazilianEventType`, `installmentInfo`, tags e metadata.
2. Consultar `financial_events` e verificar colunas `brazilian_event_type`, `installment_info`, `metadata`, `tags`.

### 4.3 Manual Verification - Financial Events (Income)

1. Criar evento do tipo income.
2. Conferir que `is_income = true` e `event_type = 'income'`.

### 4.4 Automated Verification

```bash
# Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configurados
bun test src/test/integration
```

Os testes criam usuários/contas/eventos temporários e limpam após execução.

## 5. Migration Guide

### 5.1 Applying the Database Migration

```bash
supabase migration up 20251125_add_missing_financial_event_columns
```

### 5.2 Regenerating TypeScript Types

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 5.3 Deploying the Changes

1. Aplicar migration.
2. Deploy backend (routers) e frontend (hooks).
3. Rodar testes de integração + smoke manual.

## 6. Backward Compatibility

- Eventos existentes recebem `NULL` nas novas colunas → comportamento seguro.
- Contas já gravadas com IDs dummy continuam válidas; recomenda-se script futuro de limpeza.

## 7. Future Improvements

- Script para corrigir contas antigas com dados dummy.
- Validação servidor-side adicional nas rotas de eventos (tRPC) para reforçar garantias.
- Monitoramento ativo de falhas de validação e logs centralizados.

## 8. Troubleshooting

### 8.1 Migration Fails

- Verificar se colunas já existem (rodar `supabase migration status`).
- Conferir variáveis de ambiente do CLI.

### 8.2 Validation Errors

- Consultar `console` do navegador ou logs do backend para mensagens detalhadas (incluem campo + motivo).

### 8.3 Data Not Saving

- Checar políticas RLS (`supabase/verify_migration.sql`/scripts) e se `user_id` acompanha payload.
- Garantir que types frontend foram regenerados após migrations.

## 9. References

- Migration: `supabase/migrations/20251125_add_missing_financial_event_columns.sql`
- Router: `src/server/routers/bankAccounts.ts`
- Hook: `src/hooks/useFinancialEvents.ts`
- Validadores: `src/lib/validation/*`
- Testes: `src/test/integration/`


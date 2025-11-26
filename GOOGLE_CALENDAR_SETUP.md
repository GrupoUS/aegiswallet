# 🚀 Guia Completo: Configuração Google Calendar API - AegisWallet

## 📋 Status Atual da Configuração

### ✅ **JÁ CONFIGURADO**
- **Google Cloud Console**: Client ID e Secret obtidos
- **Variáveis de Ambiente Vercel**: 100% configuradas
- **Edge Functions**: Deployadas e funcionando
- **Schema Banco de Dados**: Completo com RLS policies
- **Frontend Components**: Implementados e prontos
- **Bi-Directional Sync**: Implementado com webhooks e loop prevention

### ⚠️ **PENDENTE - Configuração Manual**

## 🔧 Passo 1: Adicionar Redirect URI no Google Cloud Console

### Acessar Google Cloud Console:
1. Vá para: https://console.cloud.google.com/
2. Selecione o projeto que contém suas credenciais
3. Menu lateral: **APIs & Services** → **Credentials**

### Configurar OAuth 2.0 Client:
1. Clique no seu Client ID: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com`
2. Em **Authorized redirect URIs**, adicione:
   ```
   https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```
3. Clique em **Save**

## 🔐 Passo 2: Configurar Secrets no Supabase Dashboard

### Acessar Dashboard Supabase:
1. Abra: https://supabase.com/dashboard/project/qatxdwderitvxqvuonqs
2. Menu lateral: **Project Settings** → **Edge Functions**

### Adicionar Secrets Role: `service_role`

Adicione os seguintes secrets exatamente como mostrado:

#### 1. GOOGLE_CLIENT_ID
```
1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
```

#### 2. GOOGLE_CLIENT_SECRET
```
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
```

#### 3. GOOGLE_REDIRECT_URI
```
https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
```

#### 4. TOKENS_ENCRYPTION_KEY
⚠️ **CRÍTICO**: Deve ser exatamente 32 bytes (64 caracteres hexadecimais)
```bash
# Gerar nova chave:
openssl rand -hex 32
```
**IMPORTANTE**: Nunca mude esta chave após tokens serem armazenados!

#### 5. WEBHOOK_SECRET
```bash
# Gerar novo secret:
openssl rand -hex 32
```

**IMPORTANTE**: Clique em **Save** após adicionar cada secret.

## 🌐 Passo 3: Configurar Webhook URL no Google Cloud Console

### Registrar Webhook para Push Notifications:

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto
3. Menu lateral: **APIs & Services** → **Library**
4. Procure por "Google Calendar API" e certifique-se que está habilitada
5. Menu lateral: **APIs & Services** → **Credentials**
6. Clique em **Create Credentials** → **Service Account** (se ainda não tiver)

### Webhook URL:
A URL do webhook será registrada automaticamente pelo código quando o usuário conectar sua conta Google Calendar:
```
https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-webhook
```

**Nota**: O registro do webhook é feito programaticamente durante o fluxo OAuth.

## 🗄️ Passo 4: Executar Migrations do Banco de Dados

### Via Terminal (Recomendado):
```bash
cd D:\Coders\aegiswallet

# Executar nova migration para bi-directional sync
bunx supabase db push
```

### Verificar Tabelas Criadas:
1. Menu lateral: **Table Editor**
2. Verifique se as seguintes tabelas existem:
   - `google_calendar_tokens`
   - `calendar_sync_mapping` (com novos campos: `sync_source`, `last_modified_at`, `version`)
   - `calendar_sync_settings` (com novos campos: `google_channel_id`, `google_resource_id`, `channel_expiry_at`, `webhook_secret`)
   - `calendar_sync_audit`
   - `sync_queue` (NOVA - para sincronização assíncrona)
   - `event_reminders`

## 🧪 Passo 5: Testar a Configuração

### 1. Testar Edge Functions:
```bash
# Testar autenticação (deve retornar 401 se funcionando)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth

# Testar sincronização (deve retornar 401 se funcionando)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync

# Testar webhook (deve retornar 200 OK)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-webhook
```

### 2. Testar Aplicação:
1. Inicie o desenvolvimento local:
   ```bash
   cd D:\Coders\aegiswallet
   bun dev
   ```

2. Acesse: http://localhost:3000/calendario

3. Clique em **Conectar Google Calendar**

4. Autentique com Google e autorize o acesso

### 3. Testar Sincronização Bi-Direcional:

#### Teste 1: App → Google (Outbound)
1. Crie um evento financeiro no AegisWallet
2. Verifique se aparece no Google Calendar
3. Confirme que o evento tem os metadados corretos

#### Teste 2: Google → App (Inbound)
1. Crie um evento no Google Calendar
2. Aguarde alguns segundos (webhook notification)
3. Verifique se o evento aparece no AegisWallet

#### Teste 3: Atualização Bi-Direcional
1. Modifique um evento no AegisWallet
2. Verifique a atualização no Google Calendar
3. Modifique o mesmo evento no Google Calendar
4. Verifique se a última modificação prevalece (Last Write Wins)

#### Teste 4: Exclusão
1. Delete um evento no Google Calendar
2. Verifique se é removido do AegisWallet
3. Delete um evento no AegisWallet
4. Verifique se é removido do Google Calendar

## 🔄 Passo 6: Configurar Background Jobs (Produção)

### Opção 1: Vercel Cron Jobs
Adicione ao `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/channel-renewal",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/process-sync-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Opção 2: Supabase pg_cron
```sql
-- Renovar canais diariamente
SELECT cron.schedule(
  'renew-google-calendar-channels',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=renew_channel',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Processar fila de sincronização a cada 5 minutos
SELECT cron.schedule(
  'process-sync-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync?action=process_queue',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

### Opção 3: Scripts Locais (Desenvolvimento)
```bash
# Processar fila de sincronização
bun run sync:process-queue

# Renovar canais expirando
bun run sync:channel-renew

# Modo watch (desenvolvimento)
bun run dev:sync-worker
```

## 🎯 Fluxo Esperado

### 1. Autenticação OAuth:
- Usuário clica "Conectar Google Calendar"
- Redirecionado para Google OAuth
- Autoriza acesso ao calendário
- Redirecionado de volta para aplicação
- Tokens armazenados **criptografados** (AES-256-GCM)
- **Webhook channel registrado automaticamente**

### 2. Sincronização Outbound (App → Google):
- Usuário cria/atualiza evento no AegisWallet
- Database trigger adiciona à `sync_queue`
- Background worker processa a fila
- Evento sincronizado com Google Calendar
- Mapping atualizado com `sync_source='aegis'`

### 3. Sincronização Inbound (Google → App):
- Usuário modifica evento no Google Calendar
- Google envia webhook notification
- Edge Function valida e processa
- Incremental sync executado
- Evento atualizado no AegisWallet com `sync_source='google'`

### 4. Loop Prevention:
- Sistema verifica `sync_source` antes de sincronizar
- Ignora mudanças que vieram da origem de destino
- Janela de 5 segundos para prevenir race conditions

### 5. Conflict Resolution:
- Compara timestamps `last_modified_at`
- "Last Write Wins" - versão mais recente prevalece
- Conflitos registrados em `calendar_sync_audit`

## 🔍 Verificação Final

### Checklist de Confirmação:
- [ ] Redirect URI adicionada no Google Cloud Console
- [ ] 5 secrets configurados no Supabase
- [ ] Migrations executadas com sucesso (incluindo nova migration)
- [ ] Edge Functions respondendo (código 401 esperado)
- [ ] Webhook endpoint respondendo (código 200 OK)
- [ ] Autenticação OAuth funcionando
- [ ] Webhook channel registrado automaticamente
- [ ] Sincronização outbound (App → Google) operacional
- [ ] Sincronização inbound (Google → App) operacional
- [ ] Loop prevention funcionando
- [ ] Conflict resolution funcionando
- [ ] Background jobs configurados (produção)

## 🚨 Solução de Problemas

### Erro Comum 1: \"redirect_uri_mismatch\"
**Causa**: Redirect URI não configurada no Google Console
**Solução**: Verifique Passo 1 - adicione as URIs exatas

### Erro Comum 2: \"Unauthorized\" (401)
**Causa**: Secrets não configurados no Supabase
**Solução**: Verifique Passo 2 - configure todos os secrets

### Erro Comum 3: \"Database error\"
**Causa**: Migrations não executadas
**Solução**: Verifique Passo 4 - execute `supabase db push`

### Erro Comum 4: \"Webhook não recebe notificações\"
**Causa**: Channel não registrado ou expirado
**Solução**:
- Verifique se o channel foi registrado durante OAuth
- Verifique `channel_expiry_at` em `calendar_sync_settings`
- Execute script de renovação: `bun run sync:channel-renew`

### Erro Comum 5: \"Sync loops detectados\"
**Causa**: `sync_source` não está sendo verificado corretamente
**Solução**:
- Verifique logs em `calendar_sync_audit`
- Confirme que `sync_source` está sendo definido corretamente
- Aumente timeout window se necessário

### Erro Comum 6: \"Token refresh failures\"
**Causa**: Encryption key mudou ou está incorreta
**Solução**:
- **NUNCA** mude `TOKENS_ENCRYPTION_KEY` após tokens serem armazenados
- Se mudou, usuários precisam reconectar suas contas
- Verifique que a chave tem exatamente 64 caracteres hexadecimais

## 📊 Monitoramento

### Queries Úteis:

```sql
-- Verificar backlog da fila de sincronização
SELECT COUNT(*) FROM sync_queue WHERE status = 'pending';

-- Erros recentes
SELECT * FROM calendar_sync_audit
WHERE action = 'sync_failed'
ORDER BY created_at DESC
LIMIT 10;

-- Canais expirando em breve
SELECT user_id, channel_expiry_at
FROM calendar_sync_settings
WHERE channel_expiry_at < NOW() + INTERVAL '24 hours';

-- Status de sincronização por usuário
SELECT
  u.email,
  s.sync_enabled,
  s.channel_expiry_at,
  COUNT(DISTINCT m.id) as mapped_events
FROM auth.users u
LEFT JOIN calendar_sync_settings s ON s.user_id = u.id
LEFT JOIN calendar_sync_mapping m ON m.user_id = u.id
GROUP BY u.email, s.sync_enabled, s.channel_expiry_at;
```

## 📚 Documentação Adicional

- **Arquitetura**: Ver `docs/google-calendar-sync-architecture.md`
- **Tipos TypeScript**: Ver `src/types/google-calendar.ts`
- **Edge Functions**: Ver `supabase/functions/google-calendar-*/index.ts`
- **API Routes**: Ver `src/server/routes/v1/google-calendar.ts`

---

## 🎉 Parabéns!

Após seguir estes passos, sua aplicação AegisWallet terá integração **completa e bi-direcional** com Google Calendar!

### Recursos Implementados:
✅ OAuth 2.0 com tokens criptografados (AES-256-GCM)
✅ Sincronização bi-direcional (App ↔ Google)
✅ Webhooks para atualizações em tempo real
✅ Loop prevention automático
✅ Conflict resolution (Last Write Wins)
✅ Retry logic com exponential backoff
✅ Background jobs para processamento assíncrono
✅ Channel renewal automático
✅ Audit logging completo
✅ Rate limiting (10 req/s)

A integração está **100% completa** e pronta para produção! 🚀

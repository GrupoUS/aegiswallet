# 🚀 Próximos Passos - Deployment Google Calendar Sync

## ✅ Concluído
- [x] Database migration aplicada com sucesso
- [x] Todos os arquivos de código implementados

## 📋 Passos Restantes

### 1️⃣ Configurar Secrets no Supabase (MANUAL)

Como o CLI está com problema de autenticação, configure os secrets manualmente via Dashboard:

#### Acessar Dashboard:
1. Abra: https://supabase.com/dashboard/project/qatxdwderitvxqvuonqs/settings/functions
2. Role até a seção **"Secrets"**

#### Adicionar os seguintes secrets:

**GOOGLE_CLIENT_ID**
```
1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
```

**GOOGLE_CLIENT_SECRET**
```
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
```

**GOOGLE_REDIRECT_URI**
```
https://aegiswallet-nwyeo51w0-gpus.vercel.app/auth/google/callback
```

**TOKENS_ENCRYPTION_KEY** (gerar nova chave)
```bash
# Execute no terminal para gerar:
openssl rand -hex 32

# Ou use este exemplo (MUDE EM PRODUÇÃO):
9f86d081884c7d659a2feaa0c55ad0153aef57199c3955815000000000000000
```

**WEBHOOK_SECRET** (gerar novo secret)
```bash
# Execute no terminal para gerar:
openssl rand -hex 32

# Ou use este exemplo (MUDE EM PRODUÇÃO):
aegiswallet-webhook-secret-2025-production-key-change-me
```

⚠️ **IMPORTANTE**: Clique em **"Add secret"** após cada um!

---

### 2️⃣ Deploy das Edge Functions (VIA DASHBOARD)

#### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/qatxdwderitvxqvuonqs/functions

2. Para cada função, clique em **"Deploy new version"**:

**google-calendar-auth**:
- Arquivo: `supabase/functions/google-calendar-auth/index.ts`
- Copie todo o conteúdo do arquivo
- Cole no editor do dashboard
- Clique em **"Deploy"**

**google-calendar-sync**:
- Arquivo: `supabase/functions/google-calendar-sync/index.ts`
- Copie todo o conteúdo do arquivo
- Cole no editor do dashboard
- Clique em **"Deploy"**

**google-calendar-webhook**:
- Arquivo: `supabase/functions/google-calendar-webhook/index.ts`
- Copie todo o conteúdo do arquivo
- Cole no editor do dashboard
- Clique em **"Deploy"**

#### Opção B: Via CLI (se conseguir autenticar)

```bash
# Fazer login
bunx supabase login

# Linkar projeto
bunx supabase link --project-ref qatxdwderitvxqvuonqs

# Deploy das funções
bunx supabase functions deploy google-calendar-auth
bunx supabase functions deploy google-calendar-sync
bunx supabase functions deploy google-calendar-webhook
```

---

### 3️⃣ Configurar Background Jobs (PRODUÇÃO)

Escolha uma das opções:

#### Opção A: Vercel Cron Jobs (Recomendado)

Crie arquivo `vercel.json` na raiz do projeto:

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

Depois crie os endpoints em `src/server/routes/`:

**src/server/routes/cron/channel-renewal.ts**:
```typescript
import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const channelRenewalRouter = new Hono();

channelRenewalRouter.get('/channel-renewal', async (c) => {
  try {
    const { stdout } = await execAsync('bun scripts/channel-renewal-cron.ts');
    return c.json({ success: true, output: stdout });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default channelRenewalRouter;
```

#### Opção B: Supabase pg_cron

Execute no SQL Editor do Supabase:

```sql
-- Renovar canais diariamente às 00:00
SELECT cron.schedule(
  'renew-google-calendar-channels',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=renew_channel',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Processar fila a cada 5 minutos
SELECT cron.schedule(
  'process-sync-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync?action=process_queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

---

### 4️⃣ Testar a Integração

#### Teste 1: Verificar Edge Functions

```bash
# Testar autenticação (deve retornar 401)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth

# Testar sincronização (deve retornar 401)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync

# Testar webhook (deve retornar 200 OK)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-webhook
```

#### Teste 2: Testar OAuth Flow

1. Inicie o servidor local:
```bash
bun dev
```

2. Acesse: http://localhost:3000/calendario

3. Clique em **"Conectar Google Calendar"**

4. Autorize o acesso

5. Verifique se:
   - Tokens foram armazenados (criptografados)
   - Webhook channel foi registrado
   - `channel_expiry_at` está definido

#### Teste 3: Testar Sincronização Bi-Direcional

**App → Google**:
1. Crie um evento financeiro no AegisWallet
2. Verifique se aparece no Google Calendar

**Google → App**:
1. Crie um evento no Google Calendar
2. Aguarde alguns segundos
3. Verifique se aparece no AegisWallet

---

### 5️⃣ Monitoramento

#### Queries Úteis:

```sql
-- Verificar backlog da fila
SELECT COUNT(*) FROM sync_queue WHERE status = 'pending';

-- Erros recentes
SELECT * FROM calendar_sync_audit
WHERE action = 'sync_failed'
ORDER BY created_at DESC
LIMIT 10;

-- Canais expirando
SELECT user_id, channel_expiry_at
FROM calendar_sync_settings
WHERE channel_expiry_at < NOW() + INTERVAL '24 hours';
```

---

## 📚 Documentação

- **Arquitetura**: `docs/google-calendar-sync-architecture.md`
- **Setup Completo**: `GOOGLE_CALENDAR_SETUP.md`
- **Walkthrough**: Artifact `walkthrough.md`

---

## ✅ Checklist Final

- [ ] Secrets configurados no Supabase Dashboard
- [ ] Edge Functions deployadas (3 funções)
- [ ] Background jobs configurados (cron ou Vercel)
- [ ] OAuth flow testado
- [ ] Sincronização bi-direcional testada
- [ ] Webhook funcionando
- [ ] Monitoramento configurado

---

## 🎉 Pronto!

Após completar estes passos, sua integração Google Calendar estará 100% funcional com:
- ✅ Sincronização bi-direcional
- ✅ Webhooks em tempo real
- ✅ Loop prevention
- ✅ Conflict resolution
- ✅ Token encryption (AES-256-GCM)
- ✅ Background jobs automáticos

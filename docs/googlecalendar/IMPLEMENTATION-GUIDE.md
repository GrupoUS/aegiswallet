# 📅 Google Calendar Integration - Guia de Implementação

## 📦 Arquivos Gerados

| Arquivo | Destino | Descrição |
|---------|---------|-----------|
| `google-calendar-sync-schema.ts` | `src/db/schema/` | Schema Drizzle para as tabelas |
| `google-calendar-service.ts` | `src/lib/services/` | Serviço principal com OAuth, sync, webhooks |
| `google-calendar-routes.ts` | `src/server/routes/v1/` | Rotas da API (substitui o stub existente) |
| `use-google-calendar-sync.ts` | `src/hooks/` | Hook React (substitui o stub existente) |
| `google-calendar-settings.tsx` | `src/components/calendar/` | Componente UI de configurações |
| `google-calendar-migration.sql` | `src/db/migrations/` | Migration SQL para criar tabelas |
| `vercel-crons.json` | Merge com `vercel.json` | Configuração de cron jobs |
| `env-google-calendar.example` | Referência | Template de variáveis de ambiente |
| `env-extension.ts` | Merge com `src/env.ts` | Extensão para validação de env |

---

## 🚀 Passo a Passo de Implementação

### Fase 1: Configuração do Google Cloud (30 min)

1. **Acesse o Google Cloud Console**
   - https://console.cloud.google.com

2. **Crie/selecione um projeto**

3. **Habilite a Google Calendar API**
   - APIs & Services → Library
   - Busque "Google Calendar API"
   - Clique "Enable"

4. **Configure o OAuth Consent Screen**
   - APIs & Services → OAuth consent screen
   - User Type: External
   - App name: AegisWallet
   - Scopes:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`

5. **Crie as credenciais OAuth 2.0**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://aegiswallet.vercel.app/api/v1/google-calendar/callback`
     - `http://localhost:3000/api/v1/google-calendar/callback`

6. **Verifique o domínio** (para webhooks)
   - Google Search Console: https://search.google.com/search-console
   - Adicione e verifique `aegiswallet.vercel.app`

---

### Fase 2: Banco de Dados (15 min)

1. **Copie o schema para o projeto**
   ```bash
   cp google-calendar-sync-schema.ts src/db/schema/google-calendar-sync.ts
   ```

2. **Atualize o arquivo de exports**
   Adicione ao `src/db/schema/index.ts`:
   ```typescript
   // Google Calendar Sync
   export {
     calendarSyncAudit,
     calendarSyncMappings,
     calendarSyncQueue,
     calendarSyncSettings,
     googleCalendarTokens,
     syncAuditActionEnum,
     syncDirectionEnum,
     syncQueueDirectionEnum,
     syncQueueStatusEnum,
     syncSourceEnum,
     syncStatusEnum,
     type CalendarSyncAuditLog,
     type CalendarSyncMapping,
     type CalendarSyncQueueItem,
     type CalendarSyncSettings,
     type GoogleCalendarToken,
     type InsertCalendarSyncAuditLog,
     type InsertCalendarSyncMapping,
     type InsertCalendarSyncQueueItem,
     type InsertCalendarSyncSettings,
     type InsertGoogleCalendarToken,
   } from './google-calendar-sync';
   ```

3. **Adicione as relations** ao `src/db/schema/relations.ts`:
   ```typescript
   // Ver comentários no arquivo google-calendar-sync-schema.ts
   ```

4. **Execute a migration**
   ```bash
   # Opção 1: Via Drizzle
   npx drizzle-kit generate
   npx drizzle-kit push
   
   # Opção 2: SQL direto no NeonDB
   # Cole o conteúdo de google-calendar-migration.sql
   ```

---

### Fase 3: Variáveis de Ambiente (10 min)

1. **Local (.env.local)**
   ```env
   GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=seu-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/google-calendar/callback
   APP_URL=http://localhost:3000
   CRON_SECRET=gere-um-hash-de-32-caracteres
   ```

2. **Vercel Dashboard**
   - Settings → Environment Variables
   - Adicione todas as variáveis acima
   - `GOOGLE_REDIRECT_URI` em produção: `https://aegiswallet.vercel.app/api/v1/google-calendar/callback`

3. **Atualize src/env.ts**
   - Adicione as validações do arquivo `env-extension.ts`

---

### Fase 4: Código Backend (20 min)

1. **Copie o serviço**
   ```bash
   cp google-calendar-service.ts src/lib/services/google-calendar-service.ts
   ```

2. **Substitua as rotas**
   ```bash
   cp google-calendar-routes.ts src/server/routes/v1/google-calendar.ts
   ```

3. **Instale dependências** (se não tiver)
   ```bash
   npm install googleapis
   ```

---

### Fase 5: Código Frontend (15 min)

1. **Substitua o hook**
   ```bash
   cp use-google-calendar-sync.ts src/hooks/use-google-calendar-sync.ts
   ```

2. **Substitua/atualize o componente**
   ```bash
   cp google-calendar-settings.tsx src/components/calendar/google-calendar-settings.tsx
   ```

3. **Verifique as dependências de UI**
   - O componente usa shadcn/ui components
   - Certifique-se que todos estão instalados

---

### Fase 6: Cron Jobs (5 min)

1. **Atualize vercel.json**
   Merge com a configuração existente:
   ```json
   {
     "crons": [
       {
         "path": "/api/v1/google-calendar/cron/renew-channels",
         "schedule": "0 */6 * * *"
       },
       {
         "path": "/api/v1/google-calendar/cron/process-queue",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

---

### Fase 7: Integração com Eventos (10 min)

Para sincronizar automaticamente quando eventos financeiros são criados/editados, use o hook `useAutoSyncToGoogle`:

```typescript
// Em componentes que criam/editam eventos:
import { useAutoSyncToGoogle } from '@/hooks/use-google-calendar-sync';

function MyEventForm() {
  const { triggerSync } = useAutoSyncToGoogle();
  
  const handleSave = async (eventData) => {
    // Salva o evento
    const savedEvent = await saveEvent(eventData);
    
    // Dispara sync para Google
    triggerSync(savedEvent.id);
  };
}
```

---

## ✅ Checklist de Validação

### Google Cloud
- [ ] Projeto criado
- [ ] Calendar API habilitada
- [ ] OAuth consent screen configurado
- [ ] Credenciais OAuth criadas
- [ ] Domínio verificado no Search Console

### Banco de Dados
- [ ] Schema adicionado
- [ ] Exports atualizados
- [ ] Relations adicionadas
- [ ] Migration executada

### Variáveis de Ambiente
- [ ] .env.local configurado
- [ ] Vercel env vars configuradas
- [ ] src/env.ts atualizado

### Backend
- [ ] googleapis instalado
- [ ] Serviço copiado
- [ ] Rotas atualizadas

### Frontend
- [ ] Hook substituído
- [ ] Componente atualizado
- [ ] shadcn/ui components disponíveis

### Cron Jobs
- [ ] vercel.json atualizado
- [ ] CRON_SECRET configurado

---

## 🧪 Testando

### 1. Teste Local
```bash
npm run dev
```
- Acesse `/calendario`
- Clique em "Conectar Google Calendar"
- Autorize na conta Google
- Verifique se voltou conectado

### 2. Teste de Webhook (via curl)
```bash
curl -X POST http://localhost:3000/api/v1/google-calendar/webhook \
  -H "X-Goog-Channel-ID: test-channel" \
  -H "X-Goog-Resource-ID: test-resource" \
  -H "X-Goog-Resource-State: sync" \
  -H "X-Goog-Channel-Token: test-token"
```

### 3. Teste de Sync
```bash
curl http://localhost:3000/api/v1/google-calendar/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### "Failed to obtain required tokens"
- Verifique se `prompt: 'consent'` está no OAuth
- Verifique se os scopes estão corretos

### "Webhook domain verification failed"
- Verifique o domínio no Google Search Console
- Certifique-se que está usando HTTPS

### "Invalid sync token (410 Gone)"
- Normal após 7 dias sem sync
- O sistema faz full sync automaticamente

### "Rate limit exceeded"
- Google Calendar API tem limites
- Reduza a frequência de sync

---

## 📊 Estimativa de Tempo Total

| Fase | Tempo |
|------|-------|
| Google Cloud Setup | 30 min |
| Banco de Dados | 15 min |
| Variáveis de Ambiente | 10 min |
| Backend | 20 min |
| Frontend | 15 min |
| Cron Jobs | 5 min |
| Integração | 10 min |
| Testes | 30 min |
| **Total** | **~2-3 horas** |

---

## 📚 Referências

- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [Incremental Sync](https://developers.google.com/calendar/api/guides/sync)
- [OAuth 2.0 Web Server](https://developers.google.com/identity/protocols/oauth2/web-server)

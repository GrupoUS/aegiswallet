# Google Calendar Integration - Testing Guide

## Prerequisites

Before testing, ensure:

1. **Supabase CLI logged in**: Run `bunx supabase login`
2. **Secrets configured**: Run `.\scripts\deploy-google-calendar.ps1` or set manually
3. **Edge functions deployed**: Functions must be deployed to Supabase
4. **Google Cloud Console configured**:
   - OAuth 2.0 credentials created
   - Authorized redirect URI added:
     ```
     https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=callback
     ```
   - Calendar API enabled

## Manual Deployment Steps

If the deployment script doesn't work, run these commands manually:

```powershell
# 1. Set environment variables
$env:GOOGLE_CLIENT_ID = "your-client-id"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret"

# 2. Login to Supabase
bunx supabase login

# 3. Set secrets
bunx supabase secrets set TOKENS_ENCRYPTION_KEY=e5441bdac357d141aeb7945c78a4636db95a9003377f1c4b71c7c51d8fe81394 --project-ref qatxdwderitvxqvuonqs
bunx supabase secrets set WEBHOOK_SECRET=cdf2165bcd38140afc78fab7697a29c1 --project-ref qatxdwderitvxqvuonqs
bunx supabase secrets set GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID --project-ref qatxdwderitvxqvuonqs
bunx supabase secrets set GOOGLE_CLIENT_SECRET=$env:GOOGLE_CLIENT_SECRET --project-ref qatxdwderitvxqvuonqs
bunx supabase secrets set GOOGLE_REDIRECT_URI="https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=callback" --project-ref qatxdwderitvxqvuonqs

# 4. Deploy edge functions
bunx supabase functions deploy google-calendar-auth --project-ref qatxdwderitvxqvuonqs
bunx supabase functions deploy google-calendar-sync --project-ref qatxdwderitvxqvuonqs
bunx supabase functions deploy google-calendar-webhook --project-ref qatxdwderitvxqvuonqs
```

---

## Test Scenarios

### 1. OAuth Flow Test

**Steps:**
1. Start the development server: `bun dev`
2. Navigate to: `http://localhost:5173/calendario`
3. Click "Conectar" button in Google Calendar settings
4. Complete Google OAuth consent screen
5. Verify redirect back to `/calendario?status=success`

**Expected Results:**
- Connection status shows "Conectado"
- Google email displayed
- Settings panel becomes visible

**Troubleshooting:**
```powershell
# Check function logs
bunx supabase functions logs google-calendar-auth --project-ref qatxdwderitvxqvuonqs
```

---

### 2. Outbound Sync Test (AegisWallet → Google)

**Steps:**
1. Ensure sync direction is "Aegis → Google" or "Bidirecional"
2. Enable "Sincronização Automática"
3. Create a new financial event in AegisWallet calendar
4. Check Google Calendar for the event

**Expected Results:**
- Event appears in Google Calendar within 5 minutes
- Event title and description match
- Sync mapping created in database

**Verify in Database:**
```sql
SELECT * FROM calendar_sync_mapping
WHERE sync_direction = 'aegis_to_google'
ORDER BY created_at DESC LIMIT 5;
```

---

### 3. Inbound Sync Test (Google → AegisWallet)

**Steps:**
1. Ensure sync direction is "Google → Aegis" or "Bidirecional"
2. Create an event in Google Calendar
3. Click "Sincronizar Agora" or wait for webhook
4. Check AegisWallet calendar for the event

**Expected Results:**
- Event appears in AegisWallet
- Sync mapping shows `google_to_aegis` direction

**Verify Webhook Reception:**
```powershell
bunx supabase functions logs google-calendar-webhook --project-ref qatxdwderitvxqvuonqs
```

---

### 4. Update Sync Test

**Steps:**
1. Update an event title in AegisWallet
2. Verify change appears in Google Calendar
3. Update the same event in Google Calendar
4. Verify change appears in AegisWallet

**Expected Results:**
- Changes propagate in both directions
- No duplicate events created
- `version` field increments in sync_mapping

---

### 5. Delete Sync Test

**Steps:**
1. Delete an event in AegisWallet
2. Verify event removed from Google Calendar
3. Create another synced event
4. Delete from Google Calendar
5. Verify event removed from AegisWallet

**Expected Results:**
- Deletions propagate correctly
- Sync mapping records cleaned up

---

### 6. Webhook Channel Renewal Test

**Steps:**
1. Check current channel expiry:
   ```sql
   SELECT user_id, channel_expiry_at
   FROM calendar_sync_settings
   WHERE google_channel_id IS NOT NULL;
   ```
2. Manually trigger renewal cron (or wait for daily run)
3. Verify new channel registered

---

## Monitoring Commands

```powershell
# View all function logs
bunx supabase functions logs --project-ref qatxdwderitvxqvuonqs

# Check sync queue status
# Run in Supabase SQL Editor:
SELECT status, COUNT(*)
FROM sync_queue
GROUP BY status;

# Check recent audit logs
SELECT * FROM calendar_sync_audit
ORDER BY created_at DESC LIMIT 10;
```

---

## Common Issues

### 1. "Unauthorized" Error
- Ensure SUPABASE_SERVICE_ROLE_KEY is set
- Check user is authenticated

### 2. OAuth Redirect Fails
- Verify GOOGLE_REDIRECT_URI matches Google Cloud Console
- Check callback URL includes `?action=callback`

### 3. Webhook Not Receiving Events
- Google webhook URL must be HTTPS
- Verify edge function is deployed and accessible
- Check webhook channel is not expired

### 4. Sync Loop Prevention
- Events synced from Google have 5-second cooldown
- Check `sync_source` field in mapping

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/google-calendar-auth/index.ts` | OAuth and channel management |
| `supabase/functions/google-calendar-sync/index.ts` | Bi-directional sync logic |
| `supabase/functions/google-calendar-webhook/index.ts` | Google push notification handler |
| `api/cron/calendar-channel-renewal.ts` | Daily channel renewal |
| `api/cron/sync-queue-processor.ts` | Process pending syncs |
| `api/cron/cleanup-sync-queue.ts` | Weekly cleanup |
| `src/hooks/use-google-calendar-sync.ts` | Frontend sync hook |
| `src/components/calendar/google-calendar-settings.tsx` | Settings UI |


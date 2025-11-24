# Google Calendar Sync Setup Guide

This guide covers the staging setup requested for the bidirectional Google Calendar integration. It explains the required Google Cloud configuration, how to provision secrets, and how to validate the sync endpoints inside AegisWallet.

## 1. Prerequisites

- Google Cloud project with OAuth consent screen published (External) and the **Google Calendar API** enabled.
- OAuth **Web** client with the following authorized redirect URIs:
  - `https://aegiswallet.vercel.app/api/google-calendar/callback`
  - `https://aegiswallet.vercel.app/api/google-calendar/auth`
  - `http://localhost:3000/api/google-calendar/callback` (local dev)
- Supabase CLI authenticated against the staging project (`qatxdwderitvxqvuonqs`).
- `TOKENS_ENCRYPTION_KEY` already defined in Supabase secrets (used by both `google-calendar-auth` and `google-calendar-sync` functions).

## 2. Run the automated setup script

```bash
bun run setup:google-calendar
```

What the script does:

1. Prompts for the Google OAuth **Client ID**, **Client Secret** and **Redirect URI** (defaults to the staging callback).
2. Updates `.env.local` with:
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
3. Creates/updates `supabase/google-calendar.env` with the same values (used when pushing secrets manually).
4. Attempts to run
   `supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URI=... --project-ref qatxdwderitvxqvuonqs`.
   If the CLI is not logged in or the command fails, the script prints the exact command to run manually.
5. Prints verification steps (see below).

> Tip: rerun the script anytime the credentials change—existing keys are overwritten in-place.

## 3. Propagate secrets to other environments

- **Supabase Functions** (staging): the script already calls `supabase secrets set ... --project-ref qatxdwderitvxqvuonqs`.
- **Vercel / Frontend previews**: run
  `vercel env set VITE_GOOGLE_CLIENT_ID <client-id>` (and equivalents for production/staging).
- **Local dev**: `.env.local` is ready after running the script. Restart `bun dev`.

## 4. Validate the integration

1. Start the stack with `bun dev`.
2. Log in, open the DevTools network tab, and connect Google Calendar via the UI (uses `google-calendar-auth` edge function).
3. In another terminal run:

   ```bash
   curl -H "Authorization: Bearer <session_jwt>" \
        "http://localhost:3000/api/trpc/googleCalendar.getSyncStatus"
   ```

   The response should contain `isConnected: true` and the Google email used.

4. Trigger a manual sync:

   ```bash
   curl -X POST \
     -H "Authorization: Bearer <session_jwt>" \
     "http://localhost:3000/api/trpc/googleCalendar.requestFullSync"
   ```

   Check the Supabase dashboard → `calendar_sync_audit` table for the `sync_completed` entry.

## 5. Deployment checklist

- [ ] `supabase/functions/google-calendar-sync` deployed (Vercel build automatically runs `supabase functions deploy`).
- [ ] Environment variables set in Supabase and Vercel as described above.
- [ ] `TOKENS_ENCRYPTION_KEY` present in Supabase secrets.
- [ ] At least one manual sync executed to confirm audit logs are generated.

Once all boxes are checked, the staging environment is ready for QA and the sync router will accept bidirectional operations using the refreshed financial-event schema (`start_date`, `end_date`, `event_type_id`).


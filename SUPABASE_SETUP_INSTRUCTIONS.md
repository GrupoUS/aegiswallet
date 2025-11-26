# Supabase Setup Instructions for AegisWallet

This document provides step-by-step instructions for configuring the Supabase secrets and deploying Edge Functions for the Google Calendar integration in AegisWallet.

## 🔧 Required Secrets Configuration

### Access Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the project: **qatxdwderitvxqvuonqs**
3. Navigate to **Project Settings** > **API**
4. Find your Service Role Key if needed for authentication

### Configure Secrets

Navigate to **Project Settings** > **Edge Functions** and add the following secrets:

#### 1. Google OAuth Configuration

```
GOOGLE_CLIENT_ID=1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
```

#### 2. Security Configuration

```
TOKENS_ENCRYPTION_KEY=9f86d081884c7d659a2feaa0c55ad0153aef57199c3955815000000000000000
WEBHOOK_SECRET=aegiswallet-webhook-secret-2025
```

#### 3. Standard Supabase Configuration (if not already configured)

```
SUPABASE_URL=https://qatxdwderitvxqvuonqs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🚀 Edge Functions Deployment

### Method 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref qatxdwderitvxqvuonqs
   ```

4. Deploy the Edge Functions:
   ```bash
   # Deploy google-calendar-auth function
   supabase functions deploy google-calendar-auth --no-verify-jwt

   # Deploy google-calendar-sync function
   supabase functions deploy google-calendar-sync --no-verify-jwt
   ```

### Method 2: Using Supabase Dashboard

1. Navigate to **Edge Functions** in your Supabase Dashboard
2. Click **New Function**
3. For **google-calendar-auth**:
   - Function name: `google-calendar-auth`
   - Upload the contents of `supabase/functions/google-calendar-auth/index.ts`
4. For **google-calendar-sync**:
   - Function name: `google-calendar-sync`
   - Upload the contents of `supabase/functions/google-calendar-sync/index.ts`

## 🔍 Function URLs

After deployment, the Edge Functions will be available at:

- **google-calendar-auth**: `https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth`
- **google-calendar-sync**: `https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync`

## 🧪 Testing the Configuration

### 1. Test Auth Function

```bash
curl -X GET "https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth?action=start" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. Verify Environment Variables

Both functions expect these environment variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (only for auth function)
- `TOKENS_ENCRYPTION_KEY` (only for auth function)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔐 Google OAuth Configuration

### Required OAuth 2.0 Credentials in Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Configure OAuth 2.0 Client ID:

**Authorized redirect URIs:**
```
https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
```

**Required Scopes:**
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/userinfo.email`

## ✅ Verification Checklist

After completing the setup:

- [ ] All secrets are configured in Supabase Edge Functions settings
- [ ] Edge Functions are deployed successfully
- [ ] Functions respond to health checks
- [ ] Google OAuth flow works end-to-end
- [ ] Database tables exist with proper permissions
- [ ] RLS policies are configured for all tables
- [ ] CORS settings allow your frontend domain

## 🚨 Troubleshooting

### Common Issues

1. **Unauthorized Errors**: Ensure your Supabase access token is valid and has proper permissions
2. **Function Not Found**: Verify Edge Functions are deployed and names match exactly
3. **Missing Environment Variables**: Double-check all secrets are properly configured
4. **OAuth Errors**: Verify Google Console configuration matches your redirect URI

### Logs and Monitoring

- Check Edge Function logs in Supabase Dashboard
- Monitor database query performance
- Set up error reporting for production issues

---

**Project Reference**: `qatxdwderitvxqvuonqs`
**Frontend URL**: `https://aegiswallet-feb4a3cr8-gpus.vercel.app`
**Support**: Contact development team for assistance with configuration issues.

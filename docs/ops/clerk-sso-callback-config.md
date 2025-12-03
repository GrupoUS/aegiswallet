# Clerk SSO Callback Configuration Guide

This guide documents the required Clerk Dashboard configuration for SSO (OAuth) callback routes to work correctly with Google OAuth authentication.

## Overview

When users sign up or sign in using Google OAuth, Clerk redirects to specific callback routes:
- `/signup/sso-callback` - For new user signups via OAuth
- `/login/sso-callback` - For existing user logins via OAuth

These routes have been implemented in the codebase and must be configured in the Clerk Dashboard to ensure proper OAuth flow.

## Required Clerk Dashboard Configuration

### 1. Allowed Redirect URLs

Navigate to **Clerk Dashboard** → **User & Authentication** → **Social Connections** → **Google** (or your OAuth provider)

**Add the following URLs to "Allowed redirect URLs":**

```
https://aegiswallet.vercel.app/signup/sso-callback
https://aegiswallet.vercel.app/login/sso-callback
```

**For local development, also add:**
```
http://localhost:3000/signup/sso-callback
http://localhost:3000/login/sso-callback
```

### 2. Allowed Origins

Navigate to **Clerk Dashboard** → **Settings** → **Domains**

**Ensure the following origins are allowed:**
- `https://aegiswallet.vercel.app`
- `http://localhost:3000` (for development)

### 3. Google OAuth Provider Configuration

If using Google OAuth, verify in **Google Cloud Console**:

1. Navigate to **APIs & Services** → **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   ```
   https://aegiswallet.vercel.app/signup/sso-callback
   https://aegiswallet.vercel.app/login/sso-callback
   ```

### 4. Clerk Application Settings

Navigate to **Clerk Dashboard** → **Settings** → **Paths**

Verify or configure:
- **Sign-in URL**: `/login`
- **Sign-up URL**: `/signup`
- **After sign-in redirect**: `/dashboard`
- **After sign-up redirect**: `/dashboard` (Note: Currently configured as `/onboarding` in code, but route doesn't exist - redirects to dashboard)

## Verification Checklist

After configuring the above settings, verify:

- [ ] SSO callback URLs are added to Clerk Dashboard redirect URLs
- [ ] Application origin (`https://aegiswallet.vercel.app`) is allowed in Clerk
- [ ] Google OAuth provider has correct redirect URIs (if using Google)
- [ ] Routes `/signup/sso-callback` and `/login/sso-callback` exist in codebase ✅
- [ ] Routes are added to `PUBLIC_PAGES` in `__root.tsx` ✅
- [ ] Vercel rewrite rules exist for callback routes ✅

## Testing SSO Flow

1. **Test Sign Up Flow:**
   - Navigate to `/signup`
   - Click "Continue with Google"
   - Should redirect to `/signup/sso-callback` (not 404)
   - Should complete authentication and redirect to `/dashboard`
   - User should be created in Clerk Dashboard

2. **Test Sign In Flow:**
   - Navigate to `/login`
   - Click "Continue with Google"
   - Should redirect to `/login/sso-callback` (not 404)
   - Should complete authentication and redirect to `/dashboard`

## Troubleshooting

### 404 Error on SSO Callback

**Symptoms:** User sees "Page not found" when redirected to `/signup/sso-callback` or `/login/sso-callback`

**Solutions:**
1. Verify routes exist in `src/routes/signup/sso-callback.tsx` and `src/routes/login/sso-callback.tsx`
2. Verify routes are in `PUBLIC_PAGES` array in `src/routes/__root.tsx`
3. Verify Vercel rewrite rules exist in `vercel.json`
4. Rebuild and redeploy: `bun run routes:generate && vercel --prod`

### User Account Not Created

**Symptoms:** OAuth flow completes but user doesn't appear in Clerk Dashboard

**Solutions:**
1. Check Clerk webhook is configured correctly (see `docs/ops/clerk-setup.md`)
2. Verify webhook endpoint is accessible: `https://aegiswallet.vercel.app/api/webhooks/clerk`
3. Check webhook logs in Clerk Dashboard for errors
4. Verify `CLERK_WEBHOOK_SECRET` is set correctly in Vercel environment variables

### Redirect Loop

**Symptoms:** User gets stuck in redirect loop between OAuth provider and callback

**Solutions:**
1. Verify callback URLs match exactly between Clerk Dashboard and Google Cloud Console
2. Check that callback routes are in `PUBLIC_PAGES` (not requiring authentication)
3. Verify `forceRedirectUrl` in SignUp/SignIn components matches expected destination

## Related Documentation

- [Clerk Setup Guide](./clerk-setup.md) - Complete Clerk integration setup
- [Clerk Deployment Fix](./clerk-deployment-fix.md) - Previous deployment fixes
- [Architecture - Auth](../architecture/auth.md) - Authentication architecture

## Implementation Notes

The SSO callback routes were implemented to fix the 404 error that occurred when Clerk redirected users after OAuth authentication. The routes:

1. Render the same `<SignUp>` or `<SignIn>` components as their parent routes
2. Clerk automatically handles the OAuth callback when the route exists
3. Must be public routes (no authentication required) as they're part of the auth flow
4. Are configured in `vercel.json` to route to `/index.html` for SPA support


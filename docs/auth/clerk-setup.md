---
title: Clerk Authentication Setup - AegisWallet
description: Complete guide for configuring Clerk authentication in AegisWallet
last_updated: 2025-11-28
---

# Clerk Authentication Setup - AegisWallet

## Overview

Clerk is already fully integrated into AegisWallet for authentication and user management. This guide covers the configuration steps required to activate the authentication flow.

- **Official Quickstart**: [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- **Current Version**: `@clerk/clerk-react@5.57.0`

## Prerequisites

- [Clerk Account](https://clerk.com/sign-up)
- [Bun](https://bun.sh) installed
- Access to Clerk Dashboard

## Configuration Steps

### Step 1: Create Clerk Application

1. Navigate to the [Clerk Dashboard](https://dashboard.clerk.com).
2. Create a new application or select an existing one.
3. Choose **React** as the framework.

### Step 2: Get Publishable Key

1. Navigate to the **API Keys** page in the Clerk Dashboard.
2. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`).
   > **Important**: Never commit this key to version control if it's a live key, although publishable keys are generally safe to expose in client-side code, it's best practice to manage them via environment variables.

### Step 3: Configure Environment Variable

1. Open the `.env.local` file in the project root.
2. Add the following line, replacing the placeholder with your actual key:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=your_actual_key_here
   ```
   > **Note**: The `VITE_` prefix is required for Vite to expose the variable to the client.

3. Save the file.

### Step 4: Verify Integration

1. Run the development server:
   ```bash
   bun dev
   ```
2. Navigate to [http://localhost:5173/login](http://localhost:5173/login).
3. The Clerk SignIn component should render without errors.
4. Check the browser console for any Clerk-related errors.

## Current Implementation

### ClerkProvider Setup

The application is wrapped with `ClerkProvider` in `src/main.tsx`:

```typescript
// src/main.tsx
<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
  <RouterProvider router={router} context={{ auth }} />
</ClerkProvider>
```

### Authentication Routes

- **Login**: `src/routes/login.tsx` (renders `<SignIn />`)
- **Signup**: `src/routes/signup.tsx` (renders `<SignUp />`)

### Auth Context

A custom `AuthContext` in `src/contexts/AuthContext.tsx` wraps Clerk hooks (`useAuth`, `useUser`) to provide a unified authentication interface throughout the app.

### Protected Routes

Route guards are implemented in `src/routes/__root.tsx` using `<SignedIn>` and `<SignedOut>` components to control access to protected areas.

## Components in Use

- `<ClerkProvider>`: Main provider wrapper
- `<SignIn>`: Login form component
- `<SignUp>`: Registration form component
- `<SignedIn>`: Renders children only when authenticated
- `<SignedOut>`: Renders children only when unauthenticated
- `<RedirectToSignIn>`: Redirects unauthenticated users

**Hooks**:
- `useAuth()`: Access authentication state
- `useUser()`: Access user profile data

## Brazilian Compliance

- **Accessibility**: Accessibility features are initialized in `src/main.tsx`.
- **Localization**: The interface is designed with a Portuguese-first approach.
- **Compliance**: Adheres to WCAG 2.1 AA+ standards and considers LGPD requirements.

## Troubleshooting

### Error: "Missing VITE_CLERK_PUBLISHABLE_KEY"
- **Cause**: The environment variable is not set or not loaded.
- **Solution**: Ensure `VITE_CLERK_PUBLISHABLE_KEY` is in `.env.local` and restart the dev server.

### Clerk components not rendering
- **Checks**:
  - Verify `ClerkProvider` is correctly wrapping the app in `src/main.tsx`.
  - Check browser console for errors.
  - Verify the publishable key is valid.

### Authentication not persisting
- **Checks**:
  - Ensure browser cookies are enabled.
  - Verify Clerk Dashboard settings for session duration.
  - Clear browser cache and cookies and try again.

## Security Best Practices

- **Version Control**: Never commit `.env.local` (it is added to `.gitignore`).
- **Keys**: Use `pk_test_` keys for development and `pk_live_` keys for production.
- **Production**: Set environment variables in your deployment platform (e.g., Vercel).
- **Rotation**: Rotate keys immediately if they are compromised.
- **Reference**: See `env.example` for all required environment variables.

## Next Steps

- Configure Clerk Dashboard settings (session duration, social logins, etc.).
- Customize Clerk components appearance to match AegisWallet branding.
- Set up webhooks for user events (optional).
- Configure production environment variables in Vercel.

## References

- [Official Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk React SDK Documentation](https://clerk.com/docs/references/react/overview)
- `src/contexts/AuthContext.tsx`
- `env.example`

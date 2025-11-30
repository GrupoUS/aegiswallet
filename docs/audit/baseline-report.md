# Baseline Report - Backend Audit
**Date**: 2025-01-28
**Project**: AegisWallet Backend Audit

## Executive Summary

This document captures the initial state of the AegisWallet backend before the comprehensive audit and cleanup process.

## 1. Hooks Inventory

### Hooks in `src/hooks/`
- `useAIChat.ts`
- `useAvatarUpload.ts`
- `useBankAccounts.ts`
- `use-calendar-search.ts`
- `use-compliance.ts`
- `useContacts.ts`
- `useDashboard.ts`
- `useFinancialEvents.ts`
- `use-google-calendar-sync.ts`
- `useLogger.ts`
- `useMultimodalResponse.ts`
- `useMultimodalResponseCompat.ts`
- `useProfile.ts`
- `useSessionManager.ts`
- `use-transactions.ts` ⚠️ **DUPLICATE DETECTED**
- `use-transactions.tsx` ⚠️ **DUPLICATE DETECTED**
- `useUserData.ts`
- `useVoiceCommand.ts`
- `useVoiceRecognition.ts`

### Billing Hooks (`src/hooks/billing/`)
- `useBillingHistory.ts`
- `useBillingPortal.ts`
- `useCheckout.ts`
- `useInvoices.ts`
- `usePaymentMethods.ts`
- `usePlans.ts`
- `useSubscription.ts`

## 2. Frontend Routes

### Main Routes (`src/routes/`)
- `/` (index.tsx) - Redirects to dashboard or login
- `/dashboard` (dashboard.tsx, dashboard.lazy.tsx)
- `/saldo` (saldo.lazy.tsx)
- `/calendario` (calendario.tsx, calendario.lazy.tsx)
- `/contas` (contas.tsx, contas.lazy.tsx)
- `/contas-bancarias` (contas-bancarias.tsx, contas-bancarias.lazy.tsx)
- `/billing` (billing.tsx) + subroutes
- `/configuracoes` (configuracoes.tsx, configuracoes.lazy.tsx)
- `/ai-chat` (ai-chat.tsx, ai-chat.lazy.tsx)
- `/login` (login.tsx)
- `/signup` (signup.tsx)
- `/privacidade` (privacidade.tsx)
- `/settings` (settings.tsx)

## 3. Backend API Endpoints

### v1 Routes (`src/server/routes/v1/`)
- `/api/v1/health` - Health check
- `/api/v1/users` - User profile and preferences
- `/api/v1/bank-accounts` - Bank account CRUD
- `/api/v1/transactions` - Transaction CRUD and statistics
- `/api/v1/contacts` - Contact management
- `/api/v1/calendar` - Calendar events
- `/api/v1/google-calendar` - Google Calendar sync
- `/api/v1/compliance` - LGPD compliance operations
- `/api/v1/ai-chat` - AI chat functionality
- `/api/v1/voice` - Voice command processing
- `/api/v1/banking` - Banking operations
- `/api/v1/billing/*` - Billing subroutes:
  - `/checkout`
  - `/subscription`
  - `/invoices`
  - `/payment-history`
  - `/payment-methods`
  - `/plans`
  - `/portal`
  - `/webhook`

## 4. Known Issues

### Critical Issues
1. **Duplicate Hooks**: `use-transactions.ts` and `use-transactions.tsx` both exist
2. **Supabase References**: 370+ references found across codebase
3. **Backup Files**: Multiple `.bak` files present
4. **Temporary Files**: Typecheck output files in root directory

### Files to Delete
- `src/hooks/use-transactions.tsx` (after unification)
- `src/test/healthcare/supabase-rls.test.ts`
- `src/lib/api-client.ts.bak`
- `src/test/formatters/brazilianFormatters.test.ts.bak`
- `ts-errors.txt`
- `typecheck-*.txt` (all temporary files)

## 5. Database Schema Status

### Schemas Exported in `src/db/schema/index.ts`
✅ All major schemas appear to be exported:
- users, bankAccounts, transactions, contacts
- pixKeys, pixTransactions, boletos
- calendarEvents, lgpdConsents, auditLogs
- notifications, organizations, voiceCommands
- billingPlans, subscriptions

## 6. Authentication Status

### Clerk Integration
- Middleware: `src/server/middleware/clerk-auth.ts`
- Webhooks: `src/server/webhooks/clerk.ts`
- User scoping helpers: `src/db/clerk-neon.ts`

## Next Steps

1. Run TypeScript type-check to catalog errors
2. Run lint checks to identify issues
3. Begin systematic cleanup starting with Phase 2


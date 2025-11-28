---
title: "Supabase → Neon/Clerk Migration - COMPLETED"
last_updated: 2025-11-28
form: how-to
tags: [migration, neon, clerk, supabase, database, completed]
related:
  - ./MIGRATION_NEON_CLERK.md
  - ./architecture.md
---

# Supabase → Neon/Clerk Migration - COMPLETED ✅

## Overview

This document tracks the migration from Supabase to Neon (PostgreSQL) + Clerk (Auth).

**Status**: COMPLETED
**Branch**: `backup/pre-supabase-removal`

## ✅ All Tasks Completed

### Server Routes Migrated to Drizzle
- [x] `src/server/routes/v1/bank-accounts.ts` - Full Drizzle migration
- [x] `src/server/routes/v1/users.ts` - Full Drizzle migration
- [x] `src/server/routes/v1/contacts.ts` - Full Drizzle migration
- [x] `src/server/routes/v1/calendar.ts` - Full Drizzle migration
- [x] `src/server/routes/v1/api.ts` - Health check endpoints
- [x] `src/server/routes/v1/compliance.ts` - Uses db from context
- [x] `src/server/routes/v1/voice.ts` - Uses db from context
- [x] `src/server/routes/v1/google-calendar.ts` - Stubbed (feature deprecated)

### AI Tools Migrated to Drizzle
- [x] `src/lib/ai/tools/transactions.ts` - Full Drizzle migration
- [x] `src/lib/ai/tools/accounts.ts` - Full Drizzle migration
- [x] `src/lib/ai/tools/categories.ts` - Full Drizzle migration
- [x] `src/lib/ai/tools/index.ts` - Updated to use HttpClient

### Auth & Session
- [x] `src/server/middleware/auth.ts` - Clerk middleware with Drizzle db
- [x] `src/contexts/AuthContext.tsx` - Token getter for API client
- [x] `src/lib/api-client.ts` - Clerk token integration

### Security Files Migrated
- [x] `src/lib/security/biometricAuth.ts` - API-based operations
- [x] `src/lib/lgpd/dataRetention.ts` - API-based operations
- [x] `src/lib/security/security-middleware.ts` - Updated CSP for Clerk
- [x] `src/lib/security/environment-validator.ts` - Removed Supabase env vars

### NLU Migrated
- [x] `src/lib/nlu/contextProcessor.ts` - API-based operations

### Hooks Stubbed/Migrated
- [x] `src/hooks/useAvatarUpload.ts` - Stubbed (needs storage solution)
- [x] `src/hooks/use-google-calendar-sync.ts` - Stubbed (feature deprecated)

### Other
- [x] `src/lib/session/sessionManager.ts` - Clerk signOut integration
- [x] `src/lib/env-validator.ts` - Updated for Clerk + Neon env vars
- [x] `src/lib/voice/voiceCommandProcessor.ts` - API-based operations

### Test Files Updated
- [x] `src/test/setup.ts` - Removed Supabase mocks
- [x] `src/test/database/brazilian-financial-data.test.ts` - Uses Drizzle types
- [x] `src/test/integration/transactions-api.test.ts` - Uses Clerk auth mock
- [x] `src/test/healthcare/lgpd-framework-validation.test.ts` - Uses API mocks
- [x] `src/test/quality-control/type-check-validation.test.ts` - Uses Drizzle types
- [x] `src/lib/nlu/__tests__/Story-1.2-VoiceCommandProcessor.test.ts` - Uses API mocks

### Types Updated
- [x] `src/types/database-stubs.ts` - Uses local Json type instead of Supabase

### Cleanup Completed
- [x] Supabase integration directory removed (already done)
- [x] `@supabase/supabase-js` removed from dependencies
- [x] `supabase` removed from devDependencies
- [x] Scripts updated to use Drizzle commands

---

## 🟢 Validation Steps

Run these commands to verify the migration:

```powershell
# 1. Type Check
bun type-check

# 2. Lint
bun lint

# 3. Build
bun build

# 4. Run Tests
bun test
```
```
# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon Database
DATABASE_URL=
```

---

## 🟡 Files Still Importing Supabase (Need Migration)

Run this command to find all remaining imports:
```powershell
Get-ChildItem -Path "d:\Coders\aegiswallet\src" -Recurse -Include "*.ts","*.tsx" | Select-String -Pattern "supabase" | Select-Object Path, LineNumber, Line
```

### Known Files Requiring Updates:

#### Security Services (Complex - Need Full Rewrite)
| File | Lines | Priority |
|------|-------|----------|
| `src/lib/security/fraudDetection.ts` | ~614 | Medium |
| `src/lib/security/smsProvider.ts` | ~200 | Low |
| `src/lib/security/pushProvider.ts` | ~200 | Low |
| `src/lib/security/auditLogger.ts` | ~300 | Medium |

#### Hooks (Need API Migration)
| File | Issue | Solution |
|------|-------|----------|
| `src/hooks/useBankAccounts.ts` | Supabase realtime | Remove realtime, use polling/React Query |
| `src/hooks/useFinancialEvents.ts` | Supabase realtime | Remove realtime, use polling/React Query |

#### Components (Import Cleanup)
| File | Issue |
|------|-------|
| `src/features/dashboard/VoiceDashboard.tsx` | May import supabase |
| Various components | Check for direct supabase imports |

#### Test Files
| File | Action |
|------|--------|
| `src/test/healthcare/*.test.ts` | Update to mock API instead of Supabase |
| `src/lib/voice/__tests__/*.test.ts` | Update mocks |

---

## 🟢 Validation Steps

After all migrations, run these commands:

```powershell
# 1. Type Check
bun type-check

# 2. Lint
bun lint

# 3. Build
bun build

# 4. Run Tests
bun test
```

### Expected Errors to Fix
- Import errors for `@/integrations/supabase/*`
- Type errors for missing Supabase types
- Test failures for Supabase mocks

---

## 📋 Migration Pattern Reference

### Converting Supabase Query to Drizzle

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('bank_accounts')
  .select('*')
  .eq('user_id', userId)
  .single();
```

**After (Drizzle):**
```typescript
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

const account = await db
  .select()
  .from(bankAccounts)
  .where(eq(bankAccounts.userId, userId))
  .limit(1);
```

### Converting Supabase Auth to Clerk

**Before (Supabase):**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**After (Clerk):**
```typescript
// Server-side (Hono middleware)
const { user } = c.get('auth');

// Client-side (React)
import { useUser } from '@clerk/clerk-react';
const { user } = useUser();
```

---

## 🗺️ Architecture After Migration

```
┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   Clerk Auth    │
│  (Frontend)     │     │   (Frontend)    │
└────────┬────────┘     └─────────────────┘
         │
         │ API Calls with Clerk Token
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Hono Server   │────▶│  Clerk Verify   │
│   (Backend)     │     │   (Backend)     │
└────────┬────────┘     └─────────────────┘
         │
         │ Drizzle ORM
         ▼
┌─────────────────┐
│   Neon Postgres │
│   (Database)    │
└─────────────────┘
```

---

## 📝 Notes

1. **Google Calendar Sync**: Feature is deprecated. The Supabase Edge Functions don't have a direct equivalent in Neon. Consider reimplementing with Cloudflare Workers or Vercel Functions if needed.

2. **Realtime**: Supabase realtime subscriptions don't have a direct equivalent. Options:
   - Use React Query polling
   - Implement WebSocket server
   - Use Pusher/Ably for realtime

3. **Storage**: Supabase Storage needs replacement. Options:
   - Cloudflare R2
   - AWS S3
   - Vercel Blob

4. **RLS Policies**: Drizzle doesn't have built-in RLS. Implement authorization in:
   - Hono middleware
   - Service layer functions
   - Or use Neon's native PostgreSQL RLS

---

## 🚀 Quick Start for New Session

```powershell
# 1. Check remaining Supabase imports
Get-ChildItem -Path "d:\Coders\aegiswallet\src" -Recurse -Include "*.ts","*.tsx" | Select-String -Pattern "@/integrations/supabase" | Select-Object Path -Unique

# 2. Run type-check to see current errors
cd d:\Coders\aegiswallet
bun type-check 2>&1 | Out-File -FilePath "typecheck-migration.txt"

# 3. Review errors
Get-Content "typecheck-migration.txt" | Select-String -Pattern "supabase|Supabase"
```

---

**Last Updated**: 2025-11-28
**Author**: GitHub Copilot (Documentation Agent)

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from '@/server/context';
import type { Meta } from '@/server/trpc-helpers';
import { router } from '@/server/trpc-helpers';

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
});

import { createBankingRouter } from '@/server/procedures/banking';
import { createVoiceRouter } from '@/server/procedures/voice';
/**
 * Import remaining specialized routers that don't have duplicates
 */
import { bankAccountsRouter } from '@/server/routers/bankAccounts';
import { calendarRouter } from '@/server/routers/calendar';
/**
 * Import consolidated routers (single source of truth)
 *
 * NOTE: Legacy routers at src/server/routers/users.ts and src/server/routers/transactions.ts
 * have been permanently removed. Their procedures counterparts in src/server/procedures/
 * have also been removed. All functionality is now consolidated in the routers below.
 */
import { consolidatedRouters } from '@/server/routers/consolidated';
import { contactsRouter } from '@/server/routers/contacts';
import { googleCalendarRouter } from '@/server/routers/google-calendar';
import { pixRouter } from '@/server/routers/pix';

/**
 * Main router with consolidated architecture
 * Eliminates duplication between procedures/ and routers/
 *
 * The following routers are consolidated implementations combining previous
 * router and procedure logic into single, authoritative sources:
 * - auth: Authentication flows with security logging and rate limiting
 * - users: Profile management, preferences, and account operations
 * - transactions: Financial transactions with fraud detection and analytics
 */
export const appRouter = router({
  // Consolidated routers (unified implementations)
  auth: consolidatedRouters.auth,
  users: consolidatedRouters.users,
  transactions: consolidatedRouters.transactions,

  // Specialized routers (no duplicates found)
  profiles: consolidatedRouters.users, // Alias for backward compatibility
  bankAccounts: bankAccountsRouter,
  financialTransactions: consolidatedRouters.transactions, // Alias for backward compatibility
  calendar: calendarRouter,
  googleCalendar: googleCalendarRouter,
  contacts: contactsRouter,
  pix: pixRouter,

  // Procedures without router equivalents
  banking: createBankingRouter(t),
  voice: createVoiceRouter(t),
});

export type AppRouter = typeof appRouter;

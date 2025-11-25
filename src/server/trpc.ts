import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from '@/server/context';

/**
 * tRPC initialization and primitives
 * This is the single source of truth for tRPC configuration
 */

export interface Meta {
  [key: string]: unknown;
}

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
});

/**
 * Export tRPC primitives
 */
export const createTRPCRouter = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Authentication middleware
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Legacy alias for createTRPCRouter
 * @deprecated Use createTRPCRouter instead
 */
export const router = createTRPCRouter;

/**
 * Import specialized routers
 */
import { createBankingRouter } from '@/server/procedures/banking';
import { createVoiceRouter } from '@/server/procedures/voice';
import { bankAccountsRouter } from '@/server/routers/bankAccounts';
import { calendarRouter } from '@/server/routers/calendar';
import { consolidatedRouters } from '@/server/routers/consolidated';
import { googleCalendarRouter } from '@/server/routers/google-calendar';

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
export const appRouter = createTRPCRouter({
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
  // contacts: using Hono API at /api/v1/contacts instead
  // pix: PIX functionality removed

  // Procedures without router equivalents
  banking: createBankingRouter(t),
  voice: createVoiceRouter(t),
});

export type AppRouter = typeof appRouter;

/**
 * Export the tRPC instance for creating additional routers
 */
export { t };

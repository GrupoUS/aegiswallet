import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from '@/server/context';
import { type Meta, router } from '@/server/trpc-helpers';

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
});

/**
 * Import procedures functions
 */
import { createAuthRouter } from '@/server/procedures/auth';
import { createBankingRouter } from '@/server/procedures/banking';
import { createTransactionRouter } from '@/server/procedures/transactions';
import { createUserRouter } from '@/server/procedures/users';
import { createVoiceRouter } from '@/server/procedures/voice';
import { bankAccountsRouter } from '@/server/routers/bankAccounts';
import { calendarRouter } from '@/server/routers/calendar';
import { contactsRouter } from '@/server/routers/contacts';
/**
 * Import routers
 */
import { pixRouter } from '@/server/routers/pix';
import { transactionsRouter } from '@/server/routers/transactions';
import { usersRouter } from '@/server/routers/users';

/**
 * Main router with all procedures
 */
export const appRouter = router({
  auth: createAuthRouter(t),
  users: createUserRouter(t),
  transactions: createTransactionRouter(t),
  banking: createBankingRouter(t),
  voice: createVoiceRouter(t),
  // Enhanced routers with full database integration
  profiles: usersRouter,
  bankAccounts: bankAccountsRouter,
  financialTransactions: transactionsRouter,
  calendar: calendarRouter,
  contacts: contactsRouter,
  pix: pixRouter,
});

export type AppRouter = typeof appRouter;

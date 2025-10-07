import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { router, publicProcedure, protectedProcedure, type Meta } from './trpc-helpers'
import { Context } from './context'

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
})

/**
 * Import procedures functions
 */
import { createAuthRouter } from './procedures/auth'
import { createBankingRouter } from './procedures/banking'
import { createTransactionRouter } from './procedures/transactions'
import { createUserRouter } from './procedures/users'
import { createVoiceRouter } from './procedures/voice'
import { bankAccountsRouter } from './routers/bankAccounts'
import { calendarRouter } from './routers/calendar'
import { contactsRouter } from './routers/contacts'
/**
 * Import routers
 */
import { pixRouter } from './routers/pix'
import { transactionsRouter } from './routers/transactions'
import { usersRouter } from './routers/users'

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
})

export type AppRouter = typeof appRouter

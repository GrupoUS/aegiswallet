import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { Context } from './context'

export interface Meta {
  // Add any meta information here
}

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error('Not authenticated')
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  })
})

/**
 * Import procedures functions
 */
import { createAuthRouter } from './procedures/auth'
import { createBankingRouter } from './procedures/banking'
import { createTransactionRouter } from './procedures/transactions'
import { createUserRouter } from './procedures/users'
import { createVoiceRouter } from './procedures/voice'
import { pixRouter } from './routers/pix'

/**
 * Main router with all procedures
 */
export const appRouter = router({
  auth: createAuthRouter(t),
  users: createUserRouter(t),
  transactions: createTransactionRouter(t),
  banking: createBankingRouter(t),
  voice: createVoiceRouter(t),
  pix: pixRouter,
})

export type AppRouter = typeof appRouter

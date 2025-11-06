import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { Context } from '@/server/context'

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

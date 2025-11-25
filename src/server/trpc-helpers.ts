import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from '@/server/context';
import { generalApiRateLimit } from '@/server/middleware/rateLimitMiddleware';

export interface Meta {
  [key: string]: unknown;
}

const t = initTRPC.context<Context>().meta<Meta>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure.use(generalApiRateLimit);
export const protectedProcedure = t.procedure.use(generalApiRateLimit).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

export { t };

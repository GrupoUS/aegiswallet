import { createTRPCRouter, publicProcedure } from '@/server/trpc-helpers';

export const createAuthRouter = (_t: ReturnType<typeof createTRPCRouter>) =>
  createTRPCRouter({
    health: publicProcedure.query(() => ({ status: 'ok' })),
  });

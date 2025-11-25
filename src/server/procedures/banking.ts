import { createTRPCRouter, publicProcedure } from '@/server/trpc';

/**
 * Creates the banking router for tRPC
 * Provides banking-related procedures
 */
export const createBankingRouter = (_t: unknown) => {
  return createTRPCRouter({
    // Health check for banking module
    health: publicProcedure.query(() => ({
      status: 'ok',
      module: 'banking',
      timestamp: new Date().toISOString(),
    })),
  });
};

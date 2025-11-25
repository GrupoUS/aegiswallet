import { publicProcedure, router } from '@/server/trpc-helpers';

/**
 * Creates the banking router for tRPC
 * Provides banking-related procedures
 */
export const createBankingRouter = (_t: unknown) => {
  return router({
    // Health check for banking module
    health: publicProcedure.query(() => ({
      status: 'ok',
      module: 'banking',
      timestamp: new Date().toISOString(),
    })),
  });
};

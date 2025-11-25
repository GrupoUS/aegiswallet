import { publicProcedure, router } from '@/server/trpc-helpers';

/**
 * Creates the voice router for tRPC
 * Provides voice command procedures
 */
export const createVoiceRouter = (_t: unknown) => {
  return router({
    // Health check for voice module
    health: publicProcedure.query(() => ({
      status: 'ok',
      module: 'voice',
      timestamp: new Date().toISOString(),
    })),
  });
};

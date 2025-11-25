import { createTRPCRouter, publicProcedure } from '@/server/trpc';

/**
 * Creates the voice router for tRPC
 * Provides voice command procedures
 */
export const createVoiceRouter = (_t: unknown) => {
  return createTRPCRouter({
    // Health check for voice module
    health: publicProcedure.query(() => ({
      status: 'ok',
      module: 'voice',
      timestamp: new Date().toISOString(),
    })),
  });
};

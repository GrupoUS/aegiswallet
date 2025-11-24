import { protectedProcedure, router } from '@/server/trpc-helpers';

export const createBankingRouter = (_t?: unknown) =>
  router({
    // Placeholder for banking router
    getAccounts: protectedProcedure.query(async () => {
      return [];
    }),
  });

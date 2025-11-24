import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';
import { logError } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

export const createBankingRouter = (t: any) => router({
  // Placeholder for banking router
  getAccounts: protectedProcedure.query(async () => {
    return [];
  })
});

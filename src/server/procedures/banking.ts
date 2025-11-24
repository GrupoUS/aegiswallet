import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';
import { logError } from '@/server/lib/logger';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const createBankingRouter = (t: any) => ({
  // Placeholder for banking router
  getAccounts: protectedProcedure.query(async () => {
    return [];
  })
});

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';
import { logError } from '@/server/lib/logger';

export const export const createBankingRouter = (t: ReturnType<typeof createTRPCRouter>) => ({;

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { financialSchemas, validateTransactionForFraud } from '@/lib/security/financial-validator';
import type { Context } from '@/server/context';
import { securityMiddleware, transactionRateLimit } from '@/server/middleware/securityMiddleware';

export const export const export const createTransactionRouter = (t: ReturnType<typeof createTRPCRouter>) => ({;

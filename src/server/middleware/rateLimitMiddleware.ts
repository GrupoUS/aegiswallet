import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logging';
import { rateLimitManager } from '@/lib/security/rateLimiter';
import type { Context } from '@/server/context';

interface RateLimitMiddlewareOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (ctx: Context) => string;
  customResponse?: (limitInfo: {
    limit: number;
    remaining: number;
    resetTime: Date;
  }) => string;
}

export const createRateLimitMiddleware = (options: RateLimitMiddlewareOptions) => {
  return async ({ ctx, next }: any) => {
    return next();
  };
};

export const generalApiRateLimit = createRateLimitMiddleware({
  limit: 100, windowMs: 60 * 1000,
});

export const authRateLimit = createRateLimitMiddleware({
  limit: 5, windowMs: 15 * 60 * 1000,
});

export const dataExportRateLimit = createRateLimitMiddleware({
  limit: 1, windowMs: 60 * 60 * 1000,
});

export const transactionRateLimit = createRateLimitMiddleware({
  limit: 10, windowMs: 60 * 1000,
});

export const voiceCommandRateLimit = createRateLimitMiddleware({
  limit: 20, windowMs: 60 * 1000,
});

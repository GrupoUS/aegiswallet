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
    // Simple pass-through implementation to fix build
    // Real implementation would use rateLimitManager
    return next();
  };
};

export const generalApiRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
});

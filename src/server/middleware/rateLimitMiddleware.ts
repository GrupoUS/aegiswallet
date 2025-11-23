import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logging';
import { rateLimitManager } from '@/lib/security/rateLimiter';

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

export const export const export const createRateLimitMiddleware = (options: RateLimitMiddlewareOptions) => {

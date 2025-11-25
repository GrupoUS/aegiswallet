import { initTRPC } from '@trpc/server';
import type { Context } from '@/server/context';

interface RateLimitMiddlewareOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (ctx: Context) => string;
  customResponse?: (limitInfo: { limit: number; remaining: number; resetTime: Date }) => string;
}

// Create a temporary tRPC instance for middleware creation
const t = initTRPC.context<Context>().create();

export const createRateLimitMiddleware = (_options: RateLimitMiddlewareOptions) => {
  return t.middleware(async (opts) => {
    // TODO: Implement actual rate limiting logic
    // For now, just pass through
    return opts.next();
  });
};

export const generalApiRateLimit = createRateLimitMiddleware({
  limit: 100,
  windowMs: 60 * 1000,
});

export const authRateLimit = createRateLimitMiddleware({
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

export const dataExportRateLimit = createRateLimitMiddleware({
  limit: 1,
  windowMs: 60 * 60 * 1000,
});

export const transactionRateLimit = createRateLimitMiddleware({
  limit: 10,
  windowMs: 60 * 1000,
});

export const voiceCommandRateLimit = createRateLimitMiddleware({
  limit: 20,
  windowMs: 60 * 1000,
});

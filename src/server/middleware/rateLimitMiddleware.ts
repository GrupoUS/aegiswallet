import type { Context } from '@/server/context';
import { experimental_standaloneMiddleware } from '@trpc/server';

interface RateLimitMiddlewareOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (ctx: Context) => string;
  customResponse?: (limitInfo: { limit: number; remaining: number; resetTime: Date }) => string;
}

export const createRateLimitMiddleware = (_options: RateLimitMiddlewareOptions) => {
  return experimental_standaloneMiddleware<{
    ctx: Context;
  input: undefined;
  // 'meta', not defined here, defaults to 'object | undefined'
  }>().create((opts) => {
    await opts.next();
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

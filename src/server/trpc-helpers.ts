import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { z } from 'zod';
import type { Context } from '@/server/context';

// Hono-based RPC helpers for AegisWallet
export type AegisContext = Context & {
  Variables: {
    auth: {
      user: {
        id: string;
        email: string;
        role?: string;
      };
      supabase: any;
    };
  };
};

export interface Meta {
  [key: string]: unknown;
}

// Create Hono app with proper typing
export const createRouter = () => new Hono<AegisContext>();

// Rate limiting middleware for Hono
const rateLimitMiddleware = createMiddleware(async (c, next) => {
  // Apply rate limiting logic here
  // For now, just pass through
  await next();
});

// Authentication middleware for Hono
export const authMiddleware = createMiddleware<AegisContext>(async (c, next) => {
  const auth = c.get('auth');
  if (!auth?.user) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }
  c.set('user', auth.user);
  await next();
});

// Public procedure helper (with rate limiting)
export const publicProcedure = <T extends z.ZodType>(schema?: T) => {
  const middlewares = [rateLimitMiddleware];
  if (schema) {
    middlewares.push(zValidator('json', schema));
  }
  return middlewares;
};

// Protected procedure helper (with auth and rate limiting)
export const protectedProcedure = <T extends z.ZodType>(schema?: T) => {
  const middlewares = [rateLimitMiddleware, authMiddleware];
  if (schema) {
    middlewares.push(zValidator('json', schema));
  }
  return middlewares;
};

// Legacy tRPC compatibility layer (to be removed after full migration)
export const router = createRouter;
export const t = {
  router: createRouter,
  procedure: {
    use: (middleware: any) => ({
      use: (nextMiddleware: any) => [middleware, nextMiddleware],
    }),
  },
};

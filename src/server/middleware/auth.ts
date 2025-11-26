/**
 * Authentication Middleware for Hono RPC
 * Handles JWT extraction, user validation, and Supabase client creation
 */

import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { createClient } from '@/integrations/supabase/server';
import { secureLogger } from '@/lib/logging/secure-logger';

interface AuthContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  supabase: ReturnType<typeof createClient>;
}

/**
 * Create a request-scoped Supabase client with user token
 */
function createRequestScopedClient(token: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Authentication middleware for Hono routes
 *
 * Extracts JWT from Authorization header, validates with Supabase,
 * and attaches user context to the request.
 *
 * Usage:
 * ```typescript
 * app.use('/api/v1/protected/*', authMiddleware);
 *
 * // In route handler:
 * const { user, supabase } = c.get('auth');
 * ```
 */
export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  // Log authentication attempt
  const requestId = c.get('requestId') || 'unknown';
  const clientIP = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';

  if (!token) {
    secureLogger.warn('Authentication failed: No token provided', {
      ip: clientIP,
      method: c.req.method,
      path: c.req.path,
      requestId,
      userAgent: c.req.header('User-Agent'),
    });

    return c.json(
      {
        code: 'AUTH_REQUIRED',
        error: 'Authentication required',
      },
      401
    );
  }

  try {
    // Create request-scoped Supabase client with token
    const supabase = createRequestScopedClient(token);

    // Validate token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      secureLogger.warn('Authentication failed: Invalid token', {
        error: error?.message,
        ip: clientIP,
        method: c.req.method,
        path: c.req.path,
        requestId,
        userAgent: c.req.header('User-Agent'),
      });

      return c.json(
        {
          code: 'INVALID_TOKEN',
          error: 'Invalid authentication token',
        },
        401
      );
    }

    // Attach auth context to request
    const authContext: AuthContext = {
      supabase,
      user: {
        id: user.id,
        email: user.email || '',
        role: user.user_metadata?.role,
      },
    };

    c.set('auth', authContext);

    // Log successful authentication
    secureLogger.info('Authentication successful', {
      ip: clientIP,
      method: c.req.method,
      path: c.req.path,
      requestId,
      userId: user.id,
    });

    await next();
  } catch (error) {
    secureLogger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      method: c.req.method,
      path: c.req.path,
      requestId,
      userAgent: c.req.header('User-Agent'),
    });

    return c.json(
      {
        code: 'AUTH_ERROR',
        error: 'Authentication failed',
      },
      500
    );
  }
});

/**
 * Optional authentication middleware
 *
 * Similar to authMiddleware but doesn't return 401 if no token is present.
 * Useful for endpoints that work with or without authentication.
 */
export const optionalAuthMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    // No token provided, continue without auth context
    await next();
    return;
  }

  try {
    // Create request-scoped Supabase client with token
    const supabase = createRequestScopedClient(token);

    // Validate token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Invalid token, but don't return error for optional auth
      await next();
      return;
    }

    // Attach auth context to request
    const authContext: AuthContext = {
      supabase,
      user: {
        id: user.id,
        email: user.email || '',
        role: user.user_metadata?.role,
      },
    };

    c.set('auth', authContext);
    await next();
  } catch {
    // Error validating token, but don't return error for optional auth
    await next();
  }
});

/**
 * Role-based authorization middleware factory
 *
 * Creates a middleware that checks if the authenticated user has the required role.
 *
 * Usage:
 * ```typescript
 * const adminOnly = roleMiddleware(['admin']);
 * app.use('/api/v1/admin/*', authMiddleware, adminOnly);
 * ```
 */
export function roleMiddleware(allowedRoles: string[]) {
  return createMiddleware(async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext | undefined;

    if (!auth) {
      return c.json(
        {
          code: 'AUTH_REQUIRED',
          error: 'Authentication required',
        },
        401
      );
    }

    const userRole = auth.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      secureLogger.warn('Authorization failed: Insufficient role', {
        method: c.req.method,
        path: c.req.path,
        requiredRoles: allowedRoles,
        userId: auth.user.id,
        userRole,
      });

      return c.json(
        {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: allowedRoles,
            current: userRole,
          },
          error: 'Insufficient permissions',
        },
        403
      );
    }

    await next();
  });
}

/**
 * Rate limiting middleware factory for authenticated users
 *
 * Creates a rate limiter that limits requests per user rather than per IP.
 *
 * Usage:
 * ```typescript
 * const userRateLimit = userRateLimitMiddleware({
 *   windowMs: 60 * 1000, // 1 minute
 *   max: 100, // 100 requests per minute per user
 * });
 * app.use('/api/v1/*', authMiddleware, userRateLimit);
 * ```
 */
export function userRateLimitMiddleware(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Too many requests' } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();

  return createMiddleware(async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext | undefined;

    if (!auth) {
      // If no auth context, use IP-based limiting
      const clientIP = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
      return handleRateLimit(clientIP, requests, windowMs, max, message, c, next);
    }

    // Use user ID for rate limiting
    return handleRateLimit(auth.user.id, requests, windowMs, max, message, c, next);
  });
}

/**
 * Handle rate limiting logic
 */
async function handleRateLimit(
  identifier: string,
  requests: Map<string, { count: number; resetTime: number }>,
  windowMs: number,
  max: number,
  message: string,
  c: Context,
  next: Next
) {
  const now = Date.now();
  const userRequests = requests.get(identifier);

  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize counter
    requests.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    // Increment counter
    userRequests.count++;

    if (userRequests.count > max) {
      const resetTime = Math.ceil((userRequests.resetTime - now) / 1000);

      return c.json(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: max,
            windowMs,
            retryAfter: resetTime,
          },
          error: message,
        },
        429
      );
    }
  }

  // Add rate limit headers
  const currentRequests = requests.get(identifier);
  if (currentRequests) {
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - currentRequests.count).toString());
    c.header('X-RateLimit-Reset', new Date(currentRequests.resetTime).toISOString());
  }

  await next();
}

export type { AuthContext };

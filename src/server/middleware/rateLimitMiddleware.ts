import { TRPCError } from '@trpc/server';
import { rateLimitManager, RATE_LIMIT_CONFIGS } from '@/lib/security/rateLimiter';
import { logger } from '@/lib/logging';

export interface RateLimitMiddlewareOptions {
  limiterName: string;
  keyGenerator?: (ctx: any) => string;
  skipOnSuccess?: boolean;
  customResponse?: (limitInfo: any) => string;
}

export const createRateLimitMiddleware = (options: RateLimitMiddlewareOptions) => {
  return async ({ ctx, next }: any) => {
    // Generate identifier for rate limiting
    const identifier = options.keyGenerator
      ? options.keyGenerator(ctx)
      : generateDefaultIdentifier(ctx);

    try {
      // Check rate limit
      const result = rateLimitManager.checkLimit(options.limiterName, identifier);

      // Add rate limit headers to response
      if (ctx.res) {
        ctx.res.setHeader('X-RateLimit-Limit', result.limitInfo.maxAttempts);
        ctx.res.setHeader('X-RateLimit-Remaining', result.limitInfo.remainingAttempts);
        ctx.res.setHeader(
          'X-RateLimit-Reset',
          Math.ceil(result.limitInfo.resetTime.getTime() / 1000)
        );

        if (!result.allowed && result.retryAfter) {
          ctx.res.setHeader('Retry-After', result.retryAfter);
        }
      }

      // Log rate limit check
      logger.debug('Rate limit check', {
        limiter: options.limiterName,
        identifier,
        allowed: result.allowed,
        attempts: result.limitInfo.currentAttempts,
        remaining: result.limitInfo.remainingAttempts,
      });

      // Block if limit exceeded
      if (!result.allowed) {
        const message =
          options.customResponse?.(result.limitInfo) ||
          `Muitas tentativas. Tente novamente em ${Math.ceil(result.retryAfter || 60)} segundos.`;

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message,
          cause: {
            retryAfter: result.retryAfter,
            limitInfo: result.limitInfo,
          },
        });
      }

      // Continue with the request
      const response = await next();

      // Mark as successful if configured
      if (options.skipOnSuccess !== true) {
        rateLimitManager.checkLimit(options.limiterName, identifier, { success: true });
      }

      return response;
    } catch (error) {
      // Mark as failed
      rateLimitManager.checkLimit(options.limiterName, identifier, { success: false });
      throw error;
    }
  };
};

// Default identifier generators
const generateDefaultIdentifier = (ctx: any): string => {
  // Priority order: user ID > IP address > session ID
  if (ctx.user?.id) {
    return `user:${ctx.user.id}`;
  }

  if (ctx.req?.headers['x-forwarded-for']) {
    return `ip:${ctx.req.headers['x-forwarded-for']}`;
  }

  if (ctx.req?.headers['x-real-ip']) {
    return `ip:${ctx.req.headers['x-real-ip']}`;
  }

  if (ctx.req?.socket?.remoteAddress) {
    return `ip:${ctx.req.socket.remoteAddress}`;
  }

  return 'anonymous';
};

// Predefined middleware for common use cases
export const authRateLimit = createRateLimitMiddleware({
  limiterName: 'auth',
  keyGenerator: (ctx) => {
    const ip =
      ctx.req?.headers['x-forwarded-for'] ||
      ctx.req?.headers['x-real-ip'] ||
      ctx.req?.socket?.remoteAddress ||
      'unknown';
    return `auth:${ip}`;
  },
});

export const voiceCommandRateLimit = createRateLimitMiddleware({
  limiterName: 'voiceCommands',
  keyGenerator: (ctx) => {
    if (ctx.user?.id) {
      return `voice:${ctx.user.id}`;
    }
    const ip = ctx.req?.headers['x-forwarded-for'] || 'unknown';
    return `voice:anonymous:${ip}`;
  },
});

export const transactionRateLimit = createRateLimitMiddleware({
  limiterName: 'transactions',
  keyGenerator: (ctx) => {
    if (ctx.user?.id) {
      return `transaction:${ctx.user.id}`;
    }
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for transactions',
    });
  },
});

export const dataExportRateLimit = createRateLimitMiddleware({
  limiterName: 'dataExport',
  keyGenerator: (ctx) => {
    if (ctx.user?.id) {
      return `export:${ctx.user.id}`;
    }
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for data export',
    });
  },
  customResponse: (limitInfo) => 'Limite de exportação de dados atingido. Tente novamente amanhã.',
});

export const generalApiRateLimit = createRateLimitMiddleware({
  limiterName: 'general',
  keyGenerator: generateDefaultIdentifier,
});

// Advanced rate limiting for specific patterns
export const createProgressiveRateLimit = (baseConfig: any) => {
  return createRateLimitMiddleware({
    limiterName: 'progressive',
    keyGenerator: (ctx) => {
      const baseKey = generateDefaultIdentifier(ctx);
      const hour = new Date().getHours();
      return `${baseKey}:hour:${hour}`;
    },
  });
};

// Rate limiting based on user behavior patterns
export const createBehavioralRateLimit = () => {
  return createRateLimitMiddleware({
    limiterName: 'behavioral',
    keyGenerator: (ctx) => {
      if (ctx.user?.id) {
        const userTier = ctx.user.subscription_tier || 'free';
        const baseKey = `behavioral:${userTier}:${ctx.user.id}`;

        // Adjust limits based on user behavior
        const recentActivity = ctx.user.recent_activity_score || 0;
        if (recentActivity > 0.8) {
          return `${baseKey}:high-activity`;
        } else if (recentActivity < 0.2) {
          return `${baseKey}:low-activity`;
        }

        return baseKey;
      }

      return `behavioral:anonymous:${generateDefaultIdentifier(ctx)}`;
    },
  });
};

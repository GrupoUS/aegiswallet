import { logger } from '@/lib/logging';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
  onLimitReached?: (identifier: string, limit: RateLimitInfo) => void;
}

export interface RateLimitInfo {
  identifier: string;
  currentAttempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  resetTime: Date;
  isBlocked: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limitInfo: RateLimitInfo;
  retryAfter?: number; // seconds
}

export class InMemoryRateLimiter {
  private attempts = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  private createEmptyLimitInfo(key: string, windowStart: number): RateLimitInfo {
    return {
      currentAttempts: 0,
      identifier: key,
      isBlocked: false,
      maxAttempts: this.config.maxAttempts,
      remainingAttempts: this.config.maxAttempts,
      resetTime: new Date(windowStart + this.config.windowMs),
    };
  }

  checkLimit(identifier: string, options?: { success?: boolean }): RateLimitResult {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing attempts
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const attempts = this.attempts.get(key);
    if (!attempts) {
      return { allowed: true, limitInfo: this.createEmptyLimitInfo(key, windowStart) };
    }

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);
    this.attempts.set(key, recentAttempts);

    // Skip counting based on success/failure settings
    if (options?.success === true && this.config.skipSuccessfulRequests) {
      return {
        allowed: true,
        limitInfo: {
          currentAttempts: recentAttempts.length,
          identifier: key,
          isBlocked: false,
          maxAttempts: this.config.maxAttempts,
          remainingAttempts: this.config.maxAttempts - recentAttempts.length,
          resetTime: new Date(windowStart + this.config.windowMs),
        },
      };
    }

    if (options?.success === false && this.config.skipFailedRequests) {
      return {
        allowed: true,
        limitInfo: {
          currentAttempts: recentAttempts.length,
          identifier: key,
          isBlocked: false,
          maxAttempts: this.config.maxAttempts,
          remainingAttempts: this.config.maxAttempts - recentAttempts.length,
          resetTime: new Date(windowStart + this.config.windowMs),
        },
      };
    }

    // Check if limit exceeded
    const isBlocked = recentAttempts.length >= this.config.maxAttempts;

    if (isBlocked) {
      // Calculate retry after time
      const oldestAttempt = Math.min(...recentAttempts);
      const retryAfter = Math.ceil((oldestAttempt + this.config.windowMs - now) / 1000);

      const limitInfo: RateLimitInfo = {
        currentAttempts: recentAttempts.length,
        identifier: key,
        isBlocked: true,
        maxAttempts: this.config.maxAttempts,
        remainingAttempts: 0,
        resetTime: new Date(oldestAttempt + this.config.windowMs),
      };

      // Call callback if provided
      this.config.onLimitReached?.(identifier, limitInfo);

      // Log rate limit hit
      logger.warn('Rate limit exceeded', {
        attempts: recentAttempts.length,
        identifier,
        maxAttempts: this.config.maxAttempts,
        retryAfter,
      });

      return {
        allowed: false,
        limitInfo,
        retryAfter,
      };
    }

    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    const limitInfo: RateLimitInfo = {
      currentAttempts: recentAttempts.length,
      identifier: key,
      isBlocked: false,
      maxAttempts: this.config.maxAttempts,
      remainingAttempts: this.config.maxAttempts - recentAttempts.length,
      resetTime: new Date(now + this.config.windowMs),
    };

    return {
      allowed: true,
      limitInfo,
    };
  }

  resetLimit(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.attempts.delete(key);
    logger.info('Rate limit reset', { identifier });
  }

  getLimitInfo(identifier: string): RateLimitInfo | null {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const attempts = this.attempts.get(key);

    if (!attempts || attempts.length === 0) {
      return null;
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);

    return {
      currentAttempts: recentAttempts.length,
      identifier: key,
      isBlocked: recentAttempts.length >= this.config.maxAttempts,
      maxAttempts: this.config.maxAttempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - recentAttempts.length),
      resetTime: new Date(Math.max(...recentAttempts) + this.config.windowMs),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    let cleanedUp = 0;

    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);

      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
        cleanedUp++;
      } else if (recentAttempts.length < attempts.length) {
        this.attempts.set(key, recentAttempts);
      }
    }

    if (cleanedUp > 0) {
      logger.debug('Rate limiter cleanup completed', { cleanedUp, total: this.attempts.size });
    }
  }

  getStats(): { totalEntries: number; blockedRequests: number } {
    let blockedRequests = 0;
    let totalEntries = 0;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const attempts of this.attempts.values()) {
      const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);
      totalEntries++;
      if (recentAttempts.length >= this.config.maxAttempts) {
        blockedRequests++;
      }
    }

    return { blockedRequests, totalEntries };
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - very strict
  auth: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Password reset - very strict
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Voice commands - moderate
  voiceCommands: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true, // Don't count failed voice recognitions
  },

  // Financial transactions - strict
  transactions: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // General API - permissive
  general: {
    maxAttempts: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  // Data export - very strict
  dataExport: {
    maxAttempts: 2,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
};

// Rate limit manager with multiple configurations
export class RateLimitManager {
  private limiters = new Map<string, InMemoryRateLimiter>();

  constructor() {
    // Initialize default limiters
    Object.entries(RATE_LIMIT_CONFIGS).forEach(([name, config]) => {
      this.limiters.set(
        name,
        new InMemoryRateLimiter({
          ...config,
          onLimitReached: (identifier, limitInfo) => {
            this.handleLimitReached(name, identifier, limitInfo);
          },
        })
      );
    });
  }

  checkLimit(
    limiterName: string,
    identifier: string,
    options?: { success?: boolean }
  ): RateLimitResult {
    const limiter = this.limiters.get(limiterName);

    if (!limiter) {
      logger.warn('Rate limiter not found', { limiterName });
      // Create ad-hoc limiter with general config
      const newLimiter = new InMemoryRateLimiter(RATE_LIMIT_CONFIGS.general);
      this.limiters.set(limiterName, newLimiter);
      return newLimiter.checkLimit(identifier, options);
    }

    return limiter.checkLimit(identifier, options);
  }

  resetLimit(limiterName: string, identifier: string): void {
    const limiter = this.limiters.get(limiterName);
    if (limiter) {
      limiter.resetLimit(identifier);
    }
  }

  getLimitInfo(limiterName: string, identifier: string): RateLimitInfo | null {
    const limiter = this.limiters.get(limiterName);
    return limiter ? limiter.getLimitInfo(identifier) : null;
  }

  private handleLimitReached(
    limiterName: string,
    identifier: string,
    limitInfo: RateLimitInfo
  ): void {
    // Log to audit trail
    logger.warn('Rate limit threshold reached', {
      attempts: limitInfo.currentAttempts,
      identifier,
      limiterName,
      maxAttempts: limitInfo.maxAttempts,
      resetTime: limitInfo.resetTime,
    });

    // Could trigger additional security measures here:
    // - Send alerts to security team
    // - Enable additional authentication
    // - Block IP address temporarily
    // - Notify user via email/SMS
  }

  getAllStats(): Record<string, { totalEntries: number; blockedRequests: number }> {
    const stats: Record<string, { totalEntries: number; blockedRequests: number }> = {};

    for (const [name, limiter] of this.limiters.entries()) {
      stats[name] = limiter.getStats();
    }

    return stats;
  }
}

// Export singleton instance
export const rateLimitManager = new RateLimitManager();

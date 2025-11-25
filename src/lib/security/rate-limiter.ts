/**
 * Rate Limiter and Account Lockout System
 * Prevents brute force attacks and implements progressive delays
 *
 * Features:
 * - IP-based rate limiting
 * - Account-based lockout after failed attempts
 * - Progressive delay mechanism
 * - Automatic unlock after timeout
 * - Audit logging for security events
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  lockoutDuration: number; // Lockout duration in milliseconds
  progressiveDelay: boolean; // Enable progressive delays
}

export interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  isLocked: boolean;
  lockUntil?: number;
}

export interface SecurityEvent {
  type: 'rate_limit_exceeded' | 'account_locked' | 'account_unlocked' | 'login_attempt';
  identifier: string; // IP address or user ID
  timestamp: number;
  details?: unknown;
}

interface RateLimitRequest {
  headers: Record<string, string | string[] | undefined>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
  [key: string]: unknown;
}

interface RateLimitResponse {
  status: (code: number) => RateLimitResponse;
  json: (body: unknown) => void;
  [key: string]: unknown;
}

/**
 * Default rate limit configurations for different scenarios
 */
export const RATE_LIMIT_CONFIGS = {
  apiGeneral: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100, // 100 requests per window
    lockoutDuration: 5 * 60 * 1000, // 5 minutes lockout
    progressiveDelay: false,
  },
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 attempts per window
    lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
    progressiveDelay: true,
  },
  financialOperations: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 20, // 20 operations per hour
    lockoutDuration: 60 * 60 * 1000, // 1 hour lockout
    progressiveDelay: true,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 attempts per hour
    lockoutDuration: 2 * 60 * 60 * 1000, // 2 hours lockout
    progressiveDelay: true,
  },
};

class RateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private config: RateLimitConfig;
  private securityEvents: SecurityEvent[] = [];
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up old records periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Clean up every minute
  }

  /**
   * Check if an identifier is currently allowed to make an attempt
   */
  canAttempt(identifier: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const record = this.getRecord(identifier);
    const now = Date.now();

    // Check if currently locked out
    if (record.isLocked && record.lockUntil && record.lockUntil > now) {
      const retryAfter = Math.ceil((record.lockUntil - now) / 1000);
      return {
        allowed: false,
        reason: 'Account temporarily locked due to too many failed attempts',
        retryAfter,
      };
    }

    // Check if rate limit exceeded
    const windowStart = now - this.config.windowMs;
    if (record.attempts >= this.config.maxAttempts && record.lastAttempt > windowStart) {
      if (this.config.progressiveDelay) {
        const delayMs = this.calculateProgressiveDelay(record.attempts);
        const timeSinceLastAttempt = now - record.lastAttempt;

        if (timeSinceLastAttempt < delayMs) {
          const retryAfter = Math.ceil((delayMs - timeSinceLastAttempt) / 1000);
          return {
            allowed: false,
            reason: 'Rate limit exceeded. Please wait before trying again.',
            retryAfter,
          };
        }
      } else {
        const retryAfter = Math.ceil((record.lastAttempt + this.config.windowMs - now) / 1000);
        return {
          allowed: false,
          reason: 'Rate limit exceeded',
          retryAfter,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record an attempt (successful or failed)
   */
  recordAttempt(identifier: string, success: boolean = true): void {
    const now = Date.now();
    const record = this.getRecord(identifier);

    if (success) {
      // Reset on successful attempt
      this.attempts.set(identifier, {
        attempts: 0,
        firstAttempt: now,
        isLocked: false,
        lastAttempt: now,
      });

      this.logSecurityEvent('login_attempt', identifier, { success: true });
    } else {
      // Increment failed attempts
      record.attempts += 1;
      record.lastAttempt = now;

      // Check if should lock account
      if (record.attempts >= this.config.maxAttempts) {
        record.isLocked = true;
        record.lockUntil = now + this.config.lockoutDuration;

        this.logSecurityEvent('account_locked', identifier, {
          attempts: record.attempts,
          lockoutDuration: this.config.lockoutDuration,
        });
      } else {
        this.logSecurityEvent('login_attempt', identifier, {
          attempts: record.attempts,
          success: false,
        });
      }

      this.attempts.set(identifier, record);
    }
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): AttemptRecord | null {
    const record = this.getRecord(identifier);
    const now = Date.now();

    // Update lock status if lock has expired
    if (record.isLocked && record.lockUntil && record.lockUntil <= now) {
      record.isLocked = false;
      record.lockUntil = undefined;
      record.attempts = 0;

      this.logSecurityEvent('account_unlocked', identifier);
      this.attempts.set(identifier, record);
    }

    return record;
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Calculate progressive delay based on number of attempts
   */
  private calculateProgressiveDelay(attempts: number): number {
    // Exponential backoff: 2^attempts seconds, capped at 5 minutes
    const delayMs = Math.min(2 ** attempts * 1000, 5 * 60 * 1000);
    return delayMs;
  }

  /**
   * Get or create attempt record
   */
  private getRecord(identifier: string): AttemptRecord {
    const existing = this.attempts.get(identifier);
    if (existing) {
      return existing;
    }

    const newRecord: AttemptRecord = {
      attempts: 0,
      firstAttempt: Date.now(),
      isLocked: false,
      lastAttempt: Date.now(),
    };

    this.attempts.set(identifier, newRecord);
    return newRecord;
  }

  /**
   * Clean up old records
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, record] of this.attempts.entries()) {
      // Remove records that are old and not locked
      if (!record.isLocked && record.lastAttempt < windowStart) {
        this.attempts.delete(identifier);
      }
    }

    // Clean up old security events (keep last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    type: SecurityEvent['type'],
    identifier: string,
    details?: Record<string, unknown>
  ): void {
    const event: SecurityEvent = {
      details,
      identifier,
      timestamp: Date.now(),
      type,
    };

    this.securityEvents.push(event);

    // Use secure logger for security events
    try {
      const { secureLogger } = require('@/lib/logging/secure-logger');

      // Log security event with appropriate level
      if (type === 'rate_limit_exceeded' || type === 'account_locked') {
        secureLogger.security(`Rate limit security event: ${type}`, {
          identifier,
          timestamp: new Date(event.timestamp).toISOString(),
          ...details,
          component: 'rate-limiter',
        });
      } else {
        secureLogger.warn(`Security event: ${type}`, {
          identifier,
          timestamp: new Date(event.timestamp).toISOString(),
          ...details,
          component: 'rate-limiter',
        });
      }
    } catch {
      // Check for rate limit exceeded events
      if (type === 'rate_limit_exceeded' || type === 'account_locked') {
      }
    }
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.attempts.clear();
    this.securityEvents = [];
  }
}

/**
 * Global rate limiter instances for different use cases
 */
export const rateLimiters = {
  apiGeneral: new RateLimiter(RATE_LIMIT_CONFIGS.apiGeneral),
  authentication: new RateLimiter(RATE_LIMIT_CONFIGS.authentication),
  financialOperations: new RateLimiter(RATE_LIMIT_CONFIGS.financialOperations),
  passwordReset: new RateLimiter(RATE_LIMIT_CONFIGS.passwordReset),
};

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  identifierExtractor: (req: RateLimitRequest) => string
) {
  return (req: RateLimitRequest, res: RateLimitResponse, next: () => void) => {
    const identifier = identifierExtractor(req);
    const result = limiter.canAttempt(identifier);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: result.reason,
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: RateLimitRequest): string {
  return (
    (Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']?.split(',')[0]) ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Helper function for authentication rate limiting
 */
export function checkAuthenticationRateLimit(
  email: string,
  ip: string
): { allowed: boolean; reason?: string; retryAfter?: number } {
  // Check both email-based and IP-based limits
  const emailLimit = rateLimiters.authentication.canAttempt(email);
  const ipLimit = rateLimiters.apiGeneral.canAttempt(ip);

  if (!emailLimit.allowed) {
    return emailLimit;
  }

  if (!ipLimit.allowed) {
    return ipLimit;
  }

  return { allowed: true };
}

/**
 * Record authentication attempt
 */
export function recordAuthenticationAttempt(email: string, ip: string, success: boolean): void {
  rateLimiters.authentication.recordAttempt(email, success);
  rateLimiters.apiGeneral.recordAttempt(ip, success);
}

export default {
  RATE_LIMIT_CONFIGS,
  RateLimiter,
  checkAuthenticationRateLimit,
  createRateLimitMiddleware,
  getClientIP,
  rateLimiters,
  recordAuthenticationAttempt,
};

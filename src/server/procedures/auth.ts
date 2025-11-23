import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { DEFAULT_PASSWORD_POLICY, validatePassword } from '@/lib/security/password-validator';
import {
  checkAuthenticationRateLimit,
  getClientIP,
  recordAuthenticationAttempt,
} from '@/lib/security/rate-limiter';
import type { Context } from '@/server/context';
import { authRateLimit } from '@/server/middleware/rateLimitMiddleware';
import { securityMiddleware } from '@/server/middleware/securityMiddleware';
import type { RouterBuilder } from '@/server/types';

// Type definitions for auth procedures
interface SignInInput {
  email: string;
  password: string;
}

interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

interface AuthContext {
  req?: unknown;
}

export const export const createAuthRouter = (t: ReturnType<typeof createTRPCRouter>) => ({;

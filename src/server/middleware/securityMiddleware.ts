import { middleware } from './trpc';
import { TRPCError } from '@trpc/server';
import {
  authRateLimit,
  voiceCommandRateLimit,
  transactionRateLimit,
  dataExportRateLimit,
  generalApiRateLimit,
} from './rateLimitMiddleware';
import { logger } from '@/lib/logging';

// Security middleware factory
export const createSecurityMiddleware = (
  options: {
    enableRateLimit?: boolean;
    enableAuthValidation?: boolean;
    enableInputValidation?: boolean;
    enableAuditLogging?: boolean;
  } = {}
) => {
  const {
    enableRateLimit = true,
    enableAuthValidation = true,
    enableInputValidation = true,
    enableAuditLogging = true,
  } = options;

  return middleware(async ({ ctx, next, type }) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Log request start
      if (enableAuditLogging) {
        logger.info('Request started', {
          requestId,
          type,
          path: ctx.req?.url,
          method: ctx.req?.method,
          userAgent: ctx.req?.headers['user-agent'],
          ip: ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket?.remoteAddress,
          userId: ctx.user?.id,
        });
      }

      // Apply security measures based on procedure type
      await applySecurityMeasures(ctx, type, {
        enableRateLimit,
        enableAuthValidation,
        enableInputValidation,
      });

      // Execute the procedure
      const result = await next();

      // Log successful completion
      if (enableAuditLogging) {
        logger.info('Request completed', {
          requestId,
          type,
          duration: Date.now() - startTime,
          userId: ctx.user?.id,
          success: true,
        });
      }

      return result;
    } catch (error) {
      // Log error
      if (enableAuditLogging) {
        logger.error('Request failed', {
          requestId,
          type,
          duration: Date.now() - startTime,
          userId: ctx.user?.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }

      // Log security events
      if (isSecurityError(error)) {
        await logSecurityEvent(ctx, error, requestId);
      }

      throw error;
    }
  });
};

// Apply appropriate security measures based on procedure type
const applySecurityMeasures = async (
  ctx: any,
  type: string,
  options: {
    enableRateLimit: boolean;
    enableAuthValidation: boolean;
    enableInputValidation: boolean;
  }
) => {
  const { enableRateLimit, enableAuthValidation, enableInputValidation } = options;

  // Rate limiting
  if (enableRateLimit) {
    await applyRateLimiting(ctx, type);
  }

  // Authentication validation
  if (enableAuthValidation) {
    await validateAuthentication(ctx, type);
  }

  // Input validation
  if (enableInputValidation) {
    await validateInput(ctx, type);
  }
};

// Apply rate limiting based on procedure type
const applyRateLimiting = async (ctx: any, type: string) => {
  // Map procedure types to rate limiters
  const rateLimitMap: Record<string, any> = {
    'auth.login': authRateLimit,
    'auth.register': authRateLimit,
    'auth.resetPassword': authRateLimit,
    'voice.command': voiceCommandRateLimit,
    'voice.transcribe': voiceCommandRateLimit,
    'transaction.create': transactionRateLimit,
    'transaction.update': transactionRateLimit,
    'transaction.delete': transactionRateLimit,
    'data.export': dataExportRateLimit,
    'user.deleteAccount': dataExportRateLimit,
  };

  const rateLimiter = rateLimitMap[type];
  if (rateLimiter) {
    await rateLimiter({ ctx, next: async () => {} });
  } else {
    // Apply general rate limiting
    await generalApiRateLimit({ ctx, next: async () => {} });
  }
};

// Validate authentication requirements
const validateAuthentication = async (ctx: any, type: string) => {
  // Procedures that don't require authentication
  const publicProcedures = [
    'auth.login',
    'auth.register',
    'auth.forgotPassword',
    'auth.resetPassword',
    'public.healthCheck',
    'public.systemInfo',
  ];

  if (!publicProcedures.includes(type) && !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required for this operation',
    });
  }

  // Check for specific role requirements
  const adminProcedures = [
    'admin.users',
    'admin.analytics',
    'admin.system',
    'data.exportAll', // Only admins can export all data
  ];

  if (adminProcedures.includes(type) && ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required for this operation',
    });
  }
};

// Validate input for security
const validateInput = async (ctx: any, type: string) => {
  const input = ctx.input;

  if (!input) return;

  // Check for common injection patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /update\s+set/gi,
    /delete\s+from/gi,
  ];

  const checkValue = (value: any, path: string = ''): void => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          logger.warn('Potentially dangerous input detected', {
            type,
            path,
            value: value.substring(0, 100),
            userId: ctx.user?.id,
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid input detected',
          });
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${path}[${index}]`);
      });
    }
  };

  checkValue(input);

  // Additional validation for specific procedure types
  await validateSpecificInput(ctx, type, input);
};

// Validate input for specific procedure types
const validateSpecificInput = async (ctx: any, type: string, input: any) => {
  switch (type) {
    case 'auth.login':
      await validateLoginInput(ctx, input);
      break;
    case 'auth.register':
      await validateRegisterInput(ctx, input);
      break;
    case 'transaction.create':
      await validateTransactionInput(ctx, input);
      break;
    case 'voice.command':
      await validateVoiceCommandInput(ctx, input);
      break;
  }
};

const validateLoginInput = async (ctx: any, input: any) => {
  if (!input.email || !input.password) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Email and password are required',
    });
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid email format',
    });
  }

  // Check password strength
  if (input.password.length < 8) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Password must be at least 8 characters long',
    });
  }
};

const validateRegisterInput = async (ctx: any, input: any) => {
  await validateLoginInput(ctx, input);

  if (!input.fullName || input.fullName.trim().length < 2) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Full name must be at least 2 characters long',
    });
  }

  // Validate CPF if provided
  if (input.cpf && !validateCPF(input.cpf)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid CPF format',
    });
  }
};

const validateTransactionInput = async (ctx: any, input: any) => {
  if (!input.amount || input.amount <= 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Amount must be greater than 0',
    });
  }

  if (!input.description || input.description.trim().length < 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Description must be at least 3 characters long',
    });
  }

  // Check for suspicious transaction patterns
  const suspiciousPatterns = [
    /^test.*$/i,
    /^demo.*$/i,
    /^hack.*$/i,
    /\btransfer\b.*\ball\b.*\bbalance\b/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input.description)) {
      logger.warn('Suspicious transaction description detected', {
        userId: ctx.user?.id,
        description: input.description,
        amount: input.amount,
      });
    }
  }
};

const validateVoiceCommandInput = async (ctx: any, input: any) => {
  if (!input.command && !input.audioData) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Command text or audio data is required',
    });
  }

  // Check command length
  if (input.command && input.command.length > 1000) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Command text too long',
    });
  }

  // Check audio file size
  if (input.audioData && input.audioData.size > 10 * 1024 * 1024) {
    // 10MB
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Audio file too large',
    });
  }
};

// Helper function to validate CPF
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/[^\d]/g, '');

  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === parseInt(cleaned.substring(10, 11));
};

// Check if error is security-related
const isSecurityError = (error: any): boolean => {
  if (error instanceof TRPCError) {
    return ['UNAUTHORIZED', 'FORBIDDEN', 'TOO_MANY_REQUESTS'].includes(error.code);
  }
  return false;
};

// Log security events
const logSecurityEvent = async (ctx: any, error: any, requestId: string) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: ctx.user?.id,
      action: 'security_violation',
      resource_type: 'api_security',
      details: {
        requestId,
        error_code: error.code,
        error_message: error.message,
        path: ctx.req?.url,
        method: ctx.req?.method,
        ip: ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket?.remoteAddress,
        userAgent: ctx.req?.headers['user-agent'],
        timestamp: new Date().toISOString(),
      },
      success: false,
    });
  } catch (logError) {
    logger.error('Failed to log security event:', logError);
  }
};

// Export middleware instances
export const securityMiddleware = createSecurityMiddleware();
export const strictSecurityMiddleware = createSecurityMiddleware({
  enableRateLimit: true,
  enableAuthValidation: true,
  enableInputValidation: true,
  enableAuditLogging: true,
});

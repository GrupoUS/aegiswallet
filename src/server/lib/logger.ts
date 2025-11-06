import crypto from 'node:crypto';
import pino from 'pino';

// LGPD-compliant data sanitizer for Brazilian financial regulations
interface SensitiveData {
  cpf?: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  agency?: string;
  amount?: number;
  fullName?: string;
}

interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  [key: string]: any;
}

interface AuditLogData {
  userId: string;
  operation: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * LGPD-compliant logger for AegisWallet
 * Implements structured logging with data sanitization and audit trails
 */
class Logger {
  private logger: pino.Logger;
  private auditLogs: AuditLogData[] = [];

  constructor() {
    // Configure Pino for production use
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          // Remove sensitive data from all logs
          return this.sanitizeLogData(object);
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      // Add request ID to all logs in development
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    });
  }

  /**
   * Sanitize entire log object recursively
   */
  private sanitizeLogData(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeLogData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if this is sensitive data
      if (key.toLowerCase().includes('cpf') && typeof value === 'string') {
        sanitized[key] = `${value.substring(0, 3)}***${value.substring(value.length - 2)}`;
      } else if (key.toLowerCase().includes('email') && typeof value === 'string') {
        const [local, domain] = value.split('@');
        sanitized[key] = `${local.substring(0, 2)}***@${domain}`;
      } else if (key.toLowerCase().includes('phone') && typeof value === 'string') {
        sanitized[key] = `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
      } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        sanitized[key] = '***';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate unique request ID for tracing
   */
  generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Enhanced logging with context
   */
  private logWithContext(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    context: LogContext = {}
  ) {
    const enhancedContext = {
      ...context,
      requestId: context.requestId || this.generateRequestId(),
      service: 'aegiswallet-server',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    this.logger[level]({
      ...enhancedContext,
      message,
    });
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}) {
    this.logWithContext('info', message, context);
  }

  /**
   * Error level logging with enhanced error handling
   */
  error(message: string, error?: Error | any, context: LogContext = {}) {
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          code: error.code,
          details: error.details || error.info,
        },
      }),
    };

    this.logWithContext('error', message, errorContext);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}) {
    this.logWithContext('warn', message, context);
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.logWithContext('debug', message, context);
    }
  }

  /**
   * Create audit log for financial operations (LGPD compliance requirement)
   */
  createAuditLog(data: Omit<AuditLogData, 'timestamp'>) {
    const auditLog: AuditLogData = {
      ...data,
      timestamp: new Date().toISOString(),
      details: this.sanitizeLogData(data.details),
    };

    // Store audit log for potential export/review
    this.auditLogs.push(auditLog);

    // Log audit event
    this.info(`AUDIT: ${data.operation}`, {
      auditId: crypto.randomUUID(),
      userId: data.userId,
      operation: data.operation,
      resource: data.resource,
      resourceId: data.resourceId,
      success: data.success,
      ip: data.ip,
      userAgent: data.userAgent,
      category: 'audit',
    });

    return auditLog;
  }

  /**
   * Get audit logs for compliance reporting
   */
  getAuditLogs(userId?: string, startDate?: Date, endDate?: Date): AuditLogData[] {
    let filteredLogs = this.auditLogs;

    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= startDate);
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) <= endDate);
    }

    return filteredLogs;
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = Object.create(Logger.prototype);
    childLogger.logger = this.logger.child(context);
    childLogger.auditLogs = this.auditLogs;
    return childLogger;
  }
}

// Create and export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogContext, AuditLogData, SensitiveData };

// Export convenience functions for common patterns
export const logOperation = (
  operation: string,
  userId: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  return logger.createAuditLog({
    userId,
    operation,
    resource,
    resourceId,
    details: details || {},
    success: true,
  });
};

export const logError = (
  operation: string,
  userId: string,
  error: Error,
  context: LogContext = {}
) => {
  logger.error(`Operation failed: ${operation}`, error, {
    ...context,
    userId,
    operation,
    category: 'operation-failure',
  });

  return logger.createAuditLog({
    userId,
    operation,
    resource: context.resource || 'unknown',
    success: false,
    error: error.message,
    details: { ...context, errorMessage: error.message },
  });
};

export default logger;

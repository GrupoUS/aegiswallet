/**
 * AegisWallet Logger - Main Export
 * Simplified logging system with backward compatibility
 */

// Re-export from simplified logger
export {
  type LogContext as LogEntry,
  type LogContext,
  LogLevel,
  simplifiedLogger as logger,
  simplifiedLogger as default,
} from './simplified-logger';

// Maintain backward compatibility for any existing code
import { simplifiedLogger } from './simplified-logger';

// Legacy exports for compatibility
export { simplifiedLogger as Logger };

// Specialized methods that maintain the same interface
export const logOperation = (
  operation: string,
  userId: string,
  resource: string,
  resourceId?: string,
  context?: Record<string, any>
): void => {
  simplifiedLogger.info(`Operation: ${operation}`, {
    userId: `${userId.substring(0, 8)}...`,
    resource,
    resourceId,
    ...context,
  });
};

export const logError = (
  operation: string,
  userId: string,
  error: Error | Record<string, any>,
  context?: Record<string, any>
): void => {
  const errorInfo =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : error;

  simplifiedLogger.error(`Operation failed: ${operation}`, {
    userId: `${userId.substring(0, 8)}...`,
    error: errorInfo,
    ...context,
  });
};

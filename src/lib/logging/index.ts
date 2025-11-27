/**
 * AegisWallet Logger - Main Export
 * Simplified logging system with backward compatibility
 */

// Re-export from simplified logger
export {
	type LogContext as LogEntry,
	type LogContext,
	LogLevel,
	logger,
	logger as default,
} from './logger';

// Maintain backward compatibility for any existing code
import { logger } from './logger';
export const simplifiedLogger = logger;

// Legacy exports for compatibility
export { logger as Logger };

// Specialized methods that maintain the same interface
export const logOperation = (
	operation: string,
	userId: string,
	resource: string,
	resourceId?: string,
	context?: Record<string, unknown>,
): void => {
	logger.info(`Operation: ${operation}`, {
		userId: `${userId.substring(0, 8)}...`,
		resource,
		resourceId,
		...context,
	});
};

export const logError = (
	operation: string,
	userId: string,
	error: Error | Record<string, unknown>,
	context?: Record<string, unknown>,
): void => {
	const errorInfo =
		error instanceof Error
			? {
					message: error.message,
					stack: error.stack,
				}
			: error;

	logger.error(`Operation failed: ${operation}`, {
		userId: `${userId.substring(0, 8)}...`,
		error: errorInfo,
		...context,
	});
};

export const logSecurityEvent = (
	event: string,
	userId: string,
	context?: Record<string, unknown>,
): void => {
	logger.securityEvent(event, { userId, ...context });
};

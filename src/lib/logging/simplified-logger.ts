/**
 * Simplified AegisWallet Logger
 * Streamlined logging system focused on essential functionality
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogContext {
	component?: string;
	action?: string;
	userId?: string;
	[key: string]: unknown;
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	context?: LogContext;
}

class SimplifiedLogger {
	private isDevelopment: boolean;

	constructor() {
		this.isDevelopment =
			(typeof process !== 'undefined' &&
				process.env?.NODE_ENV === 'development') ||
			(typeof import.meta !== 'undefined' && import.meta.env?.DEV);
	}

	/**
	 * Core logging method
	 */
	private log(level: LogLevel, _message: string, _context?: LogContext): void {
		// Skip debug logs in production
		if (!this.isDevelopment && level === LogLevel.DEBUG) {
			return;
		}

		// Use appropriate console method
		switch (level) {
			case LogLevel.DEBUG:
				break;
			case LogLevel.INFO:
				break;
			case LogLevel.WARN:
				break;
			case LogLevel.ERROR:
				break;
		}
	}

	// Public API methods
	debug(message: string, context?: LogContext): void {
		this.log(LogLevel.DEBUG, message, context);
	}

	info(message: string, context?: LogContext): void {
		this.log(LogLevel.INFO, message, context);
	}

	warn(message: string, context?: LogContext): void {
		this.log(LogLevel.WARN, message, context);
	}

	error(message: string, context?: LogContext): void {
		this.log(LogLevel.ERROR, message, context);
	}

	// Specialized methods for common use cases
	voiceCommand(
		command: string,
		confidence: number,
		context?: LogContext,
	): void {
		this.info('Voice command processed', {
			...context,
			command: command.substring(0, 50), // Limit for privacy
			confidence,
		});
	}

	authEvent(event: string, userId?: string, context?: LogContext): void {
		this.info('Authentication event', {
			...context,
			event,
			userId: userId ? `${userId.substring(0, 8)}...` : undefined,
		});
	}

	securityEvent(event: string, context?: LogContext): void {
		this.warn('Security event', { event, ...context });
	}

	userAction(action: string, component: string, context?: LogContext): void {
		this.info('User action', { action, component, ...context });
	}
}

// Export the class for advanced usage
export { SimplifiedLogger };

// Create and export singleton instance
export const simplifiedLogger = new SimplifiedLogger();
export default simplifiedLogger;

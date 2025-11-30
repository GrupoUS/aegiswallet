/**
 * Centralized logging utility for AegisWallet
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: Date;
	context?: Record<string, unknown>;
	userId?: string;
	requestId?: string;
}

export interface LogContext {
	userId?: string;
	requestId?: string;
	ip?: string;
	userAgent?: string;
	[key: string]: unknown;
}

class Logger {
	private static instance: Logger;
	private logLevel: LogLevel = LogLevel.INFO;

	private constructor() {}

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	private log(level: LogLevel, message: string, context?: LogContext): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const timestamp = new Date().toISOString();
		const levelName = LogLevel[level];
		const contextStr = context ? ` ${JSON.stringify(context)}` : '';
		const logMessage = `[${timestamp}] ${levelName}: ${message}${contextStr}`;

		switch (level) {
			case LogLevel.DEBUG:
				console.debug(logMessage);
				break;
			case LogLevel.INFO:
				console.info(logMessage);
				break;
			case LogLevel.WARN:
				console.warn(logMessage);
				break;
			case LogLevel.ERROR:
				console.error(logMessage);
				break;
		}
	}

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

	// Convenience methods for specific contexts
	security(message: string, context?: LogContext): void {
		this.warn(`[SECURITY] ${message}`, context);
	}

	audit(message: string, context?: LogContext): void {
		this.info(`[AUDIT] ${message}`, context);
	}

	performance(message: string, context?: LogContext): void {
		this.info(`[PERF] ${message}`, context);
	}
}

// Export singleton instance
export const logger = Logger.getInstance();

// Set default log level based on environment
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
	logger.setLogLevel(LogLevel.INFO);
} else if (
	typeof process !== 'undefined' &&
	process.env?.NODE_ENV === 'development'
) {
	logger.setLogLevel(LogLevel.DEBUG);
} else {
	logger.setLogLevel(LogLevel.INFO);
}

/**
 * Convenience function for logging errors
 */
export function logError(message: string, context?: LogContext): void {
	logger.error(message, context);
}

/**
 * Convenience function for logging operations
 */
export function logOperation(message: string, context?: LogContext): void {
	logger.info(`[OPERATION] ${message}`, context);
}

/**
 * Convenience function for logging security events
 */
export function logSecurityEvent(message: string, context?: LogContext): void {
	logger.security(message, context);
}

// Export types for external use
export type { LogContext as LogContextType };

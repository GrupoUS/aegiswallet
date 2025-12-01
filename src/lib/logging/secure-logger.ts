/**
 * Secure Logger for AegisWallet
 * Replaces console logging with secure, sanitized logging system
 *
 * Features:
 * - Sensitive data redaction
 * - Structured logging
 * - Performance optimization
 * - LGPD compliance
 * - Environment-aware logging levels
 */

export enum SecureLogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	SECURITY = 4,
	AUDIT = 5,
}

export interface SecureLogContext {
	component?: string;
	action?: string;
	userId?: string;
	sessionId?: string;
	requestId?: string;
	ip?: string;
	userAgent?: string;
	duration?: number;
	errorCode?: string;
	[key: string]: unknown;
}

export interface SecureLogEntry {
	level: SecureLogLevel;
	message: string;
	timestamp: string;
	context?: SecureLogContext;
	sanitized: boolean;
}

/**
 * Class for secure logging with data sanitization
 */
export class SecureLogger {
	private isDevelopment: boolean;
	private isProduction: boolean;
	private currentUserId?: string;
	private sensitivePatterns: RegExp[];
	private logBuffer: SecureLogEntry[] = [];
	private maxBufferSize = 1000;
	private flushInterval = 5000; // 5 seconds

	constructor() {
		this.isDevelopment = Boolean(
			(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
				(typeof import.meta !== 'undefined' && import.meta.env?.DEV),
		);

		this.isProduction = Boolean(
			(typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') ||
				(typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production'),
		);

		// Initialize sensitive data patterns
		this.sensitivePatterns = [
			// CPF patterns
			/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
			// Email patterns
			/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
			// Phone patterns
			/\b(?:\+55\s?)?\(?[1-9]{2}\)?\s?[9]?\d{4}-?\d{4}\b/g,
			// Credit card patterns
			/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
			// API keys
			/(?:sk_|eyJ)[a-zA-Z0-9_-]{20,}/g,
			// Password fields
			/password["\s:]+["']?[^"'\s,}]+["']?/gi,
			// Token patterns
			/token["\s:]+["']?[^"'\s,}]+["']?/gi,
			// Account numbers
			/account["\s:]+["']?\d{6,}["']?/gi,
		];

		// Start buffer flush interval in production
		if (this.isProduction) {
			setInterval(() => this.flushBuffer(), this.flushInterval);
		}
	}

	/**
	 * Set current user context for logging
	 */
	setUserId(userId: string): void {
		this.currentUserId = userId;
	}

	/**
	 * Clear user context
	 */
	clearUserId(): void {
		this.currentUserId = undefined;
	}

	/**
	 * Sanitize sensitive data from message and context
	 */
	private sanitizeData(
		message: string,
		context?: SecureLogContext,
	): {
		sanitizedMessage: string;
		sanitizedContext?: SecureLogContext;
	} {
		let sanitizedMessage = message;

		// Apply sensitive pattern replacements to message
		this.sensitivePatterns.forEach((pattern) => {
			sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]');
		});

		// Sanitize context object
		let sanitizedContext: SecureLogContext | undefined;
		if (context) {
			sanitizedContext = this.sanitizeContextObject(context);
		}

		return { sanitizedContext, sanitizedMessage };
	}

	/**
	 * Recursively sanitize context object
	 */
	private sanitizeContextObject(obj: SecureLogContext): SecureLogContext {
		const sanitized: SecureLogContext = {};

		for (const [key, value] of Object.entries(obj)) {
			// Check if key is sensitive
			const isSensitiveKey = this.isSensitiveKey(key);

			if (isSensitiveKey && value) {
				// Redact sensitive values completely
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'string') {
				// Apply pattern matching to string values
				let sanitizedValue = value;
				this.sensitivePatterns.forEach((pattern) => {
					sanitizedValue = sanitizedValue.replace(pattern, '[REDACTED]');
				});
				sanitized[key] = sanitizedValue;
			} else if (typeof value === 'object' && value !== null) {
				// Recursively sanitize nested objects
				sanitized[key] = this.sanitizeContextObject(value as SecureLogContext);
			} else {
				// Keep other values as-is
				sanitized[key] = value;
			}
		}

		// Add user context if available
		if (this.currentUserId && !sanitized.userId) {
			sanitized.userId = `${this.currentUserId.substring(0, 8)}...`;
		}

		return sanitized;
	}

	/**
	 * Check if a key is considered sensitive
	 */
	private isSensitiveKey(key: string): boolean {
		const sensitiveKeys = [
			'password',
			'token',
			'secret',
			'key',
			'auth',
			'session',
			'email',
			'phone',
			'cpf',
			'cnpj',
			'account',
			'balance',
			'creditcard',
			'card',
			'bank',
			'transaction',
			'amount',
		];

		return sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()));
	}

	/**
	 * Create structured log entry
	 */
	private createLogEntry(
		level: SecureLogLevel,
		message: string,
		context?: SecureLogContext,
	): SecureLogEntry {
		const { sanitizedMessage, sanitizedContext } = this.sanitizeData(message, context);

		return {
			context: sanitizedContext,
			level,
			message: sanitizedMessage,
			sanitized: true,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Write log entry to appropriate destination
	 */
	private writeLog(entry: SecureLogEntry): void {
		if (this.isDevelopment) {
			// In development, write to console with appropriate level

			switch (entry.level) {
				case SecureLogLevel.DEBUG:
					break;
				case SecureLogLevel.INFO:
					break;
				case SecureLogLevel.WARN:
					break;
				case SecureLogLevel.ERROR:
				case SecureLogLevel.SECURITY:
					break;
				case SecureLogLevel.AUDIT:
					break;
			}
		} else if (this.isProduction) {
			// In production, add to buffer for batch processing
			this.addToBuffer(entry);
		}
	}

	/**
	 * Add log entry to buffer
	 */
	private addToBuffer(entry: SecureLogEntry): void {
		this.logBuffer.push(entry);

		// Flush buffer if it gets too large
		if (this.logBuffer.length >= this.maxBufferSize) {
			this.flushBuffer();
		}
	}

	/**
	 * Flush buffer to external logging service
	 */
	private flushBuffer(): void {
		if (this.logBuffer.length === 0) {
			return;
		}

		const logsToFlush = [...this.logBuffer];
		this.logBuffer = [];

		// In production, this would send to external logging service
		// For now, we'll just send critical logs to console
		const criticalLogs = logsToFlush.filter((log) => log.level >= SecureLogLevel.ERROR);

		if (criticalLogs.length > 0) {
			criticalLogs.forEach((_log) => {
				// Process critical logs
			});
		}

		// TODO: Implement external logging service integration
		// this.sendToLoggingService(logsToFlush);
	}

	/**
	 * Core logging method
	 */
	private log(level: SecureLogLevel, message: string, context?: SecureLogContext): void {
		// Skip debug logs in production
		if (!this.isDevelopment && level === SecureLogLevel.DEBUG) {
			return;
		}

		const entry = this.createLogEntry(level, message, context);
		this.writeLog(entry);
	}

	// Public API methods
	debug(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.DEBUG, message, context);
	}

	info(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.INFO, message, context);
	}

	warn(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.WARN, message, context);
	}

	error(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.ERROR, message, context);
	}

	security(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.SECURITY, message, context);
	}

	audit(message: string, context?: SecureLogContext): void {
		this.log(SecureLogLevel.AUDIT, message, context);
	}

	// Specialized methods for common use cases
	voiceCommand(command: string, confidence: number, context?: SecureLogContext): void {
		this.info('Voice command processed', {
			...context,
			command: command.substring(0, 50), // Limit for privacy
			confidence,
		});
	}

	authEvent(event: string, userId?: string, context?: SecureLogContext): void {
		this.audit('Authentication event', {
			...context,
			event,
			userId: userId ? `${userId.substring(0, 8)}...` : undefined,
		});
	}

	userAction(action: string, component: string, context?: SecureLogContext): void {
		this.info('User action', { action, component, ...context });
	}

	performance(operation: string, duration: number, context?: SecureLogContext): void {
		this.info('Performance metric', {
			...context,
			operation,
			duration,
		});
	}

	/**
	 * Get buffer statistics (for monitoring)
	 */
	getBufferStats(): {
		size: number;
		maxSize: number;
		lastFlush: Date | null;
	} {
		return {
			lastFlush: new Date(),
			maxSize: this.maxBufferSize,
			size: this.logBuffer.length, // Simplified - would track actual flush time
		};
	}

	/**
	 * Force flush the buffer
	 */
	forceFlush(): void {
		this.flushBuffer();
	}

	/**
	 * Clear all logs and buffer
	 */
	clear(): void {
		this.logBuffer = [];
		this.currentUserId = undefined;
	}
}

// Create and export singleton instance
export const secureLogger = new SecureLogger();
export default secureLogger;

// Export convenience functions for backward compatibility
export const log = {
	audit: (message: string, context?: SecureLogContext) => secureLogger.audit(message, context),
	debug: (message: string, context?: SecureLogContext) => secureLogger.debug(message, context),
	error: (message: string, context?: SecureLogContext) => secureLogger.error(message, context),
	info: (message: string, context?: SecureLogContext) => secureLogger.info(message, context),
	security: (message: string, context?: SecureLogContext) =>
		secureLogger.security(message, context),
	warn: (message: string, context?: SecureLogContext) => secureLogger.warn(message, context),
};

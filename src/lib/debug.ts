/**
 * Development Debug Utility
 * Provides conditional logging that works in development but is removed in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugContext {
	component?: string;
	action?: string;
}

class Logger {
	private isDevelopment: boolean;

	constructor() {
		this.isDevelopment =
			import.meta.env.DEV || process.env.NODE_ENV === 'development';
	}

	private log(
		level: LogLevel,
		_message: string,
		_data?: unknown,
		_context?: DebugContext,
	): void {
		if (!this.isDevelopment) {
			return;
		}

		switch (level) {
			case 'debug':
				break;
			case 'info':
				break;
			case 'warn':
				break;
			case 'error':
				break;
		}
	}

	debug(message: string, data?: unknown, context?: DebugContext): void {
		this.log('debug', message, data, context);
	}

	info(message: string, data?: unknown, context?: DebugContext): void {
		this.log('info', message, data, context);
	}

	warn(message: string, data?: unknown, context?: DebugContext): void {
		this.log('warn', message, data, context);
	}

	error(message: string, error?: unknown, context?: DebugContext): void {
		this.log('error', message, error, context);
	}

	// Component-specific logging helpers
	component(componentName: string) {
		return {
			action: (actionName: string) => ({
				debug: (message: string, data?: unknown) =>
					this.debug(message, data, {
						action: actionName,
						component: componentName,
					}),
				error: (message: string, error?: unknown) =>
					this.error(message, error, {
						action: actionName,
						component: componentName,
					}),
				info: (message: string, data?: unknown) =>
					this.info(message, data, {
						action: actionName,
						component: componentName,
					}),
				warn: (message: string, data?: unknown) =>
					this.warn(message, data, {
						action: actionName,
						component: componentName,
					}),
			}),
			debug: (message: string, data?: unknown) =>
				this.debug(message, data, { component: componentName }),
			error: (message: string, error?: unknown) =>
				this.error(message, error, { component: componentName }),
			info: (message: string, data?: unknown) =>
				this.info(message, data, { component: componentName }),
			warn: (message: string, data?: unknown) =>
				this.warn(message, data, { component: componentName }),
		};
	}

	// Performance logging
	time(_label: string): void {
		if (this.isDevelopment) {
		}
	}

	timeEnd(_label: string): void {
		if (this.isDevelopment) {
		}
	}

	// Group logging
	group(_label: string): void {
		if (this.isDevelopment) {
		}
	}

	groupEnd(): void {
		if (this.isDevelopment) {
		}
	}
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions for common patterns
export const createComponentLogger = (componentName: string) =>
	logger.component(componentName);

// Development-only assertions
export const assert = (condition: boolean, message: string): void => {
	if (import.meta.env.DEV && !condition) {
		throw new Error(`Assertion failed: ${message}`);
	}
};

// Development-only warnings
export const warnOnce = (message: string): void => {
	if (import.meta.env.DEV && !warnOnce.warnedMessages.has(message)) {
		logger.warn(message);
		warnOnce.warnedMessages.add(message);
	}
};

warnOnce.warnedMessages = new Set<string>();

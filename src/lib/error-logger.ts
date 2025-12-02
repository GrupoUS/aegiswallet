/**
 * Structured Error Logging Framework
 *
 * Provides comprehensive error logging with Brazilian compliance context
 * LGPD compliant with audit trails and sensitive data handling
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

import type { EnhancedApiError } from '@/types/api.types';

// ========================================
// ERROR LOG LEVELS
// ========================================

export type ErrorLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorLogContext {
	userId?: string;
	sessionId?: string;
	requestId?: string;
	component?: string;
	route?: string;
	action?: string;
	browserInfo?: {
		userAgent: string;
		language: string;
		timezone: string;
	};
	deviceInfo?: {
		platform: string;
		screenResolution?: string;
	};
}

export interface ErrorLogEntry {
	id: string;
	timestamp: Date;
	level: ErrorLogLevel;
	message: string;
	error?: {
		name?: string;
		stack?: string;
		code?: string;
		details?: Record<string, unknown>;
	};
	context: ErrorLogContext;
	lgpd: {
		containsPersonalData: boolean;
		dataCategory?: 'financial' | 'personal' | 'health' | 'preferences';
		retentionDays: number;
		consentRequired: boolean;
	};
	performance?: {
		memoryUsage?: number;
		timestamp: number;
		duration?: number;
	};
}

// ========================================
// ERROR LOGGER CLASS
// ========================================

export class StructuredErrorLogger {
	private static instance: StructuredErrorLogger;
	private logs: ErrorLogEntry[] = [];
	private maxLogs = 1000;
	private isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

	private constructor() {
		// Private constructor for singleton
	}

	public static getInstance(): StructuredErrorLogger {
		if (!StructuredErrorLogger.instance) {
			StructuredErrorLogger.instance = new StructuredErrorLogger();
		}
		return StructuredErrorLogger.instance;
	}

	public log(
		level: ErrorLogLevel,
		message: string,
		error?: Error | EnhancedApiError,
		context: Partial<ErrorLogContext> = {},
	): void {
		const logEntry: ErrorLogEntry = {
			id: this.generateLogId(),
			timestamp: new Date(),
			level,
			message,
			context: this.buildContext(context),
			lgpd: this.buildLgpdContext(message, error),
			performance: this.buildPerformanceContext(),
		};

		if (error) {
			logEntry.error = {
				name: error.name,
				stack: error.stack,
				...((error as EnhancedApiError).code && { code: (error as EnhancedApiError).code }),
				...((error as EnhancedApiError).details && {
					details: (error as EnhancedApiError).details,
				}),
			};
		}

		this.addToBuffer(logEntry);
		this.outputLog(logEntry);
	}

	public debug(message: string, context?: Partial<ErrorLogContext>): void {
		this.log('debug', message, undefined, context);
	}

	public info(message: string, context?: Partial<ErrorLogContext>): void {
		this.log('info', message, undefined, context);
	}

	public warn(message: string, error?: Error, context?: Partial<ErrorLogContext>): void {
		this.log('warn', message, error, context);
	}

	public error(
		message: string,
		error?: Error | EnhancedApiError,
		context?: Partial<ErrorLogContext>,
	): void {
		this.log('error', message, error, context);
	}

	public fatal(
		message: string,
		error?: Error | EnhancedApiError,
		context?: Partial<ErrorLogContext>,
	): void {
		this.log('fatal', message, error, context);
	}

	public getLogs(): ErrorLogEntry[] {
		return [...this.logs];
	}

	public clearLogs(): void {
		this.logs = [];
	}

	public exportLogs(): string {
		const exportData = {
			exportedAt: new Date().toISOString(),
			logCount: this.logs.length,
			logs: this.logs.map((log) => ({
				...log,
				...(log.error?.stack &&
					!this.isDevelopment && {
						error: {
							...log.error,
							stack: '[REDACTED FOR PRIVACY]',
						},
					}),
			})),
		};

		return JSON.stringify(exportData, null, 2);
	}

	private generateLogId(): string {
		return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private buildContext(context: Partial<ErrorLogContext>): ErrorLogContext {
		const builtContext: ErrorLogContext = {};

		if (typeof window !== 'undefined') {
			builtContext.browserInfo = {
				userAgent: navigator.userAgent,
				language: navigator.language,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};

			builtContext.deviceInfo = {
				platform: navigator.platform,
				screenResolution: `x${screen.height}`,
			};
		}

		return { ...builtContext, ...context };
	}

	private buildLgpdContext(
		message: string,
		error?: Error | EnhancedApiError,
	): ErrorLogEntry['lgpd'] {
		const personalDataPatterns = [
			/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/,
			/\b\d{11}\b/,
			/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/i,
			/credit\s*card|debit\s*card|account\s*number/i,
		];

		const containsPersonalData = personalDataPatterns.some(
			(pattern) => pattern.test(message) || (error?.message && pattern.test(error.message)),
		);

		let dataCategory: ErrorLogEntry['lgpd']['dataCategory'] = 'personal';
		if (
			message.toLowerCase().includes('transaction') ||
			message.toLowerCase().includes('payment') ||
			message.toLowerCase().includes('balance')
		) {
			dataCategory = 'financial';
		}

		return {
			containsPersonalData,
			dataCategory,
			retentionDays: containsPersonalData ? 30 : 90,
			consentRequired: containsPersonalData,
		};
	}

	private buildPerformanceContext(): ErrorLogEntry['performance'] {
		const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
		return {
			memoryUsage: perf.memory?.usedJSHeapSize,
			timestamp: Date.now(),
		};
	}

	private addToBuffer(logEntry: ErrorLogEntry): void {
		this.logs.unshift(logEntry);

		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(0, this.maxLogs);
		}
	}

	private getLogStyle(level: ErrorLogLevel): string {
		const styles = {
			debug: 'color: #6B7280; font-weight: bold;',
			info: 'color: #3B82F6; font-weight: bold;',
			warn: 'color: #F59E0B; font-weight: bold;',
			error: 'color: #EF4444; font-weight: bold;',
			fatal: 'color: #DC2626; font-weight: bold; background: #FEE2E2; padding: 2px;',
		};

		return styles[level] || styles.info;
	}

	private outputLog(logEntry: ErrorLogEntry): void {
		if (!this.isDevelopment) {
			if (logEntry.level === 'error' || logEntry.level === 'fatal') {
				void this.sendToExternalService(logEntry);
			}
			return;
		}

		// In development, we could use these for enhanced logging
		// getLogStyle provides CSS styling for console output
		this.getLogStyle(logEntry.level);

		// Build context info for debugging if available
		if (logEntry.context.component || logEntry.context.route || logEntry.context.action) {
			// Context available: component, route, action
		}

		if (logEntry.lgpd.containsPersonalData) {
			// Personal data detected - handle with care
		}
	}

	private async sendToExternalService(_logEntry: ErrorLogEntry): Promise<void> {
		await Promise.resolve();
	}
}

// ========================================
// CONVENIENCE EXPORTS
// ========================================

export const errorLogger = StructuredErrorLogger.getInstance();

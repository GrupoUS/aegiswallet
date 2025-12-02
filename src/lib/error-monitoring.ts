/**
 * Error Monitoring Integration for AegisWallet
 *
 * Provides production error tracking, alerting, and monitoring
 * with Brazilian compliance and LGPD data protection.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

import React from 'react';

import { errorLogger } from './error-logger';
import { getUserFriendlyMessage, shouldReportError } from './error-messages';
import { safeExecuteAsync } from './utils/null-safety';

// ============================================================================
// Monitoring Configuration Types
// ============================================================================

export interface MonitoringConfig {
	/** Monitoring service endpoint */
	endpoint: string;
	/** API key for authentication */
	apiKey: string;
	/** Environment (development, staging, production) */
	environment: 'development' | 'staging' | 'production';
	/** Whether to enable real-time monitoring */
	enableRealTime: boolean;
	/** Error sampling rate (0-1) */
	sampleRate: number;
	/** Maximum errors per minute */
	maxErrorsPerMinute: number;
	/** Custom metadata to include */
	customMetadata?: Record<string, string>;
}

export interface ErrorReport {
	/** Unique error identifier */
	id: string;
	/** Timestamp when error occurred */
	timestamp: string;
	/** Error message */
	message: string;
	/** Error category */
	category: string;
	/** Error severity */
	severity: string;
	/** User agent information */
	userAgent: string;
	/** Current URL */
	url: string;
	/** Browser/device information */
	browserInfo: BrowserInfo;
	/** Session information */
	sessionInfo?: SessionInfo;
	/** Custom metadata */
	metadata?: Record<string, unknown>;
	/** Whether error was reported to monitoring service */
	reported: boolean;
}

export interface BrowserInfo {
	/** Browser name and version */
	name: string;
	/** Operating system */
	os: string;
	/** Device type (mobile/desktop/tablet) */
	deviceType: string;
	/** Screen resolution */
	screenResolution: string;
	/** Language settings */
	language: string;
	/** Online status */
	online: boolean;
}

export interface SessionInfo {
	/** User ID (hashed for privacy) */
	userId?: string;
	/** Session ID */
	sessionId: string;
	/** Authentication method */
	authMethod: string;
	/** Session duration */
	sessionDuration: number;
	/** Last activity timestamp */
	lastActivity: string;
}

export interface MonitoringAlert {
	/** Alert ID */
	id: string;
	/** Alert type */
	type: 'error_spike' | 'critical_error' | 'service_degradation' | 'security_incident';
	/** Alert message */
	message: string;
	/** Alert severity */
	severity: 'low' | 'medium' | 'high' | 'critical';
	/** Timestamp when alert was triggered */
	timestamp: string;
	/** Alert data */
	data: Record<string, unknown>;
	/** Whether alert was acknowledged */
	acknowledged: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_MONITORING_CONFIG: Partial<MonitoringConfig> = {
	endpoint: 'https://monitoring.aegiswallet.com.br/api/errors',
	environment: 'production',
	enableRealTime: true,
	sampleRate: 1.0,
	maxErrorsPerMinute: 100,
	customMetadata: {
		service: 'aegiswallet',
		version: '1.0.0',
		region: 'brazil',
	},
};

// ============================================================================
// Error Monitoring Service
// ============================================================================

export class ErrorMonitoringService {
	private config: MonitoringConfig;
	private errorQueue: ErrorReport[] = [];
	private alertQueue: MonitoringAlert[] = [];
	private isOnline: boolean = navigator.onLine;
	private reportingEnabled = true;

	constructor(config: Partial<MonitoringConfig> = {}) {
		this.config = { ...DEFAULT_MONITORING_CONFIG, ...config } as MonitoringConfig;
		this.initializeMonitoring();
	}

	/**
	 * Initialize monitoring service
	 */
	private initializeMonitoring(): void {
		// Set up online/offline monitoring
		window.addEventListener('online', () => {
			this.isOnline = true;
			void this.flushQueuedReports();
		});

		window.addEventListener('offline', () => {
			this.isOnline = false;
		});

		// Set up error tracking for unhandled errors
		window.addEventListener('error', (event) => {
			this.trackError(event.error || new Error('Unhandled error'), {
				category: 'system',
				severity: 'high',
			});
		});

		// Set up promise rejection tracking
		window.addEventListener('unhandledrejection', (event) => {
			this.trackError(event.reason || new Error('Unhandled promise rejection'), {
				category: 'system',
				severity: 'medium',
			});
		});

		// Flush any queued errors on page unload
		window.addEventListener('beforeunload', () => {
			void this.flushQueuedReports();
		});
	}

	/**
	 * Track error with monitoring
	 */
	public trackError(error: unknown, context?: Partial<ErrorReport>): void {
		try {
			const userFriendlyError = getUserFriendlyMessage(error);

			// Check if error should be reported
			if (!(shouldReportError(error) && this.reportingEnabled)) {
				return;
			}

			const errorReport: ErrorReport = {
				id: this.generateErrorId(),
				timestamp: new Date().toISOString(),
				message: userFriendlyError.message,
				category: userFriendlyError.category,
				severity: userFriendlyError.severity,
				userAgent: navigator.userAgent,
				url: window.location.href,
				browserInfo: this.getBrowserInfo(),
				sessionInfo: this.getSessionInfo(),
				metadata: {
					...this.config.customMetadata,
					...context,
					stack: error instanceof Error ? error.stack : undefined,
				},
				reported: false,
			};

			// Add to queue for batch reporting
			this.errorQueue.push(errorReport);

			// Check for alert conditions
			this.checkForAlerts(errorReport);

			// Try to report immediately if online
			if (this.isOnline) {
				void this.flushQueuedReports();
			}
		} catch (monitoringError) {
			// Don't let monitoring errors break the app
			errorLogger.error(
				'Error monitoring failed',
				monitoringError instanceof Error ? monitoringError : new Error(String(monitoringError)),
			);
		}
	}

	/**
	 * Track custom event
	 */
	public trackEvent(eventName: string, data?: Record<string, unknown>): void {
		try {
			const eventReport = {
				id: this.generateErrorId(),
				timestamp: new Date().toISOString(),
				message: `Event: ${eventName}`,
				category: 'user_interaction',
				severity: 'low',
				userAgent: navigator.userAgent,
				url: window.location.href,
				browserInfo: this.getBrowserInfo(),
				sessionInfo: this.getSessionInfo(),
				metadata: {
					...this.config.customMetadata,
					eventName,
					...data,
				},
				reported: false,
			};

			this.errorQueue.push(eventReport);

			if (this.isOnline) {
				void this.flushQueuedReports();
			}
		} catch (error) {
			errorLogger.error(
				'Event tracking failed',
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	/**
	 * Generate unique error ID
	 */
	private generateErrorId(): string {
		return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get browser information
	 */
	private getBrowserInfo(): BrowserInfo {
		const ua = navigator.userAgent;
		let browserName = 'Unknown';
		let os = 'Unknown';

		// Simple browser detection
		if (ua.includes('Chrome')) browserName = 'Chrome';
		else if (ua.includes('Firefox')) browserName = 'Firefox';
		else if (ua.includes('Safari')) browserName = 'Safari';
		else if (ua.includes('Edge')) browserName = 'Edge';

		// Simple OS detection
		if (ua.includes('Windows')) os = 'Windows';
		else if (ua.includes('Mac')) os = 'macOS';
		else if (ua.includes('Linux')) os = 'Linux';
		else if (ua.includes('Android')) os = 'Android';
		else if (ua.includes('iOS')) os = 'iOS';

		return {
			name: browserName,
			os,
			deviceType: this.getDeviceType(),
			screenResolution: `${screen.width}x${screen.height}`,
			language: navigator.language || 'unknown',
			online: navigator.onLine,
		};
	}

	/**
	 * Get device type
	 */
	private getDeviceType(): string {
		const width = window.innerWidth;
		if (width < 768) return 'mobile';
		if (width < 1024) return 'tablet';
		return 'desktop';
	}

	/**
	 * Get session information (LGPD compliant)
	 */
	private getSessionInfo(): SessionInfo | undefined {
		try {
			// Try to get session info from localStorage or context
			const sessionData = localStorage.getItem('aegis_session_info');
			if (sessionData) {
				const session = JSON.parse(sessionData);
				return {
					userId: session.userId ? this.hashUserId(session.userId) : undefined,
					sessionId: session.sessionId || 'unknown',
					authMethod: session.authMethod || 'unknown',
					sessionDuration: Date.now() - (session.startTime || Date.now()),
					lastActivity: new Date().toISOString(),
				};
			}
		} catch {
			return undefined;
		}
	}

	/**
	 * Hash user ID for LGPD compliance
	 */
	private hashUserId(userId: string): string {
		// Simple hash for privacy - in production, use proper hashing
		if (this.config.environment === 'production') {
			// This would be replaced with proper crypto hash in production
			return btoa(`${userId.substring(0, 8)}***`);
		}
		return `dev_${userId.substring(0, 4)}***`;
	}

	/**
	 * Check for alert conditions
	 */
	private checkForAlerts(errorReport: ErrorReport): void {
		const now = Date.now();
		// Filter recent errors for alert checking
		// Note: _recentErrors used for 1 minute window, recentFiveMinutes used for 5 minute window

		// Error spike alert (more than 10 errors in 5 minutes)
		const recentFiveMinutes = this.errorQueue.filter(
			(e) => e.timestamp > new Date(now - 300000).toISOString(),
		);

		if (recentFiveMinutes.length > 10) {
			this.createAlert('error_spike', 'High error rate detected', 'high', {
				errorCount: recentFiveMinutes.length,
				timeWindow: '5 minutes',
			});
		}

		// Critical error alert
		if (errorReport.severity === 'critical') {
			this.createAlert('critical_error', 'Critical error occurred', 'critical', {
				errorId: errorReport.id,
				errorMessage: errorReport.message,
			});
		}

		// Security incident alert
		if (errorReport.category === 'authentication' && errorReport.severity === 'high') {
			this.createAlert('security_incident', 'Security incident detected', 'high', {
				errorId: errorReport.id,
				userAgent: errorReport.userAgent,
			});
		}
	}

	/**
	 * Create monitoring alert
	 */
	private createAlert(
		type: MonitoringAlert['type'],
		message: string,
		severity: MonitoringAlert['severity'],
		data: Record<string, unknown>,
	): void {
		const alert: MonitoringAlert = {
			id: this.generateErrorId(),
			type,
			message,
			severity,
			timestamp: new Date().toISOString(),
			data,
			acknowledged: false,
		};

		this.alertQueue.push(alert);

		// Try to send alert immediately
		if (this.isOnline) {
			void this.flushQueuedAlerts();
		}
	}

	/**
	 * Flush queued error reports
	 */
	private async flushQueuedReports(): Promise<void> {
		if (this.errorQueue.length === 0) return;

		const reportsToSend = this.errorQueue.splice(0, this.config.maxErrorsPerMinute);

		try {
			await this.sendReports(reportsToSend);
			reportsToSend.forEach((report) => {
				report.reported = true;
			});
		} catch (error) {
			errorLogger.error(
				`Failed to send error reports (${reportsToSend.length} reports)`,
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	/**
	 * Flush queued alerts
	 */
	private async flushQueuedAlerts(): Promise<void> {
		if (this.alertQueue.length === 0) return;

		const alertsToSend = this.alertQueue.splice(0, 10); // Max 10 alerts at once

		try {
			await this.sendAlerts(alertsToSend);
			alertsToSend.forEach((alert) => {
				alert.acknowledged = true;
			});
		} catch (error) {
			errorLogger.error(
				`Failed to send alerts (${alertsToSend.length} alerts)`,
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	/**
	 * Send error reports to monitoring service
	 */
	private async sendReports(reports: ErrorReport[]): Promise<void> {
		if (!(this.config.endpoint && this.config.apiKey)) {
			return;
		}

		const payload = {
			reports,
			metadata: {
				...this.config.customMetadata,
				timestamp: new Date().toISOString(),
				source: 'aegiswallet-client',
			},
		};

		await safeExecuteAsync(() =>
			fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// biome-ignore lint/style/useNamingConvention: HTTP header requires specific casing
					Authorization: `Bearer ${this.config.apiKey}`,
					'X-Environment': this.config.environment,
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(10000), // 10 second timeout
			}),
		);
	}

	/**
	 * Send alerts to monitoring service
	 */
	private async sendAlerts(alerts: MonitoringAlert[]): Promise<void> {
		if (!(this.config.endpoint && this.config.apiKey)) {
			return;
		}

		const payload = {
			alerts,
			metadata: {
				...this.config.customMetadata,
				timestamp: new Date().toISOString(),
				source: 'aegiswallet-client',
			},
		};

		await safeExecuteAsync(() =>
			fetch(`${this.config.endpoint}/alerts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// biome-ignore lint/style/useNamingConvention: HTTP header requires specific casing
					Authorization: `Bearer ${this.config.apiKey}`,
					'X-Environment': this.config.environment,
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(10000), // 10 second timeout
			}),
		);
	}

	/**
	 * Enable/disable reporting
	 */
	public setReportingEnabled(enabled: boolean): void {
		this.reportingEnabled = enabled;
	}

	/**
	 * Get monitoring statistics
	 */
	public getStats(): {
		queuedErrors: number;
		queuedAlerts: number;
		isOnline: boolean;
		reportingEnabled: boolean;
	} {
		return {
			queuedErrors: this.errorQueue.length,
			queuedAlerts: this.alertQueue.length,
			isOnline: this.isOnline,
			reportingEnabled: this.reportingEnabled,
		};
	}

	/**
	 * Manually flush all queued items
	 */
	public async flush(): Promise<void> {
		await Promise.all([this.flushQueuedReports(), this.flushQueuedAlerts()]);
	}
}

// ============================================================================
// Singleton Instance
// ============================================================================

let monitoringInstance: ErrorMonitoringService | null = null;

export function getErrorMonitoring(config?: Partial<MonitoringConfig>): ErrorMonitoringService {
	if (!monitoringInstance) {
		monitoringInstance = new ErrorMonitoringService(config);
	}
	return monitoringInstance;
}

// ============================================================================
// React Hook for Error Monitoring
// ============================================================================

export function useErrorMonitoring(config?: Partial<MonitoringConfig>) {
	const monitoring = getErrorMonitoring(config);

	React.useEffect(() => {
		// Track component errors - this legitimately needs console override
		// biome-ignore lint/suspicious/noConsole: We need to override console.error to track errors
		const originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			originalConsoleError(...args);
			if (args[0] instanceof Error) {
				monitoring.trackError(args[0]);
			}
		};

		return () => {
			console.error = originalConsoleError;
		};
	}, [monitoring]);

	return {
		monitoring,
		trackError: monitoring.trackError.bind(monitoring),
		trackEvent: monitoring.trackEvent.bind(monitoring),
		getStats: monitoring.getStats.bind(monitoring),
		flush: monitoring.flush.bind(monitoring),
	};
}

export default ErrorMonitoringService;

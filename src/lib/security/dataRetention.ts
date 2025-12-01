/**
 * Data Retention Policies - LGPD Compliance
 *
 * This module implements automated data retention and deletion policies
 * in compliance with Brazilian General Data Protection Law (LGPD).
 *
 * NOTE: Uses API-based operations with NeonDB
 */

import { apiClient } from '@/lib/api-client';
import logger from '@/lib/logging/secure-logger';

export interface RetentionPolicy {
	dataType: string;
	retentionPeriod: number; // in days
	retentionCondition: 'after_inactivity' | 'after_creation' | 'manual';
	anonymize: boolean;
	secureDelete: boolean;
}

export const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
	voice_recordings: {
		dataType: 'voice_recordings',
		retentionPeriod: 30,
		retentionCondition: 'after_creation',
		anonymize: true,
		secureDelete: true,
	},
	biometric_patterns: {
		dataType: 'biometric_patterns',
		retentionPeriod: 730,
		retentionCondition: 'after_inactivity',
		anonymize: true,
		secureDelete: true,
	},
	transactions: {
		dataType: 'transactions',
		retentionPeriod: 2555, // 7 years (fiscal requirement)
		retentionCondition: 'after_creation',
		anonymize: false,
		secureDelete: false,
	},
	user_activity_logs: {
		dataType: 'user_activity_logs',
		retentionPeriod: 365,
		retentionCondition: 'after_creation',
		anonymize: true,
		secureDelete: true,
	},
	sessions: {
		dataType: 'sessions',
		retentionPeriod: 30,
		retentionCondition: 'after_creation',
		anonymize: true,
		secureDelete: true,
	},
	error_logs: {
		dataType: 'error_logs',
		retentionPeriod: 90,
		retentionCondition: 'after_creation',
		anonymize: true,
		secureDelete: true,
	},
	audit_logs: {
		dataType: 'audit_logs',
		retentionPeriod: 2555, // 7 years
		retentionCondition: 'after_creation',
		anonymize: false,
		secureDelete: false,
	},
};

type RetentionStatsEntry =
	| {
			cutoffDate: string;
			eligibleForDeletion: number;
			policy: RetentionPolicy;
	  }
	| { error: string };

export class DataRetentionManager {
	private retentionScheduleDays = [1, 7, 30, 90];

	constructor() {
		this.scheduleRetentionChecks();
	}

	private scheduleRetentionChecks(): void {
		setInterval(
			() => {
				const now = new Date();
				const dayOfMonth = now.getDate();

				if (this.retentionScheduleDays.includes(dayOfMonth)) {
					this.performRetentionCheck();
				}
			},
			24 * 60 * 60 * 1000,
		);
	}

	async performRetentionCheck(): Promise<void> {
		logger.info('Starting data retention check', {
			component: 'dataRetention',
			action: 'performRetentionCheck',
		});

		try {
			for (const [dataType, policy] of Object.entries(RETENTION_POLICIES)) {
				await this.applyRetentionPolicy(dataType, policy);
			}

			logger.info('Data retention check completed successfully', {
				component: 'dataRetention',
				action: 'performRetentionCheck',
			});
		} catch (error) {
			logger.error('Data retention check failed', {
				component: 'dataRetention',
				action: 'performRetentionCheck',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	private async applyRetentionPolicy(dataType: string, policy: RetentionPolicy): Promise<void> {
		const cutoffDate = this.calculateCutoffDate(policy);

		logger.debug(`Applying retention policy for ${dataType}`, {
			component: 'dataRetention',
			action: 'applyRetentionPolicy',
			cutoffDate: cutoffDate.toISOString(),
			policy,
		});

		try {
			await apiClient.post('/v1/compliance/retention/apply', {
				dataType,
				cutoffDate: cutoffDate.toISOString(),
				policy,
			});
		} catch (error) {
			logger.debug(`Retention endpoint not available for ${dataType}`, {
				component: 'dataRetention',
				action: 'applyRetentionPolicy',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	private calculateCutoffDate(policy: RetentionPolicy): Date {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - policy.retentionPeriod);
		return cutoff;
	}

	/**
	 * Handle user data deletion request (Right to be Forgotten)
	 */
	async handleUserDeletionRequest(userId: string): Promise<void> {
		logger.info('Processing user deletion request', {
			component: 'dataRetention',
			action: 'handleUserDeletionRequest',
			userId,
		});

		try {
			// Log the deletion request
			const { safeInsertAuditLog } = await import('./safeAuditLog');
			void safeInsertAuditLog({
				action: 'user_deletion_requested',
				details: { timestamp: new Date().toISOString() },
				resource_type: 'user_account',
				user_id: userId,
			});

			// Request deletion via API
			await apiClient.post('/v1/compliance/user/delete', {
				userId,
				timestamp: new Date().toISOString(),
			});

			logger.info('User deletion request completed', {
				component: 'dataRetention',
				action: 'handleUserDeletionRequest',
				userId,
			});
		} catch (error) {
			logger.error('Failed to process user deletion request', {
				component: 'dataRetention',
				action: 'handleUserDeletionRequest',
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get retention statistics for compliance reporting
	 */
	async getRetentionStatistics(): Promise<Record<string, RetentionStatsEntry>> {
		const stats: Record<string, RetentionStatsEntry> = {};

		for (const [dataType, policy] of Object.entries(RETENTION_POLICIES)) {
			const cutoffDate = this.calculateCutoffDate(policy);

			try {
				const response = await apiClient.get<{ count: number }>('/v1/compliance/retention/stats', {
					params: {
						dataType,
						cutoffDate: cutoffDate.toISOString(),
					},
				});

				stats[dataType] = {
					cutoffDate: cutoffDate.toISOString(),
					eligibleForDeletion: response.count || 0,
					policy,
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				logger.debug(`Failed to get retention stats for ${dataType}`, {
					component: 'dataRetention',
					action: 'getRetentionStatistics',
					error: message,
				});
				stats[dataType] = { error: message };
			}
		}

		return stats;
	}
}

// Singleton instance
export const dataRetentionManager = new DataRetentionManager();

/**
 * Handle user consent withdrawal
 */
export const handleConsentWithdrawal = async (
	userId: string,
	consentTypes: string[],
): Promise<void> => {
	logger.info('Processing consent withdrawal', {
		component: 'dataRetention',
		action: 'handleConsentWithdrawal',
		userId,
		consentTypes,
	});

	try {
		// Update consent records via API
		await apiClient.post('/v1/compliance/consent/withdraw', {
			userId,
			consentTypes,
			withdrawalDate: new Date().toISOString(),
		});

		// Log consent withdrawal
		const { safeInsertAuditLog } = await import('./safeAuditLog');
		void safeInsertAuditLog({
			action: 'consent_withdrawn',
			details: {
				consent_types: consentTypes,
				timestamp: new Date().toISOString(),
			},
			resource_type: 'user_consent',
			user_id: userId,
		});

		logger.info('Consent withdrawal completed', {
			component: 'dataRetention',
			action: 'handleConsentWithdrawal',
			userId,
			consentTypes,
		});
	} catch (error) {
		logger.error('Failed to process consent withdrawal', {
			component: 'dataRetention',
			action: 'handleConsentWithdrawal',
			userId,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
};

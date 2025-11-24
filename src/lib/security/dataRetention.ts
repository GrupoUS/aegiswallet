/**
 * Data Retention Policies - LGPD Compliance
 *
 * This module implements automated data retention and deletion policies
 * in compliance with Brazilian General Data Protection Law (LGPD).
 */

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logging/secure-logger';
import type { Json } from '@/types/database.types';

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  retentionCondition: 'after_inactivity' | 'after_creation' | 'manual';
  anonymize: boolean;
  secureDelete: boolean;
}

export const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  // Voice and Audio Data
  voice_recordings: {
    dataType: 'voice_recordings',
    retentionPeriod: 30, // 30 days
    retentionCondition: 'after_creation',
    anonymize: true,
    secureDelete: true,
  },

  biometric_patterns: {
    dataType: 'biometric_patterns',
    retentionPeriod: 730, // 2 years
    retentionCondition: 'after_inactivity',
    anonymize: true,
    secureDelete: true,
  },

  // Transaction and Financial Data
  transactions: {
    dataType: 'transactions',
    retentionPeriod: 2555, // 7 years (fiscal requirement)
    retentionCondition: 'after_creation',
    anonymize: false,
    secureDelete: false,
  },

  // User Activity and Analytics
  user_activity_logs: {
    dataType: 'user_activity_logs',
    retentionPeriod: 365, // 1 year
    retentionCondition: 'after_creation',
    anonymize: true,
    secureDelete: true,
  },

  // Session Data
  sessions: {
    dataType: 'sessions',
    retentionPeriod: 30, // 30 days
    retentionCondition: 'after_creation',
    anonymize: true,
    secureDelete: true,
  },

  // Error Logs
  error_logs: {
    dataType: 'error_logs',
    retentionPeriod: 90, // 3 months
    retentionCondition: 'after_creation',
    anonymize: true,
    secureDelete: true,
  },

  // Audit Logs (keep longer for compliance)
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
  private retentionScheduleDays = [1, 7, 30, 90]; // Run on these days of month

  constructor() {
    this.scheduleRetentionChecks();
  }

  /**
   * Schedule automated retention checks
   */
  private scheduleRetentionChecks(): void {
    // Run daily check at 2 AM
    setInterval(
      () => {
        const now = new Date();
        const dayOfMonth = now.getDate();

        if (this.retentionScheduleDays.includes(dayOfMonth)) {
          this.performRetentionCheck();
        }
      },
      24 * 60 * 60 * 1000
    ); // Daily
  }

  /**
   * Perform comprehensive retention check
   */
  async performRetentionCheck(): Promise<void> {
    logger.info('Starting data retention check');

    try {
      for (const [dataType, policy] of Object.entries(RETENTION_POLICIES)) {
        await this.applyRetentionPolicy(dataType, policy);
      }

      logger.info('Data retention check completed successfully');
    } catch (error) {
      logger.error('Data retention check failed', { error });
    }
  }

  /**
   * Apply retention policy for specific data type
   */
  private async applyRetentionPolicy(dataType: string, policy: RetentionPolicy): Promise<void> {
    const cutoffDate = this.calculateCutoffDate(policy);

    logger.debug(`Applying retention policy for ${dataType}`, {
      cutoffDate: cutoffDate.toISOString(),
      policy,
    });

    switch (dataType) {
      case 'voice_recordings':
        await this.cleanupVoiceRecordings(cutoffDate, policy);
        break;

      case 'biometric_patterns':
        await this.cleanupBiometricPatterns(cutoffDate, policy);
        break;

      case 'transactions':
        await this.cleanupTransactions(cutoffDate, policy);
        break;

      case 'user_activity_logs':
        await this.cleanupUserActivityLogs(cutoffDate, policy);
        break;

      case 'sessions':
        await this.cleanupSessions(cutoffDate, policy);
        break;

      case 'error_logs':
        await this.cleanupErrorLogs(cutoffDate, policy);
        break;

      case 'audit_logs':
        // Audit logs are kept for compliance, no automatic cleanup
        break;

      default:
        logger.warn(`Unknown data type for retention: ${dataType}`);
    }
  }

  /**
   * Calculate cutoff date based on retention policy
   */
  private calculateCutoffDate(policy: RetentionPolicy): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - policy.retentionPeriod);
    return cutoff;
  }

  /**
   * Cleanup voice recordings older than retention period
   */
  private async cleanupVoiceRecordings(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    try {
      if (policy.anonymize) {
        const metadata: Json = {
          anonymization_date: new Date().toISOString(),
          anonymized: true,
        };
        // First anonymize user references
        const { error: anonymizeError } = await supabase
          .from('voice_recordings')
          .update({ metadata, transcription_anonymized: true })
          .lt('created_at', cutoffDate.toISOString());

        if (anonymizeError) {
          throw anonymizeError;
        }
      }

      if (policy.secureDelete) {
        // Delete old recordings
        const { error } = await supabase
          .from('voice_recordings')
          .delete()
          .lt('created_at', cutoffDate.toISOString());

        if (error) {
          throw error;
        }

        logger.info(`Cleaned up voice recordings older than ${cutoffDate.toISOString()}`);
      }
    } catch (error) {
      logger.error('Failed to cleanup voice recordings', { cutoffDate, error });
    }
  }

  /**
   * Cleanup biometric patterns for inactive users
   */
  private async cleanupBiometricPatterns(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    try {
      if (policy.retentionCondition === 'after_inactivity') {
        // Find users inactive since cutoff date
        const { data: inactiveUsers, error: userError } = await supabase
          .from('users')
          .select('id')
          .lt('last_activity', cutoffDate.toISOString());

        if (userError) {
          throw userError;
        }

        if (inactiveUsers && inactiveUsers.length > 0) {
          const userIds = inactiveUsers.map((user) => user.id);

          if (policy.anonymize) {
            // Anonymize biometric patterns
            const { error: anonymizeError } = await supabase
              .from('biometric_patterns')
              .update({ pattern_hash: null })
              .in('user_id', userIds);

            if (anonymizeError) {
              throw anonymizeError;
            }
          }

          if (policy.secureDelete) {
            // Delete biometric patterns
            const { error } = await supabase
              .from('biometric_patterns')
              .delete()
              .in('user_id', userIds);

            if (error) {
              throw error;
            }
          }

          logger.info(`Cleaned up biometric patterns for ${inactiveUsers.length} inactive users`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup biometric patterns', { cutoffDate, error });
    }
  }

  /**
   * Handle user data deletion request (Right to be Forgotten)
   */
  async handleUserDeletionRequest(userId: string): Promise<void> {
    logger.info(`Processing user deletion request`, { userId });

    try {
      // Log the deletion request
      await supabase.from('audit_logs').insert({
        action: 'user_deletion_requested',
        details: { timestamp: new Date().toISOString() },
        resource_type: 'user_account',
        user_id: userId,
      });

      // Anonymize or delete user data according to policies
      for (const [dataType, policy] of Object.entries(RETENTION_POLICIES)) {
        await this.anonymizeUserData(userId, dataType, policy);
      }

      // Delete user account if allowed by policy
      const userPolicy = RETENTION_POLICIES.transactions; // Use longest retention period
      const userCutoffDate = this.calculateCutoffDate(userPolicy);

      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (userData?.created_at && new Date(userData.created_at) < userCutoffDate) {
        // Can delete entire user account
        await supabase.auth.admin.deleteUser(userId);

        await supabase.from('audit_logs').insert({
          action: 'user_account_deleted',
          details: { timestamp: new Date().toISOString() },
          resource_type: 'user_account',
          user_id: userId,
        });
      }

      logger.info(`User deletion request completed`, { userId });
    } catch (error) {
      logger.error('Failed to process user deletion request', { error, userId });
      throw error;
    }
  }

  /**
   * Anonymize user data for specific type
   */
  private async anonymizeUserData(
    userId: string,
    dataType: string,
    policy: RetentionPolicy
  ): Promise<void> {
    if (!policy.anonymize) {
      return;
    }

    try {
      switch (dataType) {
        case 'voice_recordings': {
          const metadata: Json = {
            anonymization_date: new Date().toISOString(),
            anonymized: true,
          };
          await supabase
            .from('voice_recordings')
            .update({
              metadata,
              transcription_anonymized: true,
            })
            .eq('user_id', userId);
          break;
        }

        case 'biometric_patterns':
          await supabase
            .from('biometric_patterns')
            .update({
              pattern_hash: null,
            })
            .eq('user_id', userId);
          break;

        case 'transactions':
        case 'user_activity_logs':
        case 'sessions':
        case 'error_logs':
        case 'audit_logs':
          // These data types are handled via dedicated cleanup routines or compliance storage.
          break;
      }
    } catch (error) {
      logger.error(`Failed to anonymize user data for ${dataType}`, { error, userId });
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
        let count = 0;

        switch (dataType) {
          case 'voice_recordings': {
            const { count: voiceCount } = await supabase
              .from('voice_recordings')
              .select('*', { count: 'exact', head: true })
              .lt('created_at', cutoffDate.toISOString());
            count = voiceCount || 0;
            break;
          }

          case 'sessions': {
            const { count: sessionCount } = await supabase
              .from('user_sessions')
              .select('*', { count: 'exact', head: true })
              .lt('created_at', cutoffDate.toISOString());
            count = sessionCount || 0;
            break;
          }
        }

        stats[dataType] = {
          cutoffDate: cutoffDate.toISOString(),
          eligibleForDeletion: count,
          policy,
        };
      } catch (error) {
        const message = this.extractErrorMessage(error);
        logger.error(`Failed to get retention stats for ${dataType}`, { error });
        stats[dataType] = { error: message };
      }
    }

    return stats;
  }

  private async cleanupTransactions(_cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    // Financial records are retained for fiscal compliance; log for visibility.
    logger.debug('Transactions retention policy is compliance-only; no automatic cleanup executed', {
      policy,
    });
  }

  private async cleanupUserActivityLogs(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    if (!policy.secureDelete) {
      return;
    }
    try {
      const { error } = await supabase
        .from('user_activity')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      if (error) {
        throw error;
      }
      logger.info(`Cleaned up user activity logs older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      logger.error('Failed to cleanup user activity logs', { cutoffDate, error });
    }
  }

  private async cleanupSessions(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    if (!policy.secureDelete) {
      return;
    }
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      if (error) {
        throw error;
      }
      logger.info(`Cleaned up sessions older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      logger.error('Failed to cleanup sessions', { cutoffDate, error });
    }
  }

  private async cleanupErrorLogs(_cutoffDate: Date, _policy: RetentionPolicy): Promise<void> {
    // Error logs live outside Supabase tables in this project; document manual cleanup.
    logger.debug('No error log storage configured in Supabase; skipping cleanup step.');
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
}

// Singleton instance
export const dataRetentionManager = new DataRetentionManager();

/**
 * Handle user consent withdrawal
 */
export const handleConsentWithdrawal = async (
  userId: string,
  consentTypes: string[]
): Promise<void> => {
  logger.info(`Processing consent withdrawal`, { consentTypes, userId });

  try {
    // Update consent records
    for (const consentType of consentTypes) {
      await supabase.from('user_consent').upsert({
        consent_date: new Date().toISOString(),
        consent_type: consentType,
        consent_version: '1.0.0',
        granted: false,
        user_id: userId,
        withdrawal_date: new Date().toISOString(),
      });
    }

    // Log consent withdrawal
    await supabase.from('audit_logs').insert({
      action: 'consent_withdrawn',
      details: {
        consent_types: consentTypes,
        timestamp: new Date().toISOString(),
      },
      resource_type: 'user_consent',
      user_id: userId,
    });

    // If biometric consent withdrawn, immediately delete biometric data
    if (consentTypes.includes('biometric_data')) {
      await supabase.from('biometric_patterns').delete().eq('user_id', userId);
    }

    logger.info(`Consent withdrawal completed`, { consentTypes, userId });
  } catch (error) {
    logger.error('Failed to process consent withdrawal', { error, userId });
    throw error;
  }
};

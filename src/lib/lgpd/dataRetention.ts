import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import type { Json } from '@/integrations/supabase/types';

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: string;
  retentionMonths: number;
  autoDelete: boolean;
  legalHold: boolean;
  deletionMethod: 'hard_delete' | 'anonymization';
}

export interface DataSubjectRequest {
  userId: string;
  requestType: 'access' | 'correction' | 'deletion' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestData?: Record<string, unknown>;
  response?: Record<string, unknown>;
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
}

export class LGPDDataRetentionManager {
  private readonly RETENTION_POLICIES: RetentionPolicy[] = [
    {
      autoDelete: true,
      dataType: 'voice_recordings',
      deletionMethod: 'hard_delete',
      legalHold: false,
      retentionMonths: 1,
      retentionPeriod: '30 dias',
    },
    {
      autoDelete: true,
      dataType: 'biometric_patterns',
      deletionMethod: 'hard_delete',
      legalHold: false,
      retentionMonths: 24,
      retentionPeriod: '2 anos após inatividade',
    },
    {
      autoDelete: false,
      dataType: 'transaction_data',
      deletionMethod: 'anonymization',
      legalHold: true,
      retentionMonths: 60,
      retentionPeriod: '5 anos (obrigação legal)',
    },
    {
      autoDelete: true,
      dataType: 'consent_records',
      deletionMethod: 'hard_delete',
      legalHold: false,
      retentionMonths: 24,
      retentionPeriod: '2 anos após revogação',
    },
    {
      autoDelete: true,
      dataType: 'audit_logs',
      deletionMethod: 'hard_delete',
      legalHold: false,
      retentionMonths: 12,
      retentionPeriod: '1 ano',
    },
    {
      autoDelete: true,
      dataType: 'user_preferences',
      deletionMethod: 'hard_delete',
      legalHold: false,
      retentionMonths: 24,
      retentionPeriod: '2 anos após inatividade',
    },
    {
      autoDelete: true,
      dataType: 'analytics_data',
      deletionMethod: 'anonymization',
      legalHold: false,
      retentionMonths: 13,
      retentionPeriod: '13 meses',
    },
  ];

  /**
   * Check if data is eligible for deletion based on retention policies
   */
  async checkRetentionEligibility(userId: string): Promise<
    {
      dataType: string;
      eligible: boolean;
      lastActivity: Date;
      policy: RetentionPolicy;
    }[]
  > {
    try {
      const results = [];

      for (const policy of this.RETENTION_POLICIES) {
        const lastActivity = await this.getLastActivityDate(userId, policy.dataType);
        const eligible = this.isDataEligibleForDeletion(lastActivity, policy);

        results.push({
          dataType: policy.dataType,
          eligible,
          lastActivity,
          policy,
        });
      }

      return results;
    } catch (error) {
      logger.error('Error checking retention eligibility:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Process data deletion based on retention policies
   */
  async processRetentionPolicy(userId: string): Promise<void> {
    try {
      logger.info('Starting retention policy processing for user:', { userId });

      const eligibleData = await this.checkRetentionEligibility(userId);

      for (const { dataType, eligible, policy } of eligibleData) {
        if (eligible && policy.autoDelete && !policy.legalHold) {
          await this.deleteDataByType(userId, dataType, policy);

          // Log the deletion for audit purposes
          const { safeInsertAuditLog } = await import('../security/safeAuditLog');
          void safeInsertAuditLog({
            action: 'automatic_data_deletion',
            details: {
              data_type: dataType,
              deletion_method: policy.deletionMethod,
              policy: policy.retentionPeriod,
              timestamp: new Date().toISOString(),
            },
            resource_type: 'data_retention',
            user_id: userId,
          });

          logger.info(`Automatically deleted ${dataType} for user ${userId}`, {
            resource_type: 'data_retention',
            user_id: userId,
          });
        }
      }

      logger.info('Retention policy processing completed for user:', { userId });
    } catch (error) {
      logger.error('Error processing retention policy:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Handle data subject request (LGPD rights exercise)
   */
  async createDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType'],
    requestData?: Record<string, unknown>
  ): Promise<string> {
    try {
      const requestId = crypto.randomUUID();

      const _request: Partial<DataSubjectRequest> = {
        createdAt: new Date(),
        requestData,
        requestType,
        status: 'pending',
        userId,
      };

      await supabase.from('data_subject_requests').insert({
        created_at: new Date().toISOString(),
        id: requestId,
        request_data: (requestData ?? null) as Json,
        request_type: requestType,
        status: 'pending',
        user_id: userId,
      });

      // Log the request for audit
      const { safeInsertAuditLog } = await import('../security/safeAuditLog');
      void safeInsertAuditLog({
        action: 'data_subject_request_created',
        details: {
          request_id: requestId,
          request_type: requestType,
          timestamp: new Date().toISOString(),
        },
        resource_type: 'lgpd_rights',
        user_id: userId,
      });

      logger.info(`Data subject request created: ${requestId} for user ${userId}`, {
        request_id: requestId,
        resource_type: 'lgpd_rights',
        user_id: userId,
      });
      return requestId;
    } catch (error) {
      logger.error('Error creating data subject request:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Process data deletion request (right to be forgotten)
   */
  async processDeletionRequest(userId: string, requestId: string): Promise<void> {
    try {
      logger.info(`Processing deletion request ${requestId} for user ${userId}`, {
        request_id: requestId,
        resource_type: 'lgpd_rights',
        user_id: userId,
      });

      // Update request status
      await supabase
        .from('data_subject_requests')
        .update({
          processed_at: new Date().toISOString(),
          status: 'processing',
        })
        .eq('id', requestId);

      // Process deletion for all data types
      for (const policy of this.RETENTION_POLICIES) {
        if (!policy.legalHold) {
          await this.deleteDataByType(userId, policy.dataType, policy);
        }
      }

      // Mark user account as deleted/anonymized
      await supabase
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          deletion_reason: 'lgpd_request',
          email: `deleted_${Date.now()}@deleted.com`,
          full_name: 'DELETED',
        })
        .eq('id', userId);

      // Update request status to completed
      await supabase
        .from('data_subject_requests')
        .update({
          response: {
            data_types_deleted: this.RETENTION_POLICIES.map((p) => p.dataType),
            deleted_at: new Date().toISOString(),
          },
          status: 'completed',
        })
        .eq('id', requestId);

      // Final audit log
      const { safeInsertAuditLog } = await import('../security/safeAuditLog');
      void safeInsertAuditLog({
        action: 'data_deletion_completed',
        details: {
          completed_at: new Date().toISOString(),
          data_types_deleted: this.RETENTION_POLICIES.map((p) => p.dataType),
          request_id: requestId,
        },
        resource_type: 'lgpd_rights',
        user_id: userId,
      });

      logger.info(`Deletion request ${requestId} completed for user ${userId}`);
    } catch (error) {
      logger.error('Error processing data deletion request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
        resource_type: 'lgpd_rights',
        user_id: userId,
      });

      // Update request status to failed
      await supabase
        .from('data_subject_requests')
        .update({
          notes: error instanceof Error ? error.message : 'Unknown error',
          status: 'rejected',
        })
        .eq('id', requestId);

      throw error;
    }
  }

  /**
   * Get user's data for access request
   */
  async getUserData(userId: string): Promise<Record<string, unknown>> {
    try {
      const userData = {
        profile: await supabase.from('users').select('*').eq('id', userId).single(),

        consents: await supabase.from('user_consent').select('*').eq('user_id', userId),

        transactions: await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .limit(100), // Limit for practical purposes

        auditLogs: await supabase.from('audit_logs').select('*').eq('user_id', userId).limit(50), // Limit for practical purposes

        preferences: await supabase.from('user_preferences').select('*').eq('user_id', userId),
      };

      return userData;
    } catch (error) {
      logger.error('Error retrieving user data:', { error: String(error) });
      throw error;
    }
  }

  private async getLastActivityDate(userId: string, dataType: string): Promise<Date> {
    // Implementation depends on how you track activity for each data type
    // This is a simplified version
    const { data } = await supabase
      .from('user_activity')
      .select('last_activity')
      .eq('user_id', userId)
      .eq('activity_type', dataType)
      .single();

    return data?.last_activity ? new Date(data.last_activity) : new Date();
  }

  private isDataEligibleForDeletion(lastActivity: Date, policy: RetentionPolicy): boolean {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - policy.retentionMonths);

    return lastActivity < cutoffDate;
  }

  private async deleteDataByType(
    userId: string,
    dataType: string,
    policy: RetentionPolicy
  ): Promise<void> {
    try {
      switch (dataType) {
        case 'voice_recordings':
          await supabase.from('voice_recordings').delete().eq('user_id', userId);
          break;

        case 'biometric_patterns':
          if (policy.deletionMethod === 'anonymization') {
            await supabase
              .from('biometric_patterns')
              .update({
                anonymized_at: new Date().toISOString(),
                pattern_data: null,
              })
              .eq('user_id', userId);
          } else {
            await supabase.from('biometric_patterns').delete().eq('user_id', userId);
          }
          break;

        case 'transaction_data':
          if (policy.deletionMethod === 'anonymization') {
            await supabase
              .from('transactions')
              .update({
                anonymized_at: new Date().toISOString(),
                description: 'ANONYMIZED',
                notes: 'Data anonymized per retention policy',
              })
              .eq('user_id', userId);
          }
          break;

        // Add more data types as needed
        default:
          logger.warn(`Unknown data type for deletion: ${dataType}`);
      }
    } catch (error) {
      logger.error(`Error deleting ${dataType} for user ${userId}:`, { error: String(error) });
      throw error;
    }
  }

  /**
   * Get retention policy information for user display
   */
  getRetentionPolicyInfo(): RetentionPolicy[] {
    return this.RETENTION_POLICIES;
  }

  /**
   * Check if user has any active legal holds on their data
   */
  async checkLegalHolds(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('legal_holds')
        .select('id')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      return !!data;
    } catch (error) {
      logger.error('Error checking legal holds:', { error: String(error) });
      return false;
    }
  }
}

// Export singleton instance
export const lgpdRetentionManager = new LGPDDataRetentionManager();

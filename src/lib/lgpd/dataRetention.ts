import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

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
  requestData?: any;
  response?: any;
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
}

export class LGPDDataRetentionManager {
  private readonly RETENTION_POLICIES: RetentionPolicy[] = [
    {
      dataType: 'voice_recordings',
      retentionPeriod: '30 dias',
      retentionMonths: 1,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'hard_delete',
    },
    {
      dataType: 'biometric_patterns',
      retentionPeriod: '2 anos após inatividade',
      retentionMonths: 24,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'hard_delete',
    },
    {
      dataType: 'transaction_data',
      retentionPeriod: '5 anos (obrigação legal)',
      retentionMonths: 60,
      autoDelete: false,
      legalHold: true,
      deletionMethod: 'anonymization',
    },
    {
      dataType: 'consent_records',
      retentionPeriod: '2 anos após revogação',
      retentionMonths: 24,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'hard_delete',
    },
    {
      dataType: 'audit_logs',
      retentionPeriod: '1 ano',
      retentionMonths: 12,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'hard_delete',
    },
    {
      dataType: 'user_preferences',
      retentionPeriod: '2 anos após inatividade',
      retentionMonths: 24,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'hard_delete',
    },
    {
      dataType: 'analytics_data',
      retentionPeriod: '13 meses',
      retentionMonths: 13,
      autoDelete: true,
      legalHold: false,
      deletionMethod: 'anonymization',
    },
  ];

  /**
   * Check if data is eligible for deletion based on retention policies
   */
  async checkRetentionEligibility(userId: string): Promise<
    Array<{
      dataType: string;
      eligible: boolean;
      lastActivity: Date;
      policy: RetentionPolicy;
    }>
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
      logger.error('Error checking retention eligibility:', error);
      throw error;
    }
  }

  /**
   * Process data deletion based on retention policies
   */
  async processRetentionPolicy(userId: string): Promise<void> {
    try {
      logger.info('Starting retention policy processing for user:', userId);

      const eligibleData = await this.checkRetentionEligibility(userId);

      for (const { dataType, eligible, policy } of eligibleData) {
        if (eligible && policy.autoDelete && !policy.legalHold) {
          await this.deleteDataByType(userId, dataType, policy);

          // Log the deletion for audit purposes
          await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'automatic_data_deletion',
            resource_type: 'data_retention',
            details: {
              data_type: dataType,
              policy: policy.retentionPeriod,
              deletion_method: policy.deletionMethod,
              timestamp: new Date().toISOString(),
            },
          });

          logger.info(`Automatically deleted ${dataType} for user ${userId}`);
        }
      }

      logger.info('Retention policy processing completed for user:', userId);
    } catch (error) {
      logger.error('Error processing retention policy:', error);
      throw error;
    }
  }

  /**
   * Handle data subject request (LGPD rights exercise)
   */
  async createDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType'],
    requestData?: any
  ): Promise<string> {
    try {
      const requestId = crypto.randomUUID();

      const _request: Partial<DataSubjectRequest> = {
        userId,
        requestType,
        status: 'pending',
        requestData,
        createdAt: new Date(),
      };

      await supabase.from('data_subject_requests').insert({
        id: requestId,
        user_id: userId,
        request_type: requestType,
        status: 'pending',
        request_data: requestData,
        created_at: new Date().toISOString(),
      });

      // Log the request for audit
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'data_subject_request_created',
        resource_type: 'lgpd_rights',
        details: {
          request_id: requestId,
          request_type: requestType,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Data subject request created: ${requestId} for user ${userId}`);
      return requestId;
    } catch (error) {
      logger.error('Error creating data subject request:', error);
      throw error;
    }
  }

  /**
   * Process data deletion request (right to be forgotten)
   */
  async processDeletionRequest(userId: string, requestId: string): Promise<void> {
    try {
      logger.info(`Processing deletion request ${requestId} for user ${userId}`);

      // Update request status
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString(),
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
          email: `deleted_${Date.now()}@deleted.com`,
          full_name: 'DELETED',
          deleted_at: new Date().toISOString(),
          deletion_reason: 'lgpd_request',
        })
        .eq('id', userId);

      // Update request status to completed
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          response: {
            deleted_at: new Date().toISOString(),
            data_types_deleted: this.RETENTION_POLICIES.map((p) => p.dataType),
          },
        })
        .eq('id', requestId);

      // Final audit log
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'data_deletion_completed',
        resource_type: 'lgpd_rights',
        details: {
          request_id: requestId,
          completed_at: new Date().toISOString(),
          data_types_deleted: this.RETENTION_POLICIES.map((p) => p.dataType),
        },
      });

      logger.info(`Deletion request ${requestId} completed for user ${userId}`);
    } catch (error) {
      logger.error('Error processing deletion request:', error);

      // Update request status to failed
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'rejected',
          notes: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', requestId);

      throw error;
    }
  }

  /**
   * Get user's data for access request
   */
  async getUserData(userId: string): Promise<any> {
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
      logger.error('Error retrieving user data:', error);
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
                pattern_data: null,
                anonymized_at: new Date().toISOString(),
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
                description: 'ANONYMIZED',
                notes: 'Data anonymized per retention policy',
                anonymized_at: new Date().toISOString(),
              })
              .eq('user_id', userId);
          }
          break;

        // Add more data types as needed
        default:
          logger.warn(`Unknown data type for deletion: ${dataType}`);
      }
    } catch (error) {
      logger.error(`Error deleting ${dataType} for user ${userId}:`, error);
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
      logger.error('Error checking legal holds:', error);
      return false;
    }
  }
}

// Export singleton instance
export const lgpdRetentionManager = new LGPDDataRetentionManager();

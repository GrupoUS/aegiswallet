export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_consent: {
        Row: {
          id: string;
          user_id: string;
          consent_type:
            | 'voice_data_processing'
            | 'biometric_data'
            | 'audio_recording'
            | 'data_retention'
            | 'marketing_communications'
            | 'analytics_data'
            | 'third_party_sharing';
          granted: boolean;
          consent_version: string;
          consent_date: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['user_consent']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['user_consent']['Row'], 'id' | 'created_at'>
        >;
      };
      voice_feedback: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          command_text: string;
          recognized_text: string | null;
          confidence_score: number | null;
          rating: number | null;
          feedback_text: string | null;
          feedback_type: 'accuracy' | 'speed' | 'clarity' | 'language' | 'general' | null;
          audio_file_path: string | null;
          transcription_id: string | null;
          was_correct: boolean | null;
          correction_made: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['voice_feedback']['Row'], 'id' | 'created_at'>;
        Update: Partial<
          Omit<Database['public']['Tables']['voice_feedback']['Row'], 'id' | 'created_at'>
        >;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          action:
            | 'login'
            | 'logout'
            | 'login_failed'
            | 'voice_command_processed'
            | 'voice_command_failed'
            | 'transaction_created'
            | 'transaction_updated'
            | 'transaction_deleted'
            | 'consent_granted'
            | 'consent_revoked'
            | 'consent_updated'
            | 'data_exported'
            | 'data_accessed'
            | 'data_deleted'
            | 'data_modified'
            | 'account_created'
            | 'account_updated'
            | 'account_deleted'
            | 'security_event'
            | 'admin_action'
            | 'lgpd_request_created'
            | 'lgpd_request_processed'
            | 'automatic_data_deletion'
            | 'manual_data_deletion'
            | 'settings_updated'
            | 'preferences_updated';
          resource_type: string | null;
          resource_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          success: boolean;
          error_message: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<
          Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        >;
      };
      data_subject_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: 'access' | 'correction' | 'deletion' | 'portability' | 'restriction';
          status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
          request_data: Json | null;
          response: Json | null;
          notes: string | null;
          processed_by: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['data_subject_requests']['Row'],
          'id' | 'created_at' | 'processed_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['data_subject_requests']['Row'], 'id' | 'created_at'>
        >;
      };
      legal_holds: {
        Row: {
          id: string;
          user_id: string;
          hold_type: string;
          reason: string;
          case_reference: string | null;
          active: boolean;
          placed_by: string | null;
          created_at: string;
          expires_at: string | null;
          released_at: string | null;
          released_by: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['legal_holds']['Row'],
          'id' | 'created_at' | 'released_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['legal_holds']['Row'], 'id' | 'created_at'>
        >;
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type:
            | 'voice_recording'
            | 'biometric_authentication'
            | 'transaction_activity'
            | 'login_activity'
            | 'data_access'
            | 'consent_activity';
          activity_data: Json | null;
          last_activity: string;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['user_activity']['Row'],
          'id' | 'created_at' | 'last_activity'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['user_activity']['Row'], 'id' | 'created_at'>
        >;
      };
      voice_recordings: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          file_path: string;
          file_size: number | null;
          duration_ms: number | null;
          format: string;
          sample_rate: number | null;
          channels: number | null;
          transcription_id: string | null;
          processed: boolean;
          retention_expires_at: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['voice_recordings']['Row'],
          'id' | 'created_at' | 'deleted_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['voice_recordings']['Row'], 'id' | 'created_at'>
        >;
      };
      biometric_patterns: {
        Row: {
          id: string;
          user_id: string;
          pattern_data: Json;
          model_version: string | null;
          confidence_threshold: number;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          anonymized_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['biometric_patterns']['Row'],
          'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'anonymized_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['biometric_patterns']['Row'], 'id' | 'created_at'>
        >;
      };
      // Existing tables (based on current codebase)
      transactions: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['transactions']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        >;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          subscription_tier: string | null;
          recent_activity_score: number | null;
          deleted_at: string | null;
          deletion_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['users']['Row'],
          'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deletion_reason'
        >;
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Supabase client types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

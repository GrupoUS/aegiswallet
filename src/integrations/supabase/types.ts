export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      ai_insights: {
        Row: {
          action_suggested: string | null;
          action_url: string | null;
          amount: number | null;
          category: string | null;
          comparison_period: string | null;
          confidence_score: number | null;
          created_at: string | null;
          description: string;
          dismissed_at: string | null;
          expires_at: string | null;
          id: string;
          insight_type: string;
          is_dismissed: boolean | null;
          is_read: boolean | null;
          metadata: Json | null;
          model_version: string | null;
          percentage_change: number | null;
          read_at: string | null;
          related_entities: Json | null;
          severity: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          action_suggested?: string | null;
          action_url?: string | null;
          amount?: number | null;
          category?: string | null;
          comparison_period?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          description: string;
          dismissed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          insight_type: string;
          is_dismissed?: boolean | null;
          is_read?: boolean | null;
          metadata?: Json | null;
          model_version?: string | null;
          percentage_change?: number | null;
          read_at?: string | null;
          related_entities?: Json | null;
          severity?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          action_suggested?: string | null;
          action_url?: string | null;
          amount?: number | null;
          category?: string | null;
          comparison_period?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          description?: string;
          dismissed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          insight_type?: string;
          is_dismissed?: boolean | null;
          is_read?: boolean | null;
          metadata?: Json | null;
          model_version?: string | null;
          percentage_change?: number | null;
          read_at?: string | null;
          related_entities?: Json | null;
          severity?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          error_message: string | null;
          id: string;
          ip_address: unknown;
          new_values: Json | null;
          old_values: Json | null;
          resource_id: string | null;
          resource_type: string | null;
          session_id: string | null;
          success: boolean | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          new_values?: Json | null;
          old_values?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          session_id?: string | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          new_values?: Json | null;
          old_values?: Json | null;
          resource_id?: string | null;
          resource_type?: string | null;
          session_id?: string | null;
          success?: boolean | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      auth_attempts: {
        Row: {
          created_at: string | null;
          failed_attempts: number | null;
          id: string;
          is_locked: boolean | null;
          last_attempt_at: string | null;
          lockout_until: string | null;
          method: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          failed_attempts?: number | null;
          id?: string;
          is_locked?: boolean | null;
          last_attempt_at?: string | null;
          lockout_until?: string | null;
          method: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          failed_attempts?: number | null;
          id?: string;
          is_locked?: boolean | null;
          last_attempt_at?: string | null;
          lockout_until?: string | null;
          method?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      auth_sessions: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_activity: string | null;
          method: string;
          session_token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_activity?: string | null;
          method: string;
          session_token: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_activity?: string | null;
          method?: string;
          session_token?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          account_holder_name: string | null;
          account_mask: string;
          account_number: string | null;
          account_type: string;
          available_balance: number | null;
          balance: number | null;
          belvo_account_id: string;
          created_at: string | null;
          currency: string | null;
          id: string;
          institution_id: string;
          institution_name: string;
          is_active: boolean | null;
          is_primary: boolean | null;
          last_sync: string | null;
          sync_error_message: string | null;
          sync_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          account_holder_name?: string | null;
          account_mask: string;
          account_number?: string | null;
          account_type: string;
          available_balance?: number | null;
          balance?: number | null;
          belvo_account_id: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          institution_id: string;
          institution_name: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          last_sync?: string | null;
          sync_error_message?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          account_holder_name?: string | null;
          account_mask?: string;
          account_number?: string | null;
          account_type?: string;
          available_balance?: number | null;
          balance?: number | null;
          belvo_account_id?: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          institution_id?: string;
          institution_name?: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          last_sync?: string | null;
          sync_error_message?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_audit_logs: {
        Row: {
          connection_id: string | null;
          created_at: string | null;
          digital_signature: string;
          error_code: string | null;
          error_message: string | null;
          event_type: string;
          id: string;
          institution_code: string | null;
          ip_address: unknown;
          metadata: Json | null;
          retention_until: string | null;
          status: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          connection_id?: string | null;
          created_at?: string | null;
          digital_signature: string;
          error_code?: string | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          institution_code?: string | null;
          ip_address?: unknown;
          metadata?: Json | null;
          retention_until?: string | null;
          status?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          connection_id?: string | null;
          created_at?: string | null;
          digital_signature?: string;
          error_code?: string | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          institution_code?: string | null;
          ip_address?: unknown;
          metadata?: Json | null;
          retention_until?: string | null;
          status?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_audit_logs_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: false;
            referencedRelation: 'bank_connections';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_connections: {
        Row: {
          belvo_link_id: string | null;
          connected_at: string | null;
          created_at: string | null;
          error_code: string | null;
          error_count: number | null;
          error_message: string | null;
          id: string;
          institution_code: string;
          institution_name: string;
          last_error_at: string | null;
          last_sync_at: string | null;
          metadata: Json | null;
          next_sync_at: string | null;
          status: string;
          sync_frequency_hours: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          belvo_link_id?: string | null;
          connected_at?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_count?: number | null;
          error_message?: string | null;
          id?: string;
          institution_code: string;
          institution_name: string;
          last_error_at?: string | null;
          last_sync_at?: string | null;
          metadata?: Json | null;
          next_sync_at?: string | null;
          status?: string;
          sync_frequency_hours?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          belvo_link_id?: string | null;
          connected_at?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_count?: number | null;
          error_message?: string | null;
          id?: string;
          institution_code?: string;
          institution_name?: string;
          last_error_at?: string | null;
          last_sync_at?: string | null;
          metadata?: Json | null;
          next_sync_at?: string | null;
          status?: string;
          sync_frequency_hours?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      bank_consent: {
        Row: {
          connection_id: string | null;
          consent_id: string | null;
          created_at: string | null;
          expires_at: string;
          granted_at: string | null;
          id: string;
          metadata: Json | null;
          notification_sent_at: string | null;
          reminder_sent_at: string | null;
          renewed_at: string | null;
          revoked_at: string | null;
          scopes: string[];
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          connection_id?: string | null;
          consent_id?: string | null;
          created_at?: string | null;
          expires_at: string;
          granted_at?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_sent_at?: string | null;
          reminder_sent_at?: string | null;
          renewed_at?: string | null;
          revoked_at?: string | null;
          scopes: string[];
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          connection_id?: string | null;
          consent_id?: string | null;
          created_at?: string | null;
          expires_at?: string;
          granted_at?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_sent_at?: string | null;
          reminder_sent_at?: string | null;
          renewed_at?: string | null;
          revoked_at?: string | null;
          scopes?: string[];
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_consent_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: false;
            referencedRelation: 'bank_connections';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_tokens: {
        Row: {
          connection_id: string | null;
          created_at: string | null;
          encrypted_access_token: string;
          encrypted_refresh_token: string | null;
          encryption_algorithm: string;
          encryption_iv: string;
          expires_at: string | null;
          id: string;
          refresh_expires_at: string | null;
          scopes: string[] | null;
          token_type: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          connection_id?: string | null;
          created_at?: string | null;
          encrypted_access_token: string;
          encrypted_refresh_token?: string | null;
          encryption_algorithm?: string;
          encryption_iv: string;
          expires_at?: string | null;
          id?: string;
          refresh_expires_at?: string | null;
          scopes?: string[] | null;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          connection_id?: string | null;
          created_at?: string | null;
          encrypted_access_token?: string;
          encrypted_refresh_token?: string | null;
          encryption_algorithm?: string;
          encryption_iv?: string;
          expires_at?: string | null;
          id?: string;
          refresh_expires_at?: string | null;
          scopes?: string[] | null;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_tokens_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: false;
            referencedRelation: 'bank_connections';
            referencedColumns: ['id'];
          },
        ];
      };
      biometric_credentials: {
        Row: {
          created_at: string | null;
          credential_id: string;
          credential_type: string;
          id: string;
          public_key: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          credential_id: string;
          credential_type?: string;
          id?: string;
          public_key?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          credential_id?: string;
          credential_type?: string;
          id?: string;
          public_key?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      biometric_patterns: {
        Row: {
          anonymized_at: string | null;
          confidence_threshold: number | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          is_active: boolean | null;
          last_used_at: string | null;
          model_version: string | null;
          pattern_data: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          anonymized_at?: string | null;
          confidence_threshold?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          model_version?: string | null;
          pattern_data: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          anonymized_at?: string | null;
          confidence_threshold?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          model_version?: string | null;
          pattern_data?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      boletos: {
        Row: {
          amount: number;
          barcode: string;
          capture_method: string | null;
          created_at: string | null;
          digitable_line: string | null;
          discount_amount: number | null;
          due_date: string;
          fine_amount: number | null;
          id: string;
          interest_amount: number | null;
          metadata: Json | null;
          paid_at: string | null;
          payee_document: string | null;
          payee_name: string;
          payment_confirmation: string | null;
          scheduled_payment_id: string | null;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          barcode: string;
          capture_method?: string | null;
          created_at?: string | null;
          digitable_line?: string | null;
          discount_amount?: number | null;
          due_date: string;
          fine_amount?: number | null;
          id?: string;
          interest_amount?: number | null;
          metadata?: Json | null;
          paid_at?: string | null;
          payee_document?: string | null;
          payee_name: string;
          payment_confirmation?: string | null;
          scheduled_payment_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          barcode?: string;
          capture_method?: string | null;
          created_at?: string | null;
          digitable_line?: string | null;
          discount_amount?: number | null;
          due_date?: string;
          fine_amount?: number | null;
          id?: string;
          interest_amount?: number | null;
          metadata?: Json | null;
          paid_at?: string | null;
          payee_document?: string | null;
          payee_name?: string;
          payment_confirmation?: string | null;
          scheduled_payment_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'boletos_scheduled_payment_id_fkey';
            columns: ['scheduled_payment_id'];
            isOneToOne: false;
            referencedRelation: 'scheduled_payments';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_categories: {
        Row: {
          alert_sent: boolean | null;
          alert_threshold: number | null;
          budget_amount: number;
          budget_period: string;
          category_id: string | null;
          color: string | null;
          created_at: string | null;
          current_spent: number | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          name: string;
          period_end: string | null;
          period_start: string;
          rollover_amount: number | null;
          rollover_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          alert_sent?: boolean | null;
          alert_threshold?: number | null;
          budget_amount: number;
          budget_period: string;
          category_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          current_spent?: number | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          name: string;
          period_end?: string | null;
          period_start: string;
          rollover_amount?: number | null;
          rollover_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          alert_sent?: boolean | null;
          alert_threshold?: number | null;
          budget_amount?: number;
          budget_period?: string;
          category_id?: string | null;
          color?: string | null;
          created_at?: string | null;
          current_spent?: number | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          name?: string;
          period_end?: string | null;
          period_start?: string;
          rollover_amount?: number | null;
          rollover_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'financial_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_sync_audit: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          event_id: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          event_id?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          event_id?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      calendar_sync_mapping: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          financial_event_id: string;
          google_calendar_id: string | null;
          google_event_id: string;
          id: string;
          last_modified_at: string | null;
          last_synced_at: string | null;
          sync_direction: string;
          sync_source: string | null;
          sync_status: string;
          updated_at: string | null;
          user_id: string;
          version: number | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          financial_event_id: string;
          google_calendar_id?: string | null;
          google_event_id: string;
          id?: string;
          last_modified_at?: string | null;
          last_synced_at?: string | null;
          sync_direction: string;
          sync_source?: string | null;
          sync_status: string;
          updated_at?: string | null;
          user_id: string;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          financial_event_id?: string;
          google_calendar_id?: string | null;
          google_event_id?: string;
          id?: string;
          last_modified_at?: string | null;
          last_synced_at?: string | null;
          sync_direction?: string;
          sync_source?: string | null;
          sync_status?: string;
          updated_at?: string | null;
          user_id?: string;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_sync_mapping_aegis_event_id_fkey';
            columns: ['financial_event_id'];
            isOneToOne: false;
            referencedRelation: 'financial_events';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_sync_settings: {
        Row: {
          auto_sync_interval_minutes: number | null;
          channel_expiry_at: string | null;
          created_at: string | null;
          google_channel_id: string | null;
          google_resource_id: string | null;
          last_full_sync_at: string | null;
          sync_categories: string[] | null;
          sync_direction: string | null;
          sync_enabled: boolean | null;
          sync_financial_amounts: boolean | null;
          sync_token: string | null;
          updated_at: string | null;
          user_id: string;
          webhook_secret: string | null;
        };
        Insert: {
          auto_sync_interval_minutes?: number | null;
          channel_expiry_at?: string | null;
          created_at?: string | null;
          google_channel_id?: string | null;
          google_resource_id?: string | null;
          last_full_sync_at?: string | null;
          sync_categories?: string[] | null;
          sync_direction?: string | null;
          sync_enabled?: boolean | null;
          sync_financial_amounts?: boolean | null;
          sync_token?: string | null;
          updated_at?: string | null;
          user_id: string;
          webhook_secret?: string | null;
        };
        Update: {
          auto_sync_interval_minutes?: number | null;
          channel_expiry_at?: string | null;
          created_at?: string | null;
          google_channel_id?: string | null;
          google_resource_id?: string | null;
          last_full_sync_at?: string | null;
          sync_categories?: string[] | null;
          sync_direction?: string | null;
          sync_enabled?: boolean | null;
          sync_financial_amounts?: boolean | null;
          sync_token?: string | null;
          updated_at?: string | null;
          user_id?: string;
          webhook_secret?: string | null;
        };
        Relationships: [];
      };
      chat_context_snapshots: {
        Row: {
          account_balances: Json | null;
          context_version: number | null;
          conversation_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          recent_transactions: Json | null;
          upcoming_events: Json | null;
          user_preferences: Json | null;
        };
        Insert: {
          account_balances?: Json | null;
          context_version?: number | null;
          conversation_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          recent_transactions?: Json | null;
          upcoming_events?: Json | null;
          user_preferences?: Json | null;
        };
        Update: {
          account_balances?: Json | null;
          context_version?: number | null;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          recent_transactions?: Json | null;
          upcoming_events?: Json | null;
          user_preferences?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_context_snapshots_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'chat_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string | null;
          message_count: number;
          metadata: Json | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          message_count?: number;
          metadata?: Json | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          message_count?: number;
          metadata?: Json | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          attachments: Json | null;
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          reasoning: string | null;
          role: string;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          reasoning?: string | null;
          role: string;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          reasoning?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'chat_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      compliance_audit_logs: {
        Row: {
          action: string;
          context: Json | null;
          created_at: string | null;
          event_type: string;
          geo_location: Json | null;
          id: string;
          ip_address: unknown;
          new_value: Json | null;
          old_value: Json | null;
          request_id: string | null;
          requires_review: boolean | null;
          resource_id: string | null;
          resource_type: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risk_score: number | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          context?: Json | null;
          created_at?: string | null;
          event_type: string;
          geo_location?: Json | null;
          id?: string;
          ip_address?: unknown;
          new_value?: Json | null;
          old_value?: Json | null;
          request_id?: string | null;
          requires_review?: boolean | null;
          resource_id?: string | null;
          resource_type?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_score?: number | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          context?: Json | null;
          created_at?: string | null;
          event_type?: string;
          geo_location?: Json | null;
          id?: string;
          ip_address?: unknown;
          new_value?: Json | null;
          old_value?: Json | null;
          request_id?: string | null;
          requires_review?: boolean | null;
          resource_id?: string | null;
          resource_type?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_score?: number | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      consent_templates: {
        Row: {
          consent_type: string;
          created_at: string | null;
          description_pt: string;
          full_text_pt: string;
          id: string;
          is_active: boolean | null;
          is_mandatory: boolean | null;
          title_pt: string;
          updated_at: string | null;
          version: string;
        };
        Insert: {
          consent_type: string;
          created_at?: string | null;
          description_pt: string;
          full_text_pt: string;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          title_pt: string;
          updated_at?: string | null;
          version: string;
        };
        Update: {
          consent_type?: string;
          created_at?: string | null;
          description_pt?: string;
          full_text_pt?: string;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          title_pt?: string;
          updated_at?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      contact_payment_methods: {
        Row: {
          account_number: string | null;
          account_type: string | null;
          agency: string | null;
          bank_code: string | null;
          bank_name: string | null;
          contact_id: string;
          created_at: string | null;
          id: string;
          is_favorite: boolean | null;
          is_verified: boolean | null;
          label: string | null;
          last_used_at: string | null;
          metadata: Json | null;
          payment_type: string;
          pix_key_type: string | null;
          pix_key_value: string | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string;
        };
        Insert: {
          account_number?: string | null;
          account_type?: string | null;
          agency?: string | null;
          bank_code?: string | null;
          bank_name?: string | null;
          contact_id: string;
          created_at?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_verified?: boolean | null;
          label?: string | null;
          last_used_at?: string | null;
          metadata?: Json | null;
          payment_type: string;
          pix_key_type?: string | null;
          pix_key_value?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id: string;
        };
        Update: {
          account_number?: string | null;
          account_type?: string | null;
          agency?: string | null;
          bank_code?: string | null;
          bank_name?: string | null;
          contact_id?: string;
          created_at?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_verified?: boolean | null;
          label?: string | null;
          last_used_at?: string | null;
          metadata?: Json | null;
          payment_type?: string;
          pix_key_type?: string | null;
          pix_key_value?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_payment_methods_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      contacts: {
        Row: {
          cpf: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_favorite: boolean | null;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      conversation_contexts: {
        Row: {
          created_at: string | null;
          history: Json | null;
          id: string;
          last_entities: Json | null;
          last_intent: string | null;
          session_id: string;
          timestamp: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          history?: Json | null;
          id?: string;
          last_entities?: Json | null;
          last_intent?: string | null;
          session_id: string;
          timestamp?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          history?: Json | null;
          id?: string;
          last_entities?: Json | null;
          last_intent?: string | null;
          session_id?: string;
          timestamp?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      data_deletion_requests: {
        Row: {
          created_at: string | null;
          id: string;
          ip_address: unknown;
          legal_hold: boolean | null;
          processed_by: string | null;
          processing_completed_at: string | null;
          processing_started_at: string | null;
          reason: string | null;
          records_anonymized: number | null;
          records_deleted: number | null;
          rejection_reason: string | null;
          request_type: string;
          review_deadline: string | null;
          scope: Json;
          status: string;
          tables_affected: Json | null;
          updated_at: string | null;
          user_id: string;
          verification_code: string | null;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          legal_hold?: boolean | null;
          processed_by?: string | null;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          reason?: string | null;
          records_anonymized?: number | null;
          records_deleted?: number | null;
          rejection_reason?: string | null;
          request_type: string;
          review_deadline?: string | null;
          scope?: Json;
          status?: string;
          tables_affected?: Json | null;
          updated_at?: string | null;
          user_id: string;
          verification_code?: string | null;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          legal_hold?: boolean | null;
          processed_by?: string | null;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          reason?: string | null;
          records_anonymized?: number | null;
          records_deleted?: number | null;
          rejection_reason?: string | null;
          request_type?: string;
          review_deadline?: string | null;
          scope?: Json;
          status?: string;
          tables_affected?: Json | null;
          updated_at?: string | null;
          user_id?: string;
          verification_code?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      data_export_requests: {
        Row: {
          created_at: string | null;
          date_from: string | null;
          date_to: string | null;
          download_expires_at: string | null;
          download_url: string | null;
          downloaded_at: string | null;
          error_message: string | null;
          file_path: string | null;
          file_size_bytes: number | null;
          format: string;
          id: string;
          ip_address: unknown;
          processing_completed_at: string | null;
          processing_started_at: string | null;
          request_type: string;
          requested_via: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          date_from?: string | null;
          date_to?: string | null;
          download_expires_at?: string | null;
          download_url?: string | null;
          downloaded_at?: string | null;
          error_message?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          format: string;
          id?: string;
          ip_address?: unknown;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          request_type: string;
          requested_via?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          date_from?: string | null;
          date_to?: string | null;
          download_expires_at?: string | null;
          download_url?: string | null;
          downloaded_at?: string | null;
          error_message?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          format?: string;
          id?: string;
          ip_address?: unknown;
          processing_completed_at?: string | null;
          processing_started_at?: string | null;
          request_type?: string;
          requested_via?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      data_retention_policies: {
        Row: {
          applies_to_inactive_only: boolean | null;
          created_at: string | null;
          deletion_strategy: string;
          id: string;
          is_active: boolean | null;
          last_cleanup_at: string | null;
          legal_basis: string;
          next_cleanup_at: string | null;
          retention_period: unknown;
          table_name: string;
          updated_at: string | null;
        };
        Insert: {
          applies_to_inactive_only?: boolean | null;
          created_at?: string | null;
          deletion_strategy: string;
          id?: string;
          is_active?: boolean | null;
          last_cleanup_at?: string | null;
          legal_basis: string;
          next_cleanup_at?: string | null;
          retention_period: unknown;
          table_name: string;
          updated_at?: string | null;
        };
        Update: {
          applies_to_inactive_only?: boolean | null;
          created_at?: string | null;
          deletion_strategy?: string;
          id?: string;
          is_active?: boolean | null;
          last_cleanup_at?: string | null;
          legal_basis?: string;
          next_cleanup_at?: string | null;
          retention_period?: unknown;
          table_name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      data_subject_requests: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          processed_at: string | null;
          processed_by: string | null;
          request_data: Json | null;
          request_type: string;
          response: Json | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          request_data?: Json | null;
          request_type: string;
          response?: Json | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          request_data?: Json | null;
          request_type?: string;
          response?: Json | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      event_reminders: {
        Row: {
          created_at: string | null;
          event_id: string | null;
          id: string;
          is_sent: boolean | null;
          message: string | null;
          remind_at: string;
          reminder_type: string | null;
          sent_at: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          is_sent?: boolean | null;
          message?: string | null;
          remind_at: string;
          reminder_type?: string | null;
          sent_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_id?: string | null;
          id?: string;
          is_sent?: boolean | null;
          message?: string | null;
          remind_at?: string;
          reminder_type?: string | null;
          sent_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_reminders_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'financial_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_reminders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      event_types: {
        Row: {
          color: string | null;
          created_at: string | null;
          default_reminder_hours: number | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          default_reminder_hours?: number | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          default_reminder_hours?: number | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      financial_accounts: {
        Row: {
          balance: number | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          provider: string | null;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          balance?: number | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          provider?: string | null;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          balance?: number | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          provider?: string | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      financial_categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          is_system: boolean | null;
          name: string;
          parent_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          name: string;
          parent_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          name?: string;
          parent_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'financial_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_events: {
        Row: {
          all_day: boolean | null;
          amount: number;
          attachments: string[] | null;
          brazilian_event_type: string | null;
          category: string | null;
          color: string;
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          end_date: string;
          event_type: string;
          event_type_id: string | null;
          icon: string | null;
          id: string;
          installment_info: Json | null;
          is_income: boolean | null;
          is_recurring: boolean | null;
          location: string | null;
          merchant_category: string | null;
          metadata: Json | null;
          notes: string | null;
          parent_event_id: string | null;
          priority: string | null;
          recurrence_rule: string | null;
          start_date: string;
          status: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          all_day?: boolean | null;
          amount: number;
          attachments?: string[] | null;
          brazilian_event_type?: string | null;
          category?: string | null;
          color?: string;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          end_date: string;
          event_type: string;
          event_type_id?: string | null;
          icon?: string | null;
          id?: string;
          installment_info?: Json | null;
          is_income?: boolean | null;
          is_recurring?: boolean | null;
          location?: string | null;
          merchant_category?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          parent_event_id?: string | null;
          priority?: string | null;
          recurrence_rule?: string | null;
          start_date: string;
          status?: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          all_day?: boolean | null;
          amount?: number;
          attachments?: string[] | null;
          brazilian_event_type?: string | null;
          category?: string | null;
          color?: string;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          end_date?: string;
          event_type?: string;
          event_type_id?: string | null;
          icon?: string | null;
          id?: string;
          installment_info?: Json | null;
          is_income?: boolean | null;
          is_recurring?: boolean | null;
          location?: string | null;
          merchant_category?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          parent_event_id?: string | null;
          priority?: string | null;
          recurrence_rule?: string | null;
          start_date?: string;
          status?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_events_event_type_id_fkey';
            columns: ['event_type_id'];
            isOneToOne: false;
            referencedRelation: 'event_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_events_parent_event_id_fkey';
            columns: ['parent_event_id'];
            isOneToOne: false;
            referencedRelation: 'financial_events';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_snapshots: {
        Row: {
          account_balances: Json | null;
          category_spending: Json | null;
          created_at: string | null;
          data_version: number | null;
          expires_at: string | null;
          id: string;
          largest_expense: Json | null;
          largest_income: Json | null;
          metadata: Json | null;
          net_cashflow: number | null;
          recent_transactions: Json | null;
          snapshot_date: string;
          snapshot_type: string;
          spending_trends: Json | null;
          total_balance: number | null;
          total_expenses: number | null;
          total_income: number | null;
          transaction_count: number | null;
          upcoming_bills: Json | null;
          upcoming_income: Json | null;
          user_id: string;
        };
        Insert: {
          account_balances?: Json | null;
          category_spending?: Json | null;
          created_at?: string | null;
          data_version?: number | null;
          expires_at?: string | null;
          id?: string;
          largest_expense?: Json | null;
          largest_income?: Json | null;
          metadata?: Json | null;
          net_cashflow?: number | null;
          recent_transactions?: Json | null;
          snapshot_date: string;
          snapshot_type: string;
          spending_trends?: Json | null;
          total_balance?: number | null;
          total_expenses?: number | null;
          total_income?: number | null;
          transaction_count?: number | null;
          upcoming_bills?: Json | null;
          upcoming_income?: Json | null;
          user_id: string;
        };
        Update: {
          account_balances?: Json | null;
          category_spending?: Json | null;
          created_at?: string | null;
          data_version?: number | null;
          expires_at?: string | null;
          id?: string;
          largest_expense?: Json | null;
          largest_income?: Json | null;
          metadata?: Json | null;
          net_cashflow?: number | null;
          recent_transactions?: Json | null;
          snapshot_date?: string;
          snapshot_type?: string;
          spending_trends?: Json | null;
          total_balance?: number | null;
          total_expenses?: number | null;
          total_income?: number | null;
          transaction_count?: number | null;
          upcoming_bills?: Json | null;
          upcoming_income?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      fraud_detection_rules: {
        Row: {
          created_at: string | null;
          description: string | null;
          enabled: boolean | null;
          id: string;
          rule_type: string;
          threshold: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          enabled?: boolean | null;
          id?: string;
          rule_type: string;
          threshold: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          enabled?: boolean | null;
          id?: string;
          rule_type?: string;
          threshold?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      google_calendar_tokens: {
        Row: {
          access_token: string;
          created_at: string | null;
          expiry_timestamp: string;
          google_user_email: string;
          id: string;
          refresh_token: string;
          scope: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expiry_timestamp: string;
          google_user_email: string;
          id?: string;
          refresh_token: string;
          scope: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expiry_timestamp?: string;
          google_user_email?: string;
          id?: string;
          refresh_token?: string;
          scope?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      legal_holds: {
        Row: {
          active: boolean | null;
          case_reference: string | null;
          created_at: string | null;
          expires_at: string | null;
          hold_type: string;
          id: string;
          placed_by: string | null;
          reason: string;
          released_at: string | null;
          released_by: string | null;
          user_id: string;
        };
        Insert: {
          active?: boolean | null;
          case_reference?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          hold_type: string;
          id?: string;
          placed_by?: string | null;
          reason: string;
          released_at?: string | null;
          released_by?: string | null;
          user_id: string;
        };
        Update: {
          active?: boolean | null;
          case_reference?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          hold_type?: string;
          id?: string;
          placed_by?: string | null;
          reason?: string;
          released_at?: string | null;
          released_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      lgpd_consents: {
        Row: {
          collection_method: string;
          consent_text_hash: string;
          consent_type: string;
          consent_version: string;
          created_at: string | null;
          expires_at: string | null;
          granted: boolean;
          granted_at: string | null;
          id: string;
          ip_address: unknown;
          legal_basis: string;
          metadata: Json | null;
          purpose: string;
          revoked_at: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          collection_method: string;
          consent_text_hash: string;
          consent_type: string;
          consent_version?: string;
          created_at?: string | null;
          expires_at?: string | null;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          ip_address?: unknown;
          legal_basis: string;
          metadata?: Json | null;
          purpose: string;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          collection_method?: string;
          consent_text_hash?: string;
          consent_type?: string;
          consent_version?: string;
          created_at?: string | null;
          expires_at?: string | null;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          ip_address?: unknown;
          legal_basis?: string;
          metadata?: Json | null;
          purpose?: string;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nlu_learning_data: {
        Row: {
          confidence_improvement: number;
          correction_applied: string;
          created_at: string | null;
          error_pattern: string;
          id: string;
          linguistic_style: string | null;
          original_confidence: number;
          original_text: string;
          regional_variation: string | null;
          success: boolean;
          timestamp: string | null;
          updated_at: string | null;
          user_feedback: string | null;
          user_id: string;
        };
        Insert: {
          confidence_improvement: number;
          correction_applied: string;
          created_at?: string | null;
          error_pattern: string;
          id?: string;
          linguistic_style?: string | null;
          original_confidence: number;
          original_text: string;
          regional_variation?: string | null;
          success: boolean;
          timestamp?: string | null;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_id: string;
        };
        Update: {
          confidence_improvement?: number;
          correction_applied?: string;
          created_at?: string | null;
          error_pattern?: string;
          id?: string;
          linguistic_style?: string | null;
          original_confidence?: number;
          original_text?: string;
          regional_variation?: string | null;
          success?: boolean;
          timestamp?: string | null;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      open_banking_consents: {
        Row: {
          access_token_expires_at: string | null;
          consent_id: string;
          created_at: string | null;
          created_at_institution: string | null;
          data_categories: string[];
          expires_at: string;
          id: string;
          institution_id: string;
          institution_name: string;
          ip_address: unknown;
          last_sync_at: string | null;
          permissions: string[];
          refresh_token_encrypted: string | null;
          revocation_reason: string | null;
          revoked_at: string | null;
          sharing_purpose: string;
          status: string;
          sync_error_count: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token_expires_at?: string | null;
          consent_id: string;
          created_at?: string | null;
          created_at_institution?: string | null;
          data_categories: string[];
          expires_at: string;
          id?: string;
          institution_id: string;
          institution_name: string;
          ip_address?: unknown;
          last_sync_at?: string | null;
          permissions: string[];
          refresh_token_encrypted?: string | null;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          sharing_purpose: string;
          status?: string;
          sync_error_count?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token_expires_at?: string | null;
          consent_id?: string;
          created_at?: string | null;
          created_at_institution?: string | null;
          data_categories?: string[];
          expires_at?: string;
          id?: string;
          institution_id?: string;
          institution_name?: string;
          ip_address?: unknown;
          last_sync_at?: string | null;
          permissions?: string[];
          refresh_token_encrypted?: string | null;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          sharing_purpose?: string;
          status?: string;
          sync_error_count?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      otp_codes: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_used: boolean | null;
          otp_code: string;
          phone_number: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_used?: boolean | null;
          otp_code: string;
          phone_number: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_used?: boolean | null;
          otp_code?: string;
          phone_number?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          cpf: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          user_id: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          user_id: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_rules: {
        Row: {
          autonomy_level: number;
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          max_amount: number;
          metadata: Json | null;
          payee_key: string | null;
          payee_name: string;
          payee_type: string | null;
          preferred_time: string | null;
          tolerance_percentage: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          autonomy_level?: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_amount: number;
          metadata?: Json | null;
          payee_key?: string | null;
          payee_name: string;
          payee_type?: string | null;
          preferred_time?: string | null;
          tolerance_percentage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          autonomy_level?: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_amount?: number;
          metadata?: Json | null;
          payee_key?: string | null;
          payee_name?: string;
          payee_type?: string | null;
          preferred_time?: string | null;
          tolerance_percentage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      pix_keys: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_favorite: boolean | null;
          key_type: string;
          key_value: string;
          label: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_favorite?: boolean | null;
          key_type: string;
          key_value: string;
          label?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_favorite?: boolean | null;
          key_type?: string;
          key_value?: string;
          label?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      pix_transfers: {
        Row: {
          amount: number;
          confirmation_method: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          description: string | null;
          end_to_end_id: string | null;
          executed_at: string | null;
          id: string;
          initiation_method: string | null;
          metadata: Json | null;
          pix_key: string;
          pix_key_type: string | null;
          recipient_bank: string | null;
          recipient_document: string | null;
          recipient_name: string;
          requires_confirmation: boolean | null;
          status: string;
          transaction_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          confirmation_method?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_to_end_id?: string | null;
          executed_at?: string | null;
          id?: string;
          initiation_method?: string | null;
          metadata?: Json | null;
          pix_key: string;
          pix_key_type?: string | null;
          recipient_bank?: string | null;
          recipient_document?: string | null;
          recipient_name: string;
          requires_confirmation?: boolean | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          confirmation_method?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_to_end_id?: string | null;
          executed_at?: string | null;
          id?: string;
          initiation_method?: string | null;
          metadata?: Json | null;
          pix_key?: string;
          pix_key_type?: string | null;
          recipient_bank?: string | null;
          recipient_document?: string | null;
          recipient_name?: string;
          requires_confirmation?: boolean | null;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      push_auth_requests: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          push_token: string;
          responded_at: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          push_token: string;
          responded_at?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          push_token?: string;
          responded_at?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      regulatory_reports: {
        Row: {
          acknowledgment_at: string | null;
          created_at: string | null;
          data: Json;
          external_reference: string | null;
          id: string;
          notes: string | null;
          period_end: string;
          period_start: string;
          report_type: string;
          status: string;
          submitted_at: string | null;
          submitted_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          acknowledgment_at?: string | null;
          created_at?: string | null;
          data?: Json;
          external_reference?: string | null;
          id?: string;
          notes?: string | null;
          period_end: string;
          period_start: string;
          report_type: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          acknowledgment_at?: string | null;
          created_at?: string | null;
          data?: Json;
          external_reference?: string | null;
          id?: string;
          notes?: string | null;
          period_end?: string;
          period_start?: string;
          report_type?: string;
          status?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      scheduled_payments: {
        Row: {
          amount: number;
          approval_method: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string | null;
          due_date: string;
          error_code: string | null;
          error_message: string | null;
          executed_at: string | null;
          execution_attempts: number | null;
          id: string;
          last_attempt_at: string | null;
          max_attempts: number | null;
          metadata: Json | null;
          payee_key: string;
          payee_name: string;
          payment_type: string | null;
          requires_approval: boolean | null;
          rule_id: string | null;
          scheduled_time: string;
          status: string;
          transaction_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          approval_method?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          due_date: string;
          error_code?: string | null;
          error_message?: string | null;
          executed_at?: string | null;
          execution_attempts?: number | null;
          id?: string;
          last_attempt_at?: string | null;
          max_attempts?: number | null;
          metadata?: Json | null;
          payee_key: string;
          payee_name: string;
          payment_type?: string | null;
          requires_approval?: boolean | null;
          rule_id?: string | null;
          scheduled_time: string;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          approval_method?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          due_date?: string;
          error_code?: string | null;
          error_message?: string | null;
          executed_at?: string | null;
          execution_attempts?: number | null;
          id?: string;
          last_attempt_at?: string | null;
          max_attempts?: number | null;
          metadata?: Json | null;
          payee_key?: string;
          payee_name?: string;
          payment_type?: string | null;
          requires_approval?: boolean | null;
          rule_id?: string | null;
          scheduled_time?: string;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_payments_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'payment_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      security_alerts: {
        Row: {
          alert_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_read: boolean | null;
          is_resolved: boolean | null;
          metadata: Json | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          title: string;
          user_id: string;
        };
        Insert: {
          alert_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_read?: boolean | null;
          is_resolved?: boolean | null;
          metadata?: Json | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity: string;
          title: string;
          user_id: string;
        };
        Update: {
          alert_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_read?: boolean | null;
          is_resolved?: boolean | null;
          metadata?: Json | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      security_events: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          method: string | null;
          risk_score: number | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          method?: string | null;
          risk_score?: number | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          method?: string | null;
          risk_score?: number | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          price: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          price?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          price?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      spending_patterns: {
        Row: {
          average_amount: number | null;
          category: string | null;
          change_percentage: number | null;
          confidence_score: number | null;
          created_at: string | null;
          id: string;
          last_calculated_at: string | null;
          max_amount: number | null;
          min_amount: number | null;
          pattern_data: Json;
          pattern_type: string;
          period_end: string;
          period_start: string;
          previous_period_amount: number | null;
          total_amount: number | null;
          transaction_count: number | null;
          trend_direction: string | null;
          trend_percentage: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          average_amount?: number | null;
          category?: string | null;
          change_percentage?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          max_amount?: number | null;
          min_amount?: number | null;
          pattern_data?: Json;
          pattern_type: string;
          period_end: string;
          period_start: string;
          previous_period_amount?: number | null;
          total_amount?: number | null;
          transaction_count?: number | null;
          trend_direction?: string | null;
          trend_percentage?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          average_amount?: number | null;
          category?: string | null;
          change_percentage?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          max_amount?: number | null;
          min_amount?: number | null;
          pattern_data?: Json;
          pattern_type?: string;
          period_end?: string;
          period_start?: string;
          previous_period_amount?: number | null;
          total_amount?: number | null;
          transaction_count?: number | null;
          trend_direction?: string | null;
          trend_percentage?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sync_queue: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          event_id: string | null;
          id: string;
          processed_at: string | null;
          retry_count: number | null;
          status: string;
          sync_direction: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          event_id?: string | null;
          id?: string;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
          sync_direction: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          event_id?: string | null;
          id?: string;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
          sync_direction?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sync_queue_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'financial_events';
            referencedColumns: ['id'];
          },
        ];
      };
      terms_acceptance: {
        Row: {
          accepted_at: string;
          created_at: string | null;
          document_hash: string;
          id: string;
          ip_address: unknown;
          terms_type: string;
          user_agent: string | null;
          user_id: string;
          version: string;
        };
        Insert: {
          accepted_at?: string;
          created_at?: string | null;
          document_hash: string;
          id?: string;
          ip_address?: unknown;
          terms_type: string;
          user_agent?: string | null;
          user_id: string;
          version: string;
        };
        Update: {
          accepted_at?: string;
          created_at?: string | null;
          document_hash?: string;
          id?: string;
          ip_address?: unknown;
          terms_type?: string;
          user_agent?: string | null;
          user_id?: string;
          version?: string;
        };
        Relationships: [];
      };
      transaction_limits: {
        Row: {
          created_at: string | null;
          current_daily_used: number | null;
          current_monthly_used: number | null;
          daily_limit: number;
          id: string;
          is_active: boolean | null;
          is_custom: boolean | null;
          last_reset_daily: string | null;
          last_reset_monthly: string | null;
          limit_type: string;
          monthly_limit: number | null;
          nightly_limit: number | null;
          per_transaction_limit: number | null;
          requires_approval_above: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_daily_used?: number | null;
          current_monthly_used?: number | null;
          daily_limit: number;
          id?: string;
          is_active?: boolean | null;
          is_custom?: boolean | null;
          last_reset_daily?: string | null;
          last_reset_monthly?: string | null;
          limit_type: string;
          monthly_limit?: number | null;
          nightly_limit?: number | null;
          per_transaction_limit?: number | null;
          requires_approval_above?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          current_daily_used?: number | null;
          current_monthly_used?: number | null;
          daily_limit?: number;
          id?: string;
          is_active?: boolean | null;
          is_custom?: boolean | null;
          last_reset_daily?: string | null;
          last_reset_monthly?: string | null;
          limit_type?: string;
          monthly_limit?: number | null;
          nightly_limit?: number | null;
          per_transaction_limit?: number | null;
          requires_approval_above?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          id: string;
          is_manual_entry: boolean | null;
          merchant_name: string | null;
          status: string | null;
          transaction_date: string | null;
          transaction_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          is_manual_entry?: boolean | null;
          merchant_name?: string | null;
          status?: string | null;
          transaction_date?: string | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          is_manual_entry?: boolean | null;
          merchant_name?: string | null;
          status?: string | null;
          transaction_date?: string | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'bank_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'financial_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity: {
        Row: {
          activity_data: Json | null;
          activity_type: string;
          created_at: string | null;
          id: string;
          last_activity: string | null;
          user_id: string;
        };
        Insert: {
          activity_data?: Json | null;
          activity_type: string;
          created_at?: string | null;
          id?: string;
          last_activity?: string | null;
          user_id: string;
        };
        Update: {
          activity_data?: Json | null;
          activity_type?: string;
          created_at?: string | null;
          id?: string;
          last_activity?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_consent: {
        Row: {
          consent_date: string;
          consent_type: string;
          consent_version: string;
          created_at: string | null;
          granted: boolean;
          id: string;
          ip_address: unknown;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          consent_date?: string;
          consent_type: string;
          consent_version?: string;
          created_at?: string | null;
          granted?: boolean;
          id?: string;
          ip_address?: unknown;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          consent_date?: string;
          consent_type?: string;
          consent_version?: string;
          created_at?: string | null;
          granted?: boolean;
          id?: string;
          ip_address?: unknown;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_pins: {
        Row: {
          created_at: string | null;
          id: string;
          pin_hash: string;
          salt: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          pin_hash: string;
          salt: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          pin_hash?: string;
          salt?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          accessibility_high_contrast: boolean | null;
          accessibility_large_text: boolean | null;
          accessibility_screen_reader: boolean | null;
          auto_categorize: boolean | null;
          budget_alerts: boolean | null;
          created_at: string | null;
          id: string;
          notifications_email: boolean | null;
          notifications_push: boolean | null;
          notifications_sms: boolean | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string | null;
          voice_feedback: boolean | null;
        };
        Insert: {
          accessibility_high_contrast?: boolean | null;
          accessibility_large_text?: boolean | null;
          accessibility_screen_reader?: boolean | null;
          auto_categorize?: boolean | null;
          budget_alerts?: boolean | null;
          created_at?: string | null;
          id?: string;
          notifications_email?: boolean | null;
          notifications_push?: boolean | null;
          notifications_sms?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          voice_feedback?: boolean | null;
        };
        Update: {
          accessibility_high_contrast?: boolean | null;
          accessibility_large_text?: boolean | null;
          accessibility_screen_reader?: boolean | null;
          auto_categorize?: boolean | null;
          budget_alerts?: boolean | null;
          created_at?: string | null;
          id?: string;
          notifications_email?: boolean | null;
          notifications_push?: boolean | null;
          notifications_sms?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          voice_feedback?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_security_preferences: {
        Row: {
          created_at: string | null;
          enable_push_notifications: boolean | null;
          id: string;
          lockout_duration_minutes: number | null;
          max_failed_attempts: number | null;
          phone_number: string | null;
          require_biometric: boolean | null;
          require_otp_for_sensitive_operations: boolean | null;
          session_timeout_minutes: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          enable_push_notifications?: boolean | null;
          id?: string;
          lockout_duration_minutes?: number | null;
          max_failed_attempts?: number | null;
          phone_number?: string | null;
          require_biometric?: boolean | null;
          require_otp_for_sensitive_operations?: boolean | null;
          session_timeout_minutes?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          enable_push_notifications?: boolean | null;
          id?: string;
          lockout_duration_minutes?: number | null;
          max_failed_attempts?: number | null;
          phone_number?: string | null;
          require_biometric?: boolean | null;
          require_otp_for_sensitive_operations?: boolean | null;
          session_timeout_minutes?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          autonomy_level: number | null;
          birth_date: string | null;
          cpf: string | null;
          created_at: string | null;
          currency: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          language: string | null;
          last_login: string | null;
          phone: string | null;
          profile_image_url: string | null;
          timezone: string | null;
          updated_at: string | null;
          voice_command_enabled: boolean | null;
        };
        Insert: {
          autonomy_level?: number | null;
          birth_date?: string | null;
          cpf?: string | null;
          created_at?: string | null;
          currency?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          language?: string | null;
          last_login?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          voice_command_enabled?: boolean | null;
        };
        Update: {
          autonomy_level?: number | null;
          birth_date?: string | null;
          cpf?: string | null;
          created_at?: string | null;
          currency?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          last_login?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          voice_command_enabled?: boolean | null;
        };
        Relationships: [];
      };
      voice_audit_logs: {
        Row: {
          action: string;
          audio_id: string;
          id: string;
          metadata: Json | null;
          timestamp: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          audio_id: string;
          id?: string;
          metadata?: Json | null;
          timestamp?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          audio_id?: string;
          id?: string;
          metadata?: Json | null;
          timestamp?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      voice_consent: {
        Row: {
          consent_date: string | null;
          consent_given: boolean;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          consent_date?: string | null;
          consent_given?: boolean;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          consent_date?: string | null;
          consent_given?: boolean;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      voice_feedback: {
        Row: {
          audio_file_path: string | null;
          command_text: string;
          confidence_score: number | null;
          correction_made: string | null;
          created_at: string | null;
          feedback_text: string | null;
          feedback_type: string | null;
          id: string;
          rating: number | null;
          recognized_text: string | null;
          session_id: string | null;
          transcription_id: string | null;
          user_id: string;
          was_correct: boolean | null;
        };
        Insert: {
          audio_file_path?: string | null;
          command_text: string;
          confidence_score?: number | null;
          correction_made?: string | null;
          created_at?: string | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          id?: string;
          rating?: number | null;
          recognized_text?: string | null;
          session_id?: string | null;
          transcription_id?: string | null;
          user_id: string;
          was_correct?: boolean | null;
        };
        Update: {
          audio_file_path?: string | null;
          command_text?: string;
          confidence_score?: number | null;
          correction_made?: string | null;
          created_at?: string | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          id?: string;
          rating?: number | null;
          recognized_text?: string | null;
          session_id?: string | null;
          transcription_id?: string | null;
          user_id?: string;
          was_correct?: boolean | null;
        };
        Relationships: [];
      };
      voice_recordings: {
        Row: {
          channels: number | null;
          created_at: string | null;
          deleted_at: string | null;
          duration_ms: number | null;
          file_path: string;
          file_size: number | null;
          format: string | null;
          id: string;
          processed: boolean | null;
          retention_expires_at: string | null;
          sample_rate: number | null;
          session_id: string | null;
          transcription_id: string | null;
          user_id: string;
        };
        Insert: {
          channels?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          duration_ms?: number | null;
          file_path: string;
          file_size?: number | null;
          format?: string | null;
          id?: string;
          processed?: boolean | null;
          retention_expires_at?: string | null;
          sample_rate?: number | null;
          session_id?: string | null;
          transcription_id?: string | null;
          user_id: string;
        };
        Update: {
          channels?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          duration_ms?: number | null;
          file_path?: string;
          file_size?: number | null;
          format?: string | null;
          id?: string;
          processed?: boolean | null;
          retention_expires_at?: string | null;
          sample_rate?: number | null;
          session_id?: string | null;
          transcription_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      voice_transcriptions: {
        Row: {
          audio_storage_path: string;
          confidence_score: number | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          language: string;
          processing_time_ms: number;
          transcript: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          audio_storage_path: string;
          confidence_score?: number | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          language?: string;
          processing_time_ms: number;
          transcript: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          audio_storage_path?: string;
          confidence_score?: number | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          language?: string;
          processing_time_ms?: number;
          transcript?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_required_consents: {
        Args: { p_required_consents: string[]; p_user_id: string };
        Returns: boolean;
      };
      check_retention_policies: { Args: never; Returns: undefined };
      check_transaction_limit: {
        Args: { p_amount: number; p_limit_type: string; p_user_id: string };
        Returns: Json;
      };
      cleanup_old_sync_queue_items: { Args: never; Returns: number };
      create_daily_snapshot: { Args: { p_user_id: string }; Returns: string };
      get_financial_context: { Args: { p_user_id: string }; Returns: Json };
      get_financial_summary: {
        Args: { user_uuid: string };
        Returns: {
          monthly_expenses: number;
          monthly_income: number;
          pending_bills_count: number;
          total_balance: number;
          upcoming_payments_count: number;
        }[];
      };
      log_compliance_event: {
        Args: {
          p_action: string;
          p_context?: Json;
          p_event_type: string;
          p_resource_id: string;
          p_resource_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
      reset_daily_limits: { Args: never; Returns: number };
      reset_monthly_limits: { Args: never; Returns: number };
      schedule_retention_check: { Args: never; Returns: undefined };
      update_limit_usage: {
        Args: { p_amount: number; p_limit_type: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

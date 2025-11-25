export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          is_locked: boolean | null
          last_attempt_at: string | null
          lockout_until: string | null
          method: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_locked?: boolean | null
          last_attempt_at?: string | null
          lockout_until?: string | null
          method: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_locked?: boolean | null
          last_attempt_at?: string | null
          lockout_until?: string | null
          method?: string
          user_id?: string
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_activity: string | null
          method: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          method: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          method?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_mask: string
          account_number: string | null
          account_type: string
          available_balance: number | null
          balance: number | null
          belvo_account_id: string
          created_at: string | null
          currency: string | null
          id: string
          institution_id: string
          institution_name: string
          is_active: boolean | null
          is_primary: boolean | null
          last_sync: string | null
          sync_error_message: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_mask: string
          account_number?: string | null
          account_type: string
          available_balance?: number | null
          balance?: number | null
          belvo_account_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          institution_id: string
          institution_name: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync?: string | null
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_mask?: string
          account_number?: string | null
          account_type?: string
          available_balance?: number | null
          balance?: number | null
          belvo_account_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          institution_id?: string
          institution_name?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync?: string | null
          sync_error_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_audit_logs: {
        Row: {
          connection_id: string | null
          created_at: string | null
          digital_signature: string
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          institution_code: string | null
          ip_address: unknown
          metadata: Json | null
          retention_until: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          digital_signature: string
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          institution_code?: string | null
          ip_address?: unknown
          metadata?: Json | null
          retention_until?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          digital_signature?: string
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          institution_code?: string | null
          ip_address?: unknown
          metadata?: Json | null
          retention_until?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_audit_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          belvo_link_id: string | null
          connected_at: string | null
          created_at: string | null
          error_code: string | null
          error_count: number | null
          error_message: string | null
          id: string
          institution_code: string
          institution_name: string
          last_error_at: string | null
          last_sync_at: string | null
          metadata: Json | null
          next_sync_at: string | null
          status: string
          sync_frequency_hours: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          belvo_link_id?: string | null
          connected_at?: string | null
          created_at?: string | null
          error_code?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          institution_code: string
          institution_name: string
          last_error_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          next_sync_at?: string | null
          status?: string
          sync_frequency_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          belvo_link_id?: string | null
          connected_at?: string | null
          created_at?: string | null
          error_code?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          institution_code?: string
          institution_name?: string
          last_error_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          next_sync_at?: string | null
          status?: string
          sync_frequency_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_consent: {
        Row: {
          connection_id: string | null
          consent_id: string | null
          created_at: string | null
          expires_at: string
          granted_at: string | null
          id: string
          metadata: Json | null
          notification_sent_at: string | null
          reminder_sent_at: string | null
          renewed_at: string | null
          revoked_at: string | null
          scopes: string[]
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connection_id?: string | null
          consent_id?: string | null
          created_at?: string | null
          expires_at: string
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          notification_sent_at?: string | null
          reminder_sent_at?: string | null
          renewed_at?: string | null
          revoked_at?: string | null
          scopes: string[]
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connection_id?: string | null
          consent_id?: string | null
          created_at?: string | null
          expires_at?: string
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          notification_sent_at?: string | null
          reminder_sent_at?: string | null
          renewed_at?: string | null
          revoked_at?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_consent_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_tokens: {
        Row: {
          connection_id: string | null
          created_at: string | null
          encrypted_access_token: string
          encrypted_refresh_token: string | null
          encryption_algorithm: string
          encryption_iv: string
          expires_at: string | null
          id: string
          refresh_expires_at: string | null
          scopes: string[] | null
          token_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          encrypted_access_token: string
          encrypted_refresh_token?: string | null
          encryption_algorithm?: string
          encryption_iv: string
          expires_at?: string | null
          id?: string
          refresh_expires_at?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          encrypted_access_token?: string
          encrypted_refresh_token?: string | null
          encryption_algorithm?: string
          encryption_iv?: string
          expires_at?: string | null
          id?: string
          refresh_expires_at?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_tokens_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_credentials: {
        Row: {
          created_at: string | null
          credential_id: string
          credential_type: string
          id: string
          public_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id: string
          credential_type?: string
          id?: string
          public_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string
          credential_type?: string
          id?: string
          public_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      biometric_patterns: {
        Row: {
          anonymized_at: string | null
          confidence_threshold: number | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          model_version: string | null
          pattern_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anonymized_at?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          model_version?: string | null
          pattern_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anonymized_at?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          model_version?: string | null
          pattern_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      boletos: {
        Row: {
          amount: number
          barcode: string
          capture_method: string | null
          created_at: string | null
          digitable_line: string | null
          discount_amount: number | null
          due_date: string
          fine_amount: number | null
          id: string
          interest_amount: number | null
          metadata: Json | null
          paid_at: string | null
          payee_document: string | null
          payee_name: string
          payment_confirmation: string | null
          scheduled_payment_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          barcode: string
          capture_method?: string | null
          created_at?: string | null
          digitable_line?: string | null
          discount_amount?: number | null
          due_date: string
          fine_amount?: number | null
          id?: string
          interest_amount?: number | null
          metadata?: Json | null
          paid_at?: string | null
          payee_document?: string | null
          payee_name: string
          payment_confirmation?: string | null
          scheduled_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          barcode?: string
          capture_method?: string | null
          created_at?: string | null
          digitable_line?: string | null
          discount_amount?: number | null
          due_date?: string
          fine_amount?: number | null
          id?: string
          interest_amount?: number | null
          metadata?: Json | null
          paid_at?: string | null
          payee_document?: string | null
          payee_name?: string
          payment_confirmation?: string | null
          scheduled_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boletos_scheduled_payment_id_fkey"
            columns: ["scheduled_payment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_audit: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          event_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          event_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          event_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_mapping: {
        Row: {
          aegis_event_id: string
          created_at: string | null
          error_message: string | null
          google_calendar_id: string | null
          google_event_id: string
          id: string
          last_synced_at: string | null
          sync_direction: string
          sync_status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aegis_event_id: string
          created_at?: string | null
          error_message?: string | null
          google_calendar_id?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          sync_direction: string
          sync_status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aegis_event_id?: string
          created_at?: string | null
          error_message?: string | null
          google_calendar_id?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string
          sync_status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_mapping_aegis_event_id_fkey"
            columns: ["aegis_event_id"]
            isOneToOne: false
            referencedRelation: "financial_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_settings: {
        Row: {
          auto_sync_interval_minutes: number | null
          created_at: string | null
          last_full_sync_at: string | null
          sync_categories: string[] | null
          sync_direction: string | null
          sync_enabled: boolean | null
          sync_financial_amounts: boolean | null
          sync_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync_interval_minutes?: number | null
          created_at?: string | null
          last_full_sync_at?: string | null
          sync_categories?: string[] | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_financial_amounts?: boolean | null
          sync_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync_interval_minutes?: number | null
          created_at?: string | null
          last_full_sync_at?: string | null
          sync_categories?: string[] | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_financial_amounts?: boolean | null
          sync_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_context_snapshots: {
        Row: {
          account_balances: Json | null
          context_version: number | null
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          recent_transactions: Json | null
          upcoming_events: Json | null
          user_preferences: Json | null
        }
        Insert: {
          account_balances?: Json | null
          context_version?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recent_transactions?: Json | null
          upcoming_events?: Json | null
          user_preferences?: Json | null
        }
        Update: {
          account_balances?: Json | null
          context_version?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recent_transactions?: Json | null
          upcoming_events?: Json | null
          user_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_context_snapshots_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          reasoning: string | null
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reasoning?: string | null
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reasoning?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          is_favorite: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_contexts: {
        Row: {
          created_at: string | null
          history: Json | null
          id: string
          last_entities: Json | null
          last_intent: string | null
          session_id: string
          timestamp: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          history?: Json | null
          id?: string
          last_entities?: Json | null
          last_intent?: string | null
          session_id: string
          timestamp?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          history?: Json | null
          id?: string
          last_entities?: Json | null
          last_intent?: string | null
          session_id?: string
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_data: Json | null
          request_type: string
          response: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_data?: Json | null
          request_type: string
          response?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_data?: Json | null
          request_type?: string
          response?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      event_reminders: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_sent: boolean | null
          message: string | null
          remind_at: string
          reminder_type: string | null
          sent_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_sent?: boolean | null
          message?: string | null
          remind_at: string
          reminder_type?: string | null
          sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_sent?: boolean | null
          message?: string | null
          remind_at?: string
          reminder_type?: string | null
          sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "financial_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string | null
          created_at: string | null
          default_reminder_hours: number | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_reminder_hours?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_reminder_hours?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          provider: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          provider?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_events: {
        Row: {
          all_day: boolean | null
          amount: number
          attachments: string[] | null
          brazilian_event_type: string | null
          category: string | null
          color: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          end_date: string
          event_type: string
          event_type_id: string | null
          icon: string | null
          id: string
          installment_info: Json | null
          is_income: boolean | null
          is_recurring: boolean | null
          location: string | null
          merchant_category: string | null
          metadata: Json | null
          notes: string | null
          parent_event_id: string | null
          priority: string | null
          recurrence_rule: string | null
          start_date: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          amount: number
          attachments?: string[] | null
          brazilian_event_type?: string | null
          category?: string | null
          color?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_date: string
          event_type: string
          event_type_id?: string | null
          icon?: string | null
          id?: string
          installment_info?: Json | null
          is_income?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          merchant_category?: string | null
          metadata?: Json | null
          notes?: string | null
          parent_event_id?: string | null
          priority?: string | null
          recurrence_rule?: string | null
          start_date: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          amount?: number
          attachments?: string[] | null
          brazilian_event_type?: string | null
          category?: string | null
          color?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string
          event_type?: string
          event_type_id?: string | null
          icon?: string | null
          id?: string
          installment_info?: Json | null
          is_income?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          merchant_category?: string | null
          metadata?: Json | null
          notes?: string | null
          parent_event_id?: string | null
          priority?: string | null
          recurrence_rule?: string | null
          start_date?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "financial_events"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_detection_rules: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          rule_type: string
          threshold: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          rule_type: string
          threshold: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          rule_type?: string
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_timestamp: string
          google_user_email: string
          id: string
          refresh_token: string
          scope: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_timestamp: string
          google_user_email: string
          id?: string
          refresh_token: string
          scope: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_timestamp?: string
          google_user_email?: string
          id?: string
          refresh_token?: string
          scope?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_holds: {
        Row: {
          active: boolean | null
          case_reference: string | null
          created_at: string | null
          expires_at: string | null
          hold_type: string
          id: string
          placed_by: string | null
          reason: string
          released_at: string | null
          released_by: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          case_reference?: string | null
          created_at?: string | null
          expires_at?: string | null
          hold_type: string
          id?: string
          placed_by?: string | null
          reason: string
          released_at?: string | null
          released_by?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          case_reference?: string | null
          created_at?: string | null
          expires_at?: string | null
          hold_type?: string
          id?: string
          placed_by?: string | null
          reason?: string
          released_at?: string | null
          released_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nlu_learning_data: {
        Row: {
          confidence_improvement: number
          correction_applied: string
          created_at: string | null
          error_pattern: string
          id: string
          linguistic_style: string | null
          original_confidence: number
          original_text: string
          regional_variation: string | null
          success: boolean
          timestamp: string | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          confidence_improvement: number
          correction_applied: string
          created_at?: string | null
          error_pattern: string
          id?: string
          linguistic_style?: string | null
          original_confidence: number
          original_text: string
          regional_variation?: string | null
          success: boolean
          timestamp?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          confidence_improvement?: number
          correction_applied?: string
          created_at?: string | null
          error_pattern?: string
          id?: string
          linguistic_style?: string | null
          original_confidence?: number
          original_text?: string
          regional_variation?: string | null
          success?: boolean
          timestamp?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          otp_code: string
          phone_number: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          otp_code: string
          phone_number: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          otp_code?: string
          phone_number?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_rules: {
        Row: {
          autonomy_level: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_amount: number
          metadata: Json | null
          payee_key: string | null
          payee_name: string
          payee_type: string | null
          preferred_time: string | null
          tolerance_percentage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          autonomy_level?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount: number
          metadata?: Json | null
          payee_key?: string | null
          payee_name: string
          payee_type?: string | null
          preferred_time?: string | null
          tolerance_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          autonomy_level?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number
          metadata?: Json | null
          payee_key?: string | null
          payee_name?: string
          payee_type?: string | null
          preferred_time?: string | null
          tolerance_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pix_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_favorite: boolean | null
          key_type: string
          key_value: string
          label: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          key_type: string
          key_value: string
          label?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          key_type?: string
          key_value?: string
          label?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pix_transfers: {
        Row: {
          amount: number
          confirmation_method: string | null
          confirmed_at: string | null
          created_at: string | null
          description: string | null
          end_to_end_id: string | null
          executed_at: string | null
          id: string
          initiation_method: string | null
          metadata: Json | null
          pix_key: string
          pix_key_type: string | null
          recipient_bank: string | null
          recipient_document: string | null
          recipient_name: string
          requires_confirmation: boolean | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          confirmation_method?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_to_end_id?: string | null
          executed_at?: string | null
          id?: string
          initiation_method?: string | null
          metadata?: Json | null
          pix_key: string
          pix_key_type?: string | null
          recipient_bank?: string | null
          recipient_document?: string | null
          recipient_name: string
          requires_confirmation?: boolean | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          confirmation_method?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_to_end_id?: string | null
          executed_at?: string | null
          id?: string
          initiation_method?: string | null
          metadata?: Json | null
          pix_key?: string
          pix_key_type?: string | null
          recipient_bank?: string | null
          recipient_document?: string | null
          recipient_name?: string
          requires_confirmation?: boolean | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_auth_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          push_token: string
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          push_token: string
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          push_token?: string
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          amount: number
          approval_method: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          due_date: string
          error_code: string | null
          error_message: string | null
          executed_at: string | null
          execution_attempts: number | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          metadata: Json | null
          payee_key: string
          payee_name: string
          payment_type: string | null
          requires_approval: boolean | null
          rule_id: string | null
          scheduled_time: string
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          approval_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          due_date: string
          error_code?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          payee_key: string
          payee_name: string
          payment_type?: string | null
          requires_approval?: boolean | null
          rule_id?: string | null
          scheduled_time: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          approval_method?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          due_date?: string
          error_code?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          payee_key?: string
          payee_name?: string
          payment_type?: string | null
          requires_approval?: boolean | null
          rule_id?: string | null
          scheduled_time?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "payment_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          method: string | null
          risk_score: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          method?: string | null
          risk_score?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          method?: string | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_manual_entry: boolean | null
          merchant_name: string | null
          status: string | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_manual_entry?: boolean | null
          merchant_name?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_manual_entry?: boolean | null
          merchant_name?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          last_activity: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consent: {
        Row: {
          consent_date: string
          consent_type: string
          consent_version: string
          created_at: string | null
          granted: boolean
          id: string
          ip_address: unknown
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_date?: string
          consent_type: string
          consent_version?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_date?: string
          consent_type?: string
          consent_version?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string | null
          id: string
          pin_hash: string
          salt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_hash: string
          salt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_hash?: string
          salt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility_high_contrast: boolean | null
          accessibility_large_text: boolean | null
          accessibility_screen_reader: boolean | null
          auto_categorize: boolean | null
          budget_alerts: boolean | null
          created_at: string | null
          id: string
          notifications_email: boolean | null
          notifications_push: boolean | null
          notifications_sms: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
          voice_feedback: boolean | null
        }
        Insert: {
          accessibility_high_contrast?: boolean | null
          accessibility_large_text?: boolean | null
          accessibility_screen_reader?: boolean | null
          auto_categorize?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          id?: string
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_feedback?: boolean | null
        }
        Update: {
          accessibility_high_contrast?: boolean | null
          accessibility_large_text?: boolean | null
          accessibility_screen_reader?: boolean | null
          auto_categorize?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          id?: string
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_feedback?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_preferences: {
        Row: {
          created_at: string | null
          enable_push_notifications: boolean | null
          id: string
          lockout_duration_minutes: number | null
          max_failed_attempts: number | null
          phone_number: string | null
          require_biometric: boolean | null
          require_otp_for_sensitive_operations: boolean | null
          session_timeout_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_push_notifications?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_failed_attempts?: number | null
          phone_number?: string | null
          require_biometric?: boolean | null
          require_otp_for_sensitive_operations?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_push_notifications?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_failed_attempts?: number | null
          phone_number?: string | null
          require_biometric?: boolean | null
          require_otp_for_sensitive_operations?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          autonomy_level: number | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          currency: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_login: string | null
          phone: string | null
          profile_image_url: string | null
          timezone: string | null
          updated_at: string | null
          voice_command_enabled: boolean | null
        }
        Insert: {
          autonomy_level?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          phone?: string | null
          profile_image_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          voice_command_enabled?: boolean | null
        }
        Update: {
          autonomy_level?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          phone?: string | null
          profile_image_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          voice_command_enabled?: boolean | null
        }
        Relationships: []
      }
      voice_audit_logs: {
        Row: {
          action: string
          audio_id: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          audio_id: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          audio_id?: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_consent: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_feedback: {
        Row: {
          audio_file_path: string | null
          command_text: string
          confidence_score: number | null
          correction_made: string | null
          created_at: string | null
          feedback_text: string | null
          feedback_type: string | null
          id: string
          rating: number | null
          recognized_text: string | null
          session_id: string | null
          transcription_id: string | null
          user_id: string
          was_correct: boolean | null
        }
        Insert: {
          audio_file_path?: string | null
          command_text: string
          confidence_score?: number | null
          correction_made?: string | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          rating?: number | null
          recognized_text?: string | null
          session_id?: string | null
          transcription_id?: string | null
          user_id: string
          was_correct?: boolean | null
        }
        Update: {
          audio_file_path?: string | null
          command_text?: string
          confidence_score?: number | null
          correction_made?: string | null
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          rating?: number | null
          recognized_text?: string | null
          session_id?: string | null
          transcription_id?: string | null
          user_id?: string
          was_correct?: boolean | null
        }
        Relationships: []
      }
      voice_recordings: {
        Row: {
          channels: number | null
          created_at: string | null
          deleted_at: string | null
          duration_ms: number | null
          file_path: string
          file_size: number | null
          format: string | null
          id: string
          processed: boolean | null
          retention_expires_at: string | null
          sample_rate: number | null
          session_id: string | null
          transcription_id: string | null
          user_id: string
        }
        Insert: {
          channels?: number | null
          created_at?: string | null
          deleted_at?: string | null
          duration_ms?: number | null
          file_path: string
          file_size?: number | null
          format?: string | null
          id?: string
          processed?: boolean | null
          retention_expires_at?: string | null
          sample_rate?: number | null
          session_id?: string | null
          transcription_id?: string | null
          user_id: string
        }
        Update: {
          channels?: number | null
          created_at?: string | null
          deleted_at?: string | null
          duration_ms?: number | null
          file_path?: string
          file_size?: number | null
          format?: string | null
          id?: string
          processed?: boolean | null
          retention_expires_at?: string | null
          sample_rate?: number | null
          session_id?: string | null
          transcription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_transcriptions: {
        Row: {
          audio_storage_path: string
          confidence_score: number | null
          created_at: string | null
          expires_at: string
          id: string
          language: string
          processing_time_ms: number
          transcript: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_storage_path: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          language?: string
          processing_time_ms: number
          transcript: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_storage_path?: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          language?: string
          processing_time_ms?: number
          transcript?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_retention_policies: { Args: never; Returns: undefined }
      get_financial_summary: {
        Args: { user_uuid: string }
        Returns: {
          monthly_expenses: number
          monthly_income: number
          pending_bills_count: number
          total_balance: number
          upcoming_payments_count: number
        }[]
      }
      schedule_retention_check: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

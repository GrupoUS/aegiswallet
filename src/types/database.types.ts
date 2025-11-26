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
      ai_insights: {
        Row: {
          action_suggested: string | null
          action_url: string | null
          amount: number | null
          category: string | null
          comparison_period: string | null
          confidence_score: number | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          is_read: boolean | null
          metadata: Json | null
          model_version: string | null
          percentage_change: number | null
          read_at: string | null
          related_entities: Json | null
          severity: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_suggested?: string | null
          action_url?: string | null
          amount?: number | null
          category?: string | null
          comparison_period?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          model_version?: string | null
          percentage_change?: number | null
          read_at?: string | null
          related_entities?: Json | null
          severity?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_suggested?: string | null
          action_url?: string | null
          amount?: number | null
          category?: string | null
          comparison_period?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          model_version?: string | null
          percentage_change?: number | null
          read_at?: string | null
          related_entities?: Json | null
          severity?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json
          error_message: string | null
          id: string
          ip_address: unknown
          new_values: Json
          old_values: Json
          resource_id: string | null
          resource_type: string
          severity: string
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json
          old_values?: Json
          resource_id?: string | null
          resource_type: string
          severity?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json
          old_values?: Json
          resource_id?: string | null
          resource_type?: string
          severity?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempt_time: string | null
          details: Json | null
          id: string
          ip_address: string
          is_successful: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_time?: string | null
          details?: Json | null
          id?: string
          ip_address: string
          is_successful?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_time?: string | null
          details?: Json | null
          id?: string
          ip_address?: string
          is_successful?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string
          is_active: boolean | null
          last_activity: string | null
          refresh_token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address: string
          is_active?: boolean | null
          last_activity?: string | null
          refresh_token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string
          is_active?: boolean | null
          last_activity?: string | null
          refresh_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string
          account_type: string
          agency: string
          balance: number
          bank_name: string
          created_at: string | null
          currency: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          agency: string
          balance?: number
          bank_name: string
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          agency?: string
          balance?: number
          bank_name?: string
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          institution_id: string
          institution_name: string
          last_synced_at: string | null
          metadata: Json | null
          refresh_token: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          institution_id: string
          institution_name: string
          last_synced_at?: string | null
          metadata?: Json | null
          refresh_token: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          institution_id?: string
          institution_name?: string
          last_synced_at?: string | null
          metadata?: Json | null
          refresh_token?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_consent: {
        Row: {
          consent_id: string
          created_at: string | null
          expires_at: string
          id: string
          permissions: string[]
          scopes: string[]
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consent_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          permissions: string[]
          scopes: string[]
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consent_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          permissions?: string[]
          scopes?: string[]
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          institution_id: string
          refresh_token: string
          scope: string[]
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          institution_id: string
          refresh_token: string
          scope: string[]
          token_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          institution_id?: string
          refresh_token?: string
          scope?: string[]
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      biometric_credentials: {
        Row: {
          counter: number
          created_at: string | null
          credential_id: string
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string | null
          credential_id: string
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string | null
          credential_id?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      biometric_patterns: {
        Row: {
          confidence_score: number
          created_at: string | null
          device_info: Json
          id: string
          pattern_hash: string
          pattern_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          device_info: Json
          id?: string
          pattern_hash: string
          pattern_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          device_info?: Json
          id?: string
          pattern_hash?: string
          pattern_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_audit: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_settings: {
        Row: {
          auto_sync: boolean | null
          created_at: string | null
          id: string
          sync_frequency_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string | null
          id?: string
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string | null
          id?: string
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_context_snapshots: {
        Row: {
          account_balances: Json | null
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          recent_transactions: Json | null
          upcoming_events: Json | null
          user_preferences: Json | null
          context_version: number | null
        }
        Insert: {
          account_balances?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recent_transactions?: Json | null
          upcoming_events?: Json | null
          user_preferences?: Json | null
          context_version?: number | null
        }
        Update: {
          account_balances?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recent_transactions?: Json | null
          upcoming_events?: Json | null
          user_preferences?: Json | null
          context_version?: number | null
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
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          notes: string | null
          is_favorite: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          notes?: string | null
          is_favorite?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          notes?: string | null
          is_favorite?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number
          metadata: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          reasoning: string | null
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reasoning?: string | null
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
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
      financial_events: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string
          event_type_id: string
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          event_type_id: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          event_type_id?: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_detection_logs: {
        Row: {
          action_taken: string
          created_at: string | null
          details: Json | null
          detection_rules: string[]
          id: string
          ip_address: string | null
          risk_level: string
          risk_score: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          details?: Json | null
          detection_rules: string[]
          id?: string
          ip_address?: string | null
          risk_level: string
          risk_score: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          details?: Json | null
          detection_rules?: string[]
          id?: string
          ip_address?: string | null
          risk_level?: string
          risk_score?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          email: string
          expires_at: number
          id: string
          refresh_token: string
          scope: string
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email: string
          expires_at: number
          id?: string
          refresh_token: string
          scope: string
          token_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email?: string
          expires_at?: number
          id?: string
          refresh_token?: string
          scope?: string
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          status: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          status: string
          subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          status?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurring_events: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          event_type_id: string
          id: string
          interval_count: number
          interval_unit: string
          last_generated_date: string | null
          next_due_date: string
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_type_id: string
          id?: string
          interval_count?: number
          interval_unit: string
          last_generated_date?: string | null
          next_due_date: string
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_type_id?: string
          id?: string
          interval_count?: number
          interval_unit?: string
          last_generated_date?: string | null
          next_due_date?: string
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          message: string
          phone_number: string
          provider_message_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          message: string
          phone_number: string
          provider_message_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          message?: string
          phone_number?: string
          provider_message_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_behavior_profiles: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          risk_score: number
          typical_behavior: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          risk_score?: number
          typical_behavior?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          risk_score?: number
          typical_behavior?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active_at: string | null
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_metrics: {
        Row: {
          command_type: string | null
          confidence_score: number
          created_at: string | null
          duration_ms: number | null
          error_type: string | null
          id: string
          is_successful: boolean
          processing_time_ms: number
          user_id: string
        }
        Insert: {
          command_type?: string | null
          confidence_score: number
          created_at?: string | null
          duration_ms?: number | null
          error_type?: string | null
          id?: string
          is_successful: boolean
          processing_time_ms: number
          user_id: string
        }
        Update: {
          command_type?: string | null
          confidence_score?: number
          created_at?: string | null
          duration_ms?: number | null
          error_type?: string | null
          id?: string
          is_successful?: boolean
          processing_time_ms?: number
          user_id?: string
        }
        Relationships: []
      }
      voice_transcriptions: {
        Row: {
          audio_url: string | null
          confidence: number
          created_at: string | null
          duration_seconds: number | null
          id: string
          language: string
          processed_at: string | null
          status: string
          transcription_text: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          confidence: number
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language: string
          processed_at?: string | null
          status: string
          transcription_text: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          confidence?: number
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string
          processed_at?: string | null
          status?: string
          transcription_text: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_financial_summary: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

// Exclude __InternalSupabase from schema key lookups
type DatabaseSchemaKey = Exclude<keyof Database, "__InternalSupabase">

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: DatabaseSchemaKey },
  TableName extends PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: DatabaseSchemaKey },
  TableName extends PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: DatabaseSchemaKey },
  TableName extends PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: DatabaseSchemaKey }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: DatabaseSchemaKey },
  EnumName extends PublicEnumNameOrOptions extends { schema: DatabaseSchemaKey }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: DatabaseSchemaKey }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: DatabaseSchemaKey },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: DatabaseSchemaKey
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: DatabaseSchemaKey }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
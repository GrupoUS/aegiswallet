export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          language: string | null
          currency: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          language?: string | null
          currency?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          language?: string | null
          currency?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          institution_name: string | null
          balance: number | null
          currency: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          institution_name?: string | null
          balance?: number | null
          currency?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          institution_name?: string | null
          balance?: number | null
          currency?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_events: {
        Row: {
          id: string
          user_id: string
          amount: number | null
          description: string | null
          category: string | null
          event_type_id: string | null
          is_income: boolean | null
          due_date: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount?: number | null
          description?: string | null
          category?: string | null
          event_type_id?: string | null
          is_income?: boolean | null
          due_date?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number | null
          description?: string | null
          category?: string | null
          event_type_id?: string | null
          is_income?: boolean | null
          due_date?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string | null
          details: Json | null
          error_message: string | null
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action?: string | null
          details?: Json | null
          error_message?: string | null
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string | null
          details?: Json | null
          error_message?: string | null
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          id: string
          user_id: string
          method: string | null
          failed_attempts: number | null
          is_locked: boolean | null
          lockout_until: string | null
          last_attempt_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          method?: string | null
          failed_attempts?: number | null
          is_locked?: boolean | null
          lockout_until?: string | null
          last_attempt_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          method?: string | null
          failed_attempts?: number | null
          is_locked?: boolean | null
          lockout_until?: string | null
          last_attempt_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          id: string
          name: string | null
          description: string | null
          color: string | null
          icon: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          description?: string | null
          color?: string | null
          icon?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_rules: {
        Row: {
          id: string
          user_id: string | null
          name: string | null
          conditions: Json | null
          actions: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name?: string | null
          conditions?: Json | null
          actions?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string | null
          conditions?: Json | null
          actions?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          id: string
          user_id: string | null
          amount: number | null
          description: string | null
          category: string | null
          next_date: string | null
          frequency: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount?: number | null
          description?: string | null
          category?: string | null
          next_date?: string | null
          frequency?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          amount?: number | null
          description?: string | null
          category?: string | null
          next_date?: string | null
          frequency?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voice_transcriptions: {
        Row: {
          id: string
          user_id: string | null
          audio_path: string | null
          transcription: string | null
          confidence: number | null
          language: string | null
          duration: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          audio_path?: string | null
          transcription?: string | null
          confidence?: number | null
          language?: string | null
          duration?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          audio_path?: string | null
          transcription?: string | null
          confidence?: number | null
          language?: string | null
          duration?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      event_types: {
        Row: {
          id: string
          name: string | null
          description: string | null
          icon: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          description?: string | null
          icon?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          description?: string | null
          icon?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_retention_policies: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      get_financial_summary: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      schedule_retention_check: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
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
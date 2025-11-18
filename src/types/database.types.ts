export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          cpf: string | null;
          birth_date: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          cpf?: string | null;
          birth_date?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          cpf?: string | null;
          birth_date?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'system' | 'light' | 'dark';
          language: string;
          timezone: string;
          currency: string;
          notifications_enabled: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          notifications_sms: boolean;
          auto_categorize: boolean;
          budget_alerts: boolean;
          voice_commands_enabled: boolean;
          voice_feedback: boolean;
          accessibility_high_contrast: boolean;
          accessibility_large_text: boolean;
          accessibility_screen_reader: boolean;
          autonomy_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: 'system' | 'light' | 'dark';
          language?: string;
          timezone?: string;
          currency?: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          notifications_sms?: boolean;
          auto_categorize?: boolean;
          budget_alerts?: boolean;
          voice_commands_enabled?: boolean;
          voice_feedback?: boolean;
          accessibility_high_contrast?: boolean;
          accessibility_large_text?: boolean;
          accessibility_screen_reader?: boolean;
          autonomy_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: 'system' | 'light' | 'dark';
          language?: string;
          timezone?: string;
          currency?: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          notifications_sms?: boolean;
          auto_categorize?: boolean;
          budget_alerts?: boolean;
          voice_commands_enabled?: boolean;
          voice_feedback?: boolean;
          accessibility_high_contrast?: boolean;
          accessibility_large_text?: boolean;
          accessibility_screen_reader?: boolean;
          autonomy_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_consent_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_consent: {
        Row: {
          user_id: string;
          consent_type: string;
          granted: boolean;
          consent_version: string;
          consent_date: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          consent_type: string;
          granted: boolean;
          consent_version: string;
          consent_date?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          consent_type?: string;
          granted?: boolean;
          consent_version?: string;
          consent_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          outcome: 'success' | 'failure' | 'warning';
          details: Json;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          outcome?: 'success' | 'failure' | 'warning';
          details: Json;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          outcome?: 'success' | 'failure' | 'warning';
          details?: Json;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          type: 'income' | 'expense' | 'transfer';
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          type?: 'income' | 'expense' | 'transfer';
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          category?: string;
          date?: string;
          type?: 'income' | 'expense' | 'transfer';
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bills_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          due_date: string;
          status: 'pending' | 'paid' | 'overdue';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          due_date: string;
          status?: 'pending' | 'paid' | 'overdue';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          due_date?: string;
          status?: 'pending' | 'paid' | 'overdue';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_accounts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          bank_name: string;
          account_number: string;
          balance: number;
          currency: string;
          is_active: boolean;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank_name: string;
          account_number: string;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bank_name?: string;
          account_number?: string;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_events_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_events: {
        Row: {
          id: string;
          user_id: string;
          event_type_id: string | null;
          title: string;
          description: string | null;
          amount: number | null;
          is_income: boolean;
          account_id: string | null;
          category_id: string | null;
          event_date: string;
          due_date: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          priority: 'low' | 'medium' | 'high';
          is_completed: boolean;
          completed_at: string | null;
          transaction_id: string | null;
          tags: string[] | null;
          attachments: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type_id?: string | null;
          title: string;
          description?: string | null;
          amount?: number | null;
          is_income?: boolean;
          account_id?: string | null;
          category_id?: string | null;
          event_date: string;
          due_date?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          priority?: 'low' | 'medium' | 'high';
          is_completed?: boolean;
          completed_at?: string | null;
          transaction_id?: string | null;
          tags?: string[] | null;
          attachments?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type_id?: string | null;
          title?: string;
          description?: string | null;
          amount?: number | null;
          is_income?: boolean;
          account_id?: string | null;
          category_id?: string | null;
          event_date?: string;
          due_date?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          priority?: 'low' | 'medium' | 'high';
          is_completed?: boolean;
          completed_at?: string | null;
          transaction_id?: string | null;
          tags?: string[] | null;
          attachments?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_events_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      voice_feedback: {
        Row: {
          id: string;

          user_id: string;

          command: string;

          rating: number;

          feedback_text: string | null;

          response: 'general' | 'speed' | 'accuracy' | 'understanding';

          created_at: string;

          updated_at: string;
        };

        Insert: {
          id?: string;

          user_id: string;

          command: string;

          rating: number;

          feedback_text?: string | null;

          response?: 'general' | 'speed' | 'accuracy' | 'understanding';

          created_at?: string;

          updated_at?: string;
        };

        Update: {
          id?: string;

          user_id?: string;

          command?: string;

          rating?: number;

          feedback_text?: string | null;

          response?: 'general' | 'speed' | 'accuracy' | 'understanding';

          created_at?: string;

          updated_at?: string;
        };

        Relationships: [];
      };

      voice_metrics: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          command: string;
          confidence_score: number | null;
          processing_time_ms: number | null;
          stt_time_ms: number | null;
          nlu_time_ms: number | null;
          response_time_ms: number | null;
          success: boolean;
          error_type: string | null;
          error_message: string | null;
          user_region: string | null;
          device_type: string | null;
          browser: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          command: string;
          confidence_score?: number | null;
          processing_time_ms?: number | null;
          stt_time_ms?: number | null;
          nlu_time_ms?: number | null;
          response_time_ms?: number | null;
          success?: boolean;
          error_type?: string | null;
          error_message?: string | null;
          user_region?: string | null;
          device_type?: string | null;
          browser?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          command?: string;
          confidence_score?: number | null;
          processing_time_ms?: number | null;
          stt_time_ms?: number | null;
          nlu_time_ms?: number | null;
          response_time_ms?: number | null;
          success?: boolean;
          error_type?: string | null;
          error_message?: string | null;
          user_region?: string | null;
          device_type?: string | null;
          browser?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'voice_metrics_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          access_token?: string;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bank_tokens_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_bank_links: {
        Row: {
          id: string;
          user_id: string;
          institution_name: string;
          institution_id: string | null;
          connection_status: 'active' | 'inactive' | 'revoked';
          last_synced_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          institution_name: string;
          institution_id?: string | null;
          connection_status?: 'active' | 'inactive' | 'revoked';
          last_synced_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          institution_name?: string;
          institution_id?: string | null;
          connection_status?: 'active' | 'inactive' | 'revoked';
          last_synced_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_bank_links_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      // PIX-related tables

      pix_keys: {
        Row: {
          id: string;
          user_id: string;
          key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          key_value: string;
          label: string | null;
          is_favorite: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          key_value: string;
          label?: string | null;
          is_favorite?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key_type?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          key_value?: string;
          label?: string | null;
          is_favorite?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pix_keys_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pix_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'sent' | 'received' | 'scheduled';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          amount: number;
          pix_key: string;
          pix_key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          description: string | null;
          recipient_name: string | null;
          recipient_document: string | null;
          scheduled_date: string | null;
          transaction_id: string | null;
          end_to_end_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'sent' | 'received' | 'scheduled';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          amount: number;
          pix_key: string;
          pix_key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          description?: string | null;
          recipient_name?: string | null;
          recipient_document?: string | null;
          scheduled_date?: string | null;
          transaction_id?: string | null;
          end_to_end_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'sent' | 'received' | 'scheduled';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          amount?: number;
          pix_key?: string;
          pix_key_type?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
          description?: string | null;
          recipient_name?: string | null;
          recipient_document?: string | null;
          scheduled_date?: string | null;
          transaction_id?: string | null;
          end_to_end_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pix_transactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pix_qr_codes: {
        Row: {
          id: string;
          user_id: string;
          pix_key: string;
          amount: number | null;
          description: string | null;
          qr_code_data: string;
          is_active: boolean;
          expires_at: string | null;
          max_uses: number | null;
          current_uses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pix_key: string;
          amount?: number | null;
          description?: string | null;
          qr_code_data: string;
          is_active?: boolean;
          expires_at?: string | null;
          max_uses?: number | null;
          current_uses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pix_key?: string;
          amount?: number | null;
          description?: string | null;
          qr_code_data?: string;
          is_active?: boolean;
          expires_at?: string | null;
          max_uses?: number | null;
          current_uses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pix_qr_codes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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

// Individual type interfaces
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
  currency: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  voice_commands_enabled: boolean;
  autonomy_level: number;
  created_at: string;
  updated_at: string;
}

export interface UserConsent {
  user_id: string;
  consent_type: string;
  granted: boolean;
  consent_version: string;
  consent_date: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: 'success' | 'failure' | 'warning';
  details: Json;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  balance: number;
  currency: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialEvent {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceFeedback {
  id: string;

  user_id: string;

  command: string;

  rating: number;

  feedback_text: string | null;

  response: 'general' | 'speed' | 'accuracy' | 'understanding';

  created_at: string;

  updated_at: string;
}

export interface VoiceMetric {
  id: string;
  user_id: string;
  session_id: string | null;
  command: string;
  confidence_score: number | null;
  processing_time_ms: number | null;
  stt_time_ms: number | null;
  nlu_time_ms: number | null;
  response_time_ms: number | null;
  success: boolean;
  error_type: string | null;
  error_message: string | null;
  user_region: string | null;
  device_type: string | null;
  browser: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface BankToken {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBankLink {
  id: string;
  user_id: string;
  institution_name: string;
  institution_id: string | null;
  connection_status: 'active' | 'inactive' | 'revoked';
  last_synced_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

// PIX-related interfaces

export interface PixKey {
  id: string;
  user_id: string;
  key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  key_value: string;
  label: string | null;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PixTransaction {
  id: string;
  user_id: string;
  transaction_type: 'sent' | 'received' | 'scheduled';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  pix_key: string;
  pix_key_type: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  description: string | null;
  recipient_name: string | null;
  recipient_document: string | null;
  scheduled_date: string | null;
  transaction_id: string | null;
  end_to_end_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PixQRCode {
  id: string;
  user_id: string;
  pix_key: string;
  amount: number | null;
  description: string | null;
  qr_code_data: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  updated_at: string;
}

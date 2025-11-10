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
          voice_commands_enabled: boolean;
          autonomy_level: number;
          created_at: string;
          updated_at: string;
        };
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
      };
      financial_events: {
        Row: {
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
        };
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          autonomy_level: number
          voice_command_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          autonomy_level?: number
          voice_command_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          autonomy_level?: number
          voice_command_enabled?: boolean
          updated_at?: string
        }
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          belvo_account_id: string
          institution_id: string
          institution_name: string
          account_mask: string
          balance: number
          is_active: boolean
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          belvo_account_id: string
          institution_id: string
          institution_name: string
          account_mask: string
          balance?: number
          is_active?: boolean
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          belvo_account_id?: string
          institution_id?: string
          institution_name?: string
          account_mask?: string
          balance?: number
          is_active?: boolean
          last_sync?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          bank_account_id: string | null
          amount: number
          description: string
          category: string | null
          transaction_date: string
          is_categorized: boolean
          confidence_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_account_id?: string | null
          amount: number
          description: string
          category?: string | null
          transaction_date: string
          is_categorized?: boolean
          confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_account_id?: string | null
          amount?: number
          description?: string
          category?: string | null
          transaction_date?: string
          is_categorized?: boolean
          confidence_score?: number | null
          updated_at?: string
        }
      }
      voice_commands: {
        Row: {
          id: string
          user_id: string
          command: string
          intent: string
          confidence: number | null
          response: string | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          command: string
          intent: string
          confidence?: number | null
          response?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          command?: string
          intent?: string
          confidence?: number | null
          response?: string | null
          processing_time_ms?: number | null
        }
      }
      pix_transactions: {
        Row: {
          id: string
          user_id: string
          bank_account_id: string | null
          key: string
          key_type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
          amount: number
          description: string | null
          recipient_name: string | null
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_account_id?: string | null
          key: string
          key_type: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
          amount: number
          description?: string | null
          recipient_name?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_account_id?: string | null
          key?: string
          key_type?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'
          amount?: number
          description?: string | null
          recipient_name?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id?: string | null
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          user_id: string
          bank_account_id: string | null
          barcode: string
          amount: number
          description: string
          due_date: string
          status: 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_account_id?: string | null
          barcode: string
          amount: number
          description: string
          due_date: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_account_id?: string | null
          barcode?: string
          amount?: number
          description?: string
          due_date?: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_date?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          icon: string
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          icon?: string
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          icon?: string
          is_system?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          operation_type: string
          table_name: string
          record_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          operation_type: string
          table_name: string
          record_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          operation_type?: string
          table_name?: string
          record_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_bank_account: {
        Args: {
          bank_account_uuid: string
        }
        Returns: boolean
      }
      user_owns_transaction: {
        Args: {
          transaction_uuid: string
        }
        Returns: boolean
      }
      get_user_autonomy_level: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      log_sensitive_operation: {
        Args: {
          operation_type: string
          table_name: string
          record_id: string
          details?: Json | null
        }
        Returns: void
      }
      cleanup_old_voice_commands: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: void
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

export interface AuthError {
  message: string
  status: number
}

export interface AuthResponse {
  data: any | null
  error: AuthError | null
}

export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface AuthUser {
  id: string
  app_metadata: {
    provider?: string
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  aud: string
  confirmation_sent_at?: string
  recovery_sent_at?: string
  email_change_sent_at?: string
  new_email?: string
  invited_at?: string
  action_link?: string
  email?: string
  phone?: string
  confirmed_at?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  identities: Array<{
    identity_id: string
    provider: string
    last_sign_in_at: string
    created_at: string
    identity_data: {
      [key: string]: any
    }
  }>
  factors?: Array<{
    factor_id: string
    friendly_name?: string
    factor_type: string
    status: string
    created_at: string
    updated_at: string
  }>
}

export interface AuthSession {
  provider_token?: string
  provider_refresh_token?: string
  access_token: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

export interface SupabaseClientOptions {
  auth?: {
    autoRefreshToken?: boolean
    persistSession?: boolean
    detectSessionInUrl?: boolean
    flowType?: 'implicit' | 'pkce'
    debug?: boolean
  }
  global?: {
    headers?: Record<string, string>
  }
  db?: {
    schema?: string
  }
  realtime?: {
    params?: Record<string, string>
  }
}

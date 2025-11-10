/**
 * Basic Database Types
 * Temporary file to fix type issues during deployment preparation
 */

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
          autonomy_level: number;
          voice_command_enabled: boolean;
          language: string;
          timezone: string;
          currency: string;
          profile_image_url: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['users']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          notifications_email: boolean;
          notifications_push: boolean;
          voice_feedback: boolean;
          accessibility_high_contrast: boolean;
          accessibility_large_text: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['user_preferences']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_mask: string;
          balance: number | null;
          currency: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bank_accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bank_accounts']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          description: string;
          amount: number;
          category_id: string | null;
          transaction_type: string;
          transaction_date: string;
          status: string | null;
          account_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['transactions']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      transaction_categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string;
        };
        Insert: Database['public']['Tables']['transaction_categories']['Row'];
        Update: Partial<Database['public']['Tables']['transaction_categories']['Insert']>;
      };
      financial_events: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          amount: number | null;
          event_date: string;
          event_type_id: string | null;
          is_completed: boolean | null;
          priority: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['financial_events']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['financial_events']['Insert']>;
      };
      event_types: {
        Row: {
          id: string;
          name: string;
          color: string;
        };
        Insert: Database['public']['Tables']['event_types']['Row'];
        Update: Partial<Database['public']['Tables']['event_types']['Insert']>;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          is_favorite: boolean;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };
      pix_keys: {
        Row: {
          id: string;
          user_id: string | null;
          key_type: string;
          key_value: string;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pix_keys']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pix_keys']['Insert']>;
      };
      pix_transactions: {
        Row: {
          id: string;
          user_id: string | null;
          amount: number;
          recipient_key: string;
          recipient_name: string;
          description: string | null;
          status: string;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pix_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pix_transactions']['Insert']>;
      };
      pix_qr_codes: {
        Row: {
          id: string;
          user_id: string | null;
          amount: number | null;
          description: string | null;
          qr_code_data: string;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pix_qr_codes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pix_qr_codes']['Insert']>;
      };
    };
  };
}

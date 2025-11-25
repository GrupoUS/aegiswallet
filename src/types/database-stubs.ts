/**
 * Database Table Stubs
 *
 * Temporary type definitions for database tables that are referenced in code
 * but not yet implemented in the actual database schema.
 *
 * TODO: Replace these stubs with proper database migrations and regenerate types
 * from Supabase using: bun run supabase gen types typescript
 */

import type { Json } from '@/integrations/supabase/types';

// Voice Metrics Table
export interface VoiceMetric {
  id: string;
  user_id: string;
  session_id: string | null;
  command_text: string | null;
  confidence_score: number | null;
  processing_time_ms: number | null;
  success: boolean | null;
  error_type: string | null;
  language: string | null;
  metadata: Json | null;
  created_at: string | null;
}

export interface VoiceMetricInsert {
  id?: string;
  user_id: string;
  session_id?: string | null;
  command_text?: string | null;
  confidence_score?: number | null;
  processing_time_ms?: number | null;
  success?: boolean | null;
  error_type?: string | null;
  language?: string | null;
  metadata?: Json | null;
  created_at?: string | null;
}

export interface VoiceMetricUpdate {
  id?: string;
  user_id?: string;
  session_id?: string | null;
  command_text?: string | null;
  confidence_score?: number | null;
  processing_time_ms?: number | null;
  success?: boolean | null;
  error_type?: string | null;
  language?: string | null;
  metadata?: Json | null;
  created_at?: string | null;
}

// User Sessions Table
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
}

export interface UserSessionInsert {
  id?: string;
  user_id: string;
  session_token: string;
  device_info?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
}

export interface UserSessionUpdate {
  id?: string;
  user_id?: string;
  session_token?: string;
  device_info?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
}

// User Behavior Profiles Table
export interface UserBehaviorProfile {
  id: string;
  user_id: string;
  typical_behavior: Json;
  known_devices: Json | null;
  known_locations: Json | null;
  last_updated: string | null;
  created_at: string | null;
}

export interface UserBehaviorProfileInsert {
  id?: string;
  user_id: string;
  typical_behavior: Json;
  known_devices?: Json | null;
  known_locations?: Json | null;
  last_updated?: string | null;
  created_at?: string | null;
}

export interface UserBehaviorProfileUpdate {
  id?: string;
  user_id?: string;
  typical_behavior?: Json;
  known_devices?: Json | null;
  known_locations?: Json | null;
  last_updated?: string | null;
  created_at?: string | null;
}

// Fraud Detection Logs Table
export interface FraudDetectionLog {
  id: string;
  user_id: string | null;
  transaction_id: string | null;
  risk_score: number;
  risk_factors: Json;
  action_taken: string | null;
  metadata: Json | null;
  created_at: string | null;
}

export interface FraudDetectionLogInsert {
  id?: string;
  user_id?: string | null;
  transaction_id?: string | null;
  risk_score: number;
  risk_factors: Json;
  action_taken?: string | null;
  metadata?: Json | null;
  created_at?: string | null;
}

export interface FraudDetectionLogUpdate {
  id?: string;
  user_id?: string | null;
  transaction_id?: string | null;
  risk_score?: number;
  risk_factors?: Json;
  action_taken?: string | null;
  metadata?: Json | null;
  created_at?: string | null;
}

// Push Subscriptions Table
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
  device_info: Json | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PushSubscriptionInsert {
  id?: string;
  user_id: string;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
  device_info?: Json | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PushSubscriptionUpdate {
  id?: string;
  user_id?: string;
  endpoint?: string;
  auth_key?: string;
  p256dh_key?: string;
  device_info?: Json | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Push Logs Table
export interface PushLog {
  id: string;
  user_id: string | null;
  subscription_id: string | null;
  title: string;
  body: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string | null;
}

export interface PushLogInsert {
  id?: string;
  user_id?: string | null;
  subscription_id?: string | null;
  title: string;
  body?: string | null;
  status?: string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
}

export interface PushLogUpdate {
  id?: string;
  user_id?: string | null;
  subscription_id?: string | null;
  title?: string;
  body?: string | null;
  status?: string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
}

// SMS Logs Table
export interface SmsLog {
  id: string;
  user_id: string | null;
  phone_number: string;
  message: string;
  status: string;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string | null;
}

export interface SmsLogInsert {
  id?: string;
  user_id?: string | null;
  phone_number: string;
  message: string;
  status?: string;
  provider?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
}

export interface SmsLogUpdate {
  id?: string;
  user_id?: string | null;
  phone_number?: string;
  message?: string;
  status?: string;
  provider?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
}

// Type map for stub tables (for compatibility with Supabase patterns)
export interface DatabaseStubs {
  voice_metrics: {
    Row: VoiceMetric;
    Insert: VoiceMetricInsert;
    Update: VoiceMetricUpdate;
    Relationships: [];
  };
  user_sessions: {
    Row: UserSession;
    Insert: UserSessionInsert;
    Update: UserSessionUpdate;
    Relationships: [];
  };
  user_behavior_profiles: {
    Row: UserBehaviorProfile;
    Insert: UserBehaviorProfileInsert;
    Update: UserBehaviorProfileUpdate;
    Relationships: [];
  };
  fraud_detection_logs: {
    Row: FraudDetectionLog;
    Insert: FraudDetectionLogInsert;
    Update: FraudDetectionLogUpdate;
    Relationships: [];
  };
  push_subscriptions: {
    Row: PushSubscription;
    Insert: PushSubscriptionInsert;
    Update: PushSubscriptionUpdate;
    Relationships: [];
  };
  push_logs: {
    Row: PushLog;
    Insert: PushLogInsert;
    Update: PushLogUpdate;
    Relationships: [];
  };
  sms_logs: {
    Row: SmsLog;
    Insert: SmsLogInsert;
    Update: SmsLogUpdate;
    Relationships: [];
  };
}

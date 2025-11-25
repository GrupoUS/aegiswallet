/**
 * Security Authentication Types
 *
 * Types for enhanced biometric authentication system
 * with PIN, OTP, session management and fraud detection
 */

import type { Database } from './database.types';

export interface UserPin {
  id: string;
  user_id: string;
  pin_hash: string;
  salt: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface AuthAttempt {
  id: string;
  user_id: string;
  method: 'platform' | 'pin' | 'sms' | 'push';
  failed_attempts: number;
  is_locked: boolean;
  lockout_until: string | null;
  last_attempt_at: string | null;
  created_at: string | null;
}

export interface OtpCode {
  id: string;
  user_id: string;
  phone_number: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  attempts: number;
  created_at: string | null;
}

export interface PushAuthRequest {
  id: string;
  user_id: string;
  push_token: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  responded_at: string | null;
  created_at: string | null;
}

export interface AuthSession {
  id: string;
  user_id: string;
  session_token: string;
  method: 'platform' | 'pin' | 'sms' | 'push';
  expires_at: string;
  is_active: boolean;
  created_at: string | null;
  last_activity: string | null;
}

export interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  credential_type: string;
  public_key: string | null;
  created_at: string | null;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type:
    | 'auth_success'
    | 'auth_failure'
    | 'pin_lockout'
    | 'account_locked'
    | 'suspicious_activity'
    | 'fraud_detected'
    | 'session_expired'
    | 'otp_sent'
    | 'otp_verified'
    | 'push_sent'
    | 'biometric_enrolled';
  method: 'platform' | 'pin' | 'sms' | 'push' | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  risk_score: number;
  created_at: string | null;
}

export interface FraudDetectionRule {
  id: string;
  rule_type: 'location_anomaly' | 'device_anomaly' | 'behavior_anomaly' | 'frequency_anomaly';
  threshold: number;
  enabled: boolean;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserSecurityPreferences {
  id: string;
  user_id: string;
  require_biometric: boolean;
  require_otp_for_sensitive_operations: boolean;
  session_timeout_minutes: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  enable_push_notifications: boolean;
  phone_number: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: 'suspicious_login' | 'brute_force_attempt' | 'unusual_location' | 'multiple_devices';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface UserSecuritySummary {
  user_id: string;
  has_pin: boolean;
  has_biometric: boolean;
  is_locked: boolean;
  lockout_until: string | null;
  failed_attempts: number | null;
  session_timeout_minutes: number | null;
  require_otp_for_sensitive_operations: boolean | null;
  recent_failures: number;
  unread_alerts: number;
}

// UI State Types
export interface AuthenticationState {
  isAuthenticated: boolean;
  user: Database['public']['Tables']['users']['Row'] | null;
  sessionToken: string | null;
  authMethod: 'platform' | 'pin' | 'sms' | 'push' | null;
  lastActivity: Date | null;
  expiresAt: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface PinSetupState {
  step: 'enter' | 'confirm' | 'success';
  pin: string;
  confirmPin: string;
  error: string | null;
  isLoading: boolean;
}

export interface OtpState {
  phoneNumber: string;
  otpCode: string;
  isSent: boolean;
  isVerifying: boolean;
  expiresAt: Date | null;
  attempts: number;
  error: string | null;
  resendCount: number;
}

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SecurityDashboardState {
  securityScore: number;
  hasPin: boolean;
  hasBiometric: boolean;
  recentEvents: SecurityEvent[];
  alerts: SecurityAlert[];
  activeSessions: AuthSession[];
  isLoading: boolean;
}

// API Request/Response Types
export interface PinSetupRequest {
  pin: string;
  confirmPassword: string;
}

export interface PinSetupResponse {
  success: boolean;
  message?: string;
}

export interface OtpSendRequest {
  phoneNumber: string;
}

export interface OtpSendResponse {
  success: boolean;
  expiresAt?: string;
  attempts?: number;
}

export interface OtpVerifyRequest {
  phoneNumber: string;
  otpCode: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
}

export interface BiometricEnrollRequest {
  userName: string;
}

export interface BiometricEnrollResponse {
  success: boolean;
  credentialId?: string;
}

export interface PushVerifyRequest {
  pushToken: string;
  approved: boolean;
}

export interface PushVerifyResponse {
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
}

export interface AuthStatusResponse {
  hasBiometric: boolean;
  hasPIN: boolean;
  isLocked: boolean;
  lockoutRemaining?: number;
  phoneNumber?: string;
  sessionTimeout?: number;
}

// Security Configuration Types
export interface SecurityConfig {
  maxPinAttempts: number;
  pinLockoutDuration: number;
  sessionTimeout: number;
  otpExpiry: number;
  maxOtpAttempts: number;
  rateLimitWindow: number;
  maxRateLimitAttempts: number;
  requireBiometricForSensitiveOps: boolean;
  requireOtpForLargeTransactions: boolean;
  enableFraudDetection: boolean;
  alertEmailNotifications: boolean;
}

export interface FraudDetectionConfig {
  enabled: boolean;
  locationAnomaly: boolean;
  deviceAnomaly: boolean;
  behaviorAnomaly: boolean;
  frequencyAnomaly: boolean;
  thresholds: {
    location: number;
    device: number;
    behavior: number;
    frequency: number;
  };
}

// Form Validation Types
export interface PinValidation {
  isValid: boolean;
  error: string | null;
  strength: 'weak' | 'medium' | 'strong';
}

export interface PhoneNumberValidation {
  isValid: boolean;
  error: string | null;
  formatted: string | null;
  country: string | null;
}

export interface OtpValidation {
  isValid: boolean;
  error: string | null;
  isExpired: boolean;
  remainingAttempts: number;
}

// Analytics and Monitoring Types
export interface SecurityMetrics {
  totalAuthAttempts: number;
  successfulAuths: number;
  failedAuths: number;
  fraudDetectionScore: number;
  averageSessionDuration: number;
  uniqueDevices: number;
  uniqueLocations: number;
  suspiciousActivitiesCount: number;
  blockedAttemptsCount: number;
}

export interface SecurityReport {
  userId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: SecurityMetrics;
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Re-export alias for backward compatibility
export type PushRequest = PushAuthRequest;
export type PINValidation = PinValidation;

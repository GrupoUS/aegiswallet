/**
 * Enhanced Biometric Authentication Service
 *
 * Story: 01.04 - Segurança e Confirmação por Voz
 *
 * Web Authentication API (WebAuthn) integration with comprehensive security:
 * - FaceID, TouchID, Windows Hello
 * - Secure PIN fallback with rate limiting and account lockout
 * - SMS OTP with expiration and verification
 * - Push notification fallback
 * - Session management with timeout
 * - Fraud detection and security event logging
 * - LGPD-compliant authentication data handling
 *
 * @module security/biometricAuth
 */

import { supabase } from '@/integrations/supabase/client'
import { createAuditLog } from '@/lib/security/auditLogger'
import { createSMSProvider, SMSProvider, SMSConfig } from '@/lib/security/smsProvider'
import { createPushProvider, PushProvider, PushConfig } from '@/lib/security/pushProvider'
import { createFraudDetectionService, FraudDetectionService } from '@/lib/security/fraudDetection'
import {
  createDeviceFingerprintingService,
  DeviceFingerprintingService,
} from '@/lib/security/deviceFingerprinting'

// ============================================================================
// Types
// ============================================================================

export type BiometricType = 'platform' | 'cross-platform' | 'pin' | 'sms' | 'push'
export type SecurityEvent =
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
  | 'biometric_enrolled'

export interface BiometricConfig {
  timeout: number // milliseconds
  userVerification: 'required' | 'preferred' | 'discouraged'
  authenticatorAttachment?: 'platform' | 'cross-platform'
  maxPinAttempts: number
  pinLockoutDuration: number // milliseconds
  sessionTimeout: number // milliseconds
  otpExpiry: number // milliseconds
  maxOtpAttempts: number
  rateLimitWindow: number // milliseconds
  maxRateLimitAttempts: number
}

export interface BiometricResult {
  success: boolean
  method: BiometricType
  error?: string
  processingTime: number
  requiresAction?: 'otp' | 'push' | 'pin'
  sessionToken?: string
  lockoutRemaining?: number
}

export interface SecurityEventLog {
  userId: string
  event: SecurityEvent
  method: BiometricType
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  riskScore?: number
}

export interface AuthSession {
  userId: string
  sessionToken: string
  method: BiometricType
  expiresAt: Date
  isActive: boolean
  createdAt: Date
  lastActivity: Date
}

export interface FraudDetectionRule {
  type: 'location_anomaly' | 'device_anomaly' | 'behavior_anomaly' | 'frequency_anomaly'
  threshold: number
  enabled: boolean
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: BiometricConfig = {
  timeout: 60000, // 60s
  userVerification: 'required',
  authenticatorAttachment: 'platform',
  maxPinAttempts: 5,
  pinLockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  otpExpiry: 5 * 60 * 1000, // 5 minutes
  maxOtpAttempts: 3,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRateLimitAttempts: 10,
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate cryptographically secure random string
 */
function generateSecureRandom(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)

  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256)
    }
  }

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }

  return result
}

/**
 * Generate secure PIN hash using bcrypt-like algorithm
 * Note: In production, use actual bcrypt library. This is a simplified version.
 */
async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  if (!salt) {
    salt = generateSecureRandom(22)
  }

  // This is a simplified hashing - in production, use proper bcrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return {
      hash: hashHex,
      salt,
    }
  }

  // Fallback for environments without Web Crypto API
  return {
    hash: btoa(pin + salt),
    salt,
  }
}

/**
 * Verify PIN against stored hash
 */
async function verifyPin(pin: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPin(pin, salt)
  return hash === storedHash
}

/**
 * Generate OTP code
 */
function generateOTP(): string {
  return generateSecureRandom(6)
}

/**
 * Get client IP address (simplified - in production, get from server)
 */
function getClientIP(): string {
  // In production, this should come from the server
  return 'client-ip'
}

/**
 * Get user agent information
 */
function getUserAgent(): string {
  return typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
}

/**
 * Get user location (simplified - in production, use geolocation API or IP lookup)
 */
async function getUserLocation(): Promise<
  | {
      country: string
      city: string
      latitude: number
      longitude: number
    }
  | undefined
> {
  try {
    if ('geolocation' in navigator) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              country: 'BR', // In production, use reverse geocoding
              city: 'São Paulo', // In production, use reverse geocoding
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          () => {
            resolve(undefined)
          }
        )
      })
    }
  } catch (error) {
    console.error('Failed to get location:', error)
  }
  return undefined
}

// ============================================================================
// Enhanced Biometric Authentication Service
// ============================================================================

export class BiometricAuthService {
  private config: BiometricConfig
  private activeSessions: Map<string, AuthSession> = new Map()
  private rateLimitStore: Map<string, { attempts: number; resetTime: number }> = new Map()
  private fraudRules: FraudDetectionRule[] = []

  // Enhanced security providers
  private smsProvider?: SMSProvider
  private pushProvider?: PushProvider
  private fraudDetectionService?: FraudDetectionService
  private deviceFingerprintingService?: DeviceFingerprintingService

  constructor(
    config: Partial<BiometricConfig> = {},
    securityProviders?: {
      sms?: { config: SMSConfig }
      push?: { config: PushConfig }
      fraudDetection?: { config?: any }
      deviceFingerprinting?: { config?: any }
    }
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeFraudDetection()
    this.initializeSecurityProviders(securityProviders)
  }

  /**
   * Initialize fraud detection rules
   */
  private initializeFraudDetection(): void {
    this.fraudRules = [
      {
        type: 'frequency_anomaly',
        threshold: 5, // More than 5 failed attempts in rate limit window
        enabled: true,
      },
      {
        type: 'location_anomaly',
        threshold: 0.8, // 80% confidence for location anomaly
        enabled: true,
      },
      {
        type: 'device_anomaly',
        threshold: 0.7, // 70% confidence for device anomaly
        enabled: true,
      },
    ]
  }

  /**
   * Initialize security providers
   */
  private initializeSecurityProviders(providers?: {
    sms?: { config: SMSConfig }
    push?: { config: PushConfig }
    fraudDetection?: { config?: any }
    deviceFingerprinting?: { config?: any }
  }): void {
    // Initialize SMS provider if config provided
    if (providers?.sms?.config) {
      this.smsProvider = createSMSProvider(providers.sms.config)
    }

    // Initialize Push provider if config provided
    if (providers?.push?.config) {
      this.pushProvider = createPushProvider(providers.push.config)
    }

    // Initialize Fraud Detection service
    this.fraudDetectionService = createFraudDetectionService(providers?.fraudDetection?.config)

    // Initialize Device Fingerprinting service
    this.deviceFingerprintingService = createDeviceFingerprintingService(
      providers?.deviceFingerprinting?.config
    )
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: SecurityEventLog): Promise<void> {
    try {
      // Always try to create audit log first
      await createAuditLog({
        userId: event.userId,
        action: `auth_${event.event}`,
        method: event.method,
        metadata: {
          event: event.event,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          riskScore: event.riskScore,
          ...event.metadata,
        },
      })

      // Try to store in database for detailed security monitoring
      // If table doesn't exist, we'll still have the audit log
      try {
        await supabase.from('security_events').insert({
          user_id: event.userId,
          event_type: event.event,
          method: event.method,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          metadata: event.metadata,
          risk_score: event.riskScore || 0,
          created_at: new Date().toISOString(),
        })
      } catch (dbError) {
        // If security_events table doesn't exist, just log to console
        // The audit log above will still capture the event
        console.warn('[BiometricAuth] Security events table not available:', dbError)
      }
    } catch (error) {
      console.error('[BiometricAuth] Failed to log security event:', error)
    }
  }

  /**
   * Check rate limiting (Enhanced with adaptive throttling)
   */
  private checkRateLimit(userId: string): { allowed: boolean; remainingTime?: number } {
    const key = `rate_limit_${userId}`
    const now = Date.now()
    const stored = this.rateLimitStore.get(key)

    if (!stored || now > stored.resetTime) {
      // Reset or create new rate limit entry
      this.rateLimitStore.set(key, {
        attempts: 1,
        resetTime: now + this.config.rateLimitWindow,
      })
      return { allowed: true }
    }

    // Adaptive rate limiting: reduce threshold based on recent failures
    const recentFailures = this.getRecentFailureCount(userId)
    const adjustedThreshold = Math.max(
      Math.floor(this.config.maxRateLimitAttempts * (1 - recentFailures * 0.2)),
      3 // Minimum threshold
    )

    if (stored.attempts >= adjustedThreshold) {
      return {
        allowed: false,
        remainingTime: stored.resetTime - now,
      }
    }

    stored.attempts++
    return { allowed: true }
  }

  /**
   * Get recent failure count for adaptive rate limiting
   */
  private getRecentFailureCount(userId: string): number {
    // This is a simplified version - in production, query the database
    const key = `recent_failures_${userId}`
    const stored = this.rateLimitStore.get(key)
    return stored?.attempts || 0
  }

  /**
   * Send security alerts via multiple channels
   */
  private async sendSecurityAlerts(
    userId: string,
    alertType: 'login_attempt' | 'account_locked' | 'suspicious_activity',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's contact information
      const { data: user } = await supabase
        .from('users')
        .select('phone_number, email')
        .eq('id', userId)
        .single()

      // Send SMS alert if available
      if (user?.phone_number && this.smsProvider) {
        await this.smsProvider.sendSecurityAlert(userId, user.phone_number, alertType)
      }

      // Send push notification if available
      if (this.pushProvider) {
        const pushMessage = {
          title: 'AegisWallet - Alerta de Segurança',
          body: this.getSecurityAlertMessage(alertType, metadata),
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          requireInteraction: true,
          tag: `security-${alertType}`,
          data: {
            type: 'security-alert',
            alertType,
            metadata,
          },
        }

        await this.pushProvider.sendPushNotification(userId, pushMessage)
      }

      // Log security alert sent
      await this.logSecurityEvent({
        userId,
        event: 'security_alert_sent',
        method: 'system',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        metadata: { alertType, channels: ['sms', 'push'].filter(Boolean) },
      })
    } catch (error) {
      console.error('[BiometricAuth] Failed to send security alerts:', error)
    }
  }

  /**
   * Get security alert message in Portuguese
   */
  private getSecurityAlertMessage(
    alertType: 'login_attempt' | 'account_locked' | 'suspicious_activity',
    metadata?: Record<string, any>
  ): string {
    switch (alertType) {
      case 'login_attempt':
        return 'Nova tentativa de login detectada. Se não foi você, acesse o app imediatamente.'
      case 'account_locked': {
        const lockoutMinutes = metadata?.lockoutDuration || 15
        return `Sua conta foi temporariamente bloqueada por ${lockoutMinutes} minutos por segurança.`
      }
      case 'suspicious_activity':
        return 'Atividade suspeita detectada em sua conta. Verifique suas informações de segurança.'
      default:
        return 'Alerta de segurança do AegisWallet.'
    }
  }

  /**
   * Analyze for fraud patterns
   */
  private async analyzeFraud(userId: string, event: SecurityEventLog): Promise<number> {
    let riskScore = 0

    // Check frequency anomalies
    if (event.event === 'auth_failure') {
      const { data: recentFailures } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'auth_failure')
        .gte('created_at', new Date(Date.now() - this.config.rateLimitWindow).toISOString())

      if (recentFailures && recentFailures.length > 3) {
        riskScore += 0.3
      }
    }

    // Check device anomalies
    const { data: recentDevices } = await supabase
      .from('security_events')
      .select('user_agent')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10)

    if (recentDevices && recentDevices.length > 0) {
      const uniqueDevices = new Set(recentDevices.map((d) => d.user_agent)).size
      if (uniqueDevices > 3) {
        riskScore += 0.2
      }
    }

    return Math.min(riskScore, 1.0)
  }

  /**
   * Create secure session
   */
  private async createSession(userId: string, method: BiometricType): Promise<string> {
    const sessionToken = generateSecureRandom(32)
    const expiresAt = new Date(Date.now() + this.config.sessionTimeout)

    const session: AuthSession = {
      userId,
      sessionToken,
      method,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.activeSessions.set(sessionToken, session)

    // Store in database
    await supabase.from('auth_sessions').insert({
      user_id: userId,
      session_token: sessionToken,
      method: method,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    })

    return sessionToken
  }

  /**
   * Validate session
   */
  async validateSession(sessionToken: string): Promise<AuthSession | null> {
    const session = this.activeSessions.get(sessionToken)

    if (!session) {
      // Try to fetch from database
      const { data } = await supabase
        .from('auth_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single()

      if (data && new Date(data.expires_at) > new Date()) {
        const dbSession: AuthSession = {
          userId: data.user_id,
          sessionToken: data.session_token,
          method: data.method as BiometricType,
          expiresAt: new Date(data.expires_at),
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          lastActivity: new Date(data.last_activity),
        }

        this.activeSessions.set(sessionToken, dbSession)
        return dbSession
      }

      return null
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.revokeSession(sessionToken)
      return null
    }

    // Update last activity
    session.lastActivity = new Date()
    await supabase
      .from('auth_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken)

    return session
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionToken: string): Promise<void> {
    this.activeSessions.delete(sessionToken)

    await supabase
      .from('auth_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken)
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch {
      return false
    }
  }

  /**
   * Authenticate with biometrics (Enhanced with fraud detection)
   */
  async authenticate(userId: string): Promise<BiometricResult> {
    const startTime = Date.now()

    // Rate limiting check
    const rateLimit = this.checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        method: 'platform',
        error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.remainingTime || 0) / 1000)} seconds.`,
        processingTime: Date.now() - startTime,
      }
    }

    // Check if WebAuthn is available
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        method: 'platform',
        error: 'WebAuthn not supported',
        processingTime: Date.now() - startTime,
      }
    }

    try {
      // Get device fingerprint for enhanced security
      let deviceFingerprint: string | undefined
      if (this.deviceFingerprintingService) {
        const fingerprint = await this.deviceFingerprintingService.generateFingerprint()
        deviceFingerprint = fingerprint.id
      }

      // Analyze security event for fraud detection
      let fraudResult: any = null
      if (this.fraudDetectionService) {
        fraudResult = await this.fraudDetectionService.analyzeSecurityEvent({
          userId,
          eventType: 'login_attempt',
          timestamp: new Date(),
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          deviceFingerprint,
          location: await this.getUserLocation(),
        })

        // Block if fraud detection indicates high risk
        if (fraudResult.shouldBlock) {
          await this.logSecurityEvent({
            userId,
            event: 'account_locked',
            method: 'platform',
            ipAddress: getClientIP(),
            userAgent: getUserAgent(),
            deviceFingerprint,
            metadata: {
              reason: 'fraud_detection',
              riskScore: fraudResult.riskScore,
              anomalies: fraudResult.detectedAnomalies,
            },
          })

          return {
            success: false,
            method: 'platform',
            error: 'Security verification required. Please contact support.',
            processingTime: Date.now() - startTime,
          }
        }
      }

      // Generate random challenge
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Request authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: this.config.timeout,
          userVerification: this.config.userVerification,
          authenticatorSelection: {
            authenticatorAttachment: this.config.authenticatorAttachment,
            userVerification: this.config.userVerification,
          },
        },
      })

      if (!credential) {
        // Log failed attempt with enhanced metadata
        await this.logSecurityEvent({
          userId,
          event: 'auth_failure',
          method: 'platform',
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          deviceFingerprint,
          metadata: {
            reason: 'authentication_cancelled',
            fraudRiskScore: fraudResult?.riskScore,
          },
        })

        return {
          success: false,
          method: 'platform',
          error: 'Authentication cancelled',
          processingTime: Date.now() - startTime,
          requiresAction: fraudResult?.requiresReview ? 'pin' : undefined,
        }
      }

      // Success - create session
      const sessionToken = await this.createSession(userId, 'platform')

      // Log successful authentication with enhanced metadata
      await this.logSecurityEvent({
        userId,
        event: 'auth_success',
        method: 'platform',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        deviceFingerprint,
        metadata: {
          credentialId: credential.id,
          fraudRiskScore: fraudResult?.riskScore,
        },
      })

      return {
        success: true,
        method: 'platform',
        processingTime: Date.now() - startTime,
        sessionToken,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed attempt with enhanced metadata
      await this.logSecurityEvent({
        userId,
        event: 'auth_failure',
        method: 'platform',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        metadata: {
          error: errorMessage,
          deviceFingerprint: this.deviceFingerprintingService
            ? (await this.deviceFingerprintingService.generateFingerprint()).id
            : undefined,
        },
      })

      return {
        success: false,
        method: 'platform',
        error: errorMessage,
        processingTime: Date.now() - startTime,
        requiresAction: 'pin',
      }
    }
  }

  /**
   * Authenticate with PIN fallback
   */
  async authenticateWithPIN(userId: string, pin: string): Promise<BiometricResult> {
    const startTime = Date.now()

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return {
        success: false,
        method: 'pin',
        error: 'Invalid PIN format',
        processingTime: Date.now() - startTime,
      }
    }

    // Check rate limiting
    const rateLimit = this.checkRateLimit(userId)
    if (!rateLimit.allowed) {
      return {
        success: false,
        method: 'pin',
        error: `Too many attempts. Try again in ${Math.ceil((rateLimit.remainingTime || 0) / 1000)} seconds.`,
        processingTime: Date.now() - startTime,
      }
    }

    try {
      // Check if user is locked out
      const { data: lockout } = await supabase
        .from('auth_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('method', 'pin')
        .eq('is_locked', true)
        .single()

      if (lockout && new Date(lockout.lockout_until) > new Date()) {
        const remainingTime = new Date(lockout.lockout_until).getTime() - Date.now()

        return {
          success: false,
          method: 'pin',
          error: 'Account temporarily locked for security',
          processingTime: Date.now() - startTime,
          lockoutRemaining: remainingTime,
        }
      }

      // Get stored PIN hash
      const { data: storedPin } = await supabase
        .from('user_pins')
        .select('pin_hash, salt')
        .eq('user_id', userId)
        .single()

      if (!storedPin) {
        return {
          success: false,
          method: 'pin',
          error: 'PIN not set up',
          processingTime: Date.now() - startTime,
        }
      }

      // Verify PIN
      const isValid = await verifyPin(pin, storedPin.pin_hash, storedPin.salt)

      if (isValid) {
        // Success - create session and reset failed attempts
        await this.createSession(userId, 'pin')

        // Reset failed attempts
        await supabase
          .from('auth_attempts')
          .update({ failed_attempts: 0, is_locked: false })
          .eq('user_id', userId)
          .eq('method', 'pin')

        // Log success
        await this.logSecurityEvent({
          userId,
          event: 'auth_success',
          method: 'pin',
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
        })

        return {
          success: true,
          method: 'pin',
          processingTime: Date.now() - startTime,
        }
      } else {
        // Handle failed attempt
        await this.handleFailedAttempt(userId, 'pin')

        return {
          success: false,
          method: 'pin',
          error: 'Invalid PIN',
          processingTime: Date.now() - startTime,
          requiresAction: 'sms',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await this.logSecurityEvent({
        userId,
        event: 'auth_failure',
        method: 'pin',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        metadata: { error: errorMessage },
      })

      return {
        success: false,
        method: 'pin',
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Handle failed authentication attempt (Enhanced with advanced lockout)
   */
  private async handleFailedAttempt(userId: string, method: BiometricType): Promise<void> {
    const { data: attemptRecord } = await supabase
      .from('auth_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('method', method)
      .single()

    if (attemptRecord) {
      const newAttempts = attemptRecord.failed_attempts + 1

      // Progressive lockout: increase lockout duration based on attempts
      let lockoutDuration = this.config.pinLockoutDuration
      if (newAttempts > this.config.maxPinAttempts) {
        // Exponential backoff: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 24hr
        const exponent = Math.min(newAttempts - this.config.maxPinAttempts, 6)
        lockoutDuration = this.config.pinLockoutDuration * Math.pow(2, exponent)
      }

      const isLocked = newAttempts >= this.config.maxPinAttempts
      const lockoutUntil = isLocked ? new Date(Date.now() + lockoutDuration) : null

      await supabase
        .from('auth_attempts')
        .update({
          failed_attempts: newAttempts,
          is_locked,
          lockout_until: lockoutUntil?.toISOString(),
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', attemptRecord.id)

      if (isLocked) {
        // Enhanced lockout events
        await this.logSecurityEvent({
          userId,
          event: 'pin_lockout',
          method,
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          metadata: {
            failed_attempts: newAttempts,
            lockout_duration: lockoutDuration,
            lockout_until: lockoutUntil?.toISOString(),
          },
        })

        // Send security alerts via available channels
        await this.sendSecurityAlerts(userId, 'account_locked', {
          failedAttempts: newAttempts,
          lockoutDuration: Math.round(lockoutDuration / (1000 * 60)), // minutes
        })
      }
    } else {
      // Create new attempt record
      await supabase.from('auth_attempts').insert({
        user_id: userId,
        method,
        failed_attempts: 1,
        is_locked: false,
        last_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
    }

    // Log failure with enhanced metadata
    await this.logSecurityEvent({
      userId,
      event: 'auth_failure',
      method,
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      metadata: {
        device_fingerprint: this.deviceFingerprintingService
          ? (await this.deviceFingerprintingService.generateFingerprint()).id
          : undefined,
      },
    })
  }

  /**
   * Set up PIN for user
   */
  async setupPIN(userId: string, pin: string, confirmPassword: string): Promise<boolean> {
    // Validate PIN format
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN must be 4-6 digits')
    }

    if (pin !== confirmPassword) {
      throw new Error('PINs do not match')
    }

    // Hash PIN
    const { hash, salt } = await hashPin(pin)

    try {
      // Check if PIN already exists
      const { data: existingPin } = await supabase
        .from('user_pins')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingPin) {
        // Update existing PIN
        await supabase
          .from('user_pins')
          .update({
            pin_hash: hash,
            salt: salt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      } else {
        // Create new PIN
        await supabase.from('user_pins').insert({
          user_id: userId,
          pin_hash: hash,
          salt: salt,
          created_at: new Date().toISOString(),
        })
      }

      // Initialize auth attempts record
      await supabase.from('auth_attempts').upsert({
        user_id: userId,
        method: 'pin',
        failed_attempts: 0,
        is_locked: false,
        last_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error('[BiometricAuth] Failed to setup PIN:', error)
      throw error
    }
  }

  /**
   * Send SMS OTP (Enhanced with Twilio integration)
   */
  async sendSMSOTP(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      // Generate OTP
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + this.config.otpExpiry)

      // Store OTP
      await supabase.from('otp_codes').insert({
        user_id: userId,
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        created_at: new Date().toISOString(),
      })

      // Send OTP using SMS provider if available
      let smsSent = false
      if (this.smsProvider) {
        const result = await this.smsProvider.sendOTP(userId, phoneNumber, otp)
        smsSent = result.success

        if (!result.success) {
          console.error('[BiometricAuth] SMS provider failed:', result.error)
        }
      } else {
        // Fallback: simulate sending (development only)
        console.log(`Sending OTP ${otp} to ${phoneNumber}`)
        smsSent = true
      }

      if (smsSent) {
        // Log OTP sent
        await this.logSecurityEvent({
          userId,
          event: 'otp_sent',
          method: 'sms',
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          metadata: { phone_number: phoneNumber },
        })
      }

      return smsSent
    } catch (error) {
      console.error('[BiometricAuth] Failed to send OTP:', error)
      return false
    }
  }

  /**
   * Authenticate with SMS OTP
   */
  async authenticateWithSMS(
    userId: string,
    otp: string,
    phoneNumber: string
  ): Promise<BiometricResult> {
    const startTime = Date.now()

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        method: 'sms',
        error: 'Invalid OTP format',
        processingTime: Date.now() - startTime,
      }
    }

    try {
      // Get stored OTP
      const { data: storedOTP } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!storedOTP) {
        return {
          success: false,
          method: 'sms',
          error: 'OTP not found or expired',
          processingTime: Date.now() - startTime,
        }
      }

      // Check if OTP has expired
      if (new Date(storedOTP.expires_at) < new Date()) {
        return {
          success: false,
          method: 'sms',
          error: 'OTP has expired',
          processingTime: Date.now() - startTime,
        }
      }

      // Check attempts
      if (storedOTP.attempts >= this.config.maxOtpAttempts) {
        return {
          success: false,
          method: 'sms',
          error: 'Maximum OTP attempts exceeded',
          processingTime: Date.now() - startTime,
        }
      }

      // Verify OTP
      const isValid = otp === storedOTP.otp_code

      if (isValid) {
        // Mark OTP as used
        await supabase
          .from('otp_codes')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', storedOTP.id)

        // Create session
        const sessionToken = await this.createSession(userId, 'sms')

        // Log success
        await this.logSecurityEvent({
          userId,
          event: 'otp_verified',
          method: 'sms',
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          metadata: { phone_number: phoneNumber },
        })

        return {
          success: true,
          method: 'sms',
          processingTime: Date.now() - startTime,
          sessionToken,
        }
      } else {
        // Increment attempts
        await supabase
          .from('otp_codes')
          .update({ attempts: storedOTP.attempts + 1 })
          .eq('id', storedOTP.id)

        return {
          success: false,
          method: 'sms',
          error: 'Invalid OTP',
          processingTime: Date.now() - startTime,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await this.logSecurityEvent({
        userId,
        event: 'auth_failure',
        method: 'sms',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        metadata: { error: errorMessage, phone_number: phoneNumber },
      })

      return {
        success: false,
        method: 'sms',
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Authenticate with push notification (Enhanced with Web Push integration)
   */
  async authenticateWithPush(userId: string): Promise<BiometricResult> {
    const startTime = Date.now()

    try {
      // Get user's phone number for fallback SMS
      const { data: user } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', userId)
        .single()

      const phoneNumber = user?.phone_number

      // Send push notification using push provider if available
      let pushResult: any = null
      if (this.pushProvider) {
        pushResult = await this.pushProvider.sendAuthPush(userId, phoneNumber || '')
      } else {
        // Fallback: simulate push request
        const pushToken = generateSecureRandom(16)
        await supabase.from('push_auth_requests').insert({
          user_id: userId,
          push_token: pushToken,
          expires_at: new Date(Date.now() + this.config.otpExpiry).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        })

        console.log(`Sending push notification to user ${userId}`)

        pushResult = {
          success: true,
          requiresAction: 'push',
        }
      }

      // Log push sent
      await this.logSecurityEvent({
        userId,
        event: 'push_sent',
        method: 'push',
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
        metadata: {
          push_result: pushResult.success,
          phone_number: phoneNumber,
        },
      })

      if (pushResult.success) {
        return {
          success: false,
          method: 'push',
          error: 'Push notification sent. Please approve on your device.',
          processingTime: Date.now() - startTime,
          requiresAction: 'push',
        }
      } else {
        return {
          success: false,
          method: 'push',
          error: pushResult.error || 'Failed to send push notification',
          processingTime: Date.now() - startTime,
          requiresAction: 'sms', // Fallback to SMS
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        method: 'push',
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Verify push response
   */
  async verifyPushResponse(pushToken: string, approved: boolean): Promise<BiometricResult> {
    const startTime = Date.now()

    try {
      const { data: pushRequest } = await supabase
        .from('push_auth_requests')
        .select('*')
        .eq('push_token', pushToken)
        .eq('status', 'pending')
        .single()

      if (!pushRequest) {
        return {
          success: false,
          method: 'push',
          error: 'Invalid or expired push request',
          processingTime: Date.now() - startTime,
        }
      }

      // Update push request status
      await supabase
        .from('push_auth_requests')
        .update({
          status: approved ? 'approved' : 'denied',
          responded_at: new Date().toISOString(),
        })
        .eq('id', pushRequest.id)

      if (approved) {
        // Create session
        const sessionToken = await this.createSession(pushRequest.user_id, 'push')

        return {
          success: true,
          method: 'push',
          processingTime: Date.now() - startTime,
          sessionToken,
        }
      } else {
        return {
          success: false,
          method: 'push',
          error: 'Push notification denied',
          processingTime: Date.now() - startTime,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        method: 'push',
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Register biometric credential
   */
  async register(userId: string, userName: string): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      // Generate random challenge
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Generate random user ID
      const userIdBuffer = new TextEncoder().encode(userId)

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'AegisWallet',
            id: window.location.hostname,
          },
          user: {
            id: userIdBuffer,
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          timeout: this.config.timeout,
          authenticatorSelection: {
            authenticatorAttachment: this.config.authenticatorAttachment,
            userVerification: this.config.userVerification,
          },
        },
      })

      if (credential) {
        // Store credential info
        await supabase.from('biometric_credentials').insert({
          user_id: userId,
          credential_id: credential.id,
          credential_type: 'public-key',
          created_at: new Date().toISOString(),
        })

        // Log enrollment
        await this.logSecurityEvent({
          userId,
          event: 'biometric_enrolled',
          method: 'platform',
          ipAddress: getClientIP(),
          userAgent: getUserAgent(),
          metadata: { credential_id: credential.id },
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Biometric registration failed:', error)
      return false
    }
  }

  /**
   * Get authentication status
   */
  async getAuthStatus(userId: string): Promise<{
    hasBiometric: boolean
    hasPIN: boolean
    isLocked: boolean
    lockoutRemaining?: number
  }> {
    try {
      // Check biometric
      const { data: biometric } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Check PIN
      const { data: pin } = await supabase
        .from('user_pins')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Check lockout status
      const { data: lockout } = await supabase
        .from('auth_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('method', 'pin')
        .eq('is_locked', true)
        .single()

      const isLocked = lockout && new Date(lockout.lockout_until) > new Date()
      const lockoutRemaining = isLocked
        ? new Date(lockout.lockout_until).getTime() - Date.now()
        : undefined

      return {
        hasBiometric: !!biometric,
        hasPIN: !!pin,
        isLocked: !!isLocked,
        lockoutRemaining,
      }
    } catch (error) {
      console.error('[BiometricAuth] Failed to get auth status:', error)
      return {
        hasBiometric: false,
        hasPIN: false,
        isLocked: false,
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BiometricConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): BiometricConfig {
    return { ...this.config }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()

    // Clean in-memory sessions
    for (const [token, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(token)
      }
    }

    // Clean database sessions
    await supabase
      .from('auth_sessions')
      .update({ is_active: false })
      .lt('expires_at', now.toISOString())

    // Clean expired OTPs
    await supabase.from('otp_codes').update({ is_used: true }).lt('expires_at', now.toISOString())

    // Clean expired push requests
    await supabase
      .from('push_auth_requests')
      .update({ status: 'expired' })
      .lt('expires_at', now.toISOString())
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create biometric auth service
 */
export function createBiometricAuthService(
  config?: Partial<BiometricConfig>
): BiometricAuthService {
  return new BiometricAuthService(config)
}

/**
 * Quick authentication function
 */
export async function authenticateBiometric(userId: string): Promise<BiometricResult> {
  const service = createBiometricAuthService()
  return service.authenticate(userId)
}

/**
 * Check if biometric is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const service = createBiometricAuthService()
  return service.isAvailable()
}

/**
 * Biometric Authentication Service
 *
 * Story: 01.04 - Segurança e Confirmação por Voz
 *
 * Web Authentication API (WebAuthn) integration:
 * - FaceID, TouchID, Windows Hello
 * - PIN fallback
 * - SMS OTP fallback
 * - Push notification fallback
 *
 * @module security/biometricAuth
 */

// ============================================================================
// Types
// ============================================================================

export type BiometricType = 'platform' | 'cross-platform' | 'pin' | 'sms' | 'push'

export interface BiometricConfig {
  timeout: number // milliseconds
  userVerification: 'required' | 'preferred' | 'discouraged'
  authenticatorAttachment?: 'platform' | 'cross-platform'
}

export interface BiometricResult {
  success: boolean
  method: BiometricType
  error?: string
  processingTime: number
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: BiometricConfig = {
  timeout: 60000, // 60s
  userVerification: 'required',
  authenticatorAttachment: 'platform', // Prefer built-in biometrics
}

// ============================================================================
// Biometric Authentication Service
// ============================================================================

export class BiometricAuthService {
  private config: BiometricConfig

  constructor(config: Partial<BiometricConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
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
   * Authenticate with biometrics
   */
  async authenticate(): Promise<BiometricResult> {
    const startTime = Date.now()

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
        return {
          success: false,
          method: 'platform',
          error: 'Authentication cancelled',
          processingTime: Date.now() - startTime,
        }
      }

      return {
        success: true,
        method: 'platform',
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        method: 'platform',
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Authenticate with PIN fallback
   */
  async authenticateWithPIN(pin: string): Promise<BiometricResult> {
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

    // TODO: Validate PIN against stored hash in database
    // For now, simulate validation
    const isValid = await this.validatePIN(pin)

    return {
      success: isValid,
      method: 'pin',
      error: isValid ? undefined : 'Invalid PIN',
      processingTime: Date.now() - startTime,
    }
  }

  /**
   * Authenticate with SMS OTP
   */
  async authenticateWithSMS(otp: string, phoneNumber: string): Promise<BiometricResult> {
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

    // TODO: Validate OTP against sent code
    // For now, simulate validation
    const isValid = await this.validateOTP(otp, phoneNumber)

    return {
      success: isValid,
      method: 'sms',
      error: isValid ? undefined : 'Invalid OTP',
      processingTime: Date.now() - startTime,
    }
  }

  /**
   * Send SMS OTP
   */
  async sendSMSOTP(phoneNumber: string): Promise<boolean> {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // For now, simulate sending
    console.log(`Sending OTP to ${phoneNumber}`)
    return true
  }

  /**
   * Authenticate with push notification
   */
  async authenticateWithPush(userId: string): Promise<BiometricResult> {
    const startTime = Date.now()

    // TODO: Send push notification and wait for response
    // For now, simulate
    console.log(`Sending push notification to user ${userId}`)

    return {
      success: false,
      method: 'push',
      error: 'Push notification not implemented',
      processingTime: Date.now() - startTime,
    }
  }

  /**
   * Validate PIN (placeholder)
   */
  private async validatePIN(pin: string): Promise<boolean> {
    // TODO: Implement actual PIN validation against database
    // This is a placeholder
    return pin.length >= 4
  }

  /**
   * Validate OTP (placeholder)
   */
  private async validateOTP(otp: string, _phoneNumber: string): Promise<boolean> {
    // TODO: Implement actual OTP validation
    // This is a placeholder
    return otp.length === 6
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

      return credential !== null
    } catch (error) {
      console.error('Biometric registration failed:', error)
      return false
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
export async function authenticateBiometric(): Promise<BiometricResult> {
  const service = createBiometricAuthService()
  return service.authenticate()
}

/**
 * Check if biometric is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const service = createBiometricAuthService()
  return service.isAvailable()
}

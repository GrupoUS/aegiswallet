/**
 * SMS Provider Integration - Story 01.04
 *
 * Twilio SMS integration for OTP and security notifications
 * LGPD-compliant messaging with Brazilian phone number support
 */

import { supabase } from '@/integrations/supabase/client'

export interface SMSConfig {
  accountSid: string
  authToken: string
  fromNumber: string
  maxRetries: number
  timeoutMs: number
}

export interface SMSMessage {
  to: string
  body: string
  template?: string
  variables?: Record<string, string>
}

export interface SMSResult {
  success: boolean
  messageId?: string
  status?: string
  error?: string
  processingTime: number
}

export interface SMSTemplate {
  id: string
  name: string
  body: string
  language: 'pt-BR' | 'en-US'
  category: 'otp' | 'security' | 'alert' | 'marketing'
}

// Default SMS templates for Brazilian market
const DEFAULT_TEMPLATES: SMSTemplate[] = [
  {
    id: 'otp',
    name: 'OTP Verification',
    body: 'Seu código de verificação AegisWallet: {{otp}}. Válido por 5 minutos. Não compartilhe este código.',
    language: 'pt-BR',
    category: 'otp',
  },
  {
    id: 'security_alert',
    name: 'Security Alert',
    body: 'AegisWallet: Nova tentativa de login detectada. Se não foi você, acesse o app imediatamente.',
    language: 'pt-BR',
    category: 'security',
  },
  {
    id: 'account_locked',
    name: 'Account Locked',
    body: 'AegisWallet: Sua conta foi temporariamente bloqueada por segurança. Contate o suporte se necessário.',
    language: 'pt-BR',
    category: 'security',
  },
  {
    id: 'push_approval',
    name: 'Push Approval Request',
    body: 'AegisWallet: Aprovação de login necessária. Abra o app para confirmar sua identidade.',
    language: 'pt-BR',
    category: 'security',
  },
]

/**
 * SMS Provider Service
 */
export class SMSProvider {
  private config: SMSConfig
  private templates: Map<string, SMSTemplate> = new Map()

  constructor(config: SMSConfig) {
    this.config = config
    this.loadTemplates()
  }

  /**
   * Load default SMS templates
   */
  private loadTemplates(): void {
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Validate Brazilian phone number
   */
  private validateBrazilianPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')

    // Check if it's a valid Brazilian mobile number
    // Brazilian mobile numbers: +55 (11-99) 9xxxx-xxxx
    const mobileRegex = /^55[1-9]{2}9?[6-9]\d{7,8}$/
    return mobileRegex.test(cleanPhone)
  }

  /**
   * Format phone number for international format
   */
  private formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '')

    // Add +55 if missing country code
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1)
    }

    if (cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone
    }

    return '+' + cleanPhone
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })

    return result
  }

  /**
   * Log SMS message to database for LGPD compliance
   */
  private async logSMSMessage(
    userId: string,
    message: SMSMessage,
    result: SMSResult
  ): Promise<void> {
    try {
      await supabase.from('sms_logs').insert({
        user_id: userId,
        to: message.to,
        body: message.body,
        template: message.template,
        variables: message.variables,
        message_id: result.messageId,
        status: result.status,
        error: result.error,
        processing_time: result.processingTime,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[SMSProvider] Failed to log SMS message:', error)
    }
  }

  /**
   * Send SMS message using Twilio API
   */
  async sendMessage(userId: string, message: SMSMessage): Promise<SMSResult> {
    const startTime = Date.now()

    try {
      // Validate phone number
      if (!this.validateBrazilianPhone(message.to)) {
        const error = 'Invalid Brazilian phone number format'
        const result: SMSResult = {
          success: false,
          error,
          processingTime: Date.now() - startTime,
        }
        await this.logSMSMessage(userId, message, result)
        return result
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(message.to)

      // Process template if provided
      let finalBody = message.body
      if (message.template && this.templates.has(message.template)) {
        const template = this.templates.get(message.template)!
        finalBody = this.replaceTemplateVariables(
          template.body,
          message.variables || {}
        )
      }

      // Prepare Twilio request
      const requestBody = new URLSearchParams({
        To: formattedPhone,
        From: this.config.fromNumber,
        Body: finalBody,
        StatusCallback: `${window.location.origin}/api/sms/status`,
        MaxPrice: '0.10', // Limit cost for Brazilian SMS
      })

      // Make API request to backend (server-side)
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${this.config.authToken}`,
        },
        body: requestBody.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'SMS sending failed')
      }

      const data = await response.json()

      const result: SMSResult = {
        success: true,
        messageId: data.sid,
        status: data.status,
        processingTime: Date.now() - startTime,
      }

      await this.logSMSMessage(userId, message, result)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      const result: SMSResult = {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }

      await this.logSMSMessage(userId, message, result)
      return result
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(userId: string, phoneNumber: string, otp: string): Promise<SMSResult> {
    return this.sendMessage(userId, {
      to: phoneNumber,
      template: 'otp',
      variables: { otp },
    })
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    userId: string,
    phoneNumber: string,
    alertType: 'login_attempt' | 'account_locked' | 'suspicious_activity'
  ): Promise<SMSResult> {
    const templateMap = {
      login_attempt: 'security_alert',
      account_locked: 'account_locked',
      suspicious_activity: 'security_alert',
    }

    return this.sendMessage(userId, {
      to: phoneNumber,
      template: templateMap[alertType],
    })
  }

  /**
   * Send push approval request
   */
  async sendPushApproval(userId: string, phoneNumber: string): Promise<SMSResult> {
    return this.sendMessage(userId, {
      to: phoneNumber,
      template: 'push_approval',
    })
  }

  /**
   * Add custom template
   */
  addTemplate(template: SMSTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): SMSTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get all templates
   */
  getAllTemplates(): SMSTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SMSConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): SMSConfig {
    return { ...this.config }
  }
}

/**
 * Create SMS provider instance
 */
export function createSMSProvider(config: SMSConfig): SMSProvider {
  return new SMSProvider(config)
}

/**
 * Quick OTP sending function
 */
export async function sendOTPToUser(
  userId: string,
  phoneNumber: string,
  otp: string,
  config: SMSConfig
): Promise<SMSResult> {
  const provider = createSMSProvider(config)
  return provider.sendOTP(userId, phoneNumber, otp)
}
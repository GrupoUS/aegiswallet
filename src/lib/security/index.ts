/**
 * Security Module Index - Story 01.04
 *
 * Centralized security system initialization and configuration
 * LGPD-compliant security infrastructure for AegisWallet
 */

import {
  type BiometricAuthService,
  type BiometricConfig,
  createBiometricAuthService,
} from './biometricAuth';
import {
  createDeviceFingerprintingService,
  type DeviceFingerprintingService,
  type FingerprintConfig,
} from './deviceFingerprinting';
import {
  createFraudDetectionService,
  type FraudDetectionConfig,
  type FraudDetectionService,
} from './fraudDetection';
import { createPushProvider, type PushConfig, type PushProvider } from './pushProvider';
import { createSMSProvider, type SMSConfig, type SMSProvider } from './smsProvider';

export interface SecurityConfig {
  biometric: Partial<BiometricConfig>;
  sms: {
    enabled: boolean;
    config?: SMSConfig;
  };
  push: {
    enabled: boolean;
    config?: PushConfig;
  };
  fraudDetection: {
    enabled: boolean;
    config?: Partial<FraudDetectionConfig>;
  };
  deviceFingerprinting: {
    enabled: boolean;
    config?: Partial<FingerprintConfig>;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    alertThresholds: {
      failedAuthPerHour: number;
      suspiciousActivityPerHour: number;
      accountLockoutThreshold: number;
    };
  };
}

export interface SecuritySystem {
  biometricAuth: BiometricAuthService;
  smsProvider?: SMSProvider;
  pushProvider?: PushProvider;
  fraudDetection?: FraudDetectionService;
  deviceFingerprinting?: DeviceFingerprintingService;
  config: SecurityConfig;
}

/**
 * Default security configuration for Brazilian market
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  biometric: {
    timeout: 60000, // 60 seconds
    userVerification: 'required',
    maxPinAttempts: 5,
    pinLockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    otpExpiry: 5 * 60 * 1000, // 5 minutes
    maxOtpAttempts: 3,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxRateLimitAttempts: 10,
  },
  sms: {
    enabled: process.env.NODE_ENV === 'production',
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
      maxRetries: 3,
      timeoutMs: 10000,
    },
  },
  push: {
    enabled: true,
    config: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
      vapidSubject: process.env.VAPID_SUBJECT || 'mailto:security@aegispay.com.br',
      gcmApiKey: process.env.GCM_API_KEY,
      ttl: 3600, // 1 hour
      urgency: 'high',
    },
  },
  fraudDetection: {
    enabled: true,
    config: {
      riskThresholds: {
        low: 0.3,
        medium: 0.7,
        high: 0.9,
        critical: 1.0,
      },
      timeWindows: {
        short: 1 * 60 * 60 * 1000, // 1 hour
        medium: 24 * 60 * 60 * 1000, // 24 hours
        long: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      maxFailedAttempts: 5,
      locationAnomalyThreshold: 0.8,
      deviceAnomalyThreshold: 0.7,
      behaviorAnomalyThreshold: 0.6,
    },
  },
  deviceFingerprinting: {
    enabled: true,
    config: {
      enableCanvas: true,
      enableWebGL: true,
      enableAudio: true,
      enableFonts: true,
      enableBattery: true,
      enableConnection: true,
      salt: 'aegiswallet-brazil-security-salt',
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
      },
    },
  },
  monitoring: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    alertThresholds: {
      failedAuthPerHour: 10,
      suspiciousActivityPerHour: 5,
      accountLockoutThreshold: 3,
    },
  },
};

/**
 * Security System Factory
 */
export async function createSecuritySystem(
  config?: Partial<SecurityConfig>
): Promise<SecuritySystem> {
  const finalConfig = mergeSecurityConfig(DEFAULT_SECURITY_CONFIG, config || {});

  validateSecurityConfig(finalConfig);

  const providers = await initializeSecurityProviders(finalConfig);
  const biometricAuth = createBiometricAuthService(finalConfig.biometric, providers);

  return {
    biometricAuth,
    smsProvider: providers.sms,
    pushProvider: providers.push,
    fraudDetection: providers.fraudDetection,
    deviceFingerprinting: providers.deviceFingerprinting,
    config: finalConfig,
  };
}

export function createMinimalSecuritySystem(): SecuritySystem {
  const config: SecurityConfig = {
    ...DEFAULT_SECURITY_CONFIG,
    sms: { enabled: false },
    push: { enabled: false },
    fraudDetection: { enabled: false },
    deviceFingerprinting: { enabled: false },
  };

  const biometricAuth = createBiometricAuthService(config.biometric);

  return {
    biometricAuth,
    config,
  };
}

export async function createProductionSecuritySystem(
  configOverrides?: Partial<SecurityConfig>
): Promise<SecuritySystem> {
  const productionConfig: Partial<SecurityConfig> = {
    ...configOverrides,
    sms: { enabled: true, ...configOverrides?.sms },
    push: { enabled: true, ...configOverrides?.push },
    fraudDetection: { enabled: true, ...configOverrides?.fraudDetection },
    deviceFingerprinting: {
      enabled: true,
      ...configOverrides?.deviceFingerprinting,
    },
    monitoring: {
      enabled: true,
      logLevel: 'warn',
      alertThresholds: {
        failedAuthPerHour: 5,
        suspiciousActivityPerHour: 3,
        accountLockoutThreshold: 2,
      },
      ...configOverrides?.monitoring,
    },
  };

  return createSecuritySystem(productionConfig);
}

export const SecuritySystemFactory = {
  createSecuritySystem,
  createMinimalSecuritySystem,
  createProductionSecuritySystem,
};

function mergeSecurityConfig(
  defaults: SecurityConfig,
  overrides: Partial<SecurityConfig>
): SecurityConfig {
  return {
    biometric: { ...defaults.biometric, ...overrides.biometric },
    sms: { ...defaults.sms, ...overrides.sms },
    push: { ...defaults.push, ...overrides.push },
    fraudDetection: {
      ...defaults.fraudDetection,
      ...overrides.fraudDetection,
      config: {
        ...defaults.fraudDetection.config,
        ...overrides.fraudDetection?.config,
      },
    },
    deviceFingerprinting: {
      ...defaults.deviceFingerprinting,
      ...overrides.deviceFingerprinting,
      config: {
        ...defaults.deviceFingerprinting.config,
        ...overrides.deviceFingerprinting?.config,
      },
    },
    monitoring: { ...defaults.monitoring, ...overrides.monitoring },
  };
}

function validateSecurityConfig(config: SecurityConfig): void {
  const errors: string[] = [];

  if (config.sms.enabled) {
    if (!config.sms.config?.accountSid) {
      errors.push('SMS enabled but Twilio Account SID not provided');
    }
    if (!config.sms.config?.authToken) {
      errors.push('SMS enabled but Twilio Auth Token not provided');
    }
    if (!config.sms.config?.fromNumber) {
      errors.push('SMS enabled but Twilio Phone Number not provided');
    }
  }

  if (config.push.enabled) {
    if (!config.push.config?.vapidPublicKey) {
      errors.push('Push enabled but VAPID Public Key not provided');
    }
    if (!config.push.config?.vapidPrivateKey) {
      errors.push('Push enabled but VAPID Private Key not provided');
    }
    if (!config.push.config?.vapidSubject) {
      errors.push('Push enabled but VAPID Subject not provided');
    }
  }

  if (config.biometric.maxPinAttempts < 3) {
    errors.push('Max PIN attempts should be at least 3 for security');
  }
  if (config.biometric.pinLockoutDuration < 5 * 60 * 1000) {
    errors.push('PIN lockout duration should be at least 5 minutes');
  }

  if (errors.length > 0) {
    const newline = '\n';
    const details = errors.join(newline);

    throw new Error(`Security configuration validation failed:${newline}${details}`);
  }
}

async function initializeSecurityProviders(config: SecurityConfig): Promise<{
  sms?: SMSProvider;
  push?: PushProvider;
  fraudDetection?: FraudDetectionService;
  deviceFingerprinting?: DeviceFingerprintingService;
}> {
  const providers: {
    sms?: SMSProvider;
    push?: PushProvider;
    fraudDetection?: FraudDetectionService;
    deviceFingerprinting?: DeviceFingerprintingService;
  } = {};

  if (config.sms.enabled && config.sms.config) {
    providers.sms = createSMSProvider(config.sms.config);
  }

  if (config.push.enabled && config.push.config) {
    providers.push = createPushProvider(config.push.config);
  }

  if (config.fraudDetection.enabled) {
    providers.fraudDetection = createFraudDetectionService(config.fraudDetection.config);
  }

  if (config.deviceFingerprinting.enabled) {
    providers.deviceFingerprinting = createDeviceFingerprintingService(
      config.deviceFingerprinting.config
    );
  }

  return providers;
}

/**
 * Security monitoring and alerting system
 */
export class SecurityMonitor {
  private config: SecurityConfig['monitoring'];
  private alertCounts: Map<string, number> = new Map();

  constructor(config: SecurityConfig['monitoring']) {
    this.config = config;
    this.initializeMonitoring();
  }

  /**
   * Initialize security monitoring
   */
  private initializeMonitoring(): void {
    if (!this.config.enabled) return;

    // Set up periodic monitoring
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute

    // Set up daily cleanup
    setInterval(
      () => {
        this.performDailyCleanup();
      },
      24 * 60 * 60 * 1000
    ); // Every 24 hours
  }

  /**
   * Log security event with monitoring
   */
  logSecurityEvent(event: {
    userId: string;
    eventType: string;
    method: string;
    metadata?: Record<string, any>;
  }): void {
    if (!this.config.enabled) return;

    const eventKey = `${event.eventType}_${event.userId}`;
    const currentCount = this.alertCounts.get(eventKey) || 0;
    this.alertCounts.set(eventKey, currentCount + 1);

    // Check alert thresholds
    this.checkAlertThresholds(event);
  }

  /**
   * Check if alert thresholds are exceeded
   */
  private checkAlertThresholds(event: {
    userId: string;
    eventType: string;
    method: string;
    metadata?: Record<string, any>;
  }): void {
    const eventKey = `${event.eventType}_${event.userId}`;
    const count = this.alertCounts.get(eventKey) || 0;

    // Check failed authentication threshold
    if (
      event.eventType === 'auth_failure' &&
      count >= this.config.alertThresholds.failedAuthPerHour
    ) {
      this.triggerAlert('high_failed_auth_rate', {
        userId: event.userId,
        count,
        threshold: this.config.alertThresholds.failedAuthPerHour,
      });
    }

    // Check suspicious activity threshold
    if (
      event.eventType === 'suspicious_activity' &&
      count >= this.config.alertThresholds.suspiciousActivityPerHour
    ) {
      this.triggerAlert('high_suspicious_activity', {
        userId: event.userId,
        count,
        threshold: this.config.alertThresholds.suspiciousActivityPerHour,
      });
    }

    // Check account lockout threshold
    if (
      event.eventType === 'account_locked' &&
      count >= this.config.alertThresholds.accountLockoutThreshold
    ) {
      this.triggerAlert('account_lockout_threshold', {
        userId: event.userId,
        count,
        threshold: this.config.alertThresholds.accountLockoutThreshold,
      });
    }
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(_alertType: string, _metadata: Record<string, any>): void {
    // In production, this would send alerts to:
    // - Security team
    // - Admin dashboard
    // - External monitoring services
    // - Incident response systems
  }

  /**
   * Perform system health check
   */
  private performHealthCheck(): void {
    // Check system health indicators
    // In production, this would check:
    // - Database connectivity
    // - External service health (Twilio, etc.)
    // - Memory usage
    // - Response times
    // - Error rates
  }

  /**
   * Perform daily cleanup
   */
  private performDailyCleanup(): void {
    // Reset alert counters
    this.alertCounts.clear();
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    alertCounts: Record<string, number>;
  } {
    const totalAlerts = Array.from(this.alertCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const activeAlerts = this.alertCounts.size;

    return {
      totalAlerts,
      activeAlerts,
      alertCounts: Object.fromEntries(this.alertCounts),
    };
  }
}

/**
 * Quick initialization functions
 */
export async function initializeSecurity(
  config?: Partial<SecurityConfig>
): Promise<SecuritySystem> {
  return SecuritySystemFactory.createSecuritySystem(config);
}

export function initializeMinimalSecurity(): SecuritySystem {
  return SecuritySystemFactory.createMinimalSecuritySystem();
}

export async function initializeProductionSecurity(
  configOverrides?: Partial<SecurityConfig>
): Promise<SecuritySystem> {
  return SecuritySystemFactory.createProductionSecuritySystem(configOverrides);
}

export * from './auditLogger';
// Export all security components
export * from './biometricAuth';
export * from './deviceFingerprinting';
export * from './fraudDetection';
export * from './pushProvider';
export * from './smsProvider';

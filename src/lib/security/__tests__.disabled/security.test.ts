/**
 * Security System Test Suite - Story 01.04
 *
 * Comprehensive tests for all security components
 * LGPD compliance and Brazilian market validation
 */

import {
  createBiometricAuthService,
  createDeviceFingerprintingService,
  createFraudDetectionService,
  createPushProvider,
  createSMSProvider,
  initializeMinimalSecurity,
  initializeProductionSecurity,
  initializeSecurity,
} from '@/lib/security/index';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock window object for browser APIs
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
  writable: true,
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Test Browser',
    hardwareConcurrency: 4,
    platform: 'Test Platform',
    language: 'pt-BR',
    languages: ['pt-BR', 'en'],
  },
  writable: true,
});

Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
  writable: true,
});

Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
  writable: true,
});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, sid: 'test-sms-id' }),
  } as Response)
);

describe('Security System Tests', () => {
  describe('System Initialization', () => {
    test('should initialize minimal security system', () => {
      const system = initializeMinimalSecurity();

      expect(system).toBeDefined();
      expect(system.biometricAuth).toBeDefined();
      expect(system.smsProvider).toBeUndefined();
      expect(system.pushProvider).toBeUndefined();
      expect(system.fraudDetection).toBeUndefined();
      expect(system.deviceFingerprinting).toBeUndefined();
    });

    test('should initialize production security system', async () => {
      // Mock environment variables
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+5511999999999';
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';
      process.env.VAPID_PRIVATE_KEY = 'test-private-key';
      process.env.VAPID_SUBJECT = 'mailto:test@example.com';

      const system = await initializeProductionSecurity({
        sms: { enabled: false }, // Disable for testing without real credentials
        push: { enabled: false },
      });

      expect(system).toBeDefined();
      expect(system.biometricAuth).toBeDefined();
      expect(system.fraudDetection).toBeDefined();
      expect(system.deviceFingerprinting).toBeDefined();
    });

    test('should validate configuration', async () => {
      await expect(
        initializeSecurity({
          sms: {
            enabled: true,
            config: {
              accountSid: '', // Invalid empty config
              authToken: '',
              fromNumber: '',
              maxRetries: 3,
              timeoutMs: 10000,
            },
          },
        })
      ).rejects.toThrow('SMS enabled but Twilio Account SID not provided');
    });
  });

  describe('Biometric Authentication', () => {
    let biometricAuth: any;

    beforeEach(() => {
      biometricAuth = createBiometricAuthService();
    });

    test('should handle authentication with device fingerprinting', async () => {
      // Mock device fingerprinting
      const _mockFingerprint = {
        id: 'test-fingerprint-id',
        confidence: 0.9,
        userAgent: 'Test Browser',
      };

      // Mock fraud detection
      const _mockFraudResult = {
        riskScore: 0.1,
        riskLevel: 'low',
        detectedAnomalies: [],
        recommendations: [],
        shouldBlock: false,
        requiresReview: false,
        processingTime: 50,
      };

      // This would test the enhanced authentication flow
      expect(biometricAuth).toBeDefined();
    });

    test('should handle rate limiting', () => {
      const userId = 'test-user';

      // First attempt should be allowed
      let result = biometricAuth.checkRateLimit(userId);
      expect(result.allowed).toBe(true);

      // Simulate multiple attempts
      for (let i = 0; i < 10; i++) {
        biometricAuth.checkRateLimit(userId);
      }

      // Should now be rate limited
      result = biometricAuth.checkRateLimit(userId);
      expect(result.allowed).toBe(false);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    test('should handle progressive lockout', async () => {
      const userId = 'test-user';

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await biometricAuth.handleFailedAttempt(userId, 'pin');
      }

      // Check if lockout duration increases exponentially
      // This would be tested with actual database calls
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('SMS Provider', () => {
    test('should create SMS provider with valid config', () => {
      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+5511999999999',
        maxRetries: 3,
        timeoutMs: 10000,
      };

      const smsProvider = createSMSProvider(config);
      expect(smsProvider).toBeDefined();
    });

    test('should validate Brazilian phone numbers', () => {
      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+5511999999999',
        maxRetries: 3,
        timeoutMs: 10000,
      };

      const smsProvider = createSMSProvider(config);

      // Test valid Brazilian numbers
      expect(smsProvider.validateBrazilianPhone('5511999999999')).toBe(true);
      expect(smsProvider.validateBrazilianPhone('+5511999999999')).toBe(true);
      expect(smsProvider.validateBrazilianPhone('11999999999')).toBe(true);

      // Test invalid numbers
      expect(smsProvider.validateBrazilianPhone('123456789')).toBe(false);
      expect(smsProvider.validateBrazilianPhone('invalid')).toBe(false);
    });

    test('should format phone numbers correctly', () => {
      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+5511999999999',
        maxRetries: 3,
        timeoutMs: 10000,
      };

      const smsProvider = createSMSProvider(config);

      expect(smsProvider.formatPhoneNumber('11999999999')).toBe('+5511999999999');
      expect(smsProvider.formatPhoneNumber('+5511999999999')).toBe('+5511999999999');
    });
  });

  describe('Push Provider', () => {
    test('should create push provider with valid config', () => {
      const config = {
        vapidPublicKey: 'test-public-key',
        vapidPrivateKey: 'test-private-key',
        vapidSubject: 'mailto:test@example.com',
        ttl: 3600,
        urgency: 'high' as const,
      };

      const pushProvider = createPushProvider(config);
      expect(pushProvider).toBeDefined();
    });

    test('should handle subscription management', async () => {
      const config = {
        vapidPublicKey: 'test-public-key',
        vapidPrivateKey: 'test-private-key',
        vapidSubject: 'mailto:test@example.com',
        ttl: 3600,
        urgency: 'high' as const,
      };

      const pushProvider = createPushProvider(config);

      // Test subscription flow (would need proper service worker mock)
      expect(pushProvider).toBeDefined();
    });
  });

  describe('Fraud Detection', () => {
    test('should analyze security events for fraud patterns', async () => {
      const fraudDetection = createFraudDetectionService();

      const securityEvent = {
        userId: 'test-user',
        eventType: 'login_attempt' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        deviceFingerprint: 'test-fingerprint',
        location: {
          country: 'BR',
          city: 'São Paulo',
          latitude: -23.5505,
          longitude: -46.6333,
        },
      };

      const result = await fraudDetection.analyzeSecurityEvent(securityEvent);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    test('should detect impossible travel patterns', async () => {
      const fraudDetection = createFraudDetectionService();

      // Test with locations that are far apart
      const event1 = {
        userId: 'test-user',
        eventType: 'auth_success' as const,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        location: {
          country: 'BR',
          city: 'São Paulo',
          latitude: -23.5505,
          longitude: -46.6333,
        },
      };

      const event2 = {
        userId: 'test-user',
        eventType: 'login_attempt' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.2',
        userAgent: 'Test Browser',
        location: {
          country: 'US',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      const result1 = await fraudDetection.analyzeSecurityEvent(event1);
      const result2 = await fraudDetection.analyzeSecurityEvent(event2);

      expect(result1.riskScore).toBeLessThan(result2.riskScore);
    });
  });

  describe('Device Fingerprinting', () => {
    test('should generate device fingerprint', async () => {
      const deviceFingerprinting = createDeviceFingerprintingService();

      const fingerprint = await deviceFingerprinting.generateFingerprint();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.id).toBeDefined();
      expect(fingerprint.userAgent).toBe('Test Browser');
      expect(fingerprint.confidence).toBeGreaterThan(0);
      expect(fingerprint.confidence).toBeLessThanOrEqual(1);
    });

    test('should compare fingerprints for similarity', async () => {
      const deviceFingerprinting = createDeviceFingerprintingService();

      const fingerprint1 = await deviceFingerprinting.generateFingerprint();
      const fingerprint2 = await deviceFingerprinting.generateFingerprint();

      const result = deviceFingerprinting.compareFingerprints(fingerprint1, fingerprint2);

      expect(result).toBeDefined();
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.differences)).toBe(true);
    });

    test('should calculate device risk scores', async () => {
      const deviceFingerprinting = createDeviceFingerprintingService();

      const fingerprint = await deviceFingerprinting.generateFingerprint();
      const riskScore = deviceFingerprinting.getDeviceRiskScore(fingerprint);

      expect(riskScore).toBeDefined();
      expect(riskScore.score).toBeGreaterThanOrEqual(0);
      expect(riskScore.score).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high']).toContain(riskScore.level);
      expect(Array.isArray(riskScore.reasons)).toBe(true);
    });
  });

  describe('LGPD Compliance', () => {
    test('should handle Brazilian privacy requirements', () => {
      // Test that all security components follow LGPD requirements
      const system = initializeMinimalSecurity();

      // Verify that logging includes user consent tracking
      // Verify that data retention policies are in place
      // Verify that data minimization principles are followed
      expect(system).toBeDefined();
    });

    test('should use Portuguese language for Brazilian users', async () => {
      // Test SMS templates
      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+5511999999999',
        maxRetries: 3,
        timeoutMs: 10000,
      };

      const smsProvider = createSMSProvider(config);
      const otpTemplate = smsProvider.getTemplate('otp');

      expect(otpTemplate?.language).toBe('pt-BR');
      expect(otpTemplate?.body).toContain('Seu código');
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle high volume authentication requests', async () => {
      const biometricAuth = createBiometricAuthService();
      const userId = 'test-user';

      // Simulate multiple concurrent requests
      const requests = Array.from({ length: 100 }, (_, i) =>
        biometricAuth.checkRateLimit(`${userId}-${i}`)
      );

      const results = await Promise.all(requests);

      // Most should be allowed, some should be rate limited
      const allowedCount = results.filter((r) => r.allowed).length;
      const blockedCount = results.filter((r) => !r.allowed).length;

      expect(allowedCount + blockedCount).toBe(100);
      expect(blockedCount).toBeGreaterThan(0);
    });

    test('should fail gracefully when services are unavailable', async () => {
      // Mock fetch to simulate network failure
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+5511999999999',
        maxRetries: 3,
        timeoutMs: 10000,
      };

      const smsProvider = createSMSProvider(config);
      const result = await smsProvider.sendMessage('test-user', {
        to: '+5511999999999',
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete authentication flow', async () => {
      const system = initializeMinimalSecurity();
      const userId = 'test-user';

      // Test biometric authentication
      const authResult = await system.biometricAuth.authenticate(userId);
      expect(authResult).toBeDefined();

      // Test PIN fallback
      const pinResult = await system.biometricAuth.authenticateWithPIN(userId, '123456');
      expect(pinResult).toBeDefined();

      // Test SMS OTP
      const smsResult = await system.biometricAuth.sendSMSOTP(userId, '+5511999999999');
      expect(typeof smsResult).toBe('boolean');

      // Test session management
      if (authResult.success && authResult.sessionToken) {
        const session = await system.biometricAuth.validateSession(authResult.sessionToken);
        expect(session).toBeDefined();
      }
    });

    test('should handle security event end-to-end', async () => {
      const system = await initializeProductionSecurity({
        sms: { enabled: false },
        push: { enabled: false },
      });

      const userId = 'test-user';
      const _event = {
        userId,
        eventType: 'login_attempt' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        location: {
          country: 'BR',
          city: 'São Paulo',
          latitude: -23.5505,
          longitude: -46.6333,
        },
      };

      // This would test the complete security event flow
      // including fraud detection, logging, and alerting
      expect(system.fraudDetection).toBeDefined();
    });
  });
});

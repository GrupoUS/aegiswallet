# AegisWallet Security System

Comprehensive biometric authentication and fraud detection system designed for the Brazilian financial market, with full LGPD compliance.

## Overview

This security system provides:

- **Multi-factor Authentication**: Biometric, PIN, SMS OTP, and Push notifications
- **Advanced Fraud Detection**: Machine learning-inspired pattern recognition
- **Device Fingerprinting**: Advanced device identification and risk assessment
- **Brazilian Market Compliance**: Portuguese language support, Brazilian phone validation
- **LGPD Compliance**: Privacy-first design with data minimization
- **Real-time Monitoring**: Security alerts and comprehensive audit logging

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security System                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Biometric      │  │  SMS Provider   │  │  Push        │ │
│  │  Authentication │  │  (Twilio)       │  │  Provider    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Fraud          │  │  Device         │  │  Security    │ │
│  │  Detection      │  │  Fingerprinting │  │  Monitoring  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    Supabase       │
                    │   (Database &      │
                    │    Auth)           │
                    └───────────────────┘
```

## Quick Start

### Installation

```bash
# Install dependencies
bun install

# Copy environment template
cp env.example .env.local

# Configure environment variables
# See Configuration section below
```

### Basic Usage

```typescript
import { initializeSecurity } from '@/lib/security'

// Initialize security system
const securitySystem = await initializeSecurity()

// Authenticate user
const result = await securitySystem.biometricAuth.authenticate(userId)

if (result.success) {
  // User authenticated successfully
  console.log('Session token:', result.sessionToken)
} else if (result.requiresAction) {
  // Handle fallback authentication
  switch (result.requiresAction) {
    case 'pin':
      // Show PIN input
      break
    case 'sms':
      // Send SMS OTP
      await securitySystem.biometricAuth.sendSMSOTP(userId, phoneNumber)
      break
    case 'push':
      // Send push notification
      await securitySystem.biometricAuth.authenticateWithPush(userId)
      break
  }
}
```

## Configuration

### Environment Variables

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+5511999999999

# Web Push Configuration
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:security@yourcompany.com.br

# Firebase Cloud Messaging (Optional)
GCM_API_KEY=your_gcm_api_key

# Security Configuration
NODE_ENV=production
```

### Security Configuration

```typescript
import { initializeProductionSecurity } from '@/lib/security'

const securitySystem = await initializeProductionSecurity({
  biometric: {
    maxPinAttempts: 5,
    pinLockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    otpExpiry: 5 * 60 * 1000, // 5 minutes
  },
  sms: {
    enabled: true,
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      fromNumber: process.env.TWILIO_PHONE_NUMBER!,
      maxRetries: 3,
      timeoutMs: 10000,
    },
  },
  push: {
    enabled: true,
    config: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY!,
      vapidSubject: process.env.VAPID_SUBJECT!,
      ttl: 3600,
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
    },
  },
  deviceFingerprinting: {
    enabled: true,
    config: {
      enableCanvas: true,
      enableWebGL: true,
      enableAudio: true,
      salt: 'your-custom-salt',
    },
  },
})
```

## Components

### 1. Biometric Authentication (`biometricAuth.ts`)

Multi-factor authentication with progressive fallback:

- **WebAuthn**: Face ID, Touch ID, Windows Hello
- **PIN**: Secure 4-6 digit PIN with rate limiting
- **SMS OTP**: One-time passwords via Twilio
- **Push Notifications**: Device-based approval

```typescript
// Biometric authentication
const result = await biometricAuth.authenticate(userId)

// PIN fallback
const pinResult = await biometricAuth.authenticateWithPIN(userId, '123456')

// SMS OTP
await biometricAuth.sendSMSOTP(userId, '+5511999999999')

// Push notification
const pushResult = await biometricAuth.authenticateWithPush(userId)
```

### 2. SMS Provider (`smsProvider.ts`)

Twilio integration with Brazilian phone support:

- Brazilian phone number validation
- Portuguese message templates
- Delivery tracking and logging
- LGPD-compliant message storage

```typescript
import { createSMSProvider } from '@/lib/security/smsProvider'

const smsProvider = createSMSProvider({
  accountSid: 'your_account_sid',
  authToken: 'your_auth_token',
  fromNumber: '+5511999999999',
  maxRetries: 3,
  timeoutMs: 10000,
})

// Send OTP
await smsProvider.sendOTP(userId, '+5511999999999', '123456')

// Send security alert
await smsProvider.sendSecurityAlert(userId, '+5511999999999', 'account_locked')
```

### 3. Push Provider (`pushProvider.ts`)

Web Push notifications with VAPID authentication:

- Browser-based push notifications
- Service worker integration
- Interactive approval actions
- Cross-platform support

```typescript
import { createPushProvider } from '@/lib/security/pushProvider'

const pushProvider = createPushProvider({
  vapidPublicKey: 'your_public_key',
  vapidPrivateKey: 'your_private_key',
  vapidSubject: 'mailto:security@yourcompany.com.br',
  ttl: 3600,
  urgency: 'high',
})

// Subscribe user
await pushProvider.subscribe(userId)

// Send authentication request
await pushProvider.sendAuthPush(userId, '+5511999999999')
```

### 4. Fraud Detection (`fraudDetection.ts`)

Advanced pattern recognition for fraud prevention:

- Frequency analysis (failed attempts, burst patterns)
- Location analysis (impossible travel, new locations)
- Device analysis (new devices, device + location combos)
- Behavior analysis (unusual times, method switching)
- Velocity analysis (rapid successive attempts)

```typescript
import { createFraudDetectionService } from '@/lib/security/fraudDetection'

const fraudDetection = createFraudDetectionService()

// Analyze security event
const result = await fraudDetection.analyzeSecurityEvent({
  userId: 'user123',
  eventType: 'login_attempt',
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  deviceFingerprint: 'abc123',
  location: {
    country: 'BR',
    city: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
  },
})

if (result.shouldBlock) {
  // Block authentication attempt
  console.log('High risk detected:', result.detectedAnomalies)
}
```

### 5. Device Fingerprinting (`deviceFingerprinting.ts`)

Advanced device identification for security:

- Canvas fingerprinting
- WebGL fingerprinting
- Audio fingerprinting
- Font detection
- Hardware profiling
- Risk assessment

```typescript
import { createDeviceFingerprintingService } from '@/lib/security/deviceFingerprinting'

const deviceFingerprinting = createDeviceFingerprintingService()

// Generate fingerprint
const fingerprint = await deviceFingerprinting.generateFingerprint()

// Assess device risk
const riskScore = deviceFingerprinting.getDeviceRiskScore(fingerprint)
console.log('Device risk level:', riskScore.level)
```

## Brazilian Market Specifics

### Phone Number Validation

The system validates Brazilian phone numbers:

```typescript
// Valid Brazilian numbers
'+5511999999999' // São Paulo mobile
'5521999999999'  // Rio de Janeiro mobile
'11999999999'    // São Paulo mobile (short format)

// Invalid numbers
'123456789'      // Too short
'invalid'         // Not numeric
```

### Portuguese Language Support

All user-facing messages are in Portuguese:

```typescript
// SMS Templates
'Seu código de verificação AegisWallet: {{otp}}. Válido por 5 minutos. Não compartilhe este código.'

// Security Alerts
'AegisWallet: Nova tentativa de login detectada. Se não foi você, acesse o app imediatamente.'
```

### LGPD Compliance

- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Use data only for security purposes
- **Storage Limitation**: Automatic data cleanup after retention period
- **Audit Logging**: Complete audit trail for compliance
- **User Rights**: Data export and deletion capabilities

## Database Schema

### Required Tables

```sql
-- User PINs
CREATE TABLE user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication Attempts
CREATE TABLE auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  method TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  lockout_until TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP Codes
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  location JSONB,
  metadata JSONB,
  risk_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- And more tables for fraud detection, device fingerprinting, etc.
```

## Security Best Practices

### 1. Environment Configuration

```typescript
// Production configuration
const productionConfig = {
  biometric: {
    maxPinAttempts: 3, // More restrictive in production
    pinLockoutDuration: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 15 * 60 * 1000, // 15 minutes
  },
  fraudDetection: {
    enabled: true,
    config: {
      riskThresholds: {
        low: 0.2,      // Lower thresholds for production
        medium: 0.5,
        high: 0.8,
        critical: 0.95,
      },
    },
  },
}
```

### 2. Rate Limiting

```typescript
// Implement progressive rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum requests per window
  standardHeaders: true,
  legacyHeaders: false,
}
```

### 3. Error Handling

```typescript
// Never expose sensitive information in error messages
try {
  const result = await biometricAuth.authenticate(userId)
} catch (error) {
  console.error('Authentication failed:', error)
  // Log detailed error for debugging
  // Return generic error to user
  return { success: false, error: 'Authentication failed' }
}
```

### 4. Logging and Monitoring

```typescript
// Comprehensive security logging
await logSecurityEvent({
  userId,
  event: 'auth_attempt',
  method: 'biometric',
  ipAddress: getClientIP(),
  userAgent: getUserAgent(),
  deviceFingerprint: fingerprint.id,
  riskScore: fraudResult.riskScore,
})
```

## Testing

### Unit Tests

```bash
# Run all security tests
bun test src/lib/security/__tests__

# Run specific test
bun test src/lib/security/__tests__/fraudDetection.test.ts
```

### Integration Tests

```typescript
// Test complete authentication flow
describe('Authentication Flow', () => {
  test('should handle biometric -> PIN -> SMS -> Push fallback', async () => {
    // Test complete authentication journey
  })
})
```

### Security Testing

```typescript
// Test fraud detection
describe('Fraud Detection', () => {
  test('should detect impossible travel', async () => {
    // Test geographically impossible logins
  })

  test('should detect burst attacks', async () => {
    // Test rapid successive attempts
  })
})
```

## Deployment

### Production Deployment

1. **Environment Setup**:
   ```bash
   # Set all required environment variables
   export TWILIO_ACCOUNT_SID="your_sid"
   export TWILIO_AUTH_TOKEN="your_token"
   export VAPID_PUBLIC_KEY="your_key"
   # ... other variables
   ```

2. **Database Migration**:
   ```bash
   # Run database migrations
   bunx supabase db push
   ```

3. **Service Worker Setup**:
   ```javascript
   // public/sw.js - Service worker for push notifications
   importScripts('https://cdn.jsdelivr.net/npm/@serena/push-notifications')
   ```

### Monitoring and Alerts

Set up monitoring for:

- Authentication failure rates
- Account lockouts
- Fraud detection alerts
- Service provider availability (Twilio, etc.)

### Performance Optimization

- Enable caching for device fingerprints
- Use CDN for static assets
- Implement database connection pooling
- Monitor response times

## Troubleshooting

### Common Issues

1. **Twilio SMS Not Sending**:
   - Check credentials and phone number format
   - Verify account balance
   - Check message content compliance

2. **Push Notifications Not Working**:
   - Verify VAPID keys
   - Check service worker registration
   - Ensure HTTPS is enabled

3. **High False Positive Rate**:
   - Adjust fraud detection thresholds
   - Review user behavior profiles
   - Fine-tune risk scoring

### Debug Mode

```typescript
// Enable debug logging
const securitySystem = await initializeSecurity({
  monitoring: {
    enabled: true,
    logLevel: 'debug',
  },
})
```

## Support

For security-related issues:

1. Check the audit logs in the database
2. Review security event monitoring
3. Contact the security team for urgent matters

## Contributing

When contributing to the security system:

1. Follow security best practices
2. Add comprehensive tests
3. Update documentation
4. Ensure LGPD compliance
5. Test with Brazilian market requirements

## License

This security system is proprietary to AegisWallet and subject to Brazilian data protection laws.
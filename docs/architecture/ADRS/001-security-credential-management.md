# ADR-001: Secure Credential Management System

## Status
**ACCEPTED** - Immediate Implementation Required

## Context
Currently, AegisWallet has hard-coded Supabase credentials in multiple locations, representing a critical security vulnerability. This poses immediate risks to production systems and customer data.

```typescript
// 🚨 CRITICAL SECURITY VIOLATION - MUST BE FIXED IMMEDIATELY
const supabaseUrl = process.env.SUPABASE_URL || 'https://clvdvpbnuifxedpqgrgo.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## Decision
Implement a comprehensive secure credential management system following zero-trust security principles and Brazilian financial regulations.

## Consequences

### Positive
- Eliminates security vulnerabilities from hard-coded credentials
- Enables proper secret rotation and management
- Complies with LGPD and BCB security requirements
- Supports multiple deployment environments (dev/staging/prod)
- Enables audit trail for credential access

### Negative
- Requires immediate migration effort
- Adds complexity to local development setup
- Requires DevOps infrastructure changes

### Neutral
- Changes deployment process to include secret management
- Requires environment-specific configuration

## Implementation Plan

### Phase 1: Immediate Security Fix (24 hours)
1. **Remove hard-coded credentials** from all source files
2. **Implement environment validation** at application startup
3. **Add development environment setup** with `env.example`
4. **Update all deployment scripts** to use environment variables

### Phase 2: Production-Ready Secret Management (1 week)
1. **Implement secret management service** (HashiCorp Vault or AWS Secrets Manager)
2. **Add credential rotation mechanism**
3. **Implement audit logging** for credential access
4. **Add encryption for sensitive data at rest**

### Phase 3: Advanced Security Features (2 weeks)
1. **Zero-trust network policies**
2. **Service mesh with mTLS**
3. **Database connection encryption**
4. **API key management system**

## Technical Implementation

### Environment Configuration System
```typescript
// src/lib/config/environment.ts
export interface AppConfig {
  supabase: {
    url: string
    anonKey: string
    serviceKey: string
  }
  api: {
    baseUrl: string
    version: string
  }
  security: {
    encryptionKey: string
    jwtSecret: string
  }
}

export function validateEnvironmentConfig(): AppConfig {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'VITE_APP_VERSION',
  ]

  const missing = requiredEnvVars.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file and environment configuration.`
    )
  }

  return {
    supabase: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    },
    api: {
      baseUrl: process.env.VITE_API_URL || 'http://localhost:3000',
      version: process.env.VITE_APP_VERSION || '1.0.0',
    },
    security: {
      encryptionKey: process.env.ENCRYPTION_KEY!,
      jwtSecret: process.env.JWT_SECRET!,
    },
  }
}
```

### Secure Supabase Client
```typescript
// src/integrations/supabase/secure-client.ts
import { createClient } from '@supabase/supabase-js'
import { validateEnvironmentConfig } from '@/lib/config/environment'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const config = validateEnvironmentConfig()

    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Version': config.api.version,
          'X-Request-ID': generateRequestId(),
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return supabaseClient
}

export function getServiceSupabaseClient() {
  const config = validateEnvironmentConfig()

  return createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'X-Service-Role': 'backend',
        'X-Request-ID': generateRequestId(),
      },
    },
  })
}
```

### Secret Management Integration
```typescript
// src/lib/security/secret-manager.ts
export interface SecretManager {
  getSecret(key: string): Promise<string>
  setSecret(key: string, value: string): Promise<void>
  rotateSecret(key: string): Promise<string>
  listSecrets(): Promise<string[]>
}

export class VaultSecretManager implements SecretManager {
  private vaultClient: any
  private readonly mountPath = 'secret/aegiswallet'

  async getSecret(key: string): Promise<string> {
    try {
      const result = await this.vaultClient.read(`${this.mountPath}/${key}`)
      return result.data.data.value
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${key}: ${error.message}`)
    }
  }

  async setSecret(key: string, value: string): Promise<void> {
    try {
      await this.vaultClient.write(`${this.mountPath}/${key}`, {
        value,
        updated_at: new Date().toISOString(),
        updated_by: 'aegiswallet-service',
      })
    } catch (error) {
      throw new Error(`Failed to store secret ${key}: ${error.message}`)
    }
  }

  async rotateSecret(key: string): Promise<string> {
    const newValue = this.generateSecret(key)
    await this.setSecret(key, newValue)
    return newValue
  }

  private generateSecret(key: string): string {
    // Implementation varies by secret type
    switch (key) {
      case 'database-encryption-key':
        return crypto.randomBytes(32).toString('hex')
      case 'jwt-signing-key':
        return crypto.randomBytes(64).toString('base64')
      default:
        return crypto.randomBytes(32).toString('hex')
    }
  }
}
```

## Migration Steps

### 1. Immediate Actions (Required within 24 hours)
```bash
# Step 1: Create environment template
cat > env.example << EOL
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Application Configuration
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:3000

# Security Configuration
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret

# Environment
NODE_ENV=development
EOL

# Step 2: Remove hard-coded credentials from source
# Step 3: Update all imports to use secure client
# Step 4: Test with local environment variables
```

### 2. Production Deployment
```bash
# Kubernetes Secret Example
apiVersion: v1
kind: Secret
metadata:
  name: aegiswallet-secrets
  namespace: aegiswallet
type: Opaque
data:
  SUPABASE_URL: <base64-encoded-url>
  SUPABASE_ANON_KEY: <base64-encoded-key>
  SUPABASE_SERVICE_KEY: <base64-encoded-service-key>
  ENCRYPTION_KEY: <base64-encoded-encryption-key>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

## Security Compliance

### LGPD Requirements
- ✅ Encryption of personal data at rest
- ✅ Access control and audit trails
- ✅ Data retention policies
- ✅ Secure authentication mechanisms

### BCB (Central Bank of Brazil) Requirements
- ✅ Secure communication channels
- ✅ Audit trail for financial operations
- ✅ Transaction integrity controls
- ✅ Access monitoring and logging

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Credential exposure | Low | Critical | No hard-coded credentials |
| Secret rotation failure | Low | High | Automated rotation with monitoring |
| Environment misconfiguration | Medium | Medium | Validation at startup |
| Unauthorized access | Low | Critical | Zero-trust policies + mTLS |

## Monitoring and Alerting

```typescript
// src/lib/security/credential-monitoring.ts
export class CredentialMonitor {
  async validateCredentialHealth(): Promise<CredentialHealthReport> {
    const checks = [
      this.checkSupabaseConnectivity(),
      this.checkSecretAccess(),
      this.checkEncryptionKeyValidity(),
      this.checkAuditTrailIntegrity(),
    ]

    const results = await Promise.allSettled(checks)

    return {
      overall: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'degraded',
      checks: results.map((r, i) => ({
        name: ['supabase', 'secrets', 'encryption', 'audit'][i],
        status: r.status,
        error: r.status === 'rejected' ? r.reason : undefined,
      })),
      timestamp: new Date().toISOString(),
    }
  }
}
```

## Implementation Checklist

- [ ] Remove all hard-coded credentials from source code
- [ ] Create environment validation system
- [ ] Update Supabase client to use secure configuration
- [ ] Implement secret management service
- [ ] Add credential rotation mechanism
- [ ] Set up monitoring and alerting
- [ ] Update deployment scripts and documentation
- [ ] Conduct security review and penetration testing
- [ ] Update development environment setup guide
- [ ] Train development team on secure practices

---

**Decision Date**: 2025-01-XX
**Review Date**: 2025-02-XX
**Implementation Owner**: Security Lead + DevOps Team
**Compliance**: LGPD + BCB Security Requirements
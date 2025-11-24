# Hono RPC Patterns

## Overview

This document defines standard patterns for implementing Hono RPC endpoints in the AegisWallet project. These patterns ensure consistency, type safety, and maintainability across all API endpoints.

### Purpose
- Document standard patterns for Hono RPC endpoints
- Define authentication, validation, error handling, and response formats
- Provide reference for backend developers implementing new endpoints

### Scope
- Authentication and authorization patterns
- Input validation with Zod schemas
- Error handling and response formatting
- Rate limiting and logging
- Testing strategies

## Endpoint Structure

### URL Pattern
- **Format**: `/api/v1/{domain}/{action}`
- **Examples**:
  - `/api/v1/pix/keys` - Get PIX keys
  - `/api/v1/pix/keys` - Create PIX key (POST)
  - `/api/v1/users/profile` - Get user profile
  - `/api/v1/transactions` - Get transactions with filters

### HTTP Methods
- **GET**: For queries and data retrieval
- **POST**: For creating new resources
- **PUT**: For updating existing resources
- **DELETE**: For removing resources

### Versioning Strategy
- **Current**: `/api/v1`
- **Future**: `/api/v2` for breaking changes
- **Backward Compatibility**: Maintain previous versions for at least 6 months

## Authentication Pattern

### JWT Extraction
```typescript
// src/server/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { createRequestScopedClient } from '@/integrations/supabase/factory'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createRequestScopedClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('auth', { user, supabase })
  await next()
})
```

### Usage in Endpoints
```typescript
import { authMiddleware } from '@/server/middleware/auth'

// Apply to all routes in router
router.use('*', authMiddleware)

// Apply to specific route
router.get('/protected', authMiddleware, async (c) => {
  const { user, supabase } = c.get('auth')
  // Use authenticated user and Supabase client
})
```

## Validation Pattern

### Zod Schema Definition
```typescript
import { z } from 'zod'

// Shared schemas can be exported
export const createPixKeySchema = z.object({
  type: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  value: z.string().min(1, 'Value is required'),
})

export const updatePixKeySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']).optional(),
  value: z.string().min(1).optional(),
})
```

### Validation Middleware
```typescript
import { zValidator } from '@hono/zod-validator'

router.post(
  '/keys',
  authMiddleware,
  zValidator('json', createPixKeySchema),
  async (c) => {
    const input = c.req.valid('json') // Fully typed and validated
    // Process with confidence that input is valid
  }
)
```

### Validation Error Response
```typescript
// Automatic with @hono/zod-validator
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["value"],
      "message": "Value is required"
    }
  ]
}
```

## Error Handling Pattern

### Standardized Error Response
```typescript
// Success response
return c.json({
  data: result,
  meta: { /* optional metadata */ }
})

// Error response
return c.json({
  error: "Error message",
  code: "ERROR_CODE",
  details: { /* optional context */ }
}, statusCode)
```

### HTTP Status Codes
- **200**: Successful GET request
- **201**: Successful POST (resource created)
- **400**: Validation error or bad request
- **401**: Authentication required or invalid
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Internal server error

### Error Logging
```typescript
import { secureLogger } from '@/lib/logging/secure-logger'

// In error handler
secureLogger.error('API Error', {
  error: error.message,
  stack: error.stack,
  userId: user?.id,
  endpoint: c.req.path,
  method: c.req.method,
  timestamp: new Date().toISOString(),
})
```

## Response Format Pattern

### Success Response
```typescript
// Single item
{
  "data": {
    "id": "uuid",
    "type": "EMAIL",
    "value": "user@example.com"
  }
}

// Collection
{
  "data": [
    { "id": "uuid1", "type": "EMAIL", "value": "user@example.com" },
    { "id": "uuid2", "type": "CPF", "value": "12345678901" }
  ]
}

// With metadata
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Pagination Response
```typescript
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Rate Limiting Pattern

### Rate Limiting Middleware
```typescript
import { rateLimitMiddleware } from '@/server/middleware/rateLimitMiddleware'

// Apply to router with custom limits
router.use('/keys', rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
}))

// Different limits for different operations
router.get('/keys', rateLimitMiddleware({ max: 100 })) // Higher for reads
router.post('/keys', rateLimitMiddleware({ max: 10 }))  // Lower for writes
```

### Rate Limit Headers
```typescript
// Add to response headers
c.header('X-RateLimit-Limit', limit.toString())
c.header('X-RateLimit-Remaining', remaining.toString())
c.header('X-RateLimit-Reset', resetTime.toString())
```

### Rate Limit Exceeded Response
```typescript
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 10,
    "windowMs": 60000,
    "retryAfter": 45
  }
}
```

## Logging Pattern

### Request Logging
```typescript
// Middleware for request logging
app.use('*', async (c, next) => {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  c.set('requestId', requestId)

  secureLogger.info('API Request', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
    timestamp: new Date().toISOString(),
  })

  await next()

  const duration = Date.now() - start
  secureLogger.info('API Response', {
    requestId,
    statusCode: c.res.status,
    duration,
    timestamp: new Date().toISOString(),
  })
})
```

### Error Logging
```typescript
// In error handlers
secureLogger.error('API Error', {
  error: error.message,
  stack: error.stack,
  userId: user?.id,
  endpoint: c.req.path,
  method: c.req.method,
  requestId: c.get('requestId'),
  timestamp: new Date().toISOString(),
})
```

### Security Logging
```typescript
// Log authentication failures
secureLogger.warn('Authentication Failed', {
  reason: 'Invalid token',
  ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
  userAgent: c.req.header('User-Agent'),
  timestamp: new Date().toISOString(),
})
```

## Testing Pattern

### Unit Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

describe('PIX Keys API', () => {
  let app: Hono
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }

    app = new Hono()
    setupPixRoutes(app, mockSupabase)
  })

  describe('POST /api/v1/pix/keys', () => {
    it('creates PIX key with valid input', async () => {
      const validInput = {
        type: 'EMAIL',
        value: 'test@example.com',
      }

      const res = await app.request('/api/v1/pix/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(validInput),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data).toHaveProperty('id')
      expect(mockSupabase.from).toHaveBeenCalledWith('pix_keys')
    })

    it('returns 400 for invalid input', async () => {
      const invalidInput = {
        type: 'INVALID_TYPE',
        value: '',
      }

      const res = await app.request('/api/v1/pix/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(invalidInput),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Validation failed')
    })
  })
})
```

### Integration Test Pattern
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestSupabase } from '@/test/utils/supabase'

describe('PIX Keys Integration', () => {
  let testSupabase: any

  beforeAll(async () => {
    testSupabase = await setupTestSupabase()
  })

  afterAll(async () => {
    await testSupabase.cleanup()
  })

  it('creates and retrieves PIX key end-to-end', async () => {
    // Create user
    const { data: user } = await testSupabase.auth.createUser({
      email: 'test@example.com',
      password: 'password',
    })

    // Create PIX key via API
    const createRes = await fetch('/api/v1/pix/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.session.access_token}`,
      },
      body: JSON.stringify({
        type: 'EMAIL',
        value: 'test@example.com',
      }),
    })

    expect(createRes.ok).toBe(true)
    const createdKey = await createRes.json()

    // Retrieve PIX keys via API
    const getRes = await fetch('/api/v1/pix/keys', {
      headers: {
        'Authorization': `Bearer ${user.session.access_token}`,
      },
    })

    expect(getRes.ok).toBe(true)
    const { data: keys } = await getRes.json()
    expect(keys).toContainEqual(createdKey.data)
  })
})
```

## Best Practices

### Endpoint Design
- Keep endpoints focused (single responsibility)
- Use consistent URL patterns
- Implement proper HTTP methods
- Return consistent response formats
- Include relevant metadata

### Validation
- Validate all inputs with Zod
- Provide clear error messages
- Use shared schemas when possible
- Validate at the route level

### Security
- Always authenticate sensitive endpoints
- Implement rate limiting
- Sanitize error messages
- Log security events
- Never expose sensitive data

### Performance
- Use appropriate HTTP status codes
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize database queries

### Documentation
- Document all endpoints with JSDoc
- Include request/response examples
- Specify authentication requirements
- Note rate limiting rules

## Anti-Patterns

### ❌ Returning Raw Database Errors
```typescript
// Don't do this
if (error) {
  return c.json({ error: error.message }, 500)
}

// Do this instead
if (error) {
  secureLogger.error('Database error', { error, userId: user.id })
  return c.json({ error: 'Internal server error' }, 500)
}
```

### ❌ Skipping Input Validation
```typescript
// Don't do this
router.post('/keys', async (c) => {
  const { type, value } = await c.req.json()
  // No validation!
})

// Do this instead
router.post(
  '/keys',
  zValidator('json', createPixKeySchema),
  async (c) => {
    const input = c.req.valid('json') // Validated input
  }
)
```

### ❌ Hardcoding Tokens or Secrets
```typescript
// Don't do this
const API_KEY = 'hardcoded-secret-key'

// Do this instead
const API_KEY = process.env.API_KEY
```

### ❌ Inconsistent Response Formats
```typescript
// Don't do this
return c.json({ success: true, data: result })
return c.json({ result, status: 'ok' })

// Do this instead
return c.json({ data: result })
```

### ❌ Missing Error Handling
```typescript
// Don't do this
router.get('/data', async (c) => {
  const { data } = await supabase.from('table').select()
  return c.json({ data })
})

// Do this instead
router.get('/data', async (c) => {
  const { data, error } = await supabase.from('table').select()
  if (error) {
    secureLogger.error('Database error', { error })
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
  return c.json({ data })
})
```

## Migration Checklist

For each tRPC procedure → Hono endpoint:

### Pre-Migration
- [ ] Identify all tRPC procedures to migrate
- [ ] Document input/output schemas
- [ ] Plan authentication requirements
- [ ] Identify rate limiting needs

### Implementation
- [ ] Create Zod schema for input validation
- [ ] Implement endpoint with authentication middleware
- [ ] Add error handling and logging
- [ ] Implement rate limiting if needed
- [ ] Write unit tests
- [ ] Test with Postman/curl

### Post-Migration
- [ ] Update hook to use apiClient
- [ ] Verify no regressions
- [ ] Update documentation
- [ ] Run integration tests
- [ ] Monitor performance

### Validation
- [ ] Compare responses with tRPC version
- [ ] Verify authentication works
- [ ] Test error scenarios
- [ ] Check rate limiting
- [ ] Validate logging output

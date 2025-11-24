# Hono RPC Architecture

## Overview

This document describes the Hono RPC architecture implemented in AegisWallet, replacing the previous tRPC-based system. The migration follows KISS and YAGNI principles, providing a simpler, more maintainable codebase with reduced bundle size.

## Migration Summary

The tRPC to Hono RPC migration was completed successfully with the following outcomes:
- **Bundle Size Reduction**: ~50KB reduction from removing tRPC dependencies
- **Simplified Stack**: Fewer abstractions, clearer error traces
- **Maintained Functionality**: Zero regressions in user-facing features
- **Type Safety**: Preserved through Zod schemas and manual type definitions
- **Real-time Subscriptions**: Unchanged, continue using Supabase channels

## Architecture Components

### API Layer
- **Framework**: Hono 4.10.4 with edge-first architecture
- **Routing Pattern**: `/api/v1/{domain}/{action}` with HTTP method semantics
- **Authentication**: JWT-based with request-scoped Supabase clients
- **Validation**: Zod schemas with `@hono/zod-validator` middleware
- **Error Handling**: Standardized JSON responses with error codes
- **Rate Limiting**: Per-user rate limiting with configurable windows

### Client Layer
- **API Client**: Custom fetch wrapper in `src/lib/api-client.ts`
- **State Management**: TanStack React Query for caching and optimistic updates
- **Type Safety**: Shared Zod schemas between client and server
- **Real-time**: Supabase channels for live updates (unchanged)

### Data Layer
- **Database**: Supabase PostgreSQL with RLS policies
- **Client**: Request-scoped Supabase clients with user tokens
- **Real-time**: Supabase channels for subscriptions

## API Endpoints

### Health Endpoints
- `GET /api/v1/health` - Service health check
- `GET /api/v1/health/ping` - Simple ping response
- `GET /api/v1/health/auth` - Authenticated health check

### Voice Commands
- `POST /api/v1/voice/process` - Process voice commands
- `GET /api/v1/voice/commands` - Get available commands

### Banking
- `GET /api/v1/banking/accounts` - Get linked bank accounts
- `POST /api/v1/banking/accounts/link` - Link new bank account
- `POST /api/v1/banking/accounts/sync` - Sync account data

### PIX
- `GET /api/v1/pix/keys` - Get PIX keys
- `POST /api/v1/pix/keys` - Create PIX key
- `PUT /api/v1/pix/keys/:id` - Update PIX key
- `DELETE /api/v1/pix/keys/:id` - Delete PIX key
- `GET /api/v1/pix/keys/favorites` - Get favorite PIX keys
- `GET /api/v1/pix/transactions` - Get PIX transactions
- `GET /api/v1/pix/transactions/:id` - Get single transaction
- `POST /api/v1/pix/transactions` - Create PIX transaction
- `GET /api/v1/pix/qr-codes` - Get QR codes
- `POST /api/v1/pix/qr-codes` - Generate QR code
- `DELETE /api/v1/pix/qr-codes/:id` - Deactivate QR code
- `GET /api/v1/pix/stats` - Get PIX statistics

### Contacts
- `GET /api/v1/contacts` - Get all contacts
- `GET /api/v1/contacts/:id` - Get single contact
- `POST /api/v1/contacts` - Create contact
- `PUT /api/v1/contacts/:id` - Update contact
- `DELETE /api/v1/contacts/:id` - Delete contact
- `GET /api/v1/contacts/search` - Search contacts
- `GET /api/v1/contacts/favorites` - Get favorite contacts
- `POST /api/v1/contacts/:id/favorite` - Toggle favorite status
- `GET /api/v1/contacts/stats` - Get contact statistics

## Implementation Patterns

### Authentication Middleware
```typescript
// Applied to protected routes
app.use('/api/v1/protected/*', authMiddleware);

// In route handlers
const { user, supabase } = c.get('auth');
```

### Validation Pattern
```typescript
// Input validation
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// In route definition
router.post('/endpoint', authMiddleware, zValidator('json', schema), async (c) => {
  const input = c.req.valid('json'); // Fully typed and validated
  // Process input...
});
```

### Error Handling Pattern
```typescript
// Success response
return c.json({
  data: result,
  meta: { requestId, timestamp: new Date().toISOString() }
});

// Error response
return c.json({
  error: 'Error message',
  code: 'ERROR_CODE',
  details: { /* optional context */ }
}, statusCode);
```

### Rate Limiting Pattern
```typescript
// Applied to routes
userRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests, please try again later'
})
```

## Client Integration

### API Client Usage
```typescript
import { apiClient } from '@/lib/api-client';
import { useQuery, useMutation } from '@tanstack/react-query';

// Query example
const { data, isLoading, error } = useQuery({
  queryKey: ['pix', 'keys'],
  queryFn: () => apiClient.get('/api/v1/pix/keys'),
});

// Mutation example
const { mutate, isPending } = useMutation({
  mutationFn: (input) => apiClient.post('/api/v1/pix/keys', input),
  onSuccess: () => {
    // Handle success
    queryClient.invalidateQueries({ queryKey: ['pix', 'keys'] });
  },
});
```

### Type Safety
```typescript
// Shared Zod schema
export const createPixKeySchema = z.object({
  type: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  value: z.string().min(1),
});

// Inferred type
type CreatePixKeyInput = z.infer<typeof createPixKeySchema>;

// Used in both client and server
```

## Benefits Achieved

### Performance Improvements
- **Bundle Size**: Reduced by ~50KB from removing tRPC dependencies
- **Cold Start**: Faster initial page load with fewer dependencies
- **Runtime Performance**: Reduced overhead from simpler request handling
- **Memory Usage**: Lower memory footprint with fewer abstractions

### Developer Experience
- **Simpler Debugging**: Clearer stack traces without tRPC abstraction
- **Better Error Messages**: More descriptive error responses
- **Easier Testing**: Direct HTTP endpoints are easier to test
- **Reduced Complexity**: Fewer layers between client and server

### Maintainability
- **Clearer Code Structure**: Explicit HTTP methods and routes
- **Standardized Patterns**: Consistent validation and error handling
- **Better Documentation**: Self-documenting API endpoints
- **Easier Onboarding**: New developers can understand HTTP APIs faster

## Migration Lessons Learned

### What Went Well
1. **Gradual Migration**: Coexistence of tRPC and Hono RPC allowed for zero-downtime migration
2. **Pattern Consistency**: Standardized validation, error handling, and response formats
3. **Type Safety**: Shared Zod schemas maintained type safety without tRPC's automatic inference
4. **Real-time Preservation**: Supabase channels continued working without changes

### Challenges Faced
1. **Hook Migration**: Required careful refactoring to maintain React Query patterns
2. **Type Definitions**: Manual type definitions required more upfront work
3. **Error Handling**: Standardizing error responses across all endpoints
4. **Rate Limiting**: Implementing per-user rate limiting instead of global limits

### Recommendations for Future
1. **API Versioning**: Consider implementing `/api/v2` for breaking changes
2. **OpenAPI Documentation**: Generate OpenAPI specs for better developer experience
3. **Automated Testing**: Implement comprehensive API testing with contract testing
4. **Performance Monitoring**: Add metrics collection for API performance tracking

## Security Considerations

### Authentication
- JWT-based authentication with request-scoped Supabase clients
- All protected routes require valid authentication
- Token validation and user context extraction

### Input Validation
- All inputs validated using Zod schemas
- Sanitization of sensitive data (CPF, phone numbers)
- Type safety maintained through shared schemas

### Rate Limiting
- Per-user rate limiting to prevent abuse
- Different limits for different operation types
- Configurable windows and maximum requests

### Error Handling
- Sanitized error messages (no sensitive data exposure)
- Consistent error codes across all endpoints
- Comprehensive error logging with request tracing

## Conclusion

The migration to Hono RPC has successfully simplified the AegisWallet architecture while maintaining all functionality and improving performance. The new system is more maintainable, easier to debug, and provides better developer experience.

The key to this success was following the established patterns consistently and maintaining the principle of gradual migration with coexistence, which allowed for thorough testing and validation at each step.

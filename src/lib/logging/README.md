# AegisWallet Logging System

## Overview

The AegisWallet logging system provides comprehensive, environment-aware logging capabilities that balance debugging needs in development with security and privacy requirements in production.

## Features

- **Environment-based configuration**: Different logging levels and outputs for development vs production
- **Data sanitization**: Automatic redaction of sensitive information in production logs
- **React integration**: Easy-to-use hooks for component-level logging
- **Performance tracking**: Built-in timing and performance monitoring
- **Voice command logging**: Specialized logging for voice interactions
- **Security event tracking**: Dedicated logging for security and compliance events

## Configuration

### Environment Variables

```bash
# Development (default)
VITE_LOGGING_LEVEL=debug          # Log level: debug | info | warn | error | silent
VITE_LOGGING_CONSOLE=true         # Enable console output in development
VITE_LOGGING_REMOTE=false         # Disable remote logging in development
VITE_LOGGING_ENDPOINT=            # Remote logging endpoint (production)

# Production
VITE_LOGGING_LEVEL=error          # Only log errors in production
VITE_LOGGING_CONSOLE=false        # Disable console output in production
VITE_LOGGING_REMOTE=true          # Enable remote logging in production
VITE_LOGGING_ENDPOINT=https://logs.aegiswallet.com/api/logs
```

### Default Configuration

| Environment | Log Level | Console | Remote | Sanitization |
|-------------|-----------|---------|---------|--------------|
| Development | DEBUG     | ✅      | ❌      | ❌           |
| Test        | SILENT    | ❌      | ❌      | ✅           |
| Production  | ERROR     | ❌      | ✅      | ✅           |

## Usage

### Basic Usage

```typescript
import { logger } from '@/lib/logging/logger'

// Basic logging
logger.debug('Debug message', { context: 'debug' })
logger.info('Info message', { context: 'info' })
logger.warn('Warning message', { context: 'warning' })
logger.error('Error message', { error: 'Something went wrong' })

// Specialized logging
logger.voiceCommand('User said: "What is my balance?"', 0.95)
logger.voiceError('Speech recognition failed', { error: 'Network error' })
logger.authEvent('login_success', 'user123')
logger.securityEvent('Suspicious login attempt detected')
logger.userAction('clicked_button', 'DashboardComponent')
```

### React Hook Usage

```typescript
import { useLogger } from '@/hooks/useLogger'

function MyComponent() {
  const logger = useLogger({ 
    component: 'MyComponent',
    defaultContext: { feature: 'user-profile' }
  })

  const handleClick = () => {
    logger.userAction('profile_edit_clicked', 'MyComponent', {
      userId: '123',
      section: 'personal-info'
    })
  }

  return <button onClick={handleClick}>Edit Profile</button>
}
```

### Specialized Hooks

```typescript
import { 
  useVoiceLogger, 
  useAuthLogger, 
  useSecurityLogger,
  useFinancialLogger 
} from '@/hooks/useLogger'

// Voice component logging
function VoiceComponent() {
  const logger = useVoiceLogger()
  
  const handleVoiceInput = (transcript: string) => {
    logger.voiceCommand(transcript, 0.89, { 
      inputLength: transcript.length 
    })
  }
}

// Authentication logging
function AuthComponent() {
  const logger = useAuthLogger()
  
  const handleLogin = (email: string) => {
    logger.authEvent('login_attempt', undefined, {
      emailDomain: email.split('@')[1]
    })
  }
}

// Security logging
function SecurityComponent() {
  const logger = useSecurityLogger()
  
  const handleSuspiciousActivity = (details: any) => {
    logger.securityEvent('suspicious_activity_detected', details)
  }
}
```

### Context Provider

```typescript
// In App.tsx or root component
import { LoggerProvider } from '@/contexts/LoggerContext'

function App() {
  return (
    <LoggerProvider 
      defaultConfig={{
        level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.ERROR,
        enableConsole: import.meta.env.DEV,
        enableRemote: !import.meta.env.DEV,
      }}
    >
      {/* Your app components */}
    </LoggerProvider>
  )
}
```

## Log Structure

Each log entry contains the following structure:

```typescript
interface LogEntry {
  level: LogLevel;           // debug | info | warn | error
  message: string;           // Log message
  timestamp: string;         // ISO timestamp
  context?: Record<string, any>;  // Additional context data
  userId?: string;           // User identifier (sanitized)
  sessionId?: string;        // Session identifier
  component?: string;        // React component name
  action?: string;           // Action being performed
}
```

## Data Sanitization

In production mode, the logging system automatically redacts sensitive information:

### Redacted Fields

- `password`, `token`, `secret`, `key`, `auth`, `session`
- `user`, `email`, `phone`, `cpf`, `account`, `balance`
- Any field containing these keywords (case-insensitive)

### Examples

```typescript
// Input data
{
  email: 'user@example.com',
  password: 'secret123',
  balance: 1500.50,
  sessionToken: 'abc123xyz'
}

// Sanitized output (production)
{
  email: '[REDACTED]',
  password: '[REDACTED]',
  balance: '[REDACTED]',
  sessionToken: '[REDACTED]'
}
```

## Performance Monitoring

The logging system includes built-in performance tracking:

```typescript
// Voice command performance
logger.voiceCommand('Check balance', 0.95, {
  processingTime: 245,  // ms
  confidence: 0.95
})

// TTS performance tracking
logger.warn('TTS response time exceeded target: 1200ms', {
  duration: 1200,
  target: 800,
  responseId: 'response_123'
})
```

## Remote Logging

In production, logs are sent to a remote endpoint for monitoring and analysis:

```typescript
// Automatic remote logging configuration
const config = {
  enableRemote: true,
  remoteEndpoint: 'https://logs.aegiswallet.com/api/logs'
}

// Logs are automatically sent with proper error handling
logger.error('Critical error occurred', { 
  component: 'PaymentProcessor',
  error: 'Payment failed'
})
```

## Security Considerations

### Data Privacy

- Sensitive data is automatically redacted in production
- User identifiers are truncated (first 8 characters only)
- Full transcript text is limited to 100 characters for privacy
- Stack traces are included in development only

### Compliance

- LGPD-compliant data handling
- Audit trail for security events
- User consent tracking for data processing
- Secure log transmission over HTTPS

## Development Tools

### Log Controls Hook

```typescript
import { useLoggingControls } from '@/contexts/LoggerContext'

function DebugPanel() {
  const { 
    config, 
    logs, 
    stats, 
    setLogLevel, 
    clearLogs,
    exportLogs 
  } = useLoggingControls()

  return (
    <div>
      <h3>Log Stats</h3>
      <p>Total: {stats.total}</p>
      <p>Errors: {stats.error}</p>
      <p>Warnings: {stats.warn}</p>
      
      <button onClick={() => setLogLevel(LogLevel.DEBUG)}>
        Enable Debug
      </button>
      
      <button onClick={clearLogs}>
        Clear Logs
      </button>
      
      <button onClick={() => exportLogs()}>
        Export Logs
      </button>
    </div>
  )
}
```

### Log Export

```typescript
// Export all logs as JSON
const logData = logger.exportLogs()

// Get specific log levels
const errorLogs = logger.getLogs(LogLevel.ERROR)
const allLogs = logger.getLogs()
```

## Best Practices

### When to Log

**DO log:**
- User actions (clicks, navigation, form submissions)
- Voice commands and their confidence scores
- Authentication events (login, logout, registration)
- Security events (failed attempts, suspicious activity)
- Performance metrics (response times, processing delays)
- Error conditions with context

**DON'T log:**
- Raw passwords or tokens
- Complete financial data (account numbers, full balances)
- Personal identification information (CPF, full phone numbers)
- Sensitive user content (messages, notes)

### Log Message Guidelines

- Use clear, descriptive messages
- Include context data for debugging
- Keep messages concise but informative
- Use consistent naming conventions
- Include component names for React components

### Performance Considerations

- Log levels are checked before processing
- Remote logging is asynchronous and non-blocking
- Local logs are limited to prevent memory issues
- Sensitive data sanitization is optimized for performance

## Troubleshooting

### Common Issues

**Logs not appearing in production:**
- Check `VITE_LOGGING_LEVEL` environment variable
- Verify `VITE_LOGGING_REMOTE` is set to `true`
- Ensure remote endpoint is accessible

**Sensitive data appearing in logs:**
- Verify production environment is detected correctly
- Check sanitization rules cover the sensitive fields
- Review context data for unintended sensitive information

**Performance impact from logging:**
- Reduce log level in production
- Limit context data size
- Check remote endpoint response times

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Temporarily enable debug logging
logger.updateConfig({
  level: LogLevel.DEBUG,
  enableConsole: true,
  sanitizeData: false  // Only for debugging!
})
```

Remember to restore production settings after debugging.
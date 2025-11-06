/**
 * Logging System Tests
 * Validates logging functionality, data sanitization, and environment configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, LogLevel } from '@/lib/logging/logger'
import { renderHook, act } from '@testing-library/react'
import { LoggerProvider, useLogger, useVoiceLogger, useAuthLogger } from '@/contexts/LoggerContext'
import React, { ReactNode } from 'react'

// Mock console methods
const consoleMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock fetch for remote logging
const fetchMock = vi.fn()

// Test wrapper component
const TestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <LoggerProvider>{children}</LoggerProvider>
}

describe('Logger Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logger.clearLogs()
    logger.updateConfig({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      sanitizeData: false,
    })
  })

  afterEach(() => {
    logger.clearLogs()
  })

  it('should log messages at different levels', () => {
    logger.debug('Debug message', { debug: true })
    logger.info('Info message', { info: true })
    logger.warn('Warning message', { warn: true })
    logger.error('Error message', { error: true })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(4)
    expect(logs[0].level).toBe(LogLevel.DEBUG)
    expect(logs[1].level).toBe(LogLevel.INFO)
    expect(logs[2].level).toBe(LogLevel.WARN)
    expect(logs[3].level).toBe(LogLevel.ERROR)
  })

  it('should respect log level configuration', () => {
    logger.updateConfig({ level: LogLevel.WARN })

    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warning message')
    logger.error('Error message')

    const logs = logger.getLogs()
    expect(logs).toHaveLength(2)
    expect(logs[0].level).toBe(LogLevel.WARN)
    expect(logs[1].level).toBe(LogLevel.ERROR)
  })

  it('should include proper metadata in log entries', () => {
    logger.info('Test message', { userId: '123', action: 'test' })

    const logs = logger.getLogs()
    const log = logs[0]

    expect(log).toMatchObject({
      level: LogLevel.INFO,
      message: 'Test message',
      context: { userId: '123', action: 'test' },
      sessionId: expect.stringMatching(/^session_\d+_\w+$/),
    })
    expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should sanitize sensitive data in production mode', () => {
    logger.updateConfig({ sanitizeData: true })

    const sensitiveData = {
      email: 'user@example.com',
      password: 'secret123',
      token: 'abc123xyz',
      balance: 1500.5,
      cpf: '123.456.789-00',
      nested: {
        secretKey: 'hidden',
        normalField: 'visible',
      },
    }

    logger.info('Sensitive data test', sensitiveData)

    const logs = logger.getLogs()
    const context = logs[0].context

    expect(context).toEqual({
      email: '[REDACTED]',
      password: '[REDACTED]',
      token: '[REDACTED]',
      balance: '[REDACTED]',
      cpf: '[REDACTED]',
      nested: {
        secretKey: '[REDACTED]',
        normalField: 'visible',
      },
    })
  })

  it('should handle voice command logging', () => {
    logger.voiceCommand('What is my balance?', 0.95, {
      processingTime: 250,
      language: 'pt-BR',
    })

    const logs = logger.getLogs()
    const log = logs[0]

    expect(log.message).toBe('Voice command processed')
    expect(log.context).toMatchObject({
      command: 'What is my balance?',
      confidence: 0.95,
      processingTime: 250,
      language: 'pt-BR',
    })
  })

  it('should handle authentication event logging', () => {
    logger.authEvent('login_success', 'user123abc', {
      method: 'google_oauth',
      timestamp: Date.now(),
    })

    const logs = logger.getLogs()
    const log = logs[0]

    expect(log.message).toBe('Authentication event')
    expect(log.context).toMatchObject({
      event: 'login_success',
      userId: 'user123a...', // Truncated for privacy
      method: 'google_oauth',
    })
  })

  it('should handle security event logging', () => {
    logger.securityEvent('suspicious_login_attempt', {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      attempts: 5,
    })

    const logs = logger.getLogs()
    const log = logs[0]

    expect(log.message).toBe('Security event')
    expect(log.context).toMatchObject({
      event: 'suspicious_login_attempt',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      attempts: 5,
    })
  })

  it('should handle user action logging', () => {
    logger.userAction('button_clicked', 'DashboardComponent', {
      buttonId: 'balance-button',
      timestamp: Date.now(),
    })

    const logs = logger.getLogs()
    const log = logs[0]

    expect(log.message).toBe('User action')
    expect(log.context).toMatchObject({
      action: 'button_clicked',
      component: 'DashboardComponent',
      buttonId: 'balance-button',
    })
  })

  it('should limit log history to prevent memory issues', () => {
    logger.updateConfig({ maxEntries: 5 })

    // Add more logs than the limit
    for (let i = 0; i < 10; i++) {
      logger.info(`Message ${i}`, { index: i })
    }

    const logs = logger.getLogs()
    expect(logs).toHaveLength(5)
    expect(logs[0].context?.index).toBe(5) // First 5 should be removed
    expect(logs[4].context?.index).toBe(9) // Last 5 should remain
  })
})

describe('React Hooks Integration', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should work with useLogger hook', () => {
    const { result } = renderHook(() => useLogger({ component: 'TestComponent' }), {
      wrapper: TestWrapper,
    })

    act(() => {
      result.current.info('Test message from hook', { hookData: true })
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].context?.component).toBe('TestComponent')
    expect(logs[0].context?.hookData).toBe(true)
  })

  it('should work with useVoiceLogger hook', () => {
    const { result } = renderHook(() => useVoiceLogger(), { wrapper: TestWrapper })

    act(() => {
      result.current.voiceCommand('Test voice command', 0.88, {
        hook: 'voice-logger',
      })
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].context?.component).toBe('Voice')
    expect(logs[0].context?.hook).toBe('voice-logger')
  })

  it('should work with useAuthLogger hook', () => {
    const { result } = renderHook(() => useAuthLogger(), { wrapper: TestWrapper })

    act(() => {
      result.current.authEvent('test_auth_event', 'testuser123', {
        method: 'test',
      })
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].context?.component).toBe('Auth')
    expect(logs[0].context?.method).toBe('test')
  })

  it('should handle context management in hooks', () => {
    const { result } = renderHook(() => useLogger({ component: 'ContextTest' }), {
      wrapper: TestWrapper,
    })

    act(() => {
      result.current.setContext({ sessionId: 'abc123' })
      result.current.info('Message with context')
    })

    const logs = logger.getLogs()
    expect(logs[0].context?.sessionId).toBe('abc123')
    expect(logs[0].context?.component).toBe('ContextTest')

    act(() => {
      result.current.clearContext()
      result.current.info('Message after clear')
    })

    const logsAfterClear = logger.getLogs()
    expect(logsAfterClear[1].context?.sessionId).toBeUndefined()
  })
})

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logger.clearLogs()
  })

  it('should use development configuration by default', () => {
    // Mock development environment
    vi.stubEnv('NODE_ENV', 'development')

    const config = logger.getConfig()
    expect(config.level).toBe(LogLevel.DEBUG)
    expect(config.enableConsole).toBe(true)
    expect(config.enableRemote).toBe(false)
    expect(config.sanitizeData).toBe(false)
  })

  it('should use production configuration for production', () => {
    // Mock production environment
    vi.stubEnv('NODE_ENV', 'production')

    logger.updateConfig({
      level: LogLevel.ERROR,
      enableConsole: false,
      enableRemote: true,
      sanitizeData: true,
    })

    const config = logger.getConfig()
    expect(config.level).toBe(LogLevel.ERROR)
    expect(config.enableConsole).toBe(false)
    expect(config.enableRemote).toBe(true)
    expect(config.sanitizeData).toBe(true)
  })

  it('should handle test environment configuration', () => {
    // Mock test environment
    vi.stubEnv('NODE_ENV', 'test')

    logger.updateConfig({
      level: LogLevel.SILENT,
      enableConsole: false,
      enableRemote: false,
      sanitizeData: true,
    })

    // Should not log anything in silent mode
    logger.info('This should not be logged')
    const logs = logger.getLogs()
    expect(logs).toHaveLength(0)
  })
})

describe('Error Handling', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should handle invalid log data gracefully', () => {
    expect(() => {
      logger.info('Test', null as any)
      logger.info('Test', undefined as any)
      logger.info('Test', { circular: {} })
    }).not.toThrow()

    const logs = logger.getLogs()
    expect(logs).toHaveLength(3)
  })

  it('should handle voice error logging', () => {
    const error = new Error('Speech recognition failed')
    logger.voiceError(error.message, {
      error: error.message,
      stack: error.stack,
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Voice processing error')
    expect(logs[0].context?.error).toBe('Speech recognition failed')
  })

  it('should handle circular references in context', () => {
    const circular: any = { name: 'test' }
    circular.self = circular

    expect(() => {
      logger.info('Circular reference test', circular)
    }).not.toThrow()

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
  })
})

describe('Performance', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should handle large numbers of log entries efficiently', () => {
    const startTime = performance.now()

    for (let i = 0; i < 1000; i++) {
      logger.info(`Performance test message ${i}`, { index: i })
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    // Should complete within reasonable time (less than 100ms for 1000 logs)
    expect(duration).toBeLessThan(100)

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1000)
  })

  it('should maintain performance with large context objects', () => {
    const largeContext = {
      data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
    }

    const startTime = performance.now()
    logger.info('Large context test', largeContext)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(50) // Should be very fast
  })
})

describe('Integration Tests', () => {
  beforeEach(() => {
    logger.clearLogs()
  })

  it('should simulate real-world voice command flow', () => {
    const voiceLogger = useVoiceLogger()

    // Simulate voice command processing
    voiceLogger.voiceCommand('qual é meu saldo', 0.92, {
      language: 'pt-BR',
      processingTime: 180,
    })

    // Simulate successful command processing
    voiceLogger.userAction('balance_request_processed', 'VoiceService', {
      confidence: 0.92,
      responseTime: 180,
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(2)
    expect(logs[0].context?.component).toBe('Voice')
    expect(logs[1].context?.component).toBe('Voice')
  })

  it('should simulate authentication flow with logging', () => {
    const authLogger = useAuthLogger()

    // Simulate login attempt
    authLogger.authEvent('login_attempt', undefined, {
      method: 'google_oauth',
      timestamp: Date.now(),
    })

    // Simulate successful login
    authLogger.authEvent('login_success', 'user123abc', {
      method: 'google_oauth',
    })

    // Simulate user action after login
    authLogger.userAction('dashboard_viewed', 'AuthComponent', {
      timestamp: Date.now(),
    })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(3)
    expect(logs[0].context?.event).toBe('login_attempt')
    expect(logs[1].context?.event).toBe('login_success')
    expect(logs[1].context?.userId).toBe('user123a...') // Sanitized
    expect(logs[2].context?.action).toBe('dashboard_viewed')
  })
})

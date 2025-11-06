/**
 * React Hook for Component-level Logging
 * Provides easy access to the AegisWallet logger within React components
 */

import { useCallback, useRef } from 'react'
import { logger, LogLevel, LogEntry } from '@/lib/logging/logger'

interface UseLoggerOptions {
  component?: string
  defaultContext?: Record<string, any>
}

interface UseLoggerReturn {
  // Basic logging methods
  debug: (message: string, context?: Record<string, any>) => void
  info: (message: string, context?: Record<string, any>) => void
  warn: (message: string, context?: Record<string, any>) => void
  error: (message: string, context?: Record<string, any>) => void

  // Specialized logging methods
  userAction: (action: string, context?: Record<string, any>) => void
  voiceCommand: (command: string, confidence: number, context?: Record<string, any>) => void
  voiceError: (error: string, context?: Record<string, any>) => void
  authEvent: (event: string, userId?: string, context?: Record<string, any>) => void
  securityEvent: (event: string, context?: Record<string, any>) => void

  // Utility methods
  setContext: (context: Record<string, any>) => void
  clearContext: () => void
  getLogs: (level?: LogLevel) => LogEntry[]
}

export function useLogger(options: UseLoggerOptions = {}): UseLoggerReturn {
  const { component = 'Unknown', defaultContext = {} } = options
  const contextRef = useRef<Record<string, any>>(defaultContext)

  const createLogMethod = useCallback(
    (baseMethod: (message: string, context?: Record<string, any>) => void) => {
      return (message: string, additionalContext?: Record<string, any>) => {
        const fullContext = {
          ...contextRef.current,
          ...additionalContext,
          component,
        }

        baseMethod(message, fullContext)
      }
    },
    [component]
  )

  const debug = useCallback(createLogMethod(logger.debug.bind(logger)), [createLogMethod])

  const info = useCallback(createLogMethod(logger.info.bind(logger)), [createLogMethod])

  const warn = useCallback(createLogMethod(logger.warn.bind(logger)), [createLogMethod])

  const error = useCallback(createLogMethod(logger.error.bind(logger)), [createLogMethod])

  // Specialized methods
  const userAction = useCallback(
    (action: string, additionalContext?: Record<string, any>) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      }

      logger.userAction(action, component, fullContext)
    },
    [component]
  )

  const voiceCommand = useCallback(
    (command: string, confidence: number, additionalContext?: Record<string, any>) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      }

      logger.voiceCommand(command, confidence, fullContext)
    },
    [component]
  )

  const voiceError = useCallback(
    (error: string, additionalContext?: Record<string, any>) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      }

      logger.voiceError(error, fullContext)
    },
    [component]
  )

  const authEvent = useCallback(
    (event: string, userId?: string, additionalContext?: Record<string, any>) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      }

      logger.authEvent(event, userId, fullContext)
    },
    [component]
  )

  const securityEvent = useCallback(
    (event: string, additionalContext?: Record<string, any>) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      }

      logger.securityEvent(event, fullContext)
    },
    [component]
  )

  // Context management
  const setContext = useCallback((newContext: Record<string, any>) => {
    contextRef.current = { ...contextRef.current, ...newContext }
  }, [])

  const clearContext = useCallback(() => {
    contextRef.current = defaultContext
  }, [defaultContext])

  const getLogs = useCallback((level?: LogLevel) => {
    return logger.getLogs(level)
  }, [])

  return {
    debug,
    info,
    warn,
    error,
    userAction,
    voiceCommand,
    voiceError,
    authEvent,
    securityEvent,
    setContext,
    clearContext,
    getLogs,
  }
}

// Convenience hook for common patterns
export function useVoiceLogger() {
  return useLogger({
    component: 'Voice',
    defaultContext: {
      module: 'voice-processing',
    },
  })
}

export function useAuthLogger() {
  return useLogger({
    component: 'Auth',
    defaultContext: {
      module: 'authentication',
    },
  })
}

export function useSecurityLogger() {
  return useLogger({
    component: 'Security',
    defaultContext: {
      module: 'security-compliance',
    },
  })
}

export function useFinancialLogger() {
  return useLogger({
    component: 'Financial',
    defaultContext: {
      module: 'financial-operations',
    },
  })
}

export default useLogger

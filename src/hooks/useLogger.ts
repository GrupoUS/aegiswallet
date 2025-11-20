/**
 * React Hook for Component-level Logging
 * Provides easy access to the AegisWallet logger within React components
 */

import { useCallback, useRef } from 'react';
import { type LogEntry, type LogLevel, logger } from '@/lib/logging/logger';

interface UseLoggerOptions {
  component?: string;
  defaultContext?: Record<string, unknown>;
}

type LoggerContext = Record<string, unknown>;

interface UseLoggerReturn {
  // Basic logging methods
  debug: (message: string, context?: LoggerContext) => void;
  info: (message: string, context?: LoggerContext) => void;
  warn: (message: string, context?: LoggerContext) => void;
  error: (message: string, context?: LoggerContext) => void;

  // Specialized logging methods
  userAction: (action: string, context?: LoggerContext) => void;
  voiceCommand: (command: string, confidence: number, context?: LoggerContext) => void;
  voiceError: (error: string, context?: LoggerContext) => void;
  authEvent: (event: string, userId?: string, context?: LoggerContext) => void;
  securityEvent: (event: string, context?: LoggerContext) => void;

  // Utility methods
  setContext: (context: LoggerContext) => void;
  clearContext: () => void;
  getLogs: (level?: LogLevel) => LogEntry[];
}

export function useLogger(options: UseLoggerOptions = {}): UseLoggerReturn {
  const { component = 'Unknown', defaultContext = {} } = options;
  const contextRef = useRef<LoggerContext>(defaultContext);

  const createLogMethod = useCallback(
    (baseMethod: (message: string, context?: LoggerContext) => void) => {
      return (message: string, additionalContext?: LoggerContext) => {
        const fullContext = {
          ...contextRef.current,
          ...additionalContext,
          component,
        };

        baseMethod(message, fullContext);
      };
    },
    [component]
  );

  const debug = useCallback(createLogMethod(logger.debug.bind(logger)), []);

  const info = useCallback(createLogMethod(logger.info.bind(logger)), []);

  const warn = useCallback(createLogMethod(logger.warn.bind(logger)), []);

  const error = useCallback(createLogMethod(logger.error.bind(logger)), []);

  // Specialized methods
  const userAction = useCallback(
    (action: string, additionalContext?: LoggerContext) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      };

      logger.userAction(action, component, fullContext);
    },
    [component]
  );

  const voiceCommand = useCallback(
    (command: string, confidence: number, additionalContext?: LoggerContext) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      };

      logger.voiceCommand(command, confidence, fullContext);
    },
    [component]
  );

  const voiceError = useCallback(
    (error: string, additionalContext?: LoggerContext) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      };

      logger.voiceError(error, fullContext);
    },
    [component]
  );

  const authEvent = useCallback(
    (event: string, userId?: string, additionalContext?: LoggerContext) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      };

      logger.authEvent(event, userId, fullContext);
    },
    [component]
  );

  const securityEvent = useCallback(
    (event: string, additionalContext?: LoggerContext) => {
      const fullContext = {
        ...contextRef.current,
        ...additionalContext,
        component,
      };

      logger.securityEvent(event, fullContext);
    },
    [component]
  );

  // Context management
  const setContext = useCallback((newContext: LoggerContext) => {
    contextRef.current = { ...contextRef.current, ...newContext };
  }, []);

  const clearContext = useCallback(() => {
    contextRef.current = defaultContext;
  }, [defaultContext]);

  const getLogs = useCallback((level?: LogLevel) => {
    return logger.getLogs(level);
  }, []);

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
  };
}

// Convenience hook for common patterns
export function useVoiceLogger() {
  return useLogger({
    component: 'Voice',
    defaultContext: {
      module: 'voice-processing',
    },
  });
}

export function useAuthLogger() {
  return useLogger({
    component: 'Auth',
    defaultContext: {
      module: 'authentication',
    },
  });
}

export function useSecurityLogger() {
  return useLogger({
    component: 'Security',
    defaultContext: {
      module: 'security-compliance',
    },
  });
}

export function useFinancialLogger() {
  return useLogger({
    component: 'Financial',
    defaultContext: {
      module: 'financial-operations',
    },
  });
}

export default useLogger;

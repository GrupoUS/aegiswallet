/**
 * Logger Context Provider
 * Provides global logger configuration and session management
 */

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { type LogEntry, type LoggerConfig, LogLevel, logger } from '@/lib/logging/logger';

// Enhanced logging context types
interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

interface VoiceCommandContext extends LogContext {
  confidence?: number;
  language?: string;
  processingTime?: number;
}

interface LoggerContextValue {
  config: LoggerConfig;
  updateConfig: (config: Partial<LoggerConfig>) => void;
  logs: LogEntry[];
  clearLogs: () => void;
  exportLogs: () => string;
  isDevelopment: boolean;
}

const LoggerContext = createContext<LoggerContextValue | undefined>(undefined);

interface LoggerProviderProps {
  children: ReactNode;
  defaultConfig?: Partial<LoggerConfig>;
}

export function LoggerProvider({ children, defaultConfig = {} }: LoggerProviderProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<LoggerConfig>(() => ({
    ...logger.getConfig(),
    ...defaultConfig,
  }));

  const isDevelopment = import.meta.env.DEV;

  // Update logger config when context config changes
  useEffect(() => {
    logger.updateConfig(config);
  }, [config]);

  // Sync logs from logger to context (for development tools)
  useEffect(() => {
    if (isDevelopment) {
      const interval = setInterval(() => {
        const currentLogs = logger.getLogs();
        setLogs(currentLogs);
      }, 1000); // Sync every second in development

      return () => clearInterval(interval);
    }
  }, []);

  const updateConfig = (newConfig: Partial<LoggerConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    return logger.exportLogs();
  };

  const value: LoggerContextValue = {
    config,
    updateConfig,
    logs,
    clearLogs,
    exportLogs,
    isDevelopment,
  };

  return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>;
}

export function useLoggerContext(): LoggerContextValue {
  const context = useContext(LoggerContext);
  if (context === undefined) {
    throw new Error('useLoggerContext must be used within a LoggerProvider');
  }
  return context;
}

// Development-only logging controls hook
export function useLoggingControls() {
  const { config, updateConfig, logs, clearLogs, exportLogs, isDevelopment } = useLoggerContext();

  const setLogLevel = (level: LogLevel) => {
    updateConfig({ level });
  };

  const enableConsoleLogging = (enabled: boolean) => {
    updateConfig({ enableConsole: enabled });
  };

  const enableRemoteLogging = (enabled: boolean) => {
    updateConfig({ enableRemote: enabled });
  };

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      debug: logs.filter((log) => log.level === LogLevel.DEBUG).length,
      info: logs.filter((log) => log.level === LogLevel.INFO).length,
      warn: logs.filter((log) => log.level === LogLevel.WARN).length,
      error: logs.filter((log) => log.level === LogLevel.ERROR).length,
    };
    return stats;
  };

  return {
    // Current state
    config,
    logs,
    isDevelopment,
    stats: getLogStats(),

    // Actions
    setLogLevel,
    enableConsoleLogging,
    enableRemoteLogging,
    clearLogs,
    exportLogs,
    updateConfig,
  };
}

// Enhanced logging hooks for specific domains
export function useLogger(context?: { component?: string; userId?: string }) {
  const [currentContext, setCurrentContext] = useState<LogContext>(context || {});

  const setContext = (newContext: LogContext) => {
    setCurrentContext((prev) => ({ ...prev, ...newContext }));
  };

  const clearContext = () => {
    setCurrentContext(context || {});
  };

  return {
    debug: (message: string, additionalContext?: LogContext) =>
      logger.debug(message, { ...currentContext, ...additionalContext }),
    info: (message: string, additionalContext?: LogContext) =>
      logger.info(message, { ...currentContext, ...additionalContext }),
    warn: (message: string, additionalContext?: LogContext) =>
      logger.warn(message, { ...currentContext, ...additionalContext }),
    error: (message: string, additionalContext?: LogContext) =>
      logger.error(message, { ...currentContext, ...additionalContext }),
    setContext,
    clearContext,
  };
}

export function useVoiceLogger() {
  return {
    voiceCommand: (command: string, confidence: number, context?: VoiceCommandContext) =>
      logger.voiceCommand(command, confidence, {
        component: 'Voice',
        ...context,
      }),
    voiceError: (error: string, context?: VoiceCommandContext) =>
      logger.voiceError(error, { component: 'Voice', ...context }),
    userAction: (action: string, component: string, context?: VoiceCommandContext) =>
      logger.userAction(action, component, { component: 'Voice', ...context }),
  };
}

export function useAuthLogger() {
  return {
    authEvent: (event: string, userId?: string, context?: LogContext) =>
      logger.authEvent(event, userId, { component: 'Auth', ...context }),
    userAction: (action: string, component: string, context?: LogContext) =>
      logger.userAction(action, component, { component: 'Auth', ...context }),
    securityEvent: (event: string, context?: LogContext) =>
      logger.securityEvent(event, { component: 'Auth', ...context }),
  };
}

export default LoggerProvider;

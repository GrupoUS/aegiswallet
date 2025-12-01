/**
 * Logger Context Provider
 * Provides global logger configuration and session management
 */

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { LogEntry, LoggerConfig } from '@/lib/logging/logger';
import { LogLevel, logger } from '@/lib/logging/logger';

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

	const updateConfig = useCallback((newConfig: Partial<LoggerConfig>) => {
		setConfig((prev) => ({ ...prev, ...newConfig }));
	}, []);

	const clearLogs = useCallback(() => {
		logger.clearLogs();
		setLogs([]);
	}, []);

	const exportLogs = useCallback(() => {
		return logger.exportLogs();
	}, []);

	const value = useMemo<LoggerContextValue>(
		() => ({
			clearLogs,
			config,
			exportLogs,
			isDevelopment,
			logs,
			updateConfig,
		}),
		[clearLogs, config, exportLogs, logs, updateConfig],
	);

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
			debug: logs.filter((log) => log.level === LogLevel.Debug).length,
			error: logs.filter((log) => log.level === LogLevel.Error).length,
			info: logs.filter((log) => log.level === LogLevel.Info).length,
			total: logs.length,
			warn: logs.filter((log) => log.level === LogLevel.Warn).length,
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

	const setContext = useCallback((newContext: LogContext) => {
		setCurrentContext((prev) => ({ ...prev, ...newContext }));
	}, []);

	const clearContext = useCallback(() => {
		setCurrentContext(context || {});
	}, [context]);

	const debug = useCallback(
		(message: string, additionalContext?: LogContext) =>
			logger.debug(message, { ...currentContext, ...additionalContext }),
		[currentContext],
	);

	const error = useCallback(
		(message: string, additionalContext?: LogContext) =>
			logger.error(message, { ...currentContext, ...additionalContext }),
		[currentContext],
	);

	const info = useCallback(
		(message: string, additionalContext?: LogContext) =>
			logger.info(message, { ...currentContext, ...additionalContext }),
		[currentContext],
	);

	const warn = useCallback(
		(message: string, additionalContext?: LogContext) =>
			logger.warn(message, { ...currentContext, ...additionalContext }),
		[currentContext],
	);

	return useMemo(
		() => ({
			clearContext,
			debug,
			error,
			info,
			setContext,
			warn,
		}),
		[clearContext, debug, error, info, setContext, warn],
	);
}

// Memoized voice logger functions
const voiceUserAction = (action: string, component: string, context?: VoiceCommandContext) =>
	logger.userAction(action, component, { component: 'Voice', ...context });

const voiceVoiceCommand = (command: string, confidence: number, context?: VoiceCommandContext) =>
	logger.voiceCommand(command, confidence, { component: 'Voice', ...context });

const voiceVoiceError = (errorMsg: string, context?: VoiceCommandContext) =>
	logger.voiceError(errorMsg, { component: 'Voice', ...context });

// Stable reference for useVoiceLogger
const VOICE_LOGGER_RESULT = {
	userAction: voiceUserAction,
	voiceCommand: voiceVoiceCommand,
	voiceError: voiceVoiceError,
};

export function useVoiceLogger() {
	return VOICE_LOGGER_RESULT;
}

// Memoized auth logger functions
const authAuthEvent = (event: string, userId?: string, context?: LogContext) =>
	logger.authEvent(event, userId, { component: 'Auth', ...context });

const authSecurityEvent = (event: string, context?: LogContext) =>
	logger.securityEvent(event, { component: 'Auth', ...context });

const authUserAction = (action: string, component: string, context?: LogContext) =>
	logger.userAction(action, component, { component: 'Auth', ...context });

// Stable reference for useAuthLogger
const AUTH_LOGGER_RESULT = {
	authEvent: authAuthEvent,
	securityEvent: authSecurityEvent,
	userAction: authUserAction,
};

export function useAuthLogger() {
	return AUTH_LOGGER_RESULT;
}

export default LoggerProvider;

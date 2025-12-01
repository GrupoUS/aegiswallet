/**
 * React Hook for Component-level Logging
 * Provides easy access to the AegisWallet logger within React components
 */

import { useCallback, useMemo, useRef } from 'react';

import type { LogEntry } from '@/lib/logging/logger';
import { logger } from '@/lib/logging/logger';

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
	getLogs: () => LogEntry[];
}

export function useLogger(options: UseLoggerOptions = {}): UseLoggerReturn {
	const { component = 'Unknown', defaultContext = {} } = options;
	const contextRef = useRef<LoggerContext>(defaultContext);

	// Memoize log method references with proper dependencies
	const boundDebug = useCallback(logger.debug.bind(logger), []);
	const boundInfo = useCallback(logger.info.bind(logger), []);
	const boundWarn = useCallback(logger.warn.bind(logger), []);
	const boundError = useCallback(logger.error.bind(logger), []);

	const debug = useCallback(
		(message: string, additionalContext?: LoggerContext) => {
			const fullContext = { ...contextRef.current, ...additionalContext, component };
			boundDebug(message, fullContext);
		},
		[component, boundDebug],
	);

	const info = useCallback(
		(message: string, additionalContext?: LoggerContext) => {
			const fullContext = { ...contextRef.current, ...additionalContext, component };
			boundInfo(message, fullContext);
		},
		[component, boundInfo],
	);

	const warn = useCallback(
		(message: string, additionalContext?: LoggerContext) => {
			const fullContext = { ...contextRef.current, ...additionalContext, component };
			boundWarn(message, fullContext);
		},
		[component, boundWarn],
	);

	const error = useCallback(
		(message: string, additionalContext?: LoggerContext) => {
			const fullContext = { ...contextRef.current, ...additionalContext, component };
			boundError(message, fullContext);
		},
		[component, boundError],
	);

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
		[component],
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
		[component],
	);

	const voiceError = useCallback(
		(errorMsg: string, additionalContext?: LoggerContext) => {
			const fullContext = {
				...contextRef.current,
				...additionalContext,
				component,
			};

			logger.voiceError(errorMsg, fullContext);
		},
		[component],
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
		[component],
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
		[component],
	);

	// Context management
	const setContext = useCallback((newContext: LoggerContext) => {
		contextRef.current = { ...contextRef.current, ...newContext };
	}, []);

	const clearContext = useCallback(() => {
		contextRef.current = defaultContext;
	}, [defaultContext]);

	const getLogs = useCallback(() => {
		return logger.getLogs();
	}, []);

	return useMemo(
		() => ({
			authEvent,
			clearContext,
			debug,
			error,
			getLogs,
			info,
			securityEvent,
			setContext,
			userAction,
			voiceCommand,
			voiceError,
			warn,
		}),
		[
			authEvent,
			clearContext,
			debug,
			error,
			getLogs,
			info,
			securityEvent,
			setContext,
			userAction,
			voiceCommand,
			voiceError,
			warn,
		],
	);
}

// Convenience hook for common patterns
// Stable options objects for specialized logger hooks (prevents re-renders)
const VOICE_LOGGER_OPTIONS: UseLoggerOptions = {
	component: 'Voice',
	defaultContext: {
		module: 'voice-processing',
	},
};

export function useVoiceLogger() {
	return useLogger(VOICE_LOGGER_OPTIONS);
}

const AUTH_LOGGER_OPTIONS: UseLoggerOptions = {
	component: 'Auth',
	defaultContext: {
		module: 'authentication',
	},
};

export function useAuthLogger() {
	return useLogger(AUTH_LOGGER_OPTIONS);
}

const SECURITY_LOGGER_OPTIONS: UseLoggerOptions = {
	component: 'Security',
	defaultContext: {
		module: 'security-compliance',
	},
};

export function useSecurityLogger() {
	return useLogger(SECURITY_LOGGER_OPTIONS);
}

const FINANCIAL_LOGGER_OPTIONS: UseLoggerOptions = {
	component: 'Financial',
	defaultContext: {
		module: 'financial-operations',
	},
};

export function useFinancialLogger() {
	return useLogger(FINANCIAL_LOGGER_OPTIONS);
}

export default useLogger;

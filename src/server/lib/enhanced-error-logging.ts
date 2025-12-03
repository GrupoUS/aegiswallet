/**
 * Enhanced Error Logging Utilities
 * Provides consistent error logging with full request context
 */

import type { Context } from 'hono';
import { secureLogger } from '@/lib/logging/secure-logger';
import { categorizeDatabaseError } from './db-error-handler';

export interface ErrorLogContext {
	error: unknown;
	context: Context;
	userId?: string;
	endpoint?: string;
	additionalContext?: Record<string, unknown>;
}

/**
 * Log error with enhanced context including request details
 * @param params - Error logging parameters
 */
export function logErrorWithContext(params: ErrorLogContext): void {
	const { error, context, userId, endpoint, additionalContext = {} } = params;

	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;
	const requestId = context.get('requestId') || 'unknown';
	const method = context.req.method;
	const path = context.req.path || endpoint || 'unknown';
	const clientIP = context.req.header('X-Forwarded-For') || context.req.header('X-Real-IP') || 'unknown';
	const userAgent = context.req.header('User-Agent') || 'unknown';

	// Categorize database errors if applicable
	const dbError = categorizeDatabaseError(error);

	// Build comprehensive log context
	const logContext: Record<string, unknown> = {
		error: errorMessage,
		errorCode: dbError.code,
		errorStatus: dbError.statusCode,
		isRetryable: dbError.isRetryable,
		method,
		path,
		requestId,
		userId: userId || 'unknown',
		ip: clientIP,
		userAgent,
		...additionalContext,
	};

	// Include stack trace in development
	if (errorStack && (process.env.NODE_ENV === 'development' || import.meta.env?.DEV)) {
		logContext.stack = errorStack;
	}

	// Log based on error severity
	if (dbError.statusCode >= 500) {
		// Server errors - log as error
		secureLogger.error('Server error occurred', logContext);
	} else if (dbError.statusCode >= 400) {
		// Client errors - log as warn
		secureLogger.warn('Client error occurred', logContext);
	} else {
		// Other errors - log as error
		secureLogger.error('Unexpected error occurred', logContext);
	}
}

/**
 * Create error response with enhanced logging
 * @param context - Hono context
 * @param error - Error object
 * @param defaultCode - Default error code
 * @param defaultMessage - Default error message
 * @param userId - Optional user ID
 * @param additionalContext - Additional context for logging
 * @returns JSON response with appropriate status code
 */
export function createErrorResponse(
	context: Context,
	error: unknown,
	defaultCode: string,
	defaultMessage: string,
	userId?: string,
	additionalContext?: Record<string, unknown>,
) {
	// Log error with full context
	logErrorWithContext({
		additionalContext,
		context,
		endpoint: context.req.path,
		error,
		userId,
	});

	// Categorize error
	const dbError = categorizeDatabaseError(error);

	// Return appropriate response
	return context.json(
		{
			code: dbError.code || defaultCode,
			error: dbError.message || defaultMessage,
			details: process.env.NODE_ENV === 'development' || import.meta.env?.DEV
				? (error instanceof Error ? error.message : String(error))
				: undefined,
		},
		dbError.statusCode || 500,
	);
}


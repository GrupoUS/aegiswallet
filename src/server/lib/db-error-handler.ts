/**
 * Database Error Handler
 * Categorizes database errors and returns appropriate HTTP status codes
 */

import type { ContentfulStatusCode } from 'hono/utils/http-status';

export interface DatabaseErrorInfo {
	statusCode: ContentfulStatusCode;
	code: string;
	message: string;
	isRetryable: boolean;
}

/**
 * Categorize database errors and return appropriate error information
 * @param error - The error object
 * @returns Error information with status code, error code, and message
 */
export function categorizeDatabaseError(error: unknown): DatabaseErrorInfo {
	const errorMessage = error instanceof Error ? error.message : String(error);

	// Connection errors (503 Service Unavailable)
	if (
		errorMessage.includes('connection') ||
		errorMessage.includes('ECONNREFUSED') ||
		errorMessage.includes('timeout') ||
		errorMessage.includes('ETIMEDOUT') ||
		errorMessage.includes('ENOTFOUND') ||
		errorMessage.includes('connection refused') ||
		errorMessage.includes('Connection pool') ||
		errorMessage.includes('DATABASE_URL')
	) {
		return {
			code: 'DATABASE_CONNECTION_ERROR',
			isRetryable: true,
			message: 'Database connection failed. Please try again later.',
			statusCode: 503,
		};
	}

	// RLS (Row Level Security) policy violations (403 Forbidden)
	if (
		errorMessage.includes('policy') ||
		errorMessage.includes('RLS') ||
		errorMessage.includes('row-level security') ||
		errorMessage.includes('permission denied') ||
		errorMessage.includes('insufficient privileges')
	) {
		return {
			code: 'PERMISSION_DENIED',
			isRetryable: false,
			message: 'Permission denied. You do not have access to this resource.',
			statusCode: 403,
		};
	}

	// Foreign key constraint violations (404 Not Found or 400 Bad Request)
	if (
		errorMessage.includes('foreign key') ||
		errorMessage.includes('foreign_key') ||
		errorMessage.includes('user_id') ||
		errorMessage.includes('references')
	) {
		// If it's a user_id foreign key, it's likely the user doesn't exist
		if (errorMessage.includes('user_id')) {
			return {
				code: 'USER_NOT_FOUND',
				isRetryable: false,
				message: 'User account not found. Please contact support.',
				statusCode: 404,
			};
		}

		return {
			code: 'INVALID_REFERENCE',
			isRetryable: false,
			message: 'Invalid reference. One or more related records do not exist.',
			statusCode: 400,
		};
	}

	// Unique constraint violations (409 Conflict)
	if (
		errorMessage.includes('unique constraint') ||
		errorMessage.includes('duplicate key') ||
		errorMessage.includes('already exists') ||
		errorMessage.includes('UNIQUE constraint')
	) {
		return {
			code: 'DUPLICATE_ENTRY',
			isRetryable: false,
			message: 'A record with this information already exists.',
			statusCode: 409,
		};
	}

	// Not null constraint violations (400 Bad Request)
	if (
		errorMessage.includes('not null') ||
		errorMessage.includes('NULL constraint') ||
		errorMessage.includes('required')
	) {
		return {
			code: 'MISSING_REQUIRED_FIELD',
			isRetryable: false,
			message: 'Required field is missing.',
			statusCode: 400,
		};
	}

	// Check constraint violations (400 Bad Request)
	if (
		errorMessage.includes('check constraint') ||
		errorMessage.includes('CHECK constraint') ||
		errorMessage.includes('violates check')
	) {
		return {
			code: 'VALIDATION_ERROR',
			isRetryable: false,
			message: 'Data validation failed. Please check your input.',
			statusCode: 400,
		};
	}

	// Query syntax errors (400 Bad Request) - usually indicates a bug in our code
	if (
		errorMessage.includes('syntax error') ||
		errorMessage.includes('SQL syntax') ||
		errorMessage.includes('invalid input syntax')
	) {
		return {
			code: 'QUERY_ERROR',
			isRetryable: false,
			message: 'Query error. Please contact support if this persists.',
			statusCode: 400,
		};
	}

	// Generic database errors (500 Internal Server Error)
	return {
		code: 'DATABASE_ERROR',
		isRetryable: true,
		message: 'Database error occurred. Please try again later.',
		statusCode: 500,
	};
}

/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 * Fails fast with clear error messages if required variables are missing
 */

import { secureLogger } from '@/lib/logging/secure-logger';

interface EnvValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Validate required environment variables
 * @returns Validation result with errors if any
 */
export function validateEnvironmentVariables(): EnvValidationResult {
	const errors: string[] = [];
	const isProduction = process.env.NODE_ENV === 'production';

	// Required in all environments
	if (!process.env.DATABASE_URL) {
		errors.push('DATABASE_URL is required but not set');
	}

	if (!process.env.CLERK_SECRET_KEY) {
		errors.push('CLERK_SECRET_KEY is required but not set');
	}

	// Optional but recommended in production
	if (isProduction) {
		if (!process.env.DATABASE_URL_UNPOOLED) {
			secureLogger.warn(
				'DATABASE_URL_UNPOOLED is not set. Using DATABASE_URL as fallback. This may cause connection issues.',
			);
		}

		if (!process.env.CLERK_WEBHOOK_SECRET) {
			secureLogger.warn(
				'CLERK_WEBHOOK_SECRET is not set. Clerk webhooks will not work properly.',
			);
		}
	}

	return {
		errors,
		valid: errors.length === 0,
	};
}

/**
 * Validate and throw if required environment variables are missing
 * Call this at application startup to fail fast
 * @throws Error if required environment variables are missing
 */
export function validateEnvironmentVariablesOrThrow(): void {
	const result = validateEnvironmentVariables();

	if (!result.valid) {
		const errorMessage = `Missing required environment variables:\n${result.errors.join('\n')}`;
		secureLogger.error('Environment validation failed', {
			errors: result.errors,
		});
		throw new Error(errorMessage);
	}

	secureLogger.info('Environment variables validated successfully');
}


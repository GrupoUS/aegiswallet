/**
 * Environment Configuration Validator
 * Validates all required environment variables for secure operation
 *
 * This ensures the application fails fast if security-critical configuration is missing
 */

export interface EnvironmentConfig {
	supabase: {
		url: string;
		anonKey: string;
	};
	api: {
		baseUrl: string;
		version: string;
	};
	security: {
		encryptionEnabled: boolean;
		lgpdCompliance: boolean;
		auditLogging: boolean;
	};
	app: {
		env: 'development' | 'staging' | 'production';
		debug: boolean;
	};
}

import { logger } from '@/lib/logging/logger';

/**
 * Validates that all required environment variables are present and properly formatted
 * @throws Error if validation fails with detailed message
 */
export function validateEnvironmentConfig(): EnvironmentConfig {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Helper function to get and validate environment variable
	const getEnvVar = (
		key: string,
		required: boolean = true,
	): string | undefined => {
		// Support both Vite (browser) and Node.js (server) environments
		const value =
			(typeof import.meta !== 'undefined' && import.meta.env?.[key]) ||
			(typeof import.meta !== 'undefined' &&
				import.meta.env?.[`VITE_${key}`]) ||
			(typeof process !== 'undefined' && process.env?.[key]) ||
			(typeof process !== 'undefined' && process.env?.[`VITE_${key}`]);

		if (required && !value) {
			errors.push(`Missing required environment variable: ${key}`);
		}

		return value;
	};

	// Helper function to validate environment variable format
	const validateEnvFormat = (
		key: string,
		value: string,
		pattern: RegExp,
		description: string,
	): boolean => {
		if (!pattern.test(value)) {
			errors.push(`${key} has invalid format: ${description}`);
			return false;
		}
		return true;
	};

	// Helper function to check for suspicious patterns in environment variables
	const checkSuspiciousPattern = (key: string, value: string): void => {
		const suspiciousPatterns = [
			/^(test|dev|example|mock|fake|dummy)/i,
			/(localhost|127\.0\.0\.1|0\.0\.0\.0)/,
			/^(your_|change_|replace_)/i,
			/secret|password|key/i,
		];

		if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
			warnings.push(
				`Environment variable ${key} appears to contain placeholder or test values`,
			);
		}
	};

	// Validate Supabase configuration
	const supabaseUrl = getEnvVar('SUPABASE_URL');
	const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

	if (supabaseUrl) {
		checkSuspiciousPattern('SUPABASE_URL', supabaseUrl);
		validateEnvFormat(
			'SUPABASE_URL',
			supabaseUrl,
			/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/,
			'Must be a valid Supabase URL (https://your-project.supabase.co)',
		);
	}

	if (supabaseAnonKey) {
		checkSuspiciousPattern('SUPABASE_ANON_KEY', supabaseAnonKey);
		validateEnvFormat(
			'SUPABASE_ANON_KEY',
			supabaseAnonKey,
			/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
			'Must be a valid JWT token (should start with eyJ)',
		);
	}

	// Validate application configuration
	const appEnv =
		getEnvVar('VITE_APP_ENV') || getEnvVar('NODE_ENV') || 'development';
	const validEnvs = ['development', 'staging', 'production'];
	if (!validEnvs.includes(appEnv)) {
		errors.push(`VITE_APP_ENV must be one of: ${validEnvs.join(', ')}`);
	}

	// Construct configuration object
	const config: EnvironmentConfig = {
		api: {
			baseUrl: getEnvVar('VITE_API_URL') || 'http://localhost:3000',
			version: getEnvVar('VITE_APP_VERSION') || '1.0.0',
		},
		app: {
			debug: appEnv === 'development' || getEnvVar('VITE_DEBUG') === 'true',
			env: appEnv as 'development' | 'staging' | 'production',
		},
		security: {
			auditLogging: getEnvVar('VITE_AUDIT_LOGGING_ENABLED') !== 'false',
			encryptionEnabled: getEnvVar('VITE_ENCRYPTION_ENABLED') === 'true',
			lgpdCompliance: getEnvVar('VITE_LGPD_ENABLED') !== 'false',
		},
		supabase: {
			anonKey: supabaseAnonKey || '',
			url: supabaseUrl || '',
		},
	};

	// If there are errors, throw a comprehensive error
	if (errors.length > 0) {
		const errorMessage = [
			'❌ SECURITY CONFIGURATION ERROR',
			'',
			'Missing or invalid environment variables detected:',
			...errors.map((error) => `  • ${error}`),
			'',
			'To fix this issue:',
			'1. Copy env.example to .env.local',
			'2. Fill in the required environment variables',
			'3. Restart the application',
			'',
			'📋 Example .env file:',
			'SUPABASE_URL=https://your-project.supabase.co',
			'SUPABASE_ANON_KEY=your_supabase_anon_key',
			'VITE_APP_ENV=development',
			'VITE_API_URL=http://localhost:3000',
			'',
			'For security reasons, the application will not start without proper configuration.',
		].join('\n');

		throw new Error(errorMessage);
	}

	// Combine all warnings
	const allWarnings = [...warnings];

	// Security warnings for production
	if (config.app.env === 'production') {
		if (!config.security.encryptionEnabled) {
			allWarnings.push('⚠️  Encryption should be enabled in production');
		}

		if (!config.security.lgpdCompliance) {
			allWarnings.push('⚠️  LGPD compliance should be enabled in production');
		}

		if (!config.security.auditLogging) {
			allWarnings.push('⚠️  Audit logging should be enabled in production');
		}

		if (config.app.debug) {
			allWarnings.push('⚠️  Debug mode should be disabled in production');
		}
	}

	// Display warnings using secure logger if available, otherwise console
	if (allWarnings.length > 0) {
		// Use secure logger if available, fallback to console
		try {
			logger.warn('Environment validation warnings', { warnings: allWarnings });
		} catch {
			// Fallback if logger fails
		}
	}

	return config;
}

/**
 * Validates environment at module import time
 * This ensures configuration is valid before the application starts
 */
export const ENV_CONFIG = validateEnvironmentConfig();

/**
 * Runtime environment validation function
 * Can be called during application startup to re-validate configuration
 */
export function ensureSecureConfiguration(): void {
	try {
		validateEnvironmentConfig();
	} catch (error) {
		// console.error('Environment validation failed:', error);
		if (typeof window !== 'undefined') {
			// Clear existing content
			document.body.innerHTML = '';

			// Create error display using safe DOM methods
			const container = document.createElement('div');
			container.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f8f9fa;
        margin: 0;
        padding: 20px;
      `;

			const card = document.createElement('div');
			card.style.cssText = `
        max-width: 600px;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
      `;

			const title = document.createElement('h2');
			title.style.cssText = 'color: #dc3545; margin-top: 0;';
			title.textContent = '🔒 Configuration Error';

			const message = document.createElement('p');
			message.style.cssText = 'color: #6c757d; line-height: 1.6;';
			message.textContent =
				'The application cannot start due to missing security configuration. Please check your environment variables and try again.';

			const details = document.createElement('details');
			details.style.cssText = 'text-align: left; margin-top: 20px;';

			const summary = document.createElement('summary');
			summary.style.cssText = 'cursor: pointer; color: #007bff;';
			summary.textContent = 'Technical Details';

			const pre = document.createElement('pre');
			pre.style.cssText = `
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 12px;
        margin-top: 10px;
      `;
			pre.textContent = String(error);

			// Assemble the DOM structure
			details.appendChild(summary);
			details.appendChild(pre);
			card.appendChild(title);
			card.appendChild(message);
			card.appendChild(details);
			container.appendChild(card);
			document.body.appendChild(container);
		}
		throw error;
	}
}

export default validateEnvironmentConfig;

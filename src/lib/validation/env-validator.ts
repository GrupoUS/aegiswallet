/**
 * Environment Variables Validator
 * Validates required environment variables on application startup
 * and provides clear error messages for misconfiguration
 *
 * Updated for Clerk Auth + Neon DB architecture
 */

import { secureLogger } from '@/lib/logging/secure-logger';

export interface EnvValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	diagnostics: Record<string, unknown>;
}

/**
 * Validates that a string looks like a valid database URL
 */
const isValidDatabaseUrl = (url: string | undefined): boolean => {
	if (!url) return false;
	try {
		// Neon uses postgres:// or postgresql:// protocol
		return url.startsWith('postgres://') || url.startsWith('postgresql://');
	} catch {
		return false;
	}
};

/**
 * Validates that a string looks like a valid Clerk publishable key
 */
const isValidClerkPublishableKey = (key: string | undefined): boolean => {
	if (!key) return false;
	// Clerk publishable keys start with pk_test_ or pk_live_
	return key.startsWith('pk_test_') || key.startsWith('pk_live_');
};

/**
 * Gets environment variable value with fallback logic
 */
const getEnvVar = (key: string): string | undefined => {
	// Try Vite env first
	if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
		return import.meta.env[key];
	}
	// Try process.env for server context
	if (typeof process !== 'undefined' && process.env?.[key]) {
		return process.env[key];
	}
	return undefined;
};

/**
 * Validates all required environment variables for Clerk + Neon integration
 */
export const validateEnv = (): EnvValidationResult => {
	const errors: string[] = [];
	const warnings: string[] = [];
	const diagnostics: Record<string, unknown> = {};

	// Check Clerk Publishable Key
	const clerkPublishableKey = getEnvVar('VITE_CLERK_PUBLISHABLE_KEY');
	diagnostics.hasClerkPublishableKey = !!clerkPublishableKey;
	diagnostics.clerkPublishableKeyValid =
		isValidClerkPublishableKey(clerkPublishableKey);

	if (!clerkPublishableKey) {
		errors.push('VITE_CLERK_PUBLISHABLE_KEY não está definida');
	} else if (!isValidClerkPublishableKey(clerkPublishableKey)) {
		warnings.push('VITE_CLERK_PUBLISHABLE_KEY formato inválido');
	}

	// Check Database URL (server-side only)
	const databaseUrl = getEnvVar('DATABASE_URL');
	diagnostics.hasDatabaseUrl = !!databaseUrl;
	diagnostics.databaseUrlValid = isValidDatabaseUrl(databaseUrl);

	// DATABASE_URL is optional for client-side validation
	if (typeof window === 'undefined') {
		if (!databaseUrl) {
			errors.push('DATABASE_URL não está definida');
		} else if (!isValidDatabaseUrl(databaseUrl)) {
			errors.push('DATABASE_URL inválida (deve começar com postgres://)');
		}
	}

	// Optional: Check Google Client ID (for OAuth)
	const googleClientId = getEnvVar('VITE_GOOGLE_CLIENT_ID');
	diagnostics.hasGoogleClientId = !!googleClientId;
	if (!googleClientId) {
		warnings.push(
			'VITE_GOOGLE_CLIENT_ID não definida (Google OAuth desabilitado)',
		);
	}

	const isValid = errors.length === 0;

	// Log validation result
	if (!isValid) {
		secureLogger.error('Environment validation failed', {
			diagnostics,
			errorCount: errors.length,
			errors,
		});
	} else if (warnings.length > 0) {
		secureLogger.warn('Environment validation passed with warnings', {
			diagnostics,
			warningCount: warnings.length,
			warnings,
		});
	}

	return { diagnostics, errors, isValid, warnings };
};

// Legacy alias for backward compatibility
export const validateSupabaseEnv = validateEnv;

/**
 * Validates environment and throws if critical vars missing
 */
export const assertValidEnv = (): void => {
	const result = validateEnv();

	if (!result.isValid) {
		const msg = `
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  CONFIGURAÇÃO INVÁLIDA - AegisWallet                   ║
╠═══════════════════════════════════════════════════════════╣
${result.errors.map((e) => `║  ❌ ${e.padEnd(52)}║`).join('\n')}
║                                                           ║
║  Crie .env.local com as variáveis (veja env.example)     ║
╚═══════════════════════════════════════════════════════════╝`;
		secureLogger.error('Environment configuration invalid', { message: msg });
		throw new Error('Invalid environment configuration');
	}
};

export default { assertValidEnv, validateEnv, validateSupabaseEnv };

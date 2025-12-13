/**
 * Environment Variables Validation
 *
 * Validates and exports typed environment variables using Zod
 * Includes Google Calendar OAuth and Cron configuration
 *
 * @file src/env.ts
 */

import { z } from 'zod';

// ========================================
// SCHEMA DEFINITION
// ========================================

const envSchema = z.object({
	// Database
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

	// Clerk Authentication
	CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
	CLERK_WEBHOOK_SECRET: z.string().optional(),

	// Google Calendar OAuth 2.0 (optional - feature can be disabled)
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GOOGLE_REDIRECT_URI: z.string().url('Google Redirect URI must be a valid URL').optional(),

	// Application URL (for webhooks)
	APP_URL: z
		.string()
		.url()
		.optional()
		.default(
			process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
		),

	// Cron job authentication
	CRON_SECRET: z.string().min(32, 'Cron secret must be at least 32 characters'),

	// Encryption keys
	TOKENS_ENCRYPTION_KEY: z.string().optional(),

	// AI/Voice providers (optional)
	OPENAI_API_KEY: z.string().optional(),
	VITE_GEMINI_API_KEY: z.string().optional(),

	// Vercel environment
	VERCEL_URL: z.string().optional(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// ========================================
// VALIDATION & EXPORT
// ========================================

/**
 * Parse environment variables with validation
 * Falls back to development defaults if variables are missing in non-production
 */
function parseEnv() {
	// In development, provide fallbacks for optional Google Calendar variables
	const envWithDefaults = {
		...process.env,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || undefined,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
		GOOGLE_REDIRECT_URI:
			process.env.GOOGLE_REDIRECT_URI ||
			(process.env.VERCEL_URL
				? `https://${process.env.VERCEL_URL}/api/v1/google-calendar/callback`
				: process.env.GOOGLE_CLIENT_ID
					? 'http://localhost:3000/api/v1/google-calendar/callback'
					: undefined),
		CRON_SECRET: process.env.CRON_SECRET || 'development-cron-secret-at-least-32-characters',
		APP_URL:
			process.env.APP_URL ||
			(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
	};

	const result = envSchema.safeParse(envWithDefaults);

	if (!result.success) {
		const issues = result.error.issues || [];

		// In development, log warnings instead of throwing
		if (process.env.NODE_ENV !== 'production') {
			// biome-ignore lint/suspicious/noConsole: Environment validation logging
			console.warn('⚠️ Environment validation warnings:');
			for (const issue of issues) {
				// biome-ignore lint/suspicious/noConsole: Environment validation logging
				console.warn(`  - ${issue.path.join('.')}: ${issue.message}`);
			}
			// Return partial env with defaults
			return envWithDefaults as z.infer<typeof envSchema>;
		}

		// In production, throw error
		// biome-ignore lint/suspicious/noConsole: Environment validation logging
		console.error('❌ Invalid environment variables:');
		for (const issue of issues) {
			// biome-ignore lint/suspicious/noConsole: Environment validation logging
			console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
		}
		throw new Error('Invalid environment variables');
	}

	return result.data;
}

/**
 * Validated environment variables
 * Import this in your application to access typed env vars
 *
 * @example
 * import { env } from '@/env';
 * const clientId = env.GOOGLE_CLIENT_ID;
 */
export const env = parseEnv();

/**
 * Type for environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if Google Calendar integration is configured
 */
export function isGoogleCalendarConfigured(): boolean {
	return !!(
		env.GOOGLE_CLIENT_ID &&
		env.GOOGLE_CLIENT_SECRET &&
		env.GOOGLE_REDIRECT_URI &&
		env.GOOGLE_CLIENT_ID.length > 0 &&
		env.GOOGLE_CLIENT_SECRET.length > 0
	);
}

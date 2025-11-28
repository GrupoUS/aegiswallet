/**
 * Server Environment Configuration
 * Centralized environment-based configuration for the server
 */

/**
 * Cache configuration for different content types
 */
export const cacheConfig = {
	staticAssets: 'public, max-age=31536000, immutable',
	htmlFiles: 'no-cache, no-store, must-revalidate',
	apiResponses: 'private, max-age=60',
	dynamicContent: 'private, no-cache',
};

export const environment = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: Number(process.env.PORT) || 3000,
	IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
	IS_PRODUCTION: process.env.NODE_ENV === 'production',

	// Database configuration (Neon)
	DATABASE_URL: process.env.DATABASE_URL || '',
	DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || '',

	// Clerk configuration
	CLERK_PUBLISHABLE_KEY:
		process.env.VITE_CLERK_PUBLISHABLE_KEY ||
		process.env.CLERK_PUBLISHABLE_KEY ||
		'',
	CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',

	// API configuration
	API_URL:
		process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3000',

	// CORS origins
	CORS_ORIGINS: (
		process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'
	).split(','),
};

/**
 * Helper function to check if running in production
 */
export function isProduction(): boolean {
	return environment.IS_PRODUCTION;
}

/**
 * Helper function to check if running in development
 */
export function isDevelopment(): boolean {
	return environment.IS_DEVELOPMENT;
}

/**
 * Get the server port
 */
export function getPort(): number {
	return environment.PORT;
}

/**
 * Get the NODE_ENV value
 */
export function getNodeEnv(): string {
	return environment.NODE_ENV;
}

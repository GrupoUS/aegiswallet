/**
 * Server Environment Configuration
 * Centralized environment-based configuration for the server
 */

export const environment = {
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
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

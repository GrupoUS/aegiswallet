/**
 * Server Environment Configuration
 * Centralized environment-based configuration for the server
 */

export const environment = {
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
} as const;

export const corsConfig = {
  origins: environment.IS_DEVELOPMENT
    ? ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000']
    : ['https://your-domain.com', 'http://localhost:3000'], // Update with production domain
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] as const,
} as const;

export const cacheConfig = {
  htmlFiles: 'no-cache, no-store, must-revalidate',
  staticAssets: environment.IS_PRODUCTION ? 'public, max-age=31536000, immutable' : 'no-cache',
} as const;

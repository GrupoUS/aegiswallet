/**
 * Database Schema Exports
 *
 * This barrel export ONLY exports schema types and definitions.
 * For database client access, import directly from '@/db/client'.
 *
 * This separation prevents server-only code (requiring DATABASE_URL)
 * from being bundled into the client-side application.
 *
 * @example
 * // For types/schema (safe for client-side)
 * import { type User, users } from '@/db';
 *
 * // For database operations (server-only)
 * import { db, getHttpClient } from '@/db/client';
 */
import * as schema from './schema';

export { schema };

// Type-only exports for database clients (no runtime import)
export type { HttpClient, PoolClient } from './client';
// Re-export db client for backwards compatibility with dynamic imports
// WARNING: This should only be imported in server-side code
export { db } from './client';
// Re-export all schema types and definitions
export * from './schema';

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

// NOTE: Database clients (HttpClient, PoolClient) are NOT exported here.
// Import directly from '@/db/client' for server-side usage.
// This prevents bundling server-only code (pg driver) into the client.

// Re-export all schema types and definitions
export * from './schema';

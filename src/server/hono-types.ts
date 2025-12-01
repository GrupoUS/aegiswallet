/**
 * Hono Type Definitions
 * Custom context types for Hono middleware and routes
 */

import type { User as ClerkUser } from '@clerk/backend';

import type { HttpClient } from '@/db/client';

/**
 * User context extracted from Clerk authentication
 */
export interface AuthUser {
	id: string;
	email: string;
	fullName: string | null;
	role?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Authentication context set by authMiddleware
 */
export interface AuthContext {
	user: AuthUser;
	clerkUser: ClerkUser;
	db: HttpClient;
}

/**
 * Hono context variables available in routes
 */
export interface AppVariables {
	requestId: string;
	auth: AuthContext;
}

/**
 * Environment bindings (for edge/serverless compatibility)
 */
export interface AppBindings {
	DATABASE_URL: string;
	CLERK_SECRET_KEY: string;
}

/**
 * Complete Hono environment type
 * Use this when creating Hono instances:
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import type { AppEnv } from '@/server/hono-types';
 *
 * const app = new Hono<AppEnv>();
 *
 * // Now c.get('auth') is properly typed
 * app.get('/example', (c) => {
 *   const { user, db } = c.get('auth');
 *   // user.id, user.email are typed
 *   // db is the Drizzle client
 * });
 * ```
 */
export interface AppEnv {
	Bindings: AppBindings;
	Variables: AppVariables;
}

/**
 * Partial environment for routes that only need requestId
 * (before auth middleware runs)
 */
export interface PublicAppEnv {
	Bindings: AppBindings;
	Variables: Pick<AppVariables, 'requestId'>;
}

/**
 * Type helper for getting auth context from Hono context
 */
export type GetAuth<C extends { get: (key: 'auth') => AuthContext }> = ReturnType<C['get']>;

/**
 * Type guard to check if auth context is present
 */
export function hasAuthContext(variables: Partial<AppVariables>): variables is AppVariables {
	return (
		variables.auth !== undefined &&
		variables.auth.user !== undefined &&
		variables.auth.db !== undefined
	);
}

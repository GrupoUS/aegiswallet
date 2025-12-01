/**
 * Clerk Authentication Middleware for Hono RPC
 *
 * Handles JWT extraction, user validation, and database client creation
 * Uses Clerk for authentication
 */

import { type User as ClerkUser, createClerkClient, verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';

import { getHttpClient, type HttpClient } from '@/db/client';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface AuthContext {
	user: {
		id: string;
		email: string;
		fullName: string | null;
		role?: string;
		metadata?: Record<string, unknown>;
	};
	clerkUser: ClerkUser;
	db: HttpClient;
}

// ========================================
// CLERK CLIENT
// ========================================

/**
 * Get Clerk configuration
 */
function getClerkConfig() {
	const secretKey = process.env.CLERK_SECRET_KEY;
	const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;

	if (!secretKey) {
		throw new Error('CLERK_SECRET_KEY environment variable is not set');
	}

	return { secretKey, publishableKey };
}

/**
 * Create Clerk Backend Client
 */
function getClerkClient() {
	const { secretKey } = getClerkConfig();
	return createClerkClient({ secretKey });
}

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Clerk Authentication middleware for Hono routes
 *
 * Extracts JWT from Authorization header, validates with Clerk,
 * and attaches user context to the request.
 *
 * Usage:
 * ```typescript
 * app.use('/api/v1/protected/*', clerkAuthMiddleware);
 *
 * // In route handler:
 * const { user, db } = c.get('auth');
 * ```
 */
export const clerkAuthMiddleware = createMiddleware(async (c: Context, next: Next) => {
	const authHeader = c.req.header('Authorization');
	const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

	// Log authentication attempt
	const requestId = c.get('requestId') || 'unknown';
	const clientIP = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';

	if (!token) {
		secureLogger.warn('Authentication failed: No token provided', {
			ip: clientIP,
			method: c.req.method,
			path: c.req.path,
			requestId,
			userAgent: c.req.header('User-Agent'),
		});

		return c.json(
			{
				code: 'AUTH_REQUIRED',
				error: 'Authentication required',
			},
			401,
		);
	}

	try {
		const { secretKey } = getClerkConfig();
		const clerk = getClerkClient();

		// Verify the session token using @clerk/backend verifyToken
		const payload = await verifyToken(token, { secretKey });

		if (!payload?.sub) {
			secureLogger.warn('Authentication failed: Invalid token', {
				ip: clientIP,
				method: c.req.method,
				path: c.req.path,
				requestId,
				userAgent: c.req.header('User-Agent'),
			});

			return c.json(
				{
					code: 'INVALID_TOKEN',
					error: 'Invalid authentication token',
				},
				401,
			);
		}

		const userId = payload.sub;

		// Get user details from Clerk
		const clerkUser = await clerk.users.getUser(userId);

		// Get database client
		const db = getHttpClient();

		// Attach auth context to request
		const authContext: AuthContext = {
			db,
			clerkUser,
			user: {
				id: clerkUser.id,
				email: clerkUser.emailAddresses[0]?.emailAddress || '',
				fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
				role: clerkUser.publicMetadata?.role as string | undefined,
				metadata: clerkUser.publicMetadata as Record<string, unknown>,
			},
		};

		c.set('auth', authContext);

		// Log successful authentication
		secureLogger.info('Authentication successful', {
			ip: clientIP,
			method: c.req.method,
			path: c.req.path,
			requestId,
			userId: clerkUser.id,
		});

		await next();
	} catch (error) {
		secureLogger.error('Authentication error', {
			error: error instanceof Error ? error.message : 'Unknown error',
			ip: clientIP,
			method: c.req.method,
			path: c.req.path,
			requestId,
			userAgent: c.req.header('User-Agent'),
		});

		return c.json(
			{
				code: 'AUTH_ERROR',
				error: 'Authentication failed',
			},
			500,
		);
	}
});

// ========================================
// OPTIONAL AUTH MIDDLEWARE
// ========================================

/**
 * Optional authentication middleware
 *
 * Similar to clerkAuthMiddleware but doesn't return 401 if no token is present.
 * Useful for endpoints that work with or without authentication.
 */
export const optionalClerkAuthMiddleware = createMiddleware(async (c: Context, next: Next) => {
	const authHeader = c.req.header('Authorization');
	const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

	if (!token) {
		// No token provided, continue without auth context
		await next();
		return;
	}

	try {
		const { secretKey } = getClerkConfig();
		const clerk = getClerkClient();

		// Verify the session token
		const payload = await verifyToken(token, { secretKey });

		if (!payload?.sub) {
			// Invalid token, but don't return error for optional auth
			await next();
			return;
		}

		const userId = payload.sub;

		// Get user details from Clerk
		const clerkUser = await clerk.users.getUser(userId);

		// Get database client
		const db = getHttpClient();

		// Attach auth context to request
		const authContext: AuthContext = {
			db,
			clerkUser,
			user: {
				id: clerkUser.id,
				email: clerkUser.emailAddresses[0]?.emailAddress || '',
				fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
				role: clerkUser.publicMetadata?.role as string | undefined,
				metadata: clerkUser.publicMetadata as Record<string, unknown>,
			},
		};

		c.set('auth', authContext);
		await next();
	} catch {
		// Error validating token, but don't return error for optional auth
		await next();
	}
});

// ========================================
// ROLE-BASED AUTHORIZATION
// ========================================

/**
 * Role-based authorization middleware factory
 *
 * Creates a middleware that checks if the authenticated user has the required role.
 *
 * Usage:
 * ```typescript
 * const adminOnly = roleMiddleware(['admin']);
 * app.use('/api/v1/admin/*', clerkAuthMiddleware, adminOnly);
 * ```
 */
export function clerkRoleMiddleware(allowedRoles: string[]) {
	return createMiddleware(async (c: Context, next: Next) => {
		const auth = c.get('auth') as AuthContext | undefined;

		if (!auth) {
			return c.json(
				{
					code: 'AUTH_REQUIRED',
					error: 'Authentication required',
				},
				401,
			);
		}

		const userRole = auth.user.role;

		if (!(userRole && allowedRoles.includes(userRole))) {
			secureLogger.warn('Authorization failed: Insufficient role', {
				method: c.req.method,
				path: c.req.path,
				requiredRoles: allowedRoles,
				userId: auth.user.id,
				userRole,
			});

			return c.json(
				{
					code: 'INSUFFICIENT_PERMISSIONS',
					details: {
						required: allowedRoles,
						current: userRole,
					},
					error: 'Insufficient permissions',
				},
				403,
			);
		}

		await next();
	});
}

// ========================================
// RATE LIMITING (USER-BASED)
// ========================================

/**
 * Rate limiting middleware factory for authenticated users
 *
 * Creates a rate limiter that limits requests per user rather than per IP.
 */
export function clerkUserRateLimitMiddleware(options: {
	windowMs: number;
	max: number;
	message?: string;
}) {
	const { windowMs, max, message = 'Too many requests' } = options;
	const requests = new Map<string, { count: number; resetTime: number }>();

	return createMiddleware(async (c: Context, next: Next) => {
		const auth = c.get('auth') as AuthContext | undefined;

		const identifier =
			auth?.user.id || c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';

		const now = Date.now();
		const userRequests = requests.get(identifier);

		if (!userRequests || now > userRequests.resetTime) {
			// Reset or initialize counter
			requests.set(identifier, {
				count: 1,
				resetTime: now + windowMs,
			});
		} else {
			// Increment counter
			userRequests.count++;

			if (userRequests.count > max) {
				const resetTime = Math.ceil((userRequests.resetTime - now) / 1000);

				return c.json(
					{
						code: 'RATE_LIMIT_EXCEEDED',
						details: {
							limit: max,
							windowMs,
							retryAfter: resetTime,
						},
						error: message,
					},
					429,
				);
			}
		}

		// Add rate limit headers
		const currentRequests = requests.get(identifier);
		if (currentRequests) {
			c.header('X-RateLimit-Limit', max.toString());
			c.header('X-RateLimit-Remaining', Math.max(0, max - currentRequests.count).toString());
			c.header('X-RateLimit-Reset', new Date(currentRequests.resetTime).toISOString());
		}

		await next();
	});
}

// ========================================
// LEGACY COMPATIBILITY EXPORTS
// ========================================

// Alias for backward compatibility
export const authMiddleware = clerkAuthMiddleware;
export const optionalAuthMiddleware = optionalClerkAuthMiddleware;
export const roleMiddleware = clerkRoleMiddleware;
export const userRateLimitMiddleware = clerkUserRateLimitMiddleware;

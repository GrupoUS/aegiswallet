/**
 * Authentication Middleware for Hono RPC
 *
 * Re-exports from Clerk authentication middleware
 * Maintains backward compatibility with existing codebase
 */

export {
	type AuthContext,
	authMiddleware,
	clerkAuthMiddleware,
	clerkRoleMiddleware,
	clerkUserRateLimitMiddleware,
	optionalAuthMiddleware,
	optionalClerkAuthMiddleware,
	roleMiddleware,
	userRateLimitMiddleware,
} from './clerk-auth';

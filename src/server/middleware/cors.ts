/**
 * CORS Middleware
 * Secure centralized CORS configuration for AegisWallet
 */

import type { Context, Next } from 'hono';

// Allowed origins for Brazilian financial application
const ALLOWED_ORIGINS = [
	'https://aegiswallet.com',
	'https://www.aegiswallet.com',
	'https://app.aegiswallet.com',
	// Development environments
	'http://localhost:3000',
	'http://localhost:5173',
	'http://localhost:8080',
	'http://localhost:8081',
	'http://localhost:8082',
	'https://localhost:3000',
	'https://localhost:5173',
	'https://localhost:8080',
	'https://localhost:8081',
	'https://localhost:8082',
];

/**
 * Secure CORS middleware with origin validation
 */
export const corsMiddleware = async (c: Context, next: Next) => {
	const origin = c.req.header('Origin');

	// Validate origin against allowed list
	const isOriginAllowed =
		ALLOWED_ORIGINS.includes(origin || '') ||
		(origin?.startsWith('http://localhost:') && process.env.NODE_ENV === 'development') ||
		(origin?.startsWith('https://localhost:') && process.env.NODE_ENV === 'development');

	// Set secure CORS headers
	if (isOriginAllowed) {
		c.header('Access-Control-Allow-Origin', origin || '*');
	} else {
		// In production, don't allow unknown origins
		c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
	}

	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	c.header(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, X-Requested-With, X-Client-ID',
	);
	c.header('Access-Control-Allow-Credentials', 'true');
	c.header('Access-Control-Max-Age', '86400'); // 24 hours
	c.header('Vary', 'Origin'); // Important for caching

	// Handle preflight requests
	if (c.req.method === 'OPTIONS') {
		return c.newResponse(null, 204); // No Content for OPTIONS
	}

	await next();
};

/**
 * Development CORS middleware with relaxed restrictions
 * Use only in development environment
 */
export const devCorsMiddleware = async (c: Context, next: Next) => {
	const origin = c.req.header('Origin');

	c.header('Access-Control-Allow-Origin', origin || '*');
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	c.header(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, X-Requested-With, X-Client-ID',
	);
	c.header('Access-Control-Allow-Credentials', 'true');
	c.header('Access-Control-Max-Age', '86400');
	c.header('Vary', 'Origin');

	if (c.req.method === 'OPTIONS') {
		return c.newResponse(null, 204);
	}

	await next();
};

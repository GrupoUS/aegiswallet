/**
 * Vercel Entry Point
 *
 * This file serves as the entry point for Vercel serverless functions.
 * It re-exports the complete Hono application from index.ts which includes
 * all API routes (bank-accounts, transactions, users, voice, etc.)
 *
 * The build script (scripts/build-api-vercel.ts) bundles this file,
 * which will include all routes from the main app.
 *
 * Vercel expects: export default app (Hono instance)
 */

import { Hono } from 'hono';

// Create a wrapper app to catch initialization errors
let app: Hono;

try {
	// Dynamic import to catch module load errors
	const { default: mainApp } = await import('./index');
	app = mainApp;
} catch (error) {
	// If the main app fails to load, create a fallback app that returns the error
	console.error('Failed to load main app:', error);
	app = new Hono();
	app.all('*', (c) => {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;
		return c.json(
			{
				error: 'Server initialization failed',
				message: errorMessage,
				stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
				timestamp: new Date().toISOString(),
			},
			500
		);
	});
}

export default app;

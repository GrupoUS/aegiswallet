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

// Re-export the main app directly
// This is the simplest approach that works with esbuild bundling
export { default } from './index';

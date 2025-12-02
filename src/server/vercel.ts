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
 * Output: api/index.mjs (ESM module for Node.js 20.x)
 * Vercel expects: export default app (Hono instance)
 */

import app from './index';

// ESM default export - Vercel will use this handler
export default app;

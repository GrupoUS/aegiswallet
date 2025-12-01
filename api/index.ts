/**
 * AegisWallet API - Vercel Serverless Function Entry Point
 *
 * This file serves as the entry point for Vercel's serverless functions.
 * It re-exports the Hono application from the main server module.
 *
 * NOTE: This file is automatically bundled by the build script (scripts/build-api-vercel.ts)
 * to resolve path aliases (@/) and create a single deployable bundle.
 *
 * Runtime: Node.js 20 (required for Clerk SDK, Drizzle ORM with pooling)
 * Framework: Hono 4.x with Vercel adapter
 *
 * Routes handled:
 * - /api/v1/* - All v1 API endpoints (users, banking, transactions, etc.)
 * - /api/health - Health check
 * - /cron/* - Scheduled job endpoints
 *
 * @see src/server/index.ts - Main Hono application
 * @see src/server/vercel.ts - Vercel-specific wrapper
 * @see scripts/build-api-vercel.ts - Build script that bundles this
 */

// Re-export the Vercel handler from the main server module
// The build script (scripts/build-api-vercel.ts) bundles this with all dependencies
export { config, default } from '../src/server/vercel';

// If you need to add Vercel-specific configuration overrides, do it here:
// export const config = {
//   runtime: 'nodejs',
//   maxDuration: 30,
//   memory: 1024,
// };

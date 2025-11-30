// Vercel Serverless Function - Hono App Entry Point
// Re-exports the Hono app from src/server/vercel.ts

// Using hono/vercel adapter for proper Vercel Edge/Serverless support
import { handle } from 'hono/vercel';

// Import the configured Hono application using relative path
// (path aliases @/ are resolved by the bundler in src/)
import app from '../src/server/index';

export const config = {
	runtime: 'nodejs',
	maxDuration: 30,
};

// Export the Hono app handler for Vercel
// All routes under /api/v1/* are handled by the Hono app
export default handle(app);

// Vercel Serverless Function - Hono App Entry Point
// Re-exports the Hono handler from src/server/vercel.ts

// Import the configured Hono handler (already wrapped with handle())
// from src/server/vercel.ts
import handler, { config } from '../src/server/vercel';

// Re-export the config and handler
export { config };
export default handler;

// Vercel Serverless Function - Hono App Entry Point
// Connects Vercel Edge Functions to the Hono application

// Import the configured Hono application
import app from '../src/server/index';

export const config = {
  maxDuration: 10,
};

// Export the Hono app's fetch handler for Vercel
export default app.fetch;

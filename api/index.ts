// Vercel Serverless Function - Hono App Entry Point
// Connects Vercel Edge Functions to the Hono application

import { handle } from '@hono/node-server/vercel';
// Import the configured Hono application
import app from '../src/server/index';

export const config = {
  maxDuration: 10,
};

// Export the Hono app handler for Vercel using the proper adapter
// This ensures all Hono routes (including /api/v1/google-calendar/*) are served correctly
export default handle(app);

/**
 * CORS Middleware
 * Centralized CORS configuration
 */

import { cors } from 'hono/cors';
import { corsConfig } from '@/server/config/environment';

/**
 * Standardized CORS middleware
 */
export const corsMiddleware = cors({
  origin: corsConfig.origins,
  credentials: corsConfig.credentials,
  allowMethods: [...corsConfig.allowMethods],
  allowHeaders: [...corsConfig.allowHeaders],
});

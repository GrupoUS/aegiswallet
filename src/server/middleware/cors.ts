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
  allowHeaders: [...corsConfig.allowHeaders],
  allowMethods: [...corsConfig.allowMethods],
  credentials: corsConfig.credentials,
  origin: corsConfig.origins,
});

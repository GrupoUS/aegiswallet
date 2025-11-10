/**
 * Cache Middleware
 * Standardized caching strategies for different content types
 */

import type { MiddlewareHandler } from 'hono';
import { cacheConfig } from '@/server/config/environment';

/**
 * Cache middleware for static assets
 */
export const staticAssetsCache = (): MiddlewareHandler => {
  return async (c, next) => {
    c.header('Cache-Control', cacheConfig.staticAssets);
    await next();
  };
};

/**
 * Cache middleware for HTML files
 */
export const htmlCache = (): MiddlewareHandler => {
  return async (c, next) => {
    c.header('Cache-Control', cacheConfig.htmlFiles);
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    await next();
  };
};

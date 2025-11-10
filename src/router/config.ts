/**
 * Router Configuration
 * Centralized router setup and configuration
 */

import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

// Create router instance with optimal configuration
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Add future-compatible configuration
  defaultPreloadStaleTime: 0,
  // Enable route validation in development
  caseSensitive: false,
  // Configure trailing slash behavior
  trailingSlash: 'never',
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

/**
 * Inner Application Component
 * Contains the router provider and core application structure
 */

import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router/config';

export function InnerApp() {
  return <RouterProvider router={router} />;
}

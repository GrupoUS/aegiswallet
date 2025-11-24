/**
 * Inner Application Component
 * Contains the router provider and core application structure
 */

import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/components/providers/AppProviders';
import { router } from '@/router/config';

export function InnerApp() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

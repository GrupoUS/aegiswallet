/**
 * Settings Page (English alias for /configuracoes)
 *
 * Redirects to the Portuguese settings page for E2E test compatibility.
 */

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  beforeLoad: () => {
    throw redirect({ to: '/configuracoes' });
  },
  component: () => null,
});

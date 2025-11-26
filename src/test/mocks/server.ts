/**
 * MSW Server configuration for Hono RPC API mocking
 * Replaces tRPC server mocks with HTTP service worker
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server with all handlers
export const mswServer = setupServer(...handlers);

// Export server setup functions for test lifecycle
export const startServer = () => {
  mswServer.listen({
    onUnhandledRequest: 'error', // Fail tests on unhandled requests
  });
};

export const stopServer = () => {
  mswServer.close();
};

export const resetHandlers = () => {
  mswServer.resetHandlers();
};

// Default export
export default mswServer;

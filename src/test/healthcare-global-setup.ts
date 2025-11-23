import { setup } from 'vitest/node';

export default setup(async () => {
  // Global healthcare test environment setup
  process.env.NODE_ENV = 'test';
  process.env.VITE_ENVIRONMENT = 'test';
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

  // Mock global objects that need to be available before tests run
  global.TextEncoder = require('node:util').TextEncoder;
  global.TextDecoder = require('node:util').TextDecoder as any;

  // Setup healthcare-specific global mocks
  const mockFetch = () =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });

  global.fetch = mockFetch as any;

  return async () => {
    // Global cleanup logic here if needed
  };
});

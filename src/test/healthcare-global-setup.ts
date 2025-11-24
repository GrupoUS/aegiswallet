import { setup } from 'vitest/node';

export default setup(async () => {
  // Global healthcare test environment setup
  process.env.NODE_ENV = 'test';
  process.env.VITE_ENVIRONMENT = 'test';
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

  // Mock global objects that need to be available before tests run
  const { TextEncoder, TextDecoder } = require('node:util');
  global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
  global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

  // Setup healthcare-specific global mocks
  const mockFetch: typeof fetch = async () => new Response('', { status: 200 });

  global.fetch = mockFetch;

  return async () => {
    // Global cleanup logic here if needed
  };
});

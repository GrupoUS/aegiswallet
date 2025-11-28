export default async function globalSetup() {
	// Global healthcare test environment setup
	process.env.NODE_ENV = 'test';
	process.env.VITE_ENVIRONMENT = 'test';
	process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
	process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_example';

	// Mock global objects that need to be available before tests run
	const { TextEncoder, TextDecoder } = require('node:util');
	global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
	global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

	// Setup healthcare-specific global mocks
	const mockFetch: typeof fetch = async () => new Response('', { status: 200 });

	global.fetch = mockFetch;

	return async function globalTeardown() {
		// Global cleanup logic here if needed
	};
}

// Global setup for JSDOM environment

export default async function setup() {
  // Ensure DOM environment is properly initialized before tests
  // This runs before any test files and setup files

  // Set up global window/document if they don't exist
  if (typeof globalThis.window === 'undefined') {
    // @ts-expect-error - we're setting up the global environment
    globalThis.window = globalThis.window || {};
  }

  // Ensure document exists
  if (typeof globalThis.document === 'undefined') {
    // @ts-expect-error - we're setting up the global environment
    globalThis.document = globalThis.window.document || {};
  }

  // Ensure navigator exists
  if (typeof globalThis.navigator === 'undefined') {
    // @ts-expect-error - we're setting up the global environment
    globalThis.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      language: 'pt-BR',
      languages: ['pt-BR', 'pt', 'en-US', 'en'],
      platform: 'Win32',
    };
  }
}

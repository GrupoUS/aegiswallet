// Global setup for JSDOM environment

export default async function setup() {
	// Ensure DOM environment is properly initialized before tests
	// This runs before any test files and setup files

	// Set up global window/document if they don't exist
	if (typeof globalThis.window === 'undefined') {
		(globalThis as any).window = {};
	}

	// Ensure document exists
	if (typeof globalThis.document === 'undefined') {
		(globalThis as any).document = {};
	}

	// Ensure navigator exists
	if (typeof globalThis.navigator === 'undefined') {
		(globalThis as any).navigator = {
			language: 'pt-BR',
			languages: ['pt-BR', 'pt', 'en-US', 'en'],
			platform: 'Win32',
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		};
	}
}

import * as path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// biome-ignore lint/suspicious/noExplicitAny: React plugin type mismatch between vite and vitest versions
	plugins: [react() as any],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/healthcare-setup.ts'],

		// Healthcare-specific JSDOM environment configuration
		environmentOptions: {
			jsdom: {
				pretendToBeVisual: true,
				resources: 'usable',
				runScripts: 'dangerously',
				url: 'http://localhost:3000',
			},
		},

		// Sequential testing for healthcare compliance and data integrity
		sequence: {
			concurrent: false, // Critical for LGPD compliance testing
			shuffle: false, // Maintain predictable test order for audit trails
		},

		// Enhanced coverage configuration for healthcare compliance (90%+ target)
		coverage: {
			provider: 'v8', // Faster and more accurate for TypeScript
			reporter: ['text', 'json', 'html', 'lcov', 'clover'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.d.ts',
				'**/*.config.js',
				'**/*.config.ts',
				'src/integrations/', // External dependencies
				'src/mocks/', // Mock files
				'docs/',
				'scripts/',
				'coverage/',
				'dist/',
				'build/',
			],
			thresholds: {
				global: {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90,
				},
				// Critical healthcare components require higher coverage
				'src/lib/security/**': {
					branches: 95,
					functions: 95,
					lines: 95,
					statements: 95,
				},
				'src/components/financial/**': {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90,
				},
				'src/lib/speech/**': {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90,
				},
				'src/lib/nlu/**': {
					branches: 90,
					functions: 90,
					lines: 90,
					statements: 90,
				},
			},
			all: true, // Include all source files in coverage
			clean: true, // Clean coverage directories before running
			cleanOnRerun: true, // Clean on re-run
		},

		// Include healthcare-specific test files
		include: [
			'src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
			'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
			'src/test/healthcare/**/*.test.{ts,tsx}',
			'src/test/quality-control/**/*.test.{ts,tsx}',
		],

		exclude: [
			'node_modules/',
			'dist/',
			'build/',
			'coverage/',
			'**/*.disabled.*', // Disabled test files
		],

		// Enhanced timeout for async operations and healthcare compliance
		testTimeout: 30000, // 30 seconds for database operations
		hookTimeout: 30000, // 30 seconds for setup hooks

		// Better error reporting for healthcare compliance
		reporters: ['default', 'verbose'],

		// Sequential testing for healthcare data integrity
		isolate: true,
		fileParallelism: false, // Critical for LGPD compliance testing

		// Global setup for healthcare testing environment
		// globalSetup: './src/test/healthcare-global-setup.ts', // Disabled for initial setup

		// Mock configuration for healthcare testing
		clearMocks: true,
		restoreMocks: true,
		mockReset: true,

		// Performance optimization for large test suites
		maxConcurrency: 1, // Sequential execution for healthcare compliance
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true, // Use single fork for healthcare compliance
			},
		},
	},

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	// Optimized dependencies for healthcare testing
	optimizeDeps: {
		exclude: [
			// Exclude heavy dependencies from optimization during testing
			'@supabase/supabase-js',
			'@tanstack/react-query',
			'@tanstack/react-router',
		],
		include: [
			'@testing-library/react',
			'@testing-library/jest-dom',
			'@testing-library/user-event',
			'vitest',
			'@vitest/coverage-v8',
		],
	},

	// Define global variables for healthcare testing
	define: {
		'global.POLLY_JS': 'true',
		'process.env.NODE_ENV': '"test"',
		'process.env.VITE_ENVIRONMENT': '"test"',
		'process.env.VITE_SUPABASE_ANON_KEY': '"test-anon-key"',
		'process.env.VITE_SUPABASE_URL': '"http://localhost:54321"', // Enable mocking for healthcare tests
	},
});

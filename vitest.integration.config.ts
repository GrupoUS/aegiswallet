import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    include: ['@testing-library/react', '@testing-library/jest-dom'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // Enhanced JSDOM environment configuration
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously',
      },
    },

    // Type checking enabled
    typecheck: {
      enabled: true,
      checker: 'tsc',
    },

    // Pool options for performance
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },

    // Sequential testing for integration tests
    sequence: {
      concurrent: false, // Critical for integration tests
      shuffle: false, // Maintain predictable test order
    },

    // Enhanced coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/*.config.ts',
        'src/integrations/',
        'src/mocks/',
        'docs/',
        'scripts/',
        'src/routeTree.gen.ts',
        'dist/',
        'coverage/',
        '**/*.gen.ts',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      all: true,
      clean: true,
      cleanOnRerun: true,
    },

    // Include integration test files
    include: [
      'src/test/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'src/test/healthcare/**', // Exclude healthcare-specific tests
      'src/test/ui/**', // Exclude UI component tests
    ],

    // Enhanced timeout for async operations
    testTimeout: 15000,
    hookTimeout: 15000,

    // Better error reporting
    reporters: ['default', 'verbose'],

    // Better isolate tests
    isolate: true,

    // Performance optimization for integration tests
    maxConcurrency: 2, // Limited concurrency for integration tests
    pool: 'threads',
  },
});

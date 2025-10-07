import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Ensure setup runs before any tests
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Enhanced coverage configuration for 90%+ target
    coverage: {
      provider: 'v8', // Faster and more accurate for TypeScript
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/*.config.ts',
        'src/integrations/', // Integration code might have external deps
        'src/mocks/', // Mock files
        'docs/',
        'scripts/',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      // Include all source files in coverage
      all: true,
      // Clean coverage directories before running
      clean: true,
      // Clean on re-run
      cleanOnRerun: true,
    },
    include: [
      'src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules/', 'dist/', 'build/', 'coverage/'],
    // Enhanced timeout for async operations
    testTimeout: 10000,
    // Better error reporting
    reporter: ['verbose'],
    // Sequential testing for debugging (can be enabled for troubleshooting)
    // fileParallelism: false,
    // Better isolate tests
    isolate: true,
    // Hook timeout
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

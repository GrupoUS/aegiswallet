import * as path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/healthcare-setup.ts'],
    // Enhanced JSDOM environment for healthcare applications
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:5173',
        referrer: 'http://localhost:5173',
        userAgent: 'Mozilla/5.0 (compatible; AegisWallet-Healthcare-Testing/1.0)',
      },
    },
    // Sequential testing for healthcare compliance (no concurrent execution)
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Enhanced coverage configuration for healthcare applications (95%+ required)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/mocks/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/*.config.ts',
        'docs/',
        'scripts/',
        'coverage/',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Critical healthcare components require 95%+ coverage
        'src/routes/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/domain/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/integrations/supabase/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      all: true,
      clean: true,
      cleanOnRerun: true,
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95],
      },
    },
    include: [
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/features/**/lgpd-compliance.test.{ts,tsx}',
      'src/features/**/voice-interface.test.{ts,tsx}',
      'src/features/**/healthcare-compliance.test.{ts,tsx}',
    ],
    exclude: ['node_modules/', 'dist/', 'build/', 'coverage/', 'src/test/fixtures/'],
    // Enhanced timeout for healthcare operations (database, external APIs)
    testTimeout: 30000,
    hookTimeout: 15000,
    // Better error reporting for healthcare debugging
    reporters: ['default', 'verbose'],
    // Isolate tests to prevent data leakage between healthcare tests
    isolate: true,
    // File parallelism disabled for healthcare data integrity
    fileParallelism: false,
    // Global setup for healthcare test environment
    globalSetup: ['./src/test/healthcare-global-setup.ts'],
    // Watch mode configuration for development
    watch: {
      // Include healthcare-related files
      include: ['src/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
      // Exclude build artifacts
      exclude: ['node_modules/', 'dist/', 'coverage/'],
    },
    // Benchmark configuration for performance testing
    benchmark: {
      include: ['src/**/*.{bench,benchmark}.ts'],
      exclude: ['node_modules/'],
      outputJson: './benchmark-results.json',
      outputFile: './benchmark-results.md',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test': path.resolve(__dirname, './src/test'),
      '@/test-utils': path.resolve(__dirname, './src/test/utils'),
      '@/healthcare': path.resolve(__dirname, './src/test/healthcare'),
    },
  },
  optimizeDeps: {
    include: [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      '@supabase/supabase-js',
      '@trpc/server',
      '@trpc/client',
    ],
  },
  // Define constants for healthcare testing
  define: {
    __HEALTHCARE_TESTING__: 'true',
    __LGPD_COMPLIANCE__: 'true',
    __VOICE_INTERFACE_TESTING__: 'true',
  },
  // Environment variables for healthcare testing
  env: {
    NODE_ENV: 'test',
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_ENABLE_MOCK_SPEECH_RECOGNITION: 'true',
    VITE_TEST_LGDP_MODE: 'true',
  },
});

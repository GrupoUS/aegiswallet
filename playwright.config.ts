import { defineConfig, devices } from '@playwright/test';

/**
 * AegisWallet Playwright E2E Test Configuration
 *
 * Features:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Mobile device emulation (iPhone, Pixel)
 * - Visual regression testing
 * - Accessibility testing (WCAG 2.1 AA+)
 * - LGPD compliance testing
 * - CI/CD optimized with sharding and retries
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory structure
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: '**/*.spec.ts',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only - helps with flaky tests
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: process.env.CI
    ? [
        ['github'],
        ['junit', { outputFile: 'playwright-report/e2e-junit-results.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Global timeout for each test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
    // Visual comparison settings
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  // Shared settings for all projects
  use: {
    // Base URL for navigation (matches Vite server.port: 8080)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for local development)
    ignoreHTTPSErrors: true,

    // Browser context options
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for parallel testing across browsers and devices
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Devices - Brazilian market focus
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Branded browsers (optional, for specific testing)
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'bun dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Metadata for test organization
  metadata: {
    project: 'AegisWallet',
    version: '1.0.0',
    environment: process.env.CI ? 'ci' : 'local',
  },
});

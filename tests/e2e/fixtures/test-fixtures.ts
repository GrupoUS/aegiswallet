/**
 * AegisWallet E2E Test Fixtures
 *
 * Extended Playwright test fixtures for:
 * - Authentication state management
 * - Brazilian locale configuration
 * - Accessibility testing with axe-core
 * - Visual regression helpers
 * - LGPD compliance utilities
 *
 * @see https://playwright.dev/docs/test-fixtures
 */
import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fixture types
type AegisWalletFixtures = {
  /** Pre-authenticated page with user session */
  authenticatedPage: Page;
  /** Axe accessibility scanner configured for WCAG 2.1 AA+ */
  axeBuilder: AxeBuilder;
  /** Brazilian locale utilities */
  brazilianContext: {
    formatCurrency: (value: number) => string;
    formatDate: (date: Date) => string;
    formatCPF: (cpf: string) => string;
  };
};

/**
 * Extended test fixture with AegisWallet-specific utilities
 */
export const test = base.extend<AegisWalletFixtures>({
  // Authenticated page fixture - handles login state
  authenticatedPage: async ({ page }, use) => {
    // Navigate to app
    await page.goto('/');

    // Check if already authenticated (storage state)
    const isAuthenticated = await page
      .locator('[data-testid="user-menu"], [data-testid="dashboard"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (!isAuthenticated) {
      // Perform login flow
      await page.goto('/auth');
      // Login implementation depends on your auth flow
      // This is a placeholder for your actual login logic
      await page.waitForSelector('[data-testid="dashboard"]', {
        timeout: 10000,
      });
    }

    await use(page);
  },

  // Axe accessibility builder with WCAG 2.1 AA+ configuration
  axeBuilder: async ({ page }, use) => {
    const builder = new AxeBuilder({ page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'best-practice',
    ]);
    await use(builder);
  },

  // Brazilian locale utilities for financial testing
  brazilianContext: async ({}, use) => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (date: Date): string => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    };

    const formatCPF = (cpf: string): string => {
      const cleaned = cpf.replace(/\D/g, '');
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    await use({
      formatCurrency,
      formatDate,
      formatCPF,
    });
  },
});

export { expect };

// Re-export common utilities
export { type Page, type Locator, type BrowserContext } from '@playwright/test';

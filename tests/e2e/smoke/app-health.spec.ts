/**
 * AegisWallet Smoke Tests - App Health
 *
 * Critical path tests that verify:
 * - App loads successfully
 * - Core routes are accessible
 * - Basic UI elements render
 * - No JavaScript errors on startup
 *
 * Run: bun test:e2e:smoke
 */
import { test, expect } from '@playwright/test';

test.describe('App Health - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear console errors collector
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
  });

  test('should load the app successfully', async ({ page }) => {
    await page.goto('/');

    // App should render without crashing
    await expect(page).toHaveTitle(/AegisWallet|Aegis/i);

    // Main app container should be visible
    await expect(page.locator('#root, #app, [data-testid="app-root"]').first()).toBeVisible();
  });

  test('should have no critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No critical JS errors should occur
    expect(errors).toHaveLength(0);
  });

  test('should load static assets correctly', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400 && response.status() < 600) {
        failedRequests.push(`${response.status()}: ${response.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected 404s (favicon, etc.) if needed
    const criticalFailures = failedRequests.filter(
      (req) => !req.includes('favicon') && !req.includes('.map')
    );

    expect(criticalFailures).toHaveLength(0);
  });

  test('should render core navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation elements (adjust selectors as needed)
    const navElements = page.locator('nav, [role="navigation"], [data-testid*="nav"]');
    await expect(navElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive and adapt to viewport', async ({ page }) => {
    await page.goto('/');

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display Brazilian Portuguese content', async ({ page }) => {
    await page.goto('/');

    // Check for PT-BR content markers (adjust based on your app)
    const pageContent = await page.textContent('body');

    // Common Portuguese words/phrases that should appear
    const hasPtBrContent =
      pageContent?.includes('Entrar') ||
      pageContent?.includes('Cadastrar') ||
      pageContent?.includes('Dashboard') ||
      pageContent?.includes('Transações') ||
      pageContent?.includes('Bem-vindo');

    expect(hasPtBrContent).toBeTruthy();
  });
});

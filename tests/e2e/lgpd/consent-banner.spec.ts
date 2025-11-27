/**
 * AegisWallet LGPD Compliance Tests - Consent Banner
 *
 * Tests for Brazilian LGPD (Lei Geral de Proteção de Dados) compliance:
 * - Cookie consent banner display
 * - Privacy policy accessibility
 * - Data export functionality
 * - Data deletion (right to be forgotten)
 * - Consent preferences management
 *
 * Run: bun test:e2e:lgpd
 */
import { test, expect } from '@playwright/test';

test.describe('LGPD Compliance - Consent Banner', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies to ensure fresh consent state
    await context.clearCookies();
    
    // Clear localStorage to reset consent state (component uses localStorage, not cookies)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('aegis_lgpd_consent');
    });
    // Reload to apply the cleared state
    await page.reload();
  });

  test('should display consent banner on first visit', async ({ page }) => {
    await page.goto('/');

    // Consent banner should be visible - matches ConsentBanner component
    const consentBanner = page.locator('[data-testid="consent-banner"]');

    await expect(consentBanner).toBeVisible({ timeout: 10000 });
  });

  test('should allow accepting all cookies', async ({ page }) => {
    await page.goto('/');

    // Find and click accept all button - matches ConsentBanner component
    const acceptButton = page.locator('[data-testid="consent-accept"]');

    await expect(acceptButton).toBeVisible({ timeout: 10000 });
    await acceptButton.click();

    // Banner should disappear
    const consentBanner = page.locator('[data-testid="consent-banner"]');

    await expect(consentBanner).not.toBeVisible({ timeout: 5000 });
  });

  test('should allow customizing cookie preferences', async ({ page }) => {
    await page.goto('/');

    // Find customize/manage preferences button - matches ConsentBanner component
    const customizeButton = page.locator('[data-testid="consent-customize"]');

    await expect(customizeButton).toBeVisible({ timeout: 10000 });
    await customizeButton.click();

    // Should navigate to settings page
    await page.waitForURL(/configuracoes|settings/i, { timeout: 5000 });
    
    // Verify we're on the settings page with privacy tab
    // Note: Full privacy settings content requires authentication
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/Configurações/i, { timeout: 5000 });
    
    // Check that the privacy tab exists and is accessible
    const privacyTab = page.locator('button[role="tab"]:has-text("Privacidade")');
    await expect(privacyTab).toBeVisible({ timeout: 5000 });
  });

  test('should provide link to privacy policy', async ({ page }) => {
    await page.goto('/');

    // Privacy policy link should be accessible
    const privacyLink = page.locator('[data-testid="privacy-policy-link"]');

    await expect(privacyLink).toBeVisible({ timeout: 10000 });

    // Link should navigate to privacy policy page
    await privacyLink.click();
    await page.waitForURL(/privacidade/i, { timeout: 10000 });

    // Privacy policy page should have LGPD-related heading and content
    const policyHeading = page.locator('h1:has-text("Política de Privacidade")');
    await expect(policyHeading).toBeVisible({ timeout: 5000 });
    
    // Check for LGPD-specific content
    const lgpdContent = page.locator('text=/LGPD|Lei Geral de Proteção de Dados/i');
    await expect(lgpdContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should remember consent preferences on refresh', async ({ page }) => {
    await page.goto('/');

    // Accept cookies - matches ConsentBanner component
    const acceptButton = page.locator('[data-testid="consent-accept"]');

    await acceptButton.click({ timeout: 10000 }).catch(() => {});

    // Refresh page
    await page.reload();

    // Banner should NOT appear again
    const consentBanner = page.locator('[data-testid="consent-banner"]');

    // Wait a moment for any animations
    await page.waitForTimeout(1000);

    const isVisible = await consentBanner.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });
});

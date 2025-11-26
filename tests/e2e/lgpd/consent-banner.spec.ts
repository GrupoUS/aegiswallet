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
  test.beforeEach(async ({ context }) => {
    // Clear cookies to ensure fresh consent state
    await context.clearCookies();
  });

  test('should display consent banner on first visit', async ({ page }) => {
    await page.goto('/');

    // Consent banner should be visible
    const consentBanner = page.locator(
      '[data-testid="consent-banner"], [data-testid="lgpd-banner"], [role="dialog"][aria-label*="cookie"], .cookie-banner, .lgpd-banner'
    );

    await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow accepting all cookies', async ({ page }) => {
    await page.goto('/');

    // Find and click accept all button
    const acceptButton = page.locator(
      'button:has-text("Aceitar"), button:has-text("Aceitar todos"), [data-testid="accept-cookies"], [data-testid="consent-accept"]'
    ).first();

    await expect(acceptButton).toBeVisible({ timeout: 10000 });
    await acceptButton.click();

    // Banner should disappear
    const consentBanner = page.locator(
      '[data-testid="consent-banner"], [data-testid="lgpd-banner"], .cookie-banner'
    ).first();

    await expect(consentBanner).not.toBeVisible({ timeout: 5000 });
  });

  test('should allow customizing cookie preferences', async ({ page }) => {
    await page.goto('/');

    // Find customize/manage preferences button
    const customizeButton = page.locator(
      'button:has-text("Personalizar"), button:has-text("Gerenciar"), [data-testid="customize-cookies"], [data-testid="consent-customize"]'
    ).first();

    await expect(customizeButton).toBeVisible({ timeout: 10000 });
    await customizeButton.click();

    // Preferences modal/panel should appear
    const preferencesPanel = page.locator(
      '[data-testid="cookie-preferences"], [data-testid="consent-preferences"], [role="dialog"]'
    ).first();

    await expect(preferencesPanel).toBeVisible({ timeout: 5000 });
  });

  test('should provide link to privacy policy', async ({ page }) => {
    await page.goto('/');

    // Privacy policy link should be accessible
    const privacyLink = page.locator(
      'a:has-text("Política de Privacidade"), a:has-text("Privacidade"), a[href*="privacy"], a[href*="privacidade"]'
    ).first();

    await expect(privacyLink).toBeVisible({ timeout: 10000 });

    // Link should navigate to privacy policy page
    await privacyLink.click();
    await page.waitForURL(/privacy|privacidade|politica/i, { timeout: 10000 });

    // Privacy policy content should be present
    const policyContent = await page.textContent('body');
    expect(policyContent).toMatch(/dados|proteção|LGPD|privacidade/i);
  });

  test('should remember consent preferences on refresh', async ({ page }) => {
    await page.goto('/');

    // Accept cookies
    const acceptButton = page.locator(
      'button:has-text("Aceitar"), [data-testid="accept-cookies"]'
    ).first();

    await acceptButton.click({ timeout: 10000 }).catch(() => {});

    // Refresh page
    await page.reload();

    // Banner should NOT appear again
    const consentBanner = page.locator(
      '[data-testid="consent-banner"], .cookie-banner'
    ).first();

    // Wait a moment for any animations
    await page.waitForTimeout(1000);

    const isVisible = await consentBanner.isVisible().catch(() => false);
    expect(isVisible).toBeFalsy();
  });
});

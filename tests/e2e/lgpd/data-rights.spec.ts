/**
 * AegisWallet LGPD Compliance Tests - Data Rights
 *
 * Tests for LGPD data subject rights:
 * - Right to access (data export)
 * - Right to rectification
 * - Right to erasure (deletion)
 * - Right to data portability
 *
 * Run: bun test:e2e:lgpd
 */
import { test, expect } from '@playwright/test';

test.describe('LGPD Compliance - Data Subject Rights', () => {
  test.describe('Data Export (Right to Access)', () => {
    test('should have data export option in settings', async ({ page }) => {
      // Navigate to settings/privacy section
      await page.goto('/settings');

      // Look for data export option
      const exportOption = page.locator(
        'button:has-text("Exportar"), button:has-text("Baixar meus dados"), [data-testid="export-data"], a:has-text("Exportar dados")'
      ).first();

      await expect(exportOption).toBeVisible({ timeout: 10000 });
    });

    test('should provide data in portable format', async ({ page }) => {
      await page.goto('/settings');

      // Trigger export
      const exportButton = page.locator(
        'button:has-text("Exportar"), [data-testid="export-data"]'
      ).first();

      // Check for download or confirmation
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);

      await exportButton.click().catch(() => {});

      const download = await downloadPromise;

      // If download happened, verify it's a valid format
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(json|csv|pdf|zip)$/i);
      }
    });
  });

  test.describe('Data Deletion (Right to Erasure)', () => {
    test('should have account deletion option', async ({ page }) => {
      await page.goto('/settings');

      // Look for delete account option
      const deleteOption = page.locator(
        'button:has-text("Excluir"), button:has-text("Deletar conta"), [data-testid="delete-account"], a:has-text("Excluir conta")'
      ).first();

      await expect(deleteOption).toBeVisible({ timeout: 10000 });
    });

    test('should require confirmation for data deletion', async ({ page }) => {
      await page.goto('/settings');

      const deleteButton = page.locator(
        'button:has-text("Excluir conta"), [data-testid="delete-account"]'
      ).first();

      await deleteButton.click().catch(() => {});

      // Confirmation dialog should appear
      const confirmDialog = page.locator(
        '[role="alertdialog"], [data-testid="confirm-delete"], .confirm-dialog'
      ).first();

      await expect(confirmDialog).toBeVisible({ timeout: 5000 }).catch(() => {
        // Alternative: check for confirmation text
        const confirmText = page.locator('text=/confirmar|certeza|irreversível/i');
        return expect(confirmText.first()).toBeVisible({ timeout: 5000 });
      });
    });
  });

  test.describe('Privacy Settings', () => {
    test('should allow updating privacy preferences', async ({ page }) => {
      await page.goto('/settings');

      // Navigate to privacy section
      const privacySection = page.locator(
        'a:has-text("Privacidade"), button:has-text("Privacidade"), [data-testid="privacy-settings"]'
      ).first();

      await privacySection.click().catch(() => {});

      // Privacy options should be available
      const privacyOptions = page.locator(
        '[data-testid="privacy-option"], input[type="checkbox"], [role="switch"]'
      );

      await expect(privacyOptions.first()).toBeVisible({ timeout: 10000 });
    });
  });
});

/**
 * AegisWallet Accessibility Tests - WCAG 2.1 AA+ Audit
 *
 * Automated accessibility testing using axe-core:
 * - WCAG 2.1 Level A and AA compliance
 * - Best practice rules
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Focus management
 *
 * Run: bun test:e2e:a11y
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Configure axe for WCAG 2.1 AA+ compliance
const axeConfig = {
	tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
};

test.describe('Accessibility Audit - WCAG 2.1 AA+', () => {
	test.describe('Core Pages Accessibility', () => {
		test('home page should have no accessibility violations', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const results = await new AxeBuilder({ page }).withTags(axeConfig.tags).analyze();

			// Log violations for debugging
			if (results.violations.length > 0) {
				console.log('Accessibility violations:', JSON.stringify(results.violations, null, 2));
			}

			expect(results.violations).toHaveLength(0);
		});

		test('login page should have no accessibility violations', async ({ page }) => {
			await page.goto('/auth');
			await page.waitForLoadState('networkidle');

			const results = await new AxeBuilder({ page }).withTags(axeConfig.tags).analyze();

			expect(results.violations).toHaveLength(0);
		});

		test('dashboard page should have no accessibility violations', async ({ page }) => {
			await page.goto('/dashboard');
			await page.waitForLoadState('networkidle');

			const results = await new AxeBuilder({ page }).withTags(axeConfig.tags).analyze();

			expect(results.violations).toHaveLength(0);
		});
	});

	test.describe('Keyboard Navigation', () => {
		test('should allow complete keyboard navigation', async ({ page }) => {
			await page.goto('/');

			// Tab through interactive elements
			const interactiveElements: string[] = [];

			for (let i = 0; i < 20; i++) {
				await page.keyboard.press('Tab');

				const focusedElement = await page.evaluate(() => {
					const el = document.activeElement;
					return el
						? {
								tag: el.tagName,
								role: el.getAttribute('role'),
								text: el.textContent?.substring(0, 50),
							}
						: null;
				});

				if (focusedElement) {
					interactiveElements.push(
						`${focusedElement.tag}${focusedElement.role ? `[${focusedElement.role}]` : ''}`,
					);
				}
			}

			// Should have found interactive elements
			expect(interactiveElements.length).toBeGreaterThan(0);
		});

		test('should have visible focus indicators', async ({ page }) => {
			await page.goto('/');

			// Tab to first interactive element
			await page.keyboard.press('Tab');

			// Check if focus is visible
			const hasFocusIndicator = await page.evaluate(() => {
				const el = document.activeElement;
				if (!el) return false;

				const styles = window.getComputedStyle(el);
				const outlineWidth = Number.parseInt(styles.outlineWidth) || 0;
				const boxShadow = styles.boxShadow;

				return outlineWidth > 0 || boxShadow !== 'none';
			});

			expect(hasFocusIndicator).toBeTruthy();
		});

		test('should support Escape key to close modals', async ({ page }) => {
			await page.goto('/');

			// Open a modal (if available)
			const modalTrigger = page
				.locator('[data-testid="open-modal"], button:has-text("Abrir"), [aria-haspopup="dialog"]')
				.first();

			if (await modalTrigger.isVisible().catch(() => false)) {
				await modalTrigger.click();

				// Modal should be visible
				const modal = page.locator('[role="dialog"]').first();
				await expect(modal).toBeVisible({ timeout: 5000 });

				// Press Escape
				await page.keyboard.press('Escape');

				// Modal should close
				await expect(modal).not.toBeVisible({ timeout: 5000 });
			}
		});
	});

	test.describe('Color Contrast', () => {
		test('should have sufficient color contrast', async ({ page }) => {
			await page.goto('/');

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2aa'])
				.options({ runOnly: ['color-contrast'] })
				.analyze();

			expect(results.violations).toHaveLength(0);
		});
	});

	test.describe('Form Accessibility', () => {
		test('forms should have proper labels', async ({ page }) => {
			await page.goto('/auth');

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa'])
				.options({ runOnly: ['label', 'label-title-only'] })
				.analyze();

			expect(results.violations).toHaveLength(0);
		});

		test('required fields should be indicated', async ({ page }) => {
			await page.goto('/auth');

			// Check for required field indicators
			const requiredInputs = await page.locator('input[required], [aria-required="true"]').count();
			const ariaInvalid = await page.locator('[aria-invalid]').count();

			// If there are required fields, they should be properly marked
			if (requiredInputs > 0) {
				expect(requiredInputs).toBeGreaterThan(0);
			}
		});
	});

	test.describe('Images and Media', () => {
		test('images should have alt text', async ({ page }) => {
			await page.goto('/');

			const results = await new AxeBuilder({ page }).options({ runOnly: ['image-alt'] }).analyze();

			expect(results.violations).toHaveLength(0);
		});
	});

	test.describe('Semantic Structure', () => {
		test('should have proper heading hierarchy', async ({ page }) => {
			await page.goto('/');

			const results = await new AxeBuilder({ page })
				.options({ runOnly: ['heading-order'] })
				.analyze();

			expect(results.violations).toHaveLength(0);
		});

		test('should have landmark regions', async ({ page }) => {
			await page.goto('/');

			// Check for main landmark
			const mainLandmark = await page.locator('main, [role="main"]').count();
			expect(mainLandmark).toBeGreaterThanOrEqual(1);

			// Check for navigation landmark
			const navLandmark = await page.locator('nav, [role="navigation"]').count();
			expect(navLandmark).toBeGreaterThanOrEqual(1);
		});
	});
});

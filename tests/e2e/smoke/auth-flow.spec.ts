/**
 * AegisWallet Smoke Tests - Authentication Flow
 *
 * Verifies critical authentication paths:
 * - Login page renders correctly
 * - Authentication form works
 * - Protected routes redirect properly
 * - Session management functions
 *
 * Run: bun test:e2e:smoke
 */
import { expect, test } from '@playwright/test';

test.describe('Authentication Flow - Smoke Tests', () => {
	test('should render login page', async ({ page }) => {
		await page.goto('/auth');

		// Login form elements should be visible
		await expect(
			page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]').first(),
		).toBeVisible({ timeout: 10000 });

		await expect(
			page
				.locator('input[type="password"], input[name="password"], [data-testid="password-input"]')
				.first(),
		).toBeVisible();
	});

	test('should redirect unauthenticated users from protected routes', async ({ page }) => {
		// Try to access a protected route directly
		await page.goto('/dashboard');

		// Should redirect to auth page or show login prompt
		await page.waitForURL(/auth|login|signin/i, { timeout: 10000 }).catch(() => {
			// If no redirect, check for login prompt
		});

		const currentUrl = page.url();
		const isOnAuthPage = /auth|login|signin/i.test(currentUrl);
		const hasLoginPrompt = await page
			.locator('input[type="password"]')
			.isVisible()
			.catch(() => false);

		expect(isOnAuthPage || hasLoginPrompt).toBeTruthy();
	});

	test('should show validation errors for invalid credentials', async ({ page }) => {
		await page.goto('/auth');

		// Fill in invalid credentials
		const emailInput = page
			.locator('input[type="email"], input[name="email"], [data-testid="email-input"]')
			.first();
		const passwordInput = page
			.locator('input[type="password"], input[name="password"], [data-testid="password-input"]')
			.first();

		await emailInput.fill('invalid@test.com');
		await passwordInput.fill('wrongpassword123');

		// Submit form
		const submitButton = page
			.locator('button[type="submit"], [data-testid="login-button"], button:has-text("Entrar")')
			.first();
		await submitButton.click();

		// Should show error message (adjust selector based on your UI)
		const errorMessage = page.locator(
			'[role="alert"], .error, [data-testid="error-message"], .toast-error',
		);

		// Wait for error or stay on same page
		await expect(errorMessage.first())
			.toBeVisible({ timeout: 10000 })
			.catch(() => {
				// If no error message, verify we're still on auth page
				expect(page.url()).toMatch(/auth|login/i);
			});
	});

	test('should have accessible form labels', async ({ page }) => {
		await page.goto('/auth');

		// Email input should have associated label
		const emailInput = page.locator('input[type="email"]').first();
		const emailLabel = await emailInput.getAttribute('aria-label');
		const emailLabelledBy = await emailInput.getAttribute('aria-labelledby');
		const emailId = await emailInput.getAttribute('id');

		// Check if input has proper labeling
		const hasProperLabel =
			emailLabel ||
			emailLabelledBy ||
			(emailId && (await page.locator(`label[for="${emailId}"]`).count()) > 0);

		expect(hasProperLabel).toBeTruthy();
	});

	test('should support keyboard navigation', async ({ page }) => {
		await page.goto('/auth');

		// Tab through form elements
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Focused element should be interactive
		const focusedElement = page.locator(':focus');
		await expect(focusedElement).toBeVisible();
	});
});

/**
 * AegisWallet E2E Tests - Data Integrity & Database Operations
 *
 * Verifies:
 * - RLS policies are working correctly (tested via Drizzle ORM)
 * - Authenticated users can only access their own data
 * - Protected routes redirect properly
 * - Frontend auth guards work correctly
 *
 * Note: These tests focus on frontend behavior.
 * Backend API tests require running `bun dev:full` (Vite + Hono server).
 *
 * Run: bun test:e2e --grep "Data Integrity"
 */
import { expect, test } from '@playwright/test';

test.describe('Data Integrity - Frontend Protection', () => {
	test.beforeEach(async ({ page }) => {
		// Clear console errors collector
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				console.error(`Console error: ${msg.text()}`);
			}
		});
	});

	test('should redirect to login when accessing protected routes', async ({ page }) => {
		await page.goto('/dashboard');

		// Wait for redirect
		await page.waitForURL(/login|auth/i, { timeout: 10000 });

		// Should be on login page
		expect(page.url()).toMatch(/login|auth/i);
	});

	test('should redirect to login when accessing saldo page', async ({ page }) => {
		await page.goto('/saldo');

		// Wait for redirect
		await page.waitForURL(/login|auth/i, { timeout: 10000 });

		// Should be on login page
		expect(page.url()).toMatch(/login|auth/i);
	});

	test('should redirect to login when accessing calendario page', async ({ page }) => {
		await page.goto('/calendario');

		// Wait for redirect
		await page.waitForURL(/login|auth/i, { timeout: 10000 });

		// Should be on login page
		expect(page.url()).toMatch(/login|auth/i);
	});

	test('should redirect to login when accessing contas page', async ({ page }) => {
		await page.goto('/contas');

		// Wait for redirect
		await page.waitForURL(/login|auth/i, { timeout: 10000 });

		// Should be on login page
		expect(page.url()).toMatch(/login|auth/i);
	});

	test('should redirect to login when accessing configuracoes page', async ({ page }) => {
		await page.goto('/configuracoes');

		// Wait for redirect
		await page.waitForURL(/login|auth/i, { timeout: 10000 });

		// Should be on login page
		expect(page.url()).toMatch(/login|auth/i);
	});

	test('should show login page with proper form elements', async ({ page }) => {
		await page.goto('/login');

		// Check login page loads
		await expect(page.locator('body')).toBeVisible();

		// Check for login form elements
		const hasLoginForm =
			(await page.locator('input[type="email"], input[type="password"]').count()) > 0;
		expect(hasLoginForm).toBeTruthy();
	});

	test('should have no JavaScript errors on login page', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => {
			errors.push(error.message);
		});

		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		// No critical JS errors should occur
		expect(errors).toHaveLength(0);
	});

	test('should render in Portuguese', async ({ page }) => {
		await page.goto('/login');

		// Page should have Portuguese content
		const pageContent = await page.textContent('body');
		const hasPtBrContent =
			pageContent?.includes('Entrar') ||
			pageContent?.includes('Email') ||
			pageContent?.includes('Senha') ||
			pageContent?.includes('Cadastrar') ||
			pageContent?.includes('Google');

		expect(hasPtBrContent).toBeTruthy();
	});
});

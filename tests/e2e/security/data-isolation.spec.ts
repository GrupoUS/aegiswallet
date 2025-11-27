import { expect, test } from '@playwright/test';

test.describe('Data Isolation & Security', () => {
  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/saldo',
      '/calendario',
      '/contas',
      '/contas-bancarias',
      '/configuracoes',
    ];

    for (const route of protectedRoutes) {
      console.log(`Testing protection for route: ${route}`);
      await page.goto(route);

      // Should redirect to login page
      // The URL might contain query parameters like ?redirect=...
      await expect(page).toHaveURL(/\/login/);

      // Verify login form is visible
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('should not allow access to protected components without auth', async ({ page }) => {
    // Attempt to access a protected route and verify no protected content is leaked before redirect
    await page.goto('/dashboard');

    // Check that dashboard specific elements are NOT visible
    // e.g., "Resumo Financeiro", "Saldo Total"
    const dashboardContent = page.getByText('Resumo Financeiro');
    await expect(dashboardContent).not.toBeVisible();

    await expect(page).toHaveURL(/\/login/);
  });
});

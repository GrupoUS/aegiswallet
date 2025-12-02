import { expect, type Page } from '@playwright/test';

export class LoginPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// Locator Getters (lazy evaluation)
	get emailInput() {
		return this.page.locator('input[type="email"]');
	}

	get passwordInput() {
		return this.page.locator('input[type="password"]');
	}

	get submitButton() {
		return this.page.locator(
			'button[type="submit"]:has-text("Entrar"), button[type="submit"]:has-text("Cadastrar")',
		);
	}

	get googleButton() {
		return this.page.locator('button:has-text("Google")');
	}

	get errorMessage() {
		return this.page.locator('.text-destructive, [role="alert"]').first();
	}

	get dashboardIndicator() {
		return this.page.locator('[data-testid="dashboard"], h1:has-text("Dashboard")').first();
	}

	// Action Methods
	async goto() {
		await this.page.goto('/login');
		return this;
	}

	async fillEmail(email: string) {
		await this.emailInput.fill(email);
		return this;
	}

	async fillPassword(password: string) {
		await this.passwordInput.fill(password);
		return this;
	}

	async clickSubmit() {
		await this.submitButton.click();
		return this;
	}

	async clickGoogleSignIn() {
		await this.googleButton.click();
		return this;
	}

	async login(email: string, password: string) {
		await this.fillEmail(email);
		await this.fillPassword(password);
		await this.clickSubmit();
		return this;
	}

	// Assertion Helpers
	async expectLoggedIn() {
		await this.dashboardIndicator.waitFor({ state: 'visible', timeout: 10000 });
	}

	async expectError(message?: string) {
		const errorLocator = message
			? this.errorMessage.filter({ hasText: message })
			: this.errorMessage;

		await expect(errorLocator).toBeVisible();
	}
}

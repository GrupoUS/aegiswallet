import { expect, type Page } from '@playwright/test';

export class DashboardPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// Locator Getters (lazy evaluation)
	get dashboardHeading() {
		return this.page.locator('h1:has-text("Dashboard")').first();
	}

	get balanceCard() {
		return this.page
			.locator('.magic-card, [class*="MagicCard"]')
			.filter({ hasText: 'Saldo em Conta' })
			.first();
	}

	get investmentsCard() {
		return this.page
			.locator('.magic-card, [class*="MagicCard"]')
			.filter({ hasText: 'Investimentos' })
			.first();
	}

	get recentTransactionsSection() {
		return this.page
			.locator(
				'h3:has-text("Transações Recentes"), [class*="CardTitle"]:has-text("Transações Recentes")',
			)
			.first();
	}

	get viewAllTransactionsButton() {
		return this.page
			.locator(
				'button:has-text("Ver Todas as Transações"), a:has-text("Ver Todas as Transações")',
			)
			.first();
	}

	get quickActionsContainer() {
		return this.page
			.locator('.grid')
			.filter({ has: this.page.locator('button:has-text("Nova Transação")') })
			.first();
	}

	// Action Methods
	async goto() {
		await this.page.goto('/dashboard');
		return this;
	}

	async waitForLoad() {
		await this.dashboardHeading.waitFor({ state: 'visible', timeout: 10000 });
		return this;
	}

	async getBalance(): Promise<number> {
		await this.balanceCard.waitFor({ state: 'visible' });

		// Look for FinancialAmount component or BRL currency pattern
		const balanceText =
			(await this.balanceCard.locator('text=/R\\$/').first().textContent()) ||
			(await this.balanceCard.textContent());

		if (!balanceText) {
			throw new Error('Balance text not found');
		}

		// Extract numeric value using regex for BRL format
		const match = balanceText.match(/R\$\s*([\d.,]+)/);
		if (!match || !match[1]) {
			throw new Error(`Could not extract balance from: ${balanceText}`);
		}

		// Convert Brazilian format to number: "1.234,56" → 1234.56
		const cleanValue = match[1].replace(/\./g, '').replace(',', '.');
		const balance = parseFloat(cleanValue);

		if (Number.isNaN(balance)) {
			throw new Error(`Could not convert balance to number: ${cleanValue}`);
		}

		return balance;
	}

	async getRecentTransactionCount(): Promise<number> {
		await this.recentTransactionsSection.waitFor({ state: 'visible' });

		// Count transaction items in the recent transactions section
		const transactionItems = await this.recentTransactionsSection
			.locator('[class*="transaction"], [class*="Transaction"], tr')
			.count();

		return transactionItems;
	}

	async clickViewAllTransactions() {
		await this.viewAllTransactionsButton.waitFor({ state: 'visible' });
		await this.viewAllTransactionsButton.click();
		return this;
	}

	async clickQuickAction(action: string) {
		const button = this.page.locator(`button:has-text("${action}")`);
		await button.waitFor({ state: 'visible' });
		await button.click();
		return this;
	}

	// Assertion Helpers
	async expectDashboardVisible() {
		await expect(this.dashboardHeading).toBeVisible();
	}

	async expectBalanceGreaterThan(amount: number) {
		const balance = await this.getBalance();
		expect(balance).toBeGreaterThan(amount);
	}
}

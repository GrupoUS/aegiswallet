import { expect, type Page } from '@playwright/test';

export class TransferPage {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// Locator Getters (lazy evaluation)
	get descriptionInput() {
		return this.page
			.getByLabel('Descrição')
			.or(
				this.page
					.locator('input[type="text"]')
					.filter({ has: this.page.locator('label:has-text("Descrição")') }),
			)
			.first();
	}

	get amountInput() {
		return this.page
			.getByLabel('Valor')
			.or(
				this.page
					.locator('input[type="number"]')
					.filter({ has: this.page.locator('label:has-text("Valor")') }),
			)
			.first();
	}

	get typeSelect() {
		return this.page
			.getByLabel('Tipo')
			.or(
				this.page
					.locator('select')
					.filter({ has: this.page.locator('label:has-text("Tipo")') }),
			)
			.first();
	}

	get dateInput() {
		return this.page
			.getByLabel('Data')
			.or(
				this.page
					.locator('input[type="date"]')
					.filter({ has: this.page.locator('label:has-text("Data")') }),
			)
			.first();
	}

	get accountSelect() {
		return this.page
			.getByLabel('Conta Bancária')
			.or(
				this.page
					.locator('select')
					.filter({
						has: this.page.locator('label:has-text("Conta Bancária")'),
					}),
			)
			.first();
	}

	get submitButton() {
		return this.page.locator('button[type="submit"]:has-text("Salvar")');
	}

	get cancelButton() {
		return this.page.locator('button:has-text("Cancelar")');
	}

	get successToast() {
		return this.page
			.locator('[role="status"], .sonner-toast')
			.filter({ hasText: /sucesso|success/i })
			.first();
	}

	get errorToast() {
		return this.page
			.locator('[role="alert"], .sonner-toast')
			.filter({ hasText: /erro|error/i })
			.first();
	}

	get formHeading() {
		return this.page.locator('h2:has-text("Nova Transação")');
	}

	// Action Methods
	async goto() {
		// Try common routes where transaction form might be available
		await this.page.goto('/saldo');
		// If form not found, try alternative routes
		if (!(await this.formHeading.isVisible().catch(() => false))) {
			await this.page.goto('/contas');
		}
		return this;
	}

	async waitForFormVisible() {
		await this.formHeading.waitFor({ state: 'visible', timeout: 10000 });
		return this;
	}

	async fillDescription(description: string) {
		await this.descriptionInput.fill(description);
		return this;
	}

	async fillAmount(amount: number | string) {
		const amountStr = typeof amount === 'number' ? amount.toString() : amount;
		await this.amountInput.fill(amountStr);
		return this;
	}

	async selectType(type: 'debit' | 'credit' | 'pix' | 'boleto' | 'transfer') {
		const typeMap = {
			debit: 'Débito',
			credit: 'Crédito',
			pix: 'PIX',
			boleto: 'Boleto',
			transfer: 'Transferência',
		};

		const portugueseType = typeMap[type];
		if (!portugueseType) {
			throw new Error(`Invalid transaction type: ${type}`);
		}

		await this.typeSelect.selectOption({ label: portugueseType });
		return this;
	}

	async selectAccount(accountName: string) {
		await this.accountSelect.selectOption({ label: accountName });
		return this;
	}

	async fillDate(date: string) {
		await this.dateInput.fill(date);
		return this;
	}

	async clickSubmit() {
		await this.submitButton.click();
		return this;
	}

	async clickCancel() {
		await this.cancelButton.click();
		return this;
	}

	async transfer(params: {
		description: string;
		amount: number;
		type?: 'debit' | 'credit' | 'pix' | 'boleto' | 'transfer';
		account?: string;
	}) {
		await this.waitForFormVisible();
		await this.fillDescription(params.description);
		await this.fillAmount(params.amount);
		await this.selectType(params.type || 'pix');

		if (params.account) {
			await this.selectAccount(params.account);
		} else {
			// Select first available account if none specified
			const options = await this.accountSelect.locator('option').count();
			if (options > 1) {
				// More than just the placeholder option
				await this.accountSelect.selectOption({ index: 1 }); // Select first actual option
			}
		}

		await this.clickSubmit();
		return this;
	}

	// Assertion Helpers
	async expectSuccess() {
		await this.successToast.waitFor({ state: 'visible', timeout: 10000 });
	}

	async expectError(message?: string) {
		const errorLocator = message
			? this.errorToast.filter({ hasText: new RegExp(message, 'i') })
			: this.errorToast;

		await errorLocator.waitFor({ state: 'visible', timeout: 10000 });
	}

	async expectFormVisible() {
		await expect(this.formHeading).toBeVisible();
	}
}

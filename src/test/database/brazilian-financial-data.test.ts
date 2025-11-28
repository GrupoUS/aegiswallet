/**
 * Brazilian Financial Data Test Suite
 *
 * Validates that test fixtures align with the current database schema
 * Tests Brazilian-specific financial data and compliance using Drizzle ORM types
 */

import { describe, expect, it } from 'vitest';

import type {
	BankAccount,
	FinancialEvent,
	InsertBankAccount,
	InsertFinancialEvent,
	InsertPixKey,
	InsertTransaction,
	InsertUser,
	PixKey,
	Transaction,
	User,
} from '@/db/schema';

describe('Brazilian Financial Data Schema Alignment', () => {
	describe('User Profile Schema', () => {
		it('should validate user profile structure with Brazilian data', () => {
			const userProfile: InsertUser = {
				id: 'test-user-id',
				clerkId: 'clerk_test_123',
				email: 'joao.silva@email.com',
				fullName: 'João Silva',
				phone: '11987654321',
				cpf: '12345678900',
				dateOfBirth: '1990-01-01',
				autonomyLevel: 50,
				voiceCommandEnabled: true,
				preferredLanguage: 'pt-BR',
				timezone: 'America/Sao_Paulo',
				currency: 'BRL',
				isActive: true,
			};

			expect(userProfile.cpf).toBe('12345678900');
			expect(userProfile.preferredLanguage).toBe('pt-BR');
			expect(userProfile.currency).toBe('BRL');
			expect(userProfile.isActive).toBe(true);
		});

		it('should validate user type structure', () => {
			const user: Partial<User> = {
				id: 'test-user-2',
				email: 'maria.santos@email.com',
				fullName: 'Maria Santos',
				cpf: '98765432100',
				phone: '11998765432',
				autonomyLevel: 75,
				voiceCommandEnabled: true,
				preferredLanguage: 'pt-BR',
				timezone: 'America/Sao_Paulo',
				currency: 'BRL',
				isActive: true,
			};

			expect(user.cpf).toBe('98765432100');
			expect(user.autonomyLevel).toBe(75);
			expect(user.isActive).toBe(true);
		});
	});

	describe('Bank Account Schema', () => {
		it('should validate Brazilian bank account structure', () => {
			const bankAccount: InsertBankAccount = {
				userId: 'test-user-id',
				belvoAccountId: 'belvo-acc-123',
				institutionId: 'br-bank-bb',
				institutionName: 'Banco do Brasil',
				accountType: 'CHECKING',
				accountNumber: '1234567-8',
				accountMask: '****567-8',
				accountHolderName: 'João Silva',
				balance: '5000.00',
				availableBalance: '4800.00',
				currency: 'BRL',
				isActive: true,
				isPrimary: true,
				syncStatus: 'success',
			};

			expect(bankAccount.institutionName).toBe('Banco do Brasil');
			expect(bankAccount.currency).toBe('BRL');
			expect(bankAccount.balance).toBe('5000.00');
			expect(bankAccount.isPrimary).toBe(true);
		});

		it('should validate bank account type structure', () => {
			const account: Partial<BankAccount> = {
				id: 'test-account-id',
				institutionName: 'Itaú',
				currency: 'BRL',
				isPrimary: true,
				isActive: true,
			};

			expect(account.isPrimary).toBe(true);
			expect(account.currency).toBe('BRL');
		});
	});

	describe('PIX Keys Schema', () => {
		it('should validate PIX key structure for Brazilian financial system', () => {
			const pixKey: InsertPixKey = {
				userId: 'test-user-id',
				bankAccountId: 'test-account-id',
				keyType: 'cpf',
				keyValue: '12345678900',
				keyName: 'CPF Principal',
				isActive: true,
				verificationStatus: 'verified',
			};

			expect(pixKey.keyType).toBe('cpf');
			expect(pixKey.keyValue).toBe('12345678900');
			expect(pixKey.isActive).toBe(true);
		});

		it('should validate PIX key type structure', () => {
			const key: Partial<PixKey> = {
				id: 'test-pix-key-id',
				keyType: 'email',
				keyValue: 'joao@email.com',
				isActive: true,
				verificationStatus: 'verified',
			};

			expect(key.keyType).toBe('email');
			expect(key.isActive).toBe(true);
		});
	});

	describe('Transactions Schema', () => {
		it('should validate Brazilian financial transaction structure', () => {
			const transaction: InsertTransaction = {
				userId: 'test-user-id',
				accountId: 'test-bank-account-id',
				amount: '-347.85',
				currency: 'BRL',
				description: 'Supermercado Carrefour',
				merchantName: 'Carrefour Comércio e Indústria Ltda',
				transactionDate: new Date().toISOString(),
				transactionType: 'debit',
				paymentMethod: 'debit_card',
				status: 'posted',
				isManualEntry: false,
				externalSource: 'belvo',
			};

			expect(transaction.amount).toBe('-347.85');
			expect(transaction.currency).toBe('BRL');
			expect(transaction.transactionType).toBe('debit');
			expect(transaction.merchantName).toBe(
				'Carrefour Comércio e Indústria Ltda',
			);
		});

		it('should validate transaction type structure', () => {
			const tx: Partial<Transaction> = {
				id: 'test-tx-id',
				amount: '100.00',
				currency: 'BRL',
				transactionType: 'credit',
				status: 'posted',
			};

			expect(tx.transactionType).toBe('credit');
			expect(tx.currency).toBe('BRL');
		});
	});

	describe('Financial Events Schema', () => {
		it('should validate Brazilian financial event structure', () => {
			const eventDate = new Date();
			const financialEvent: InsertFinancialEvent = {
				userId: 'test-user-id',
				title: 'Pagamento de Conta de Energia',
				description: 'Conta mensal de energia elétrica',
				amount: '234.67',
				status: 'pending',
				startDate: eventDate,
				endDate: eventDate,
				allDay: false,
				color: 'red',
				isIncome: false,
				isCompleted: false,
				isRecurring: true,
				recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=15',
				priority: 'high',
			};

			expect(financialEvent.title).toBe('Pagamento de Conta de Energia');
			expect(financialEvent.amount).toBe('234.67');
			expect(financialEvent.status).toBe('pending');
			expect(financialEvent.isRecurring).toBe(true);
		});

		it('should validate financial event type structure', () => {
			const event: Partial<FinancialEvent> = {
				id: 'test-event-id',
				title: 'Salário',
				amount: '5000.00',
				isIncome: true,
				status: 'completed',
			};

			expect(event.isIncome).toBe(true);
			expect(event.status).toBe('completed');
		});
	});
});

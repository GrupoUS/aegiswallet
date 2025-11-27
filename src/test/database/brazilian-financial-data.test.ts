/**
 * Brazilian Financial Data Test Suite
 *
 * Validates that test fixtures align with the current database schema
 * Tests Brazilian-specific financial data and compliance
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { setupMockDatabase } from '../mocks/supabase-mock';
import { supabase } from '@/integrations/supabase/client';

describe('Brazilian Financial Data Schema Alignment', () => {
	beforeEach(() => {
		// Clear all mock data before each test
		setupMockDatabase.clear('users');
		setupMockDatabase.clear('bank_accounts');
		setupMockDatabase.clear('transactions');
		setupMockDatabase.clear('pix_keys');
		setupMockDatabase.clear('financial_events');
	});

	describe('User Profile Schema', () => {
		it('should create user profile with Brazilian CPF', async () => {
			const userProfile = {
				id: 'test-user-id',
				email: 'joao.silva@email.com',
				full_name: 'João Silva',
				phone: '11 98765-4321',
				cpf: '123.456.789-00',
				birth_date: '1990-01-01',
				autonomy_level: 50,
				voice_command_enabled: true,
				language: 'pt-BR',
				timezone: 'America/Sao_Paulo',
				currency: 'BRL',
				is_active: true,
			};

			const { data, error } = await supabase
				.from('users')
				.insert(userProfile)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.cpf).toBe('123.456.789-00');
			expect(data!.language).toBe('pt-BR');
			expect(data!.currency).toBe('BRL');
			expect(data!.is_active).toBe(true);
		});

		it('should validate Brazilian user data', async () => {
			const userProfile = {
				id: 'test-user-2',
				email: 'maria.santos@email.com',
				full_name: 'Maria Santos',
				cpf: '987.654.321-00',
				phone: '11 99876-5432',
				birth_date: '1985-05-15',
				autonomy_level: 75,
				voice_command_enabled: true,
				language: 'pt-BR',
				timezone: 'America/Sao_Paulo',
				currency: 'BRL',
				is_active: true,
			};

			const { data, error } = await supabase
				.from('users')
				.insert(userProfile)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.cpf).toBe('987.654.321-00');
			expect(data!.autonomy_level).toBe(75);
			expect(data!.is_active).toBe(true);
		});
	});

	describe('Bank Account Schema', () => {
		it('should create Brazilian bank account with proper structure', async () => {
			const bankAccount = {
				user_id: 'test-user-id',
				belvo_account_id: 'belvo-acc-123',
				institution_id: 'br-bank-bb',
				institution_name: 'Banco do Brasil',
				account_type: 'CHECKING',
				account_number: '1234567-8',
				account_mask: '****567-8',
				account_holder_name: 'João Silva',
				balance: 5000.0,
				available_balance: 4800.0,
				currency: 'BRL',
				is_active: true,
				is_primary: true,
				sync_status: 'success',
			};

			const { data, error } = await supabase
				.from('bank_accounts')
				.insert(bankAccount)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.institution_name).toBe('Banco do Brasil');
			expect(data!.currency).toBe('BRL');
			expect(data!.balance).toBe(5000.0);
			expect(data!.is_primary).toBe(true);
		});
	});

	describe('PIX Keys Schema', () => {
		it('should create PIX keys for Brazilian financial system', async () => {
			const pixKey = {
				user_id: 'test-user-id',
				key_type: 'CPF',
				key_value: '123.456.789-00',
				key_name: 'CPF Principal',
				is_active: true,
				verification_status: 'verified',
				usage_count: 0,
			};

			const { data, error } = await supabase
				.from('pix_keys')
				.insert(pixKey)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.key_type).toBe('CPF');
			expect(data!.key_value).toBe('123.456.789-00');
			expect(data!.is_active).toBe(true);
		});
	});

	describe('Transactions Schema', () => {
		it('should create Brazilian financial transactions', async () => {
			const transaction = {
				user_id: 'test-user-id',
				account_id: 'test-bank-account-id',
				amount: -347.85, // Negative for expense
				currency: 'BRL',
				description: 'Supermercado Carrefour',
				merchant_name: 'Carrefour Comércio e Indústria Ltda',
				transaction_date: new Date().toISOString(),
				transaction_type: 'debit',
				payment_method: 'debit_card',
				status: 'posted',
				tags: ['essencial'],
				notes: 'Compra mensal de supermercado',
				is_manual_entry: false,
				external_source: 'belvo',
			};

			const { data, error } = await supabase
				.from('transactions')
				.insert(transaction)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.amount).toBe(-347.85);
			expect(data!.currency).toBe('BRL');
			expect(data!.transaction_type).toBe('debit');
			expect(data!.merchant_name).toBe('Carrefour Comércio e Indústria Ltda');
		});
	});

	describe('Financial Events Schema', () => {
		it('should create Brazilian financial events', async () => {
			const eventDate = new Date();
			const financialEvent = {
				user_id: 'test-user-id',
				title: 'Pagamento de Conta de Energia',
				description: 'Conta mensal de energia elétrica',
				amount: 234.67,
				status: 'pending',
				start_date: eventDate.toISOString(),
				end_date: eventDate.toISOString(),
				all_day: false,
				color: 'red',
				is_income: false,
				is_completed: false,
				is_recurring: true,
				recurrence_rule: 'FREQ=MONTHLY;BYMONTHDAY=15',
				priority: 'high',
				tags: ['prioritario', 'automatizado'],
				brazilian_event_type: 'conta_energia',
				event_type: 'bill_payment',
				metadata: {
					priority: 'alta',
					category: 'essencial',
					due_day: 15,
				},
			};

			const { data, error } = await supabase
				.from('financial_events')
				.insert(financialEvent)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).not.toBeNull();
			expect(data!.title).toBe('Pagamento de Conta de Energia');
			expect(data!.amount).toBe(234.67);
			expect(data!.status).toBe('pending');
			expect(data!.is_recurring).toBe(true);
			expect(data!.brazilian_event_type).toBe('conta_energia');
		});
	});
});

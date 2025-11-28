import { describe, expect, it } from 'vitest';

import type { Tables } from '@/types/database.types';

/**
 * Database Schema Type Validation Tests
 *
 * These tests validate that database types are correctly defined
 * and can be used properly in the application. Tests use actual
 * mock data to verify runtime behavior matches type definitions.
 */
describe('Database Schema Type Validation', () => {
	describe('User Preferences Table', () => {
		it('should have correct type structure', () => {
			// Create a properly typed mock to verify type structure
			const testRow: Tables<'user_preferences'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				accessibility_high_contrast: true,
				accessibility_large_text: false,
				accessibility_screen_reader: false,
				auto_categorize: true,
				budget_alerts: true,
				voice_feedback: true,
				theme: 'dark',
				notifications_email: true,
				notifications_push: true,
				notifications_sms: false,
			};
			expect(testRow).toBeDefined();
			expect(testRow.id).toBe('test-id');
			expect(testRow.accessibility_high_contrast).toBe(true);
		});

		it('should allow proper type access patterns', () => {
			const preferences: Partial<Tables<'user_preferences'>> = {
				accessibility_high_contrast: true,
				auto_categorize: false,
				budget_alerts: true,
				voice_feedback: true,
			};

			expect(preferences.accessibility_high_contrast).toBe(true);
			expect(preferences.auto_categorize).toBe(false);
		});
	});

	describe('Bank Accounts Table', () => {
		it('should have correct type structure', () => {
			const testRow: Tables<'bank_accounts'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				institution_name: 'Test Bank',
				institution_id: 'bank-001',
				account_type: 'checking',
				account_mask: '****1234',
				account_number: '12345678',
				account_holder_name: 'John Doe',
				balance: 1000,
				available_balance: 950,
				currency: 'BRL',
				is_primary: true,
				is_active: true,
				last_sync: null,
				sync_status: 'synced',
				sync_error_message: null,
				belvo_account_id: 'belvo-123',
			};
			expect(testRow).toBeDefined();
			expect(testRow.institution_name).toBe('Test Bank');
			expect(testRow.balance).toBe(1000);
		});
	});

	describe('Voice Transcriptions Table', () => {
		it('should have correct type structure', () => {
			const testRow: Tables<'voice_transcriptions'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				transcript: 'Test transcription',
				audio_storage_path: '/audio/test.mp3',
				expires_at: new Date(Date.now() + 86400000).toISOString(),
				confidence_score: 0.95,
				language: 'pt-BR',
				processing_time_ms: 200,
			};
			expect(testRow).toBeDefined();
			expect(testRow.transcript).toBe('Test transcription');
			expect(testRow.language).toBe('pt-BR');
		});
	});

	describe('Financial Events Table', () => {
		it('should have correct type structure', () => {
			const testRow: Tables<'financial_events'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				title: 'Test Event',
				description: 'Test description',
				amount: 500,
				event_type: 'payment',
				start_date: new Date().toISOString(),
				end_date: new Date().toISOString(),
				status: 'active',
				color: '#4CAF50',
				is_recurring: false,
				is_income: false,
				all_day: false,
				metadata: null,
				due_date: null,
				priority: null,
				category: null,
				icon: null,
				location: null,
				tags: null,
				notes: null,
				attachments: null,
				recurrence_rule: null,
				completed_at: null,
				brazilian_event_type: null,
				event_type_id: null,
				installment_info: null,
				merchant_category: null,
				parent_event_id: null,
			};
			expect(testRow).toBeDefined();
			expect(testRow.title).toBe('Test Event');
			expect(testRow.amount).toBe(500);
		});
	});

	describe('Transactions Table', () => {
		it('should have correct type structure', () => {
			const testRow: Tables<'transactions'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				amount: 100,
				description: 'Test transaction',
				transaction_date: new Date().toISOString(),
				transaction_type: 'debit',
				account_id: null,
				category_id: null,
				currency: 'BRL',
				is_manual_entry: false,
				merchant_name: 'Test Merchant',
				status: 'completed',
			};
			expect(testRow).toBeDefined();
			expect(testRow.amount).toBe(100);
			expect(testRow.transaction_type).toBe('debit');
		});

		it('should handle optional fields correctly', () => {
			const transaction: Partial<Tables<'transactions'>> = {
				amount: 100,
				description: 'Test transaction',
				transaction_date: '2024-01-01',
				user_id: 'test-user-id',
			};

			expect(transaction.amount).toBe(100);
			expect(transaction.description).toBe('Test transaction');
		});
	});

	describe('AI Insights Table', () => {
		it('should have correct type structure', () => {
			const testRow: Tables<'ai_insights'> = {
				id: 'test-id',
				user_id: 'test-user-id',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				insight_type: 'spending_alert',
				title: 'High spending detected',
				description: 'Your spending this month is higher than usual',
				confidence_score: 0.85,
				action_suggested: null,
				action_url: null,
				amount: null,
				category: null,
				comparison_period: null,
				dismissed_at: null,
				expires_at: null,
				is_dismissed: false,
				is_read: false,
				metadata: null,
				model_version: null,
				percentage_change: null,
				read_at: null,
				related_entities: null,
				severity: 'medium',
			};
			expect(testRow).toBeDefined();
			expect(testRow.insight_type).toBe('spending_alert');
			expect(testRow.confidence_score).toBe(0.85);
		});
	});

	describe('Complex Query Type Patterns', () => {
		it('should handle filter types correctly', () => {
			type TransactionFilter = Partial<
				Pick<
					Tables<'transactions'>,
					'amount' | 'category_id' | 'account_id' | 'user_id'
				>
			> & {
				startDate?: string;
				endDate?: string;
				limit?: number;
				offset?: number;
			};

			const filter: TransactionFilter = {
				user_id: 'test-user',
				amount: 100,
				limit: 20,
				offset: 0,
			};

			expect(filter.user_id).toBe('test-user');
			expect(filter.amount).toBe(100);
			expect(filter.limit).toBe(20);
		});
	});

	describe('Table Existence Validation', () => {
		it('should validate key tables exist in type definitions', () => {
			// These core tables must exist in the schema
			const testAiInsight: Tables<'ai_insights'> = {} as Tables<'ai_insights'>;
			const testAuditLog: Tables<'audit_logs'> = {} as Tables<'audit_logs'>;
			const testBankAccount: Tables<'bank_accounts'> =
				{} as Tables<'bank_accounts'>;
			const testFinancialEvent: Tables<'financial_events'> =
				{} as Tables<'financial_events'>;
			const testTransaction: Tables<'transactions'> =
				{} as Tables<'transactions'>;
			const testUserPreferences: Tables<'user_preferences'> =
				{} as Tables<'user_preferences'>;
			const testVoiceTranscription: Tables<'voice_transcriptions'> =
				{} as Tables<'voice_transcriptions'>;
			const testUser: Tables<'users'> = {} as Tables<'users'>;
			const testContact: Tables<'contacts'> = {} as Tables<'contacts'>;
			const testPixKey: Tables<'pix_keys'> = {} as Tables<'pix_keys'>;

			// All type casts should succeed (compile-time validation)
			expect(testAiInsight).toBeDefined();
			expect(testAuditLog).toBeDefined();
			expect(testBankAccount).toBeDefined();
			expect(testFinancialEvent).toBeDefined();
			expect(testTransaction).toBeDefined();
			expect(testUserPreferences).toBeDefined();
			expect(testVoiceTranscription).toBeDefined();
			expect(testUser).toBeDefined();
			expect(testContact).toBeDefined();
			expect(testPixKey).toBeDefined();
		});
	});

	describe('Type Safety Validation', () => {
		it('should enforce required fields', () => {
			// This should cause a type error if required fields are missing
			// @ts-expect-error - Missing required fields
			const _invalidTransaction: Tables<'transactions'> = {};

			// This should work with all required fields
			const validTransaction: Tables<'transactions'> = {
				id: 'test-id',
				amount: 100,
				user_id: 'test-user',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				account_id: null,
				category_id: null,
				currency: null,
				description: null,
				is_manual_entry: null,
				merchant_name: null,
				status: null,
				transaction_date: null,
				transaction_type: null,
			};

			expect(validTransaction.id).toBe('test-id');
			expect(validTransaction.amount).toBe(100);
			expect(validTransaction.user_id).toBe('test-user');
		});

		it('should handle nullable fields correctly', () => {
			const preferences: Tables<'user_preferences'> = {
				id: 'test-id',
				user_id: 'test-user',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				accessibility_high_contrast: null,
				accessibility_large_text: null,
				accessibility_screen_reader: null,
				auto_categorize: null,
				budget_alerts: null,
				voice_feedback: null,
				theme: null,
				notifications_email: null,
				notifications_push: null,
				notifications_sms: null,
			};

			expect(preferences.accessibility_high_contrast).toBeNull();
			expect(preferences.auto_categorize).toBeNull();
		});
	});
});

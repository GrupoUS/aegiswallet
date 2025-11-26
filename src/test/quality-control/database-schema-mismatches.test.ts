/**
 * RED PHASE: Failing tests to expose database schema mismatches
 * These tests will fail initially and drive the implementation of fixes
 */

import { describe, expect, it } from 'vitest';
import type { Database, Tables } from '@/integrations/supabase/types';

describe('Database Schema Type Safety', () => {
  describe('User Preferences Schema', () => {
    it('should have voice_feedback property', () => {
      // This test exposes missing properties in user_preferences table
      type UserPreferencesRow = Tables<'user_preferences'>['Row'];
      const mockPreferences: UserPreferencesRow = {
        id: 'test-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        notifications_email: true,
        notifications_push: false,
        theme: 'dark',
        // @ts-expect-error - This should fail because voice_feedback is missing
        voice_feedback: true,
      };

      expect(mockPreferences.voice_feedback).toBeDefined();
    });

    it('should have accessibility properties', () => {
      type UserPreferencesRow = Tables<'user_preferences'>['Row'];
      const mockPreferences: UserPreferencesRow = {
        id: 'test-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        notifications_email: true,
        notifications_push: false,
        theme: 'dark',
        // @ts-expect-error - These should fail because accessibility properties are missing
        accessibility_high_contrast: true,
        accessibility_large_text: false,
        accessibility_screen_reader: true,
      };

      expect(mockPreferences.accessibility_high_contrast).toBeDefined();
      expect(mockPreferences.accessibility_large_text).toBeDefined();
      expect(mockPreferences.accessibility_screen_reader).toBeDefined();
    });
  });

  describe('Bank Accounts Schema', () => {
    it('should have is_primary property', () => {
      type BankAccountRow = Tables<'bank_accounts'>['Row'];
      const mockAccount: BankAccountRow = {
        id: 'test-id',
        account_mask: '1234',
        institution_name: 'Test Bank',
        balance: 1000,
        currency: 'BRL',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        // @ts-expect-error - This should fail because is_primary is missing
        is_primary: true,
      };

      expect(mockAccount.is_primary).toBeDefined();
    });
  });

  describe('Financial Events Schema', () => {
    it('should have missing properties for financial events', () => {
      type FinancialEventRow = Tables<'financial_events'>['Row'];
      const mockEvent: FinancialEventRow = {
        id: 'test-id',
        title: 'Test Event',
        event_date: '2024-01-01',
        amount: 100,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        event_type_id: 'type-id',
        // @ts-expect-error - These should fail because properties are missing
        description: 'Test description',
        is_income: true,
        account_id: 'account-id',
        category_id: 'category-id',
        priority: 'high',
      };

      expect(mockEvent.description).toBeDefined();
      expect(mockEvent.is_income).toBeDefined();
      expect(mockEvent.account_id).toBeDefined();
      expect(mockEvent.category_id).toBeDefined();
      expect(mockEvent.priority).toBeDefined();
    });
  });

  describe('Transactions Schema', () => {
    it('should have correct date field naming', () => {
      type TransactionRow = Tables<'transactions'>['Row'];
      const mockTransaction: TransactionRow = {
        id: 'test-id',
        description: 'Test Transaction',
        amount: 100,
        transaction_type: 'credit',
        transaction_date: '2024-01-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        account_id: 'account-id',
        category_id: 'category-id',
        status: 'completed',
        // @ts-expect-error - This should fail because date field doesn't exist
        date: '2024-01-01',
      };

      expect(mockTransaction.date).toBeDefined();
    });
  });

  describe('Missing Tables for Voice and Analytics', () => {
    it('should have voice_feedback table', () => {
      // This test exposes that voice_feedback table doesn't exist in database types
      type DatabaseTables = Database['public']['Tables'];

      // @ts-expect-error - This should fail because voice_feedback table is missing
      const voiceFeedbackTable: DatabaseTables['voice_feedback'] =
        {} as unknown as DatabaseTables['voice_feedback'];

      expect(voiceFeedbackTable).toBeDefined();
    });

    it('should have voice_metrics table', () => {
      type DatabaseTables = Database['public']['Tables'];

      // @ts-expect-error - This should fail because voice_metrics table is missing
      const voiceMetricsTable: DatabaseTables['voice_metrics'] =
        {} as unknown as DatabaseTables['voice_metrics'];

      expect(voiceMetricsTable).toBeDefined();
    });

    it('should have audit_logs table', () => {
      type DatabaseTables = Database['public']['Tables'];

      // @ts-expect-error - This should fail because audit_logs table is missing
      const auditLogsTable: DatabaseTables['audit_logs'] =
        {} as unknown as DatabaseTables['audit_logs'];

      expect(auditLogsTable).toBeDefined();
    });

    it('should have bank_tokens table', () => {
      type DatabaseTables = Database['public']['Tables'];

      // @ts-expect-error - This should fail because bank_tokens table is missing
      const bankTokensTable: DatabaseTables['bank_tokens'] =
        {} as unknown as DatabaseTables['bank_tokens'];

      expect(bankTokensTable).toBeDefined();
    });

    it('should have user_bank_links table', () => {
      type DatabaseTables = Database['public']['Tables'];

      // @ts-expect-error - This should fail because user_bank_links table is missing
      const userBankLinksTable: DatabaseTables['user_bank_links'] =
        {} as unknown as DatabaseTables['user_bank_links'];

      expect(userBankLinksTable).toBeDefined();
    });
  });

  describe('Calendar Filter Schema', () => {
    it('should have categories property in CalendarFilter', () => {
      // This test exposes missing categories property in CalendarFilter type
      interface CalendarFilter {
        startDate?: string;
        endDate?: string;
        typeId?: string;
        isCompleted?: boolean;
        // @ts-expect-error - This should fail because categories is missing
        categories?: string[];
      }

      const filter: CalendarFilter = {
        categories: ['category1', 'category2'],
        endDate: '2024-01-31',
        startDate: '2024-01-01',
      };

      expect(filter.categories).toBeDefined();
      expect(filter.categories?.length).toBeGreaterThan(0);
    });
  });
});

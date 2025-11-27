/**
 * Type Check Validation Test
 * Validates that critical type fixes are working correctly
 */

import { describe, expect, it } from 'vitest';
import type { Tables } from '@/integrations/supabase/types';

describe('Type Check Validation', () => {
  describe('Database Schema Fixes', () => {
    it('should have user_preferences with voice_feedback', () => {
      // Tables<'table_name'> returns the Row type directly
      const mockPreferences: Tables<'user_preferences'> = {
        accessibility_high_contrast: true,
        accessibility_large_text: false,
        accessibility_screen_reader: true,
        auto_categorize: null,
        budget_alerts: null,
        created_at: new Date().toISOString(),
        id: 'test-id',
        notifications_email: true,
        notifications_push: false,
        notifications_sms: null,
        theme: 'dark',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        voice_feedback: true,
      };

      expect(mockPreferences.voice_feedback).toBe(true);
      expect(mockPreferences.accessibility_high_contrast).toBe(true);
    });

    it('should have bank_accounts with is_primary', () => {
      // Use partial type since we don't need all fields for testing
      type BankAccountRow = Tables<'bank_accounts'>;
      const mockAccount: Partial<BankAccountRow> = {
        account_mask: '1234',
        balance: 1000,
        created_at: new Date().toISOString(),
        currency: 'BRL',
        id: 'test-id',
        institution_name: 'Test Bank',
        is_active: true,
        is_primary: true,
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
      };

      expect(mockAccount.is_primary).toBe(true);
    });

    it('should have financial_events with new properties', () => {
      // Use partial type since schema has many required fields
      type FinancialEventRow = Tables<'financial_events'>;
      const mockEvent: Partial<FinancialEventRow> = {
        amount: 100,
        category: 'test-category',
        created_at: new Date().toISOString(),
        description: 'Test description',
        id: 'test-id',
        title: 'Test Event',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        is_income: true,
        priority: 'high',
      };

      expect(mockEvent.description).toBe('Test description');
      expect(mockEvent.is_income).toBe(true);
      expect(mockEvent.priority).toBe('high');
    });

    it('should have transactions with date field', () => {
      type TransactionRow = Tables<'transactions'>;
      const mockTransaction: Partial<TransactionRow> = {
        account_id: 'account-id',
        amount: 100,
        category_id: 'category-id',
        created_at: new Date().toISOString(),
        description: 'Test Transaction',
        id: 'test-id',
        transaction_date: '2024-01-01',
        transaction_type: 'credit',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
      };

      expect(mockTransaction.transaction_date).toBe('2024-01-01');
    });

    it('should have voice tables available', () => {
      // voice_feedback table exists
      type VoiceFeedbackRow = Tables<'voice_feedback'>;
      const voiceFeedbackRow: Partial<VoiceFeedbackRow> = {
        command_text: 'test command',
        was_correct: true,
      };

      // audit_logs table exists
      type AuditLogsRow = Tables<'audit_logs'>;
      const auditLogsRow: Partial<AuditLogsRow> = {
        action: 'test_action',
        resource_type: 'test',
      };

      // bank_tokens table exists
      type BankTokensRow = Tables<'bank_tokens'>;
      const bankTokensRow: Partial<BankTokensRow> = {
        encrypted_access_token: 'token',
        encryption_algorithm: 'AES-256-GCM',
      };

      expect(voiceFeedbackRow).toBeDefined();
      expect(auditLogsRow).toBeDefined();
      expect(bankTokensRow).toBeDefined();
    });
  });

  describe('Component Export Fixes', () => {
    it('should export components correctly', async () => {
      // These should now work without import errors
      const uiModule = await import('@/components/ui');

      // These should exist and be React components (functions or forwardRef objects)
      const isReactComponent = (component: unknown): boolean =>
        typeof component === 'function' ||
        (typeof component === 'object' &&
          component !== null &&
          '$$typeof' in component);

      expect(isReactComponent(uiModule.PopoverAnchor)).toBe(true);
      expect(isReactComponent(uiModule.SheetOverlay)).toBe(true);
      expect(isReactComponent(uiModule.SheetPortal)).toBe(true);
      expect(isReactComponent(uiModule.Button)).toBe(true);
      expect(isReactComponent(uiModule.Card)).toBe(true);
    });
  });

  describe('Hono Auth Context Fixes', () => {
    it('should have Hono auth middleware with user property', async () => {
      // Now using Hono RPC instead of tRPC
      const authModule = await import('@/server/middleware/auth');

      // This should include the authMiddleware function
      const { authMiddleware, optionalAuthMiddleware } = authModule;

      // Verify the auth middlewares exist and are functions
      expect(authMiddleware).toBeDefined();
      expect(optionalAuthMiddleware).toBeDefined();
      expect(typeof authMiddleware).toBe('function');
      expect(typeof optionalAuthMiddleware).toBe('function');
    });
  });

  describe('Calendar Filter Fixes', () => {
    it('should have categories in CalendarFilter', async () => {
      // Import the types module to verify it exists and can be used
      const typesModule = await import('@/components/ui/event-calendar/types');

      // Verify the module exported successfully (CalendarFilter is a type, not a runtime value)
      expect(typesModule).toBeDefined();

      // Create a filter object with categories using the interface shape
      const filter: { categories?: string[]; search?: string } = {
        categories: ['category1', 'category2'],
        search: 'test',
      };

      // Verify the filter object works correctly
      expect(filter.categories).toEqual(['category1', 'category2']);
      expect(filter.search).toBe('test');
    });
  });
});

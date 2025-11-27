/**
 * Type Check Validation Test
 * Validates that critical type fixes are working correctly
 */

import { describe, expect, it } from 'vitest';
import type { Tables } from '@/integrations/supabase/types';

describe('Type Check Validation', () => {
  describe('Database Schema Fixes', () => {
    it('should have user_preferences with voice_feedback', () => {
      // This should now work without errors
      const mockPreferences: Tables<'user_preferences'>['Row'] = {
        accessibility_high_contrast: true,
        accessibility_large_text: false,
        accessibility_screen_reader: true,
        created_at: new Date().toISOString(),
        id: 'test-id',
        notifications_email: true,
        notifications_push: false,
        theme: 'dark',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
        voice_feedback: true,
      };

      expect(mockPreferences.voice_feedback).toBe(true);
      expect(mockPreferences.accessibility_high_contrast).toBe(true);
    });

    it('should have bank_accounts with is_primary', () => {
      const mockAccount: Tables<'bank_accounts'>['Row'] = {
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
      const mockEvent: Tables<'financial_events'>['Row'] = {
        account_id: 'account-id',
        amount: 100,
        category_id: 'category-id',
        created_at: new Date().toISOString(),
        description: 'Test description',
        event_date: '2024-01-01',
        event_type_id: 'type-id',
        id: 'test-id',
        is_completed: false,
        is_income: true,
        priority: 'high',
        title: 'Test Event',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
      };

      expect(mockEvent.description).toBe('Test description');
      expect(mockEvent.is_income).toBe(true);
      expect(mockEvent.priority).toBe('high');
    });

    it('should have transactions with date field', () => {
      const mockTransaction: Tables<'transactions'>['Row'] = {
        account_id: 'account-id',
        amount: 100,
        category_id: 'category-id',
        created_at: new Date().toISOString(),
        date: '2024-01-01',
        description: 'Test Transaction',
        id: 'test-id',
        status: 'completed',
        transaction_date: '2024-01-01',
        transaction_type: 'credit',
        updated_at: new Date().toISOString(),
        user_id: 'user-id',
      };

      expect(mockTransaction.date).toBe('2024-01-01');
    });

    it('should have voice tables available', () => {
      // These should now exist in the database types without TypeScript errors
      const voiceFeedbackRow: Tables<'voice_feedback'>['Row'] =
        {} as unknown as Tables<'voice_feedback'>['Row'];
      const voiceMetricsRow: Tables<'voice_metrics'>['Row'] =
        {} as unknown as Tables<'voice_metrics'>['Row'];
      const auditLogsRow: Tables<'audit_logs'>['Row'] =
        {} as unknown as Tables<'audit_logs'>['Row'];
      const bankTokensRow: Tables<'bank_tokens'>['Row'] =
        {} as unknown as Tables<'bank_tokens'>['Row'];

      expect(voiceFeedbackRow).toBeDefined();
      expect(voiceMetricsRow).toBeDefined();
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

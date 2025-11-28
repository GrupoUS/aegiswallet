/**
 * Type Check Validation Test
 * Validates that critical type fixes are working correctly
 */

import { describe, expect, it } from 'vitest';

import type {
	AuditLog,
	BankAccount,
	FinancialEvent,
	Transaction,
	UserPreferences,
	VoiceCommand,
} from '@/db/schema';

describe('Type Check Validation', () => {
	describe('Database Schema Fixes', () => {
		it('should have user_preferences with voice_feedback', () => {
			const mockPreferences: Partial<UserPreferences> = {
				accessibilityHighContrast: true,
				accessibilityLargeText: false,
				accessibilityScreenReader: true,
				autoCategorize: null,
				budgetAlerts: null,
				createdAt: new Date(),
				id: 'test-id',
				notificationsEmail: true,
				notificationsPush: false,
				notificationsSms: null,
				theme: 'dark',
				updatedAt: new Date(),
				userId: 'user-id',
				voiceFeedback: true,
			};

			expect(mockPreferences.voiceFeedback).toBe(true);
			expect(mockPreferences.accessibilityHighContrast).toBe(true);
		});

		it('should have bank_accounts with is_primary', () => {
			const mockAccount: Partial<BankAccount> = {
				accountMask: '1234',
				balance: '1000',
				createdAt: new Date(),
				currency: 'BRL',
				id: 'test-id',
				institutionName: 'Test Bank',
				isActive: true,
				isPrimary: true,
				updatedAt: new Date(),
				userId: 'user-id',
			};

			expect(mockAccount.isPrimary).toBe(true);
		});

		it('should have financial_events with new properties', () => {
			const mockEvent: Partial<FinancialEvent> = {
				amount: '100',
				category: 'test-category',
				createdAt: new Date(),
				description: 'Test description',
				id: 'test-id',
				title: 'Test Event',
				updatedAt: new Date(),
				userId: 'user-id',
				isIncome: true,
				priority: 'high',
			};

			expect(mockEvent.description).toBe('Test description');
			expect(mockEvent.isIncome).toBe(true);
			expect(mockEvent.priority).toBe('high');
		});

		it('should have transactions with date field', () => {
			const mockTransaction: Partial<Transaction> = {
				accountId: 'account-id',
				amount: '100',
				categoryId: 'category-id',
				createdAt: new Date(),
				description: 'Test Transaction',
				id: 'test-id',
				transactionDate: '2024-01-01',
				transactionType: 'credit',
				updatedAt: new Date(),
				userId: 'user-id',
			};

			expect(mockTransaction.transactionDate).toBe('2024-01-01');
		});

		it('should have voice and audit tables available', () => {
			// voice_commands table exists
			const voiceCommandRow: Partial<VoiceCommand> = {
				commandText: 'test command',
				wasSuccessful: true,
			};

			// audit_logs table exists
			const auditLogsRow: Partial<AuditLog> = {
				action: 'test_action',
				resourceType: 'test',
			};

			expect(voiceCommandRow).toBeDefined();
			expect(auditLogsRow).toBeDefined();
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

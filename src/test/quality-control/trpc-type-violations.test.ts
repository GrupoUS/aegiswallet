/**
 * RED PHASE: Failing tests to expose tRPC type violations
 * These tests will fail initially and drive the implementation of fixes
 */

import { describe, it, expect } from 'vitest'
import type { AppRouter } from '@/server/trpc'
import { createTRPCMsw } from 'msw-trpc'

describe('tRPC Type Safety Violations', () => {
  // Create MSW handlers for testing
  const trpcMsw = createTRPCMsw<AppRouter>()

  describe('Context Type Violations', () => {
    it('should have user property in context', () => {
      // This test exposes missing user property in context
      const mockContext = {
        session: {
          user: {
            id: 'user-id',
            email: 'test@example.com'
          }
        },
        supabase: {} as any
      }

      // @ts-expect-error - This should fail because ctx.user is missing in procedures
      const user = mockContext.user
      
      expect(user).toBeDefined()
      expect(user.id).toBe('user-id')
    })

    it('should properly access user context in procedures', () => {
      // This test exposes the issue where procedures try to access ctx.user
      // but it doesn't exist in the context type
      const mockProcedure = async ({ ctx }: { ctx: any }) => {
        // @ts-expect-error - This should fail because ctx.user is not typed
        if (!ctx.user) {
          throw new Error('User not found')
        }
        
        return ctx.user.id
      }

      const mockContext = {
        session: { user: { id: 'test-id' } },
        supabase: {} as any
      }

      expect(mockProcedure({ ctx: mockContext })).resolves.toBe('test-id')
    })
  })

  describe('Transaction Type Violations', () => {
    it('should accept period parameter in transaction summary', () => {
      // This test exposes invalid period parameter types
      const mockGetSummary = trpcMsw.transactions.getSummary.query
      
      // @ts-expect-error - This should fail because period expects specific values
      const result = mockGetSummary({ period: 'invalid-period' })
      
      expect(result).toBeDefined()
    })

    it('should handle infinite query return types correctly', () => {
      // This test exposes infinite query type mismatches
      const mockContactsQuery = trpcMsw.contacts.getAllInfinite.query
      
      // @ts-expect-error - This should fail because return structure is wrong
      const result = mockContactsQuery({ search: 'test' })
      
      expect(result.pages).toBeDefined()
      expect(result.pageParams).toBeDefined()
    })
  })

  describe('Voice Recognition Types', () => {
    it('should have proper voice command types', () => {
      // This test exposes missing voice command parameter types
      const mockVoiceCommand = trpcMsw.voice.processCommand.mutate
      
      // @ts-expect-error - This should fail because parameter structure is wrong
      const result = mockVoiceCommand({ 
        command: 'test command',
        invalidParam: 'should not exist'
      })
      
      expect(result).toBeDefined()
    })
  })

  describe('Bank Account Type Violations', () => {
    it('should handle bank account types correctly', () => {
      // This test exposes bank account type issues
      const mockBankAccount = trpcMsw.bankAccounts.create.mutate
      
      // @ts-expect-error - This should fail because date field is wrong
      const result = mockBankAccount({
        institution_name: 'Test Bank',
        account_mask: '1234',
        date: '2024-01-01' // Should be created_at
      })
      
      expect(result).toBeDefined()
    })
  })

  describe('Calendar Type Violations', () => {
    it('should require start and end dates for calendar queries', () => {
      // This test exposes calendar query parameter issues
      const mockCalendarQuery = trpcMsw.calendar.getEvents.query
      
      // @ts-expect-error - This should fail because startDate is required but undefined
      const result = mockCalendarQuery({
        startDate: undefined,
        endDate: '2024-01-31'
      })
      
      expect(result).toBeDefined()
    })
  })

  describe('User Profile Type Violations', () => {
    it('should include user_preferences in profile type', () => {
      // This test exposes missing user_preferences in profile
      const mockProfile = trpcMsw.profiles.get.query
      
      // @ts-expect-error - This should fail because user_preferences is missing
      const result = mockProfile()
      
      expect(result.user_preferences).toBeDefined()
    })
  })

  describe('Transaction Category Violations', () => {
    it('should handle category parameters correctly', () => {
      // This test exposes category type issues
      const mockTransactionCreate = trpcMsw.transactions.create.mutate
      
      // @ts-expect-error - This should fail because category is wrong type
      const result = mockTransactionCreate({
        description: 'Test transaction',
        amount: 100,
        category: 123, // Should be string
        date: '2024-01-01'
      })
      
      expect(result).toBeDefined()
    })
  })
})
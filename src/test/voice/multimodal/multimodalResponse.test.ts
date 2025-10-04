/**
 * Tests for Multimodal Response System
 *
 * Story: 01.03 - Respostas Multimodais
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMultimodalResponse } from '@/hooks/useMultimodalResponse'
import {
  formatCurrency,
  formatCurrencyForVoice,
  formatDate,
  formatPercentage,
  formatRelativeDate,
  numberToWords,
} from '@/lib/formatters/brazilianFormatters'
import { IntentType } from '@/lib/nlu/types'

describe('Brazilian Formatters', () => {
  describe('Currency Formatting', () => {
    it('should format currency with R$ symbol', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
      expect(formatCurrency(10)).toBe('R$ 10,00')
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00')
    })

    it('should format currency without symbol', () => {
      expect(formatCurrency(1234.56, { showSymbol: false })).toBe('1.234,56')
    })

    it('should format currency for voice', () => {
      expect(formatCurrencyForVoice(100)).toContain('cem reais')
      expect(formatCurrencyForVoice(1234.56)).toContain('mil duzentos')
      expect(formatCurrencyForVoice(0.5)).toContain('cinquenta centavos')
    })
  })

  describe('Date Formatting', () => {
    it('should format date as DD/MM/YYYY', () => {
      const date = new Date('2025-01-04')
      expect(formatDate(date)).toBe('04/01/2025')
    })

    it('should format relative dates', () => {
      const today = new Date()
      expect(formatRelativeDate(today)).toBe('hoje')

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(formatRelativeDate(tomorrow)).toBe('amanhã')

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatRelativeDate(yesterday)).toBe('ontem')
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers with Brazilian conventions', () => {
      expect(formatPercentage(12.5)).toBe('12,5%')
      expect(formatPercentage(100)).toBe('100,0%')
    })

    it('should convert numbers to words', () => {
      expect(numberToWords(0)).toBe('zero')
      expect(numberToWords(1)).toBe('um')
      expect(numberToWords(100)).toBe('cem')
      expect(numberToWords(1000)).toBe('mil')
    })
  })
})

describe('Multimodal Response Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CHECK_BALANCE Intent', () => {
    it('should generate balance response', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false, // Disable TTS for testing
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 5842.5,
          accountName: 'Conta Principal',
        })
      })

      expect(result.current.response).toBeDefined()
      expect(result.current.response?.text).toContain('R$ 5.842,50')
      expect(result.current.response?.visual.type).toBe('balance')
      expect(result.current.error).toBeNull()
    })

    it('should include accessibility labels', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 1000,
        })
      })

      expect(result.current.response?.accessibility.ariaLabel).toBeDefined()
      expect(result.current.response?.accessibility.screenReaderText).toBeDefined()
    })
  })

  describe('CHECK_BUDGET Intent', () => {
    it('should generate budget response with percentage', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BUDGET, {
          available: 1500,
          total: 3000,
          spent: 1500,
          period: 'mês',
        })
      })

      expect(result.current.response?.text).toContain('R$ 1.500,00')
      expect(result.current.response?.text).toContain('50,0%')
      expect(result.current.response?.visual.type).toBe('budget')
    })
  })

  describe('PAY_BILL Intent', () => {
    it('should generate confirmation request', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.PAY_BILL, {
          billName: 'Energia Elétrica',
          amount: 180.5,
          dueDate: new Date('2025-01-15'),
          confirmed: false,
        })
      })

      expect(result.current.response?.text).toContain('Confirmar')
      expect(result.current.response?.requiresConfirmation).toBe(true)
    })

    it('should generate confirmation response', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.PAY_BILL, {
          billName: 'Energia Elétrica',
          amount: 180.5,
          dueDate: new Date('2025-01-15'),
          confirmed: true,
        })
      })

      expect(result.current.response?.text).toContain('confirmado')
      expect(result.current.response?.requiresConfirmation).toBeUndefined()
    })
  })

  describe('Performance Tracking', () => {
    it('should track response time', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
          performanceTracking: true,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 1000,
        })
      })

      expect(result.current.metrics).toBeDefined()
      expect(result.current.metrics?.totalTime).toBeGreaterThan(0)
      expect(result.current.metrics?.success).toBe(true)
    })

    it('should meet <800ms performance target', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
          performanceTracking: true,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 1000,
        })
      })

      expect(result.current.metrics?.totalTime).toBeLessThan(800)
    })
  })

  describe('Text-Only Mode', () => {
    it('should work in text-only mode', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          textOnlyMode: true,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 1000,
        })
      })

      expect(result.current.response).toBeDefined()
      expect(result.current.isSpeaking).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        try {
          await result.current.generateAndSpeak(IntentType.UNKNOWN, {})
        } catch (error) {
          // Expected to fail
        }
      })

      expect(result.current.response?.visual.type).toBe('error')
    })
  })

  describe('Control Functions', () => {
    it('should clear response', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      await act(async () => {
        await result.current.generateAndSpeak(IntentType.CHECK_BALANCE, {
          balance: 1000,
        })
      })

      expect(result.current.response).toBeDefined()

      act(() => {
        result.current.clearResponse()
      })

      expect(result.current.response).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.metrics).toBeNull()
    })
  })

  describe('Loading States', () => {
    it('should set loading state during generation', async () => {
      const { result } = renderHook(() =>
        useMultimodalResponse({
          ttsEnabled: false,
        })
      )

      let loadingDuringGeneration = false

      act(() => {
        result.current
          .generateAndSpeak(IntentType.CHECK_BALANCE, {
            balance: 1000,
          })
          .then(() => {
            // Check if loading was true during generation
          })
      })

      // Check immediately after calling
      if (result.current.isLoading) {
        loadingDuringGeneration = true
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(loadingDuringGeneration).toBe(true)
    })
  })
})

describe('Response Templates', () => {
  describe('All Intents', () => {
    it('should generate responses for all 6 intents', async () => {
      const intents = [
        { intent: IntentType.CHECK_BALANCE, data: { balance: 1000 } },
        { intent: IntentType.CHECK_BUDGET, data: { available: 500, total: 1000, spent: 500 } },
        {
          intent: IntentType.PAY_BILL,
          data: { billName: 'Test', amount: 100, dueDate: new Date() },
        },
        {
          intent: IntentType.CHECK_INCOME,
          data: { nextIncome: { description: 'Salário', amount: 5000, date: new Date() } },
        },
        {
          intent: IntentType.FINANCIAL_PROJECTION,
          data: {
            projectedBalance: 1000,
            currentBalance: 800,
            period: 'mês',
            income: 5000,
            expenses: 4800,
          },
        },
        { intent: IntentType.TRANSFER_MONEY, data: { recipient: 'João', amount: 100 } },
      ]

      for (const { intent, data } of intents) {
        const { result } = renderHook(() =>
          useMultimodalResponse({
            ttsEnabled: false,
          })
        )

        await act(async () => {
          await result.current.generateAndSpeak(intent, data)
        })

        expect(result.current.response).toBeDefined()
        expect(result.current.response?.text).toBeTruthy()
        expect(result.current.response?.speech).toBeTruthy()
        expect(result.current.error).toBeNull()
      }
    })
  })
})

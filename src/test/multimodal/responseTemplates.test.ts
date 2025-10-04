/**
 * Response Templates Tests
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * @module test/multimodal/responseTemplates
 */

import { describe, expect, it } from 'vitest'
import {
  buildBalanceResponse,
  buildBillsResponse,
  buildBudgetResponse,
  buildConfirmationResponse,
  buildErrorResponse,
  buildIncomeResponse,
  buildMultimodalResponse,
  buildProjectionResponse,
  buildTransferResponse,
} from '@/lib/multimodal/responseTemplates'

describe('Response Templates', () => {
  describe('Balance Response', () => {
    it('should build complete balance response', () => {
      const response = buildBalanceResponse({
        currentBalance: 1500.5,
        income: 3000,
        expenses: 1500,
        accountType: 'corrente',
      })

      expect(response.voice).toContain('1500 reais')
      expect(response.text).toContain('R$ 1.500,50')
      expect(response.visual.type).toBe('balance')
      expect(response.visual.data.currentBalance).toBe(1500.5)
      expect(response.accessibility.ariaLabel).toBeDefined()
      expect(response.ssmlOptions?.emphasis).toBe('strong')
    })

    it('should handle simple balance without income/expenses', () => {
      const response = buildBalanceResponse({
        currentBalance: 500,
      })

      expect(response.voice).toContain('500 reais')
      expect(response.visual.data.income).toBeUndefined()
    })
  })

  describe('Budget Response', () => {
    it('should build budget response with percentage', () => {
      const response = buildBudgetResponse({
        available: 500,
        total: 1000,
        spent: 500,
        spentPercentage: 50,
        category: 'Alimentação',
      })

      expect(response.voice).toContain('500 reais')
      expect(response.voice).toContain('50%')
      expect(response.text).toContain('Alimentação')
      expect(response.visual.type).toBe('budget')
      expect(response.visual.data.spentPercentage).toBe(50)
    })

    it('should handle budget without category', () => {
      const response = buildBudgetResponse({
        available: 500,
        total: 1000,
        spent: 500,
        spentPercentage: 50,
      })

      expect(response.voice).toContain('orçamento')
      expect(response.text).not.toContain('(')
    })
  })

  describe('Bills Response', () => {
    it('should build bills response with multiple items', () => {
      const response = buildBillsResponse({
        bills: [
          { name: 'Energia', amount: 150, dueDate: '2024-01-15' },
          { name: 'Água', amount: 80, dueDate: '2024-01-20', isPastDue: true },
        ],
        totalAmount: 230,
      })

      expect(response.voice).toContain('2 contas')
      expect(response.voice).toContain('230 reais')
      expect(response.voice).toContain('vencida')
      expect(response.visual.type).toBe('bills')
      expect(response.visual.data.bills).toHaveLength(2)
      expect(response.ssmlOptions?.emphasis).toBe('strong') // Past due warning
    })

    it('should handle single bill', () => {
      const response = buildBillsResponse({
        bills: [{ name: 'Energia', amount: 150, dueDate: '2024-01-15' }],
        totalAmount: 150,
      })

      expect(response.voice).toContain('1 conta')
    })
  })

  describe('Income Response', () => {
    it('should build income response with next payment', () => {
      const response = buildIncomeResponse({
        incoming: [
          { source: 'Salário', amount: 5000, expectedDate: '2024-01-05', confirmed: true },
          { source: 'Freelance', amount: 1500, expectedDate: '2024-01-15' },
        ],
        totalExpected: 6500,
        nextIncome: {
          source: 'Salário',
          amount: 5000,
          date: '2024-01-05',
        },
      })

      expect(response.voice).toContain('6500 reais')
      expect(response.voice).toContain('Salário')
      expect(response.visual.type).toBe('incoming')
      expect(response.visual.data.nextIncome).toBeDefined()
    })
  })

  describe('Projection Response', () => {
    it('should build projection with positive variation', () => {
      const response = buildProjectionResponse({
        projectedBalance: 2000,
        currentBalance: 1500,
        expectedIncome: 3000,
        expectedExpenses: 2500,
        variation: 500,
        period: 'fim do mês',
      })

      expect(response.voice).toContain('2000 reais')
      expect(response.voice).toContain('positiva')
      expect(response.visual.type).toBe('projection')
    })

    it('should build projection with negative variation', () => {
      const response = buildProjectionResponse({
        projectedBalance: 1000,
        currentBalance: 1500,
        expectedIncome: 2000,
        expectedExpenses: 2500,
        variation: -500,
        period: 'fim do mês',
      })

      expect(response.voice).toContain('negativa')
    })
  })

  describe('Transfer Response', () => {
    it('should build pending transfer response', () => {
      const response = buildTransferResponse({
        recipient: 'João Silva',
        amount: 100,
        method: 'PIX',
        estimatedTime: 'Instantâneo',
        status: 'pending',
      })

      expect(response.voice).toContain('100 reais')
      expect(response.voice).toContain('João Silva')
      expect(response.voice).toContain('Confirme')
      expect(response.visual.type).toBe('transfer')
      expect(response.accessibility.role).toBe('alertdialog')
      expect(response.ssmlOptions?.emphasis).toBe('moderate')
    })

    it('should build completed transfer response', () => {
      const response = buildTransferResponse({
        recipient: 'Maria Santos',
        amount: 200,
        method: 'PIX',
        status: 'completed',
      })

      expect(response.voice).toContain('sucesso')
      expect(response.accessibility.role).toBe('status')
    })

    it('should build failed transfer response', () => {
      const response = buildTransferResponse({
        recipient: 'Pedro Costa',
        amount: 300,
        method: 'TED',
        status: 'failed',
      })

      expect(response.voice).toContain('Não foi possível')
    })
  })

  describe('Error Response', () => {
    it('should build error response', () => {
      const response = buildErrorResponse({
        message: 'Saldo insuficiente',
        code: 'INSUFFICIENT_FUNDS',
        details: 'Adicione fundos e tente novamente',
      })

      expect(response.voice).toContain('Saldo insuficiente')
      expect(response.voice).toContain('Adicione fundos')
      expect(response.visual.data.error).toBe(true)
      expect(response.accessibility.role).toBe('alert')
    })
  })

  describe('Confirmation Response', () => {
    it('should build confirmation request', () => {
      const response = buildConfirmationResponse({
        action: 'pagar a conta de energia',
        details: 'Valor: R$ 150,00',
        requiresConfirmation: true,
      })

      expect(response.voice).toContain('deseja')
      expect(response.voice).toContain('Confirme')
      expect(response.accessibility.role).toBe('alertdialog')
    })
  })

  describe('Factory Function', () => {
    it('should build response from intent type', () => {
      const response = buildMultimodalResponse('check_balance', {
        currentBalance: 1000,
      })

      expect(response.visual.type).toBe('balance')
      expect(response.voice).toContain('saldo')
    })

    it('should return error for unknown intent', () => {
      const response = buildMultimodalResponse('unknown_intent' as any, {})

      expect(response.visual.data.error).toBe(true)
      expect(response.voice).toContain('não reconhecido')
    })
  })

  describe('Accessibility', () => {
    it('should include ARIA labels for all responses', () => {
      const responses = [
        buildBalanceResponse({ currentBalance: 1000 }),
        buildBudgetResponse({ available: 500, total: 1000, spent: 500, spentPercentage: 50 }),
        buildBillsResponse({ bills: [], totalAmount: 0 }),
      ]

      responses.forEach((response) => {
        expect(response.accessibility.ariaLabel).toBeDefined()
        expect(response.accessibility.screenReaderText).toBeDefined()
      })
    })

    it('should set appropriate ARIA roles', () => {
      const alertResponse = buildErrorResponse({ message: 'Error' })
      expect(alertResponse.accessibility.role).toBe('alert')

      const confirmationResponse = buildConfirmationResponse({
        action: 'test',
        details: 'test',
        requiresConfirmation: true,
      })
      expect(confirmationResponse.accessibility.role).toBe('alertdialog')

      const balanceResponse = buildBalanceResponse({ currentBalance: 1000 })
      expect(balanceResponse.accessibility.role).toBe('status')
    })
  })
})

/**
 * Multimodal Response Templates for AegisWallet
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Templates for each voice command with:
 * - Voice output (natural speech)
 * - Text output (formatted)
 * - Visual data structure
 * - Accessibility labels
 *
 * @module multimodal/responseTemplates
 */

import {
  formatCurrency,
  formatCurrencyForVoice,
  formatDateForVoice,
  formatPercentage,
  pluralize,
} from '@/lib/formatters/brazilianFormatters';
import { IntentType } from '@/lib/nlu/types';

// ============================================================================
// Types
// ============================================================================

export interface MultimodalResponse {
  voice: string; // Natural speech text
  text: string; // Formatted text for display
  visual: {
    type: 'balance' | 'budget' | 'bills' | 'incoming' | 'projection' | 'transfer' | 'info';
    data: any;
  };
  accessibility: {
    ariaLabel: string;
    screenReaderText: string;
    role?: string;
  };
  ssmlOptions?: {
    emphasis?: 'strong' | 'moderate' | 'reduced';
    pauseDuration?: number;
  };
}

export interface ResponseData {
  intent: IntentType;
  entities: any[];
  contextData: any;
}

// ============================================================================
// Template Builders
// ============================================================================

/**
 * Build response for CHECK_BALANCE
 */
export function buildBalanceResponse(data: {
  currentBalance: number;
  income?: number;
  expenses?: number;
  accountType?: string;
}): MultimodalResponse {
  const { currentBalance, income, expenses, accountType } = data;

  if (typeof currentBalance !== 'number' || Number.isNaN(currentBalance)) {
    return {
      text: 'Saldo indisponível',
      voice: 'Saldo indisponível',
      visual: {
        type: 'balance',
        data: { balance: 0, income: 0, expenses: 0 },
        accessibility: 'Screen reader support available',
      },
    };
  }

  // Voice output (natural speech)
  const voiceParts = [
    `Seu saldo ${accountType ? `da conta ${accountType}` : 'atual'} é de`,
    formatCurrencyForVoice(currentBalance),
  ];

  if (income && expenses) {
    voiceParts.push(
      `Você recebeu ${formatCurrencyForVoice(income)} e gastou ${formatCurrencyForVoice(expenses)} este mês`
    );
  }

  const voice = voiceParts.join('. ');

  // Text output
  const text = `Saldo ${accountType ? `(${accountType})` : ''}: ${formatCurrency(currentBalance)}`;

  // Visual data
  const visual = {
    type: 'balance' as const,
    data: {
      currentBalance,
      income,
      expenses,
      accountType,
    },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Saldo atual: ${formatCurrency(currentBalance)}`,
    screenReaderText: voice,
    role: 'status',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
    ssmlOptions: {
      emphasis: 'strong',
      pauseDuration: 300,
    },
  };
}

/**
 * Build response for CHECK_BUDGET
 */
export function buildBudgetResponse(data: {
  available: number;
  total: number;
  spent: number;
  spentPercentage: number;
  category?: string;
}): MultimodalResponse {
  const { available, total, spent, spentPercentage, category } = data;

  // Voice output
  const safeSpentPercentage =
    typeof spentPercentage === 'number' && !Number.isNaN(spentPercentage) ? spentPercentage : 0;
  const categoryText = category ? `do orçamento de ${category}` : 'do seu orçamento';
  const voice = [
    `Você ainda pode gastar ${formatCurrencyForVoice(available)} ${categoryText}`,
    `Você já utilizou ${formatPercentage(safeSpentPercentage)} do limite`,
  ].join('. ');

  // Text output
  const percentageText =
    category && safeSpentPercentage > 0 ? ` (${formatPercentage(safeSpentPercentage)} usado)` : '';
  const text = `Orçamento ${category ? `(${category})` : ''}: ${formatCurrency(available)} disponíveis${percentageText}`;

  // Visual data
  const visual = {
    type: 'budget' as const,
    data: {
      available,
      total,
      spent,
      spentPercentage,
      category,
    },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Orçamento disponível: ${formatCurrency(available)}`,
    screenReaderText: voice,
    role: 'status',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
  };
}

/**
 * Build response for PAY_BILL
 */
export function buildBillsResponse(data: {
  bills: Array<{
    name: string;
    amount: number;
    dueDate: string;
    isPastDue?: boolean;
  }>;
  totalAmount: number;
}): MultimodalResponse {
  const { bills, totalAmount } = data;

  const safeBills = bills || [];
  const billCount = safeBills.length;
  const pastDue = safeBills.filter((b) => b.isPastDue).length;

  if (!Number.isFinite(totalAmount)) {
    return {
      text: 'Valores das contas indisponíveis',
      voice: 'Valores das contas indirecíveis',
      visual: {
        type: 'bills',
        data: { bills: [], totalAmount: 0, pastDueCount: 0 },
        accessibility: 'Screen reader available',
      },
    };
  }

  // Voice output
  const voiceParts = [
    `Você tem ${billCount} ${pluralize(billCount, 'conta')} para pagar`,
    `totalizando ${formatCurrencyForVoice(totalAmount)}`,
  ];

  if (pastDue > 0) {
    voiceParts.push(
      `Atenção: ${pastDue} ${pluralize(pastDue, 'conta está vencida', 'contas estão vencidas')}`
    );
  }

  const voice = voiceParts.join('. ');

  // Text output
  const text = `${billCount} ${pluralize(billCount, 'conta')} • Total: ${formatCurrency(totalAmount)}`;

  // Visual data
  const visual = {
    type: 'bills' as const,
    data: { bills, totalAmount, pastDue },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `${billCount} contas a pagar, total ${formatCurrency(totalAmount)}`,
    screenReaderText: voice,
    role: 'alert',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
    ssmlOptions: pastDue > 0 ? { emphasis: 'strong' } : undefined,
  };
}

/**
 * Build response for CHECK_INCOME
 */
export function buildIncomeResponse(data: {
  incoming: Array<{
    source: string;
    amount: number;
    expectedDate: string;
    confirmed?: boolean;
  }>;
  totalExpected: number;
  nextIncome?: {
    source: string;
    amount: number;
    date: string;
  };
}): MultimodalResponse {
  const { incoming, totalExpected, nextIncome } = data;

  // Voice output
  const voiceParts = [
    `Você tem ${formatCurrencyForVoice(totalExpected)} em recebimentos previstos`,
  ];

  if (nextIncome) {
    voiceParts.push(
      `O próximo é ${nextIncome.source}, ${formatCurrencyForVoice(nextIncome.amount)}, previsto para ${formatDateForVoice(nextIncome.date)}`
    );
  }

  const voice = voiceParts.join('. ');

  // Text output
  const text = `Recebimentos previstos: ${formatCurrency(totalExpected)}`;

  // Visual data
  const visual = {
    type: 'incoming' as const,
    data: { incoming, totalExpected, nextIncome },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Recebimentos previstos: ${formatCurrency(totalExpected)}`,
    screenReaderText: voice,
    role: 'status',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
  };
}

/**
 * Build response for FINANCIAL_PROJECTION
 */
export function buildProjectionResponse(data: {
  projectedBalance: number;
  currentBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  variation: number;
  period: string;
}): MultimodalResponse {
  const { projectedBalance, variation, period } = data;

  // Voice output
  const trendText = variation >= 0 ? 'positiva' : 'negativa';
  const voice = [
    `Sua projeção financeira para ${period} indica um saldo de ${formatCurrencyForVoice(projectedBalance)}`,
    `Com uma variação ${trendText} de ${formatCurrencyForVoice(Math.abs(variation))}`,
  ].join('. ');

  // Text output
  const text = `Projeção (${period}): ${formatCurrency(projectedBalance)}`;

  // Visual data
  const visual = {
    type: 'projection' as const,
    data,
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Projeção financeira: ${formatCurrency(projectedBalance)}`,
    screenReaderText: voice,
    role: 'status',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
  };
}

/**
 * Build response for TRANSFER_MONEY
 */
export function buildTransferResponse(data: {
  recipient: string;
  amount: number;
  method: string;
  estimatedTime?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}): MultimodalResponse {
  const { recipient, amount, method, estimatedTime, status } = data;

  // Voice output
  const voiceParts = [];

  switch (status) {
    case 'pending':
      voiceParts.push(
        `Transferência de ${formatCurrencyForVoice(amount)} para ${recipient} via ${method}`
      );
      if (estimatedTime) {
        voiceParts.push(`Tempo estimado: ${estimatedTime}`);
      }
      voiceParts.push('Confirme para prosseguir');
      break;
    case 'processing':
      voiceParts.push(`Processando transferência de ${formatCurrencyForVoice(amount)}`);
      break;
    case 'completed':
      voiceParts.push(
        `Transferência de ${formatCurrencyForVoice(amount)} para ${recipient} realizada com sucesso`
      );
      break;
    case 'failed':
      voiceParts.push(`Não foi possível completar a transferência. Tente novamente`);
      break;
  }

  const voice = voiceParts.join('. ');

  // Text output
  const text = `Transferência: ${formatCurrency(amount)} → ${recipient}`;

  // Visual data
  const visual = {
    type: 'transfer' as const,
    data,
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Transferência de ${formatCurrency(amount)} para ${recipient}`,
    screenReaderText: voice,
    role: status === 'pending' ? 'alertdialog' : 'status',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
    ssmlOptions: status === 'pending' ? { emphasis: 'moderate', pauseDuration: 500 } : undefined,
  };
}

/**
 * Build error response
 */
export function buildErrorResponse(error: {
  message: string;
  code?: string;
  details?: string;
}): MultimodalResponse {
  const { message, details } = error;

  // Voice output
  const voice = details ? `${message}. ${details}` : message;

  // Text output
  const text = message;

  // Visual data
  const visual = {
    type: 'info' as const,
    data: { error: true, message, details },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Erro: ${message}`,
    screenReaderText: voice,
    role: 'alert',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
    ssmlOptions: {
      emphasis: 'moderate',
    },
  };
}

/**
 * Build confirmation request response
 */
export function buildConfirmationResponse(data: {
  action: string;
  details: string;
  requiresConfirmation: boolean;
}): MultimodalResponse {
  const { action, details } = data;

  // Voice output
  const voice = `Você deseja ${action}? ${details}. Confirme para prosseguir`;

  // Text output
  const text = `Confirmação necessária: ${action}`;

  // Visual data
  const visual = {
    type: 'info' as const,
    data: { ...data, type: 'confirmation' },
  };

  // Accessibility
  const accessibility = {
    ariaLabel: `Confirmação necessária: ${action}`,
    screenReaderText: voice,
    role: 'alertdialog',
  };

  return {
    voice,
    text,
    visual,
    accessibility,
    ssmlOptions: {
      emphasis: 'moderate',
      pauseDuration: 500,
    },
  };
}

// ============================================================================
// Response Builder Factory
// ============================================================================

export const responseBuilders = {
  check_balance: buildBalanceResponse,
  check_budget: buildBudgetResponse,
  pay_bill: buildBillsResponse,
  check_income: buildIncomeResponse,
  financial_projection: buildProjectionResponse,
  transfer_money: buildTransferResponse,
  unknown: buildErrorResponse,
  error: buildErrorResponse,
  confirmation: buildConfirmationResponse,
};

/**
 * Build multimodal response based on intent
 */
export function buildMultimodalResponse(
  intent: IntentType | 'error' | 'confirmation',
  data: any
): MultimodalResponse {
  const intentKey = intent === IntentType.UNKNOWN ? 'unknown' : intent;
  const builder = responseBuilders[intentKey];

  if (!builder) {
    return buildErrorResponse({
      message: 'Comando não reconhecido',
      details: 'Tente novamente com um comando conhecido',
    });
  }

  // Map common prop names to expected names
  const mappedData =
    intent === IntentType.CHECK_BALANCE && data.balance !== undefined
      ? { ...data, currentBalance: data.balance }
      : intent === IntentType.PAY_BILL && data.billName && data.amount
        ? {
            ...data,
            bills: [
              {
                name: data.billName,
                amount: data.amount,
                dueDate: data.dueDate,
                isPastDue: false,
              },
            ],
            totalAmount: data.amount,
          }
        : intent === IntentType.CHECK_BUDGET && data.available !== undefined
          ? {
              ...data,
              spentPercentage:
                data.total && data.spent !== undefined ? (data.spent / data.total) * 100 : 0,
            }
          : data;

  return builder(mappedData);
}

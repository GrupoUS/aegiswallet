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
    type:
      | 'balance'
      | 'budget'
      | 'bills'
      | 'incoming'
      | 'projection'
      | 'transfer'
      | 'info'
      | 'error'
      | 'confirmation';
    data: Record<string, unknown>;
  };
  accessibility?: {
    'aria-label': string;
    'aria-live'?: 'polite' | 'assertive' | 'off';
    role?: string;
  };
  ssmlOptions?: {
    emphasis?: 'strong' | 'moderate' | 'reduced';
    pauseDuration?: number;
  };
  requiresConfirmation?: boolean;
}

export interface ResponseData {
  intent: IntentType;
  entities: unknown[];
  contextData: Record<string, unknown>;
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
      accessibility: {
        'aria-label': 'Saldo indisponível',
        'aria-live': 'polite' as const,
        role: 'status',
      },
      text: 'Saldo indisponível',
      visual: {
        data: { balance: 0, expenses: 0, income: 0 },
        type: 'balance',
      },
      voice: 'Saldo indisponível',
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
    data: {
      accountType,
      currentBalance,
      expenses,
      income,
    },
    type: 'balance' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Saldo atual: ${formatCurrency(currentBalance)}`,
    'aria-live': 'polite' as const,
    role: 'status',
  };

  return {
    accessibility,
    ssmlOptions: {
      emphasis: 'strong',
      pauseDuration: 300,
    },
    text,
    visual,
    voice,
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

  // Voice output - handle invalid types safely
  const safeSpentPercentage =
    typeof spentPercentage === 'number' && !Number.isNaN(spentPercentage) ? spentPercentage : 0;
  const safeAvailable = typeof available === 'number' && !Number.isNaN(available) ? available : 0;
  const safeTotal = typeof total === 'number' && !Number.isNaN(total) ? total : 0;
  const safeSpent = typeof spent === 'number' && !Number.isNaN(spent) ? spent : 0;

  const categoryText = category ? `do orçamento de ${category}` : 'do seu orçamento';
  const voice = [
    `Você ainda pode gastar ${formatCurrencyForVoice(safeAvailable)} ${categoryText}`,
    `Você já utilizou ${formatPercentage(safeSpentPercentage)} do limite`,
  ].join('. ');

  // Text output
  const percentageText =
    safeSpentPercentage > 0 ? ` (${formatPercentage(safeSpentPercentage)} usado)` : '';
  const text = `Orçamento ${category ? `(${category})` : ''}: ${formatCurrency(safeAvailable)} disponíveis${percentageText}`;

  // Visual data - ensure safe values for display
  const visual = {
    data: {
      available: safeAvailable,
      category,
      spent: safeSpent,
      spentPercentage: safeSpentPercentage,
      total: safeTotal,
    },
    type: 'budget' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Orçamento disponível: ${formatCurrency(available)}`,
    'aria-live': 'polite' as const,
    role: 'status' as const,
  };

  return {
    accessibility,
    text,
    visual,
    voice,
  };
}

/**
 * Build response for PAY_BILL
 */
export function buildBillsResponse(data: {
  bills: {
    name: string;
    amount: number;
    dueDate: string;
    isPastDue?: boolean;
  }[];
  totalAmount: number;
}): MultimodalResponse {
  const { bills, totalAmount } = data;

  const safeBills = bills || [];
  const billCount = safeBills.length;
  const pastDue = safeBills.filter((b) => b.isPastDue).length;

  if (!Number.isFinite(totalAmount)) {
    return {
      accessibility: {
        'aria-label': 'Valores das contas indisponíveis',
        'aria-live': 'polite',
      },
      text: 'Valores das contas indisponíveis',
      visual: {
        data: { bills: [], pastDueCount: 0, totalAmount: 0 },
        type: 'bills',
      },
      voice: 'Valores das contas indirecíveis',
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
    data: { bills, pastDue, totalAmount },
    type: 'bills' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `${billCount} contas a pagar, total ${formatCurrency(totalAmount)}`,
    'aria-live': 'assertive' as const,
    role: 'alert' as const,
  };

  return {
    accessibility,
    ssmlOptions: pastDue > 0 ? { emphasis: 'strong' } : undefined,
    text,
    visual,
    voice,
  };
}

/**
 * Build response for CHECK_INCOME
 */
export function buildIncomeResponse(data: {
  incoming: {
    source: string;
    amount: number;
    expectedDate: string;
    confirmed?: boolean;
  }[];
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
    data: { incoming, nextIncome, totalExpected },
    type: 'incoming' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Recebimentos previstos: ${formatCurrency(totalExpected)}`,
    'aria-live': 'polite' as const,
    role: 'status' as const,
  };

  return {
    accessibility,
    ssmlOptions: {
      emphasis: 'moderate',
      pauseDuration: 500,
    },
    text,
    visual,
    voice,
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
    data,
    type: 'projection' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Projeção financeira: ${formatCurrency(projectedBalance)}`,
    'aria-live': 'polite' as const,
    role: 'status' as const,
  };

  return {
    accessibility,
    ssmlOptions: {
      emphasis: 'strong',
      pauseDuration: 300,
    },
    text,
    visual,
    voice,
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
    data,
    type: 'transfer' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Transferência de ${formatCurrency(amount)} para ${recipient}`,
    'aria-live': status === 'pending' ? ('assertive' as const) : ('polite' as const),
    role: status === 'pending' ? ('alertdialog' as const) : ('status' as const),
  };

  return {
    accessibility,
    ssmlOptions: status === 'pending' ? { emphasis: 'moderate', pauseDuration: 500 } : undefined,
    text,
    visual,
    voice,
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
    data: { details, error: true, message },
    type: 'error' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Erro: ${message}`,
    'aria-live': 'assertive' as const,
    role: 'alert' as const,
  };

  return {
    accessibility,
    ssmlOptions: {
      emphasis: 'moderate',
    },
    text,
    visual,
    voice,
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
    data: { ...data, type: 'confirmation' },
    type: 'confirmation' as const,
  };

  // Accessibility
  const accessibility = {
    'aria-label': `Confirmação necessária: ${action}`,
    'aria-live': 'assertive' as const,
    role: 'alertdialog' as const,
  };

  return {
    accessibility,
    requiresConfirmation: true,
    ssmlOptions: {
      emphasis: 'moderate',
      pauseDuration: 500,
    },
    text,
    visual,
    voice,
  };
}

// ============================================================================
// Response Builder Factory
// ============================================================================

export const responseBuilders = {
  [IntentType.CHECK_BALANCE]: buildBalanceResponse,
  [IntentType.CHECK_BUDGET]: buildBudgetResponse,
  [IntentType.PAY_BILL]: buildBillsResponse,
  [IntentType.CHECK_INCOME]: buildIncomeResponse,
  [IntentType.FINANCIAL_PROJECTION]: buildProjectionResponse,
  [IntentType.TRANSFER_MONEY]: buildTransferResponse,
  [IntentType.UNKNOWN]: buildErrorResponse,
  error: buildErrorResponse,
  confirmation: buildConfirmationResponse,
} as const;

/**
 * Build multimodal response based on intent
 */
export function buildMultimodalResponse(
  intent: IntentType | 'error' | 'confirmation',
  data: Record<string, unknown>
): MultimodalResponse {
  const intentKey = intent === IntentType.UNKNOWN ? 'unknown' : intent;

  // Special handling for PAY_BILL confirmation
  if (intent === IntentType.PAY_BILL && data.confirmed === false) {
    return buildConfirmationResponse({
      action: 'Confirmar pagamento',
      details: `${data.billName || 'Conta'} de ${formatCurrency(data.amount || 0)}`,
      requiresConfirmation: true,
    });
  }

  if (intent === IntentType.PAY_BILL && data.confirmed === true) {
    const billName = data.billName || data.bills?.[0]?.name || 'Conta';
    const amount =
      data.amount ??
      data.totalAmount ??
      (Array.isArray(data.bills) && data.bills[0]?.amount ? data.bills[0].amount : 0);

    return {
      accessibility: {
        'aria-label': `Pagamento confirmado de ${formatCurrency(amount)}`,
        'aria-live': 'assertive',
        role: 'status',
      },
      requiresConfirmation: false,
      text: `Pagamento confirmado: ${formatCurrency(amount)}`,
      visual: {
        data: {
          ...data,
          bills: data.bills ?? [
            {
              amount,
              dueDate: data.dueDate,
              isPastDue: false,
              name: billName,
            },
          ],
          totalAmount: amount,
          confirmed: true,
        },
        type: 'bills',
      },
      voice: `Pagamento confirmado de ${formatCurrencyForVoice(amount)} para ${billName}`,
    };
  }

  const builder = responseBuilders[intentKey as keyof typeof responseBuilders];

  if (!builder) {
    return buildErrorResponse({
      details: 'Tente novamente com um comando conhecido',
      message: 'Comando não reconhecido',
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
                amount: data.amount,
                dueDate: data.dueDate,
                isPastDue: false,
                name: data.billName,
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
          : intent === IntentType.FINANCIAL_PROJECTION && data.projectedBalance !== undefined
            ? {
                ...data,
                expectedIncome: data.income ?? data.expectedIncome ?? data.currentBalance ?? 0,
                expectedExpenses: data.expenses ?? data.expectedExpenses ?? 0,
                variation:
                  data.variation ??
                  (data.projectedBalance !== undefined && data.currentBalance !== undefined
                    ? data.projectedBalance - data.currentBalance
                    : 0),
              }
            : intent === IntentType.CHECK_INCOME && data.nextIncome
              ? {
                  ...data,
                  incoming: data.incoming ?? [
                    {
                      amount: data.nextIncome.amount ?? 0,
                      confirmed: data.nextIncome.confirmed ?? false,
                      expectedDate:
                        typeof data.nextIncome.date === 'string'
                          ? data.nextIncome.date
                          : (data.nextIncome.date?.toISOString?.() ?? ''),
                      source: data.nextIncome.description || data.nextIncome.source || 'Receita',
                    },
                  ],
                  totalExpected:
                    data.totalExpected ?? data.nextIncome.amount ?? data.incoming?.[0]?.amount ?? 0,
                }
              : data;

  const response = builder(mappedData);

  if (!response.accessibility) {
    return {
      ...response,
      accessibility: {
        'aria-label': response.text || 'Resposta gerada',
        'aria-live': 'polite',
        role: 'status',
      },
    };
  }

  return response;
}

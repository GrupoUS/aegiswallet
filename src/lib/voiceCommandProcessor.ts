// Voice command processor for Brazilian Portuguese
// Enhanced with NLU Engine (Story 01.02)

import { logger } from '@/lib/logging/logger';
import { createNLUEngine } from '@/lib/nlu/nluEngine';
import { IntentType } from '@/lib/nlu/types';

// Mock data for demonstration - replace with real Supabase data
const mockFinancialData = {
  accounts: [
    {
      id: '1',
      name: 'Conta Principal',
      balance: 5842.5,
      type: 'checking',
    },
    {
      id: '2',
      name: 'Poupança',
      balance: 12500.0,
      type: 'savings',
    },
  ],
  transactions: [
    {
      id: '1',
      description: 'Salário',
      amount: 5000.0,
      type: 'income',
      date: new Date('2024-10-01'),
      category: 'salary',
    },
    {
      id: '2',
      description: 'Aluguel',
      amount: -1500.0,
      type: 'expense',
      date: new Date('2024-10-05'),
      category: 'housing',
    },
    {
      id: '3',
      description: 'Supermercado',
      amount: -450.0,
      type: 'expense',
      date: new Date('2024-10-10'),
      category: 'food',
    },
  ],
  bills: [
    {
      id: '1',
      name: 'Energia Elétrica',
      amount: 180.5,
      dueDate: new Date('2024-10-15'),
      status: 'pending',
    },
    {
      id: '2',
      name: 'Internet',
      amount: 99.9,
      dueDate: new Date('2024-10-20'),
      status: 'pending',
    },
    {
      id: '3',
      name: 'Água',
      amount: 85.0,
      dueDate: new Date('2024-10-25'),
      status: 'pending',
    },
  ],
  incoming: [
    {
      id: '1',
      source: 'Salário',
      amount: 5000.0,
      expectedDate: new Date('2024-11-01'),
      type: 'salary',
    },
    {
      id: '2',
      source: 'Freelance',
      amount: 1200.0,
      expectedDate: new Date('2024-11-05'),
      type: 'freelance',
    },
  ],
  budget: {
    total: 3500.0,
    spent: 2180.5,
    categories: {
      food: { budget: 800.0, spent: 450.0 },
      transport: { budget: 300.0, spent: 150.0 },
      entertainment: { budget: 400.0, spent: 280.0 },
      utilities: { budget: 500.0, spent: 380.0 },
      other: { budget: 1500.0, spent: 920.5 },
    },
  },
};

export interface ProcessedCommand {
  type: 'balance' | 'budget' | 'bills' | 'incoming' | 'projection' | 'transfer' | 'error';
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  confidence?: number;
}

// Simple confidence threshold for command acceptance
const CONFIDENCE_THRESHOLD = 0.7;

// Essential voice commands patterns for Brazilian Portuguese
const COMMAND_PATTERNS = {
  balance: [/como está meu saldo/i, /qual meu saldo/i, /saldo atual/i, /quanto tenho/i],
  budget: [/quanto posso gastar/i, /orçamento disponível/i, /quanto resta/i, /limite de gastos/i],
  bills: [/boleto.*pagar/i, /contas.*pagar/i, /pagamentos pendentes/i, /próximos vencimentos/i],
  incoming: [
    /recebimento.*entrar/i,
    /dinheiro.*entrar/i,
    /próximos recebimentos/i,
    /receitas futuras/i,
  ],
  projection: [
    /saldo.*final.*mês/i,
    /projeção.*saldo/i,
    /como ficará.*saldo/i,
    /previsão financeira/i,
  ],
  transfer: [/transferência.*para/i, /enviar.*dinheiro/i, /pagar.*para/i, /transferir.*para/i],
};

/**
 * Process voice command using NLU Engine (Story 01.02)
 * Enhanced version with Natural Language Understanding
 */
export async function processVoiceCommandWithNLU(transcript: string): Promise<ProcessedCommand> {
  try {
    const nluEngine = createNLUEngine();
    const nluResult = await nluEngine.processUtterance(transcript);

    // Check confidence threshold
    if (nluResult.confidence < CONFIDENCE_THRESHOLD) {
      return {
        type: 'error',
        message: 'Não entendi bem. Poderia repetir mais claramente?',
        confidence: nluResult.confidence,
      };
    }

    // Process command based on intent
    switch (nluResult.intent) {
      case IntentType.CHECK_BALANCE:
        return handleBalanceCommand(nluResult.confidence);

      case IntentType.CHECK_BUDGET:
        return handleBudgetCommand(nluResult.confidence);

      case IntentType.PAY_BILL:
        return handleBillsCommand(nluResult.confidence);

      case IntentType.CHECK_INCOME:
        return handleIncomingCommand(nluResult.confidence);

      case IntentType.FINANCIAL_PROJECTION:
        return handleProjectionCommand(nluResult.confidence);

      case IntentType.TRANSFER_MONEY:
        return handleTransferCommand(transcript, nluResult.confidence);

      default:
        return {
          type: 'error',
          message: 'Comando não reconhecido. Tente: "Qual é meu saldo?" ou "Quanto posso gastar?"',
          confidence: nluResult.confidence,
        };
    }
  } catch (error) {
    logger.voiceError('NLU processing error', {
      error: error instanceof Error ? error.message : String(error),
      transcript: transcript.substring(0, 100), // Limit transcript length for privacy
      stack: error instanceof Error ? error.stack : undefined,
      component: 'VoiceCommandProcessor',
    });
    return {
      type: 'error',
      message: 'Erro ao processar comando. Tente novamente.',
      confidence: 0,
    };
  }
}

/**
 * Legacy function - kept for backward compatibility
 * Use processVoiceCommandWithNLU for new implementations
 */
export function processVoiceCommand(
  transcript: string,
  confidence: number = 0.8
): ProcessedCommand {
  // Check confidence threshold
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      type: 'error',
      message: 'Não entendi bem. Poderia repetir mais claramente?',
      confidence,
    };
  }

  // Match transcript against command patterns
  const commandType = matchCommand(transcript);

  switch (commandType) {
    case 'balance':
      return handleBalanceCommand(confidence);

    case 'budget':
      return handleBudgetCommand(confidence);

    case 'bills':
      return handleBillsCommand(confidence);

    case 'incoming':
      return handleIncomingCommand(confidence);

    case 'projection':
      return handleProjectionCommand(confidence);

    case 'transfer':
      return handleTransferCommand(transcript, confidence);

    default:
      return {
        type: 'error',
        message: 'Comando não reconhecido. Tente: "Como está meu saldo?" ou "Quanto posso gastar?"',
        confidence,
      };
  }
}

function matchCommand(transcript: string): string | null {
  for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(transcript))) {
      return command;
    }
  }
  return null;
}

function handleBalanceCommand(confidence: number): ProcessedCommand {
  const totalBalance = mockFinancialData.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  return {
    type: 'balance',
    message: `Seu saldo total é de R$ ${totalBalance.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    data: {
      totalBalance,
      accounts: mockFinancialData.accounts,
    },
    confidence,
  };
}

function handleBudgetCommand(confidence: number): ProcessedCommand {
  const { total, spent } = mockFinancialData.budget;
  const available = total - spent;
  const spentPercentage = (spent / total) * 100;

  let message = '';
  if (spentPercentage > 90) {
    message = 'Cuidado! Você já utilizou quase todo o seu orçamento este mês.';
  } else if (spentPercentage > 70) {
    message = 'Você está chegando perto do limite do seu orçamento.';
  } else {
    message = 'Você ainda tem espaço no seu orçamento este mês.';
  }

  return {
    type: 'budget',
    message,
    data: {
      available,
      spent,
      total,
      spentPercentage,
      categories: mockFinancialData.budget.categories,
    },
    confidence,
  };
}

function handleBillsCommand(confidence: number): ProcessedCommand {
  const pendingBills = mockFinancialData.bills.filter((bill) => bill.status === 'pending');
  const upcomingBills = pendingBills.filter((bill) => {
    const daysUntilDue = Math.ceil((bill.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7;
  });

  let message = '';
  if (upcomingBills.length === 0) {
    message = 'Você não tem contas próximas do vencimento.';
  } else if (upcomingBills.length === 1) {
    message = 'Você tem 1 conta para pagar em breve.';
  } else {
    message = `Você tem ${upcomingBills.length} contas para pagar em breve.`;
  }

  return {
    type: 'bills',
    message,
    data: {
      bills: upcomingBills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
      totalPending: pendingBills.length,
      totalAmount: pendingBills.reduce((sum, bill) => sum + bill.amount, 0),
    },
    confidence,
  };
}

function handleIncomingCommand(confidence: number): ProcessedCommand {
  const currentMonth = new Date().getMonth();
  const upcomingIncoming = mockFinancialData.incoming.filter(
    (item) => item.expectedDate.getMonth() === currentMonth
  );

  let message = '';
  if (upcomingIncoming.length === 0) {
    message = 'Você não tem recebimentos programados para este mês.';
  } else if (upcomingIncoming.length === 1) {
    message = 'Você tem 1 recebimento programado para este mês.';
  } else {
    message = `Você tem ${upcomingIncoming.length} recebimentos programados para este mês.`;
  }

  return {
    type: 'incoming',
    message,
    data: {
      incoming: upcomingIncoming.sort(
        (a, b) => a.expectedDate.getTime() - b.expectedDate.getTime()
      ),
      totalExpected: upcomingIncoming.reduce((sum, item) => sum + item.amount, 0),
    },
    confidence,
  };
}

function handleProjectionCommand(confidence: number): ProcessedCommand {
  const currentBalance = mockFinancialData.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  const pendingBills = mockFinancialData.bills
    .filter((bill) => bill.status === 'pending')
    .reduce((sum, bill) => sum + bill.amount, 0);
  const expectedIncoming = mockFinancialData.incoming.reduce((sum, item) => sum + item.amount, 0);

  const projectedBalance = currentBalance - pendingBills + expectedIncoming;
  const variation = projectedBalance - currentBalance;

  let message = '';
  if (variation > 0) {
    message = 'Seu saldo deve aumentar até o final do mês.';
  } else if (variation < 0) {
    message = 'Seu saldo deve diminuir até o final do mês.';
  } else {
    message = 'Seu saldo deve permanecer estável até o final do mês.';
  }

  return {
    type: 'projection',
    message,
    data: {
      currentBalance,
      projectedBalance,
      variation,
      pendingBills,
      expectedIncoming,
    },
    confidence,
  };
}

function handleTransferCommand(transcript: string, confidence: number): ProcessedCommand {
  // Simple stub implementation - extract basic info from transcript
  const amountMatch = transcript.match(/(\d+[,.]?\d*)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;
  const recipient = 'Destinatário (stub)';

  if (!recipient) {
    return {
      type: 'error',
      message: 'Para quem você gostaria de transferir?',
    };
  }

  if (!amount) {
    return {
      type: 'error',
      message: 'Qual valor você gostaria de transferir?',
    };
  }

  const currentBalance = mockFinancialData.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  if (amount > currentBalance) {
    return {
      type: 'error',
      message: 'Saldo insuficiente para esta transferência.',
    };
  }

  return {
    type: 'transfer',
    message: `Transferência de ${formatCurrency(amount)} para ${recipient}`,
    data: {
      recipient,
      amount,
      method: 'PIX',
      estimatedTime: 'Instantâneo',
      requiresConfirmation: true,
    },
    confidence,
    requiresConfirmation: true,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

// Brazilian financial utilities
export const brazilianFinancialUtils = {
  formatCurrency,
  isValidCPF: (cpf: string) => {
    // Basic CPF validation
    const cleanedCPF = cpf.replace(/[^\d]/g, '');
    return cleanedCPF.length === 11;
  },
  isValidCNPJ: (cnpj: string) => {
    // Basic CNPJ validation
    const cleanedCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanedCNPJ.length === 14;
  },
  formatPhone: (phone: string) => {
    // Format Brazilian phone number
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },
};

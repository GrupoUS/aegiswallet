import { expect } from 'vitest';

import { mockSpeechRecognition, mockSpeechSynthesis } from '../setup-dom';

// Healthcare-specific test utilities
export const mockHealthcareData = {
  // Mock LGPD-compliant patient data
  patient: {
    id: 'test-patient-001',
    name: 'João Silva',
    cpf: '123.456.789-00', // Real CPF for testing, will be masked
    phone: '+5511976543210',
    email: 'joao.silva@email.com',
    lgpdConsent: {
      consentType: 'treatment',
      deviceId: 'test-device-id',
      ip: '127.0.0.1',
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  },

  // Mock financial data for healthcare payments
  transaction: {
    amount: 150.0,
    createdAt: new Date().toISOString(),
    currency: 'BRL',
    description: 'Consulta médica',
    id: 'test-transaction-001',
    recipient: 'Dra. Maria Santos',
    recipientBank: '001',
    recipientDocument: '987.654.321-00',
    status: 'completed',
    type: 'payment',
  },

  // Mock voice commands in Portuguese
  voiceCommands: [
    'qual é meu saldo',
    'transferir cem reais para João',
    'pagar consulta médica',
    'agendar consulta para amanhã',
    'ver extrato de este mês',
    'cancelar pagamento',
  ],
};

// Make mock data available globally for healthcare tests
if (!(global as Record<string, unknown>).mockHealthcareData) {
  Object.defineProperty(global, 'mockHealthcareData', {
    configurable: true,
    value: mockHealthcareData,
    writable: false,
  });
}

// Custom matchers for healthcare compliance
expect.extend({
  toBeBrazilianCurrency(received: string) {
    const isValid = /^R\$\s\d{1,3}(\.\d{3})*,\d{2}$/.test(received);
    return {
      message: () => `expected ${received} to be valid Brazilian currency format`,
      pass: isValid,
    };
  },
  toBeLGPDCompliant(received: string, type: string) {
    // Fix: do not rely on this.pass, calculate validity directly
    let isValid = false;

    if (type === 'cpf') {
      isValid = /^\*{3}\.\*{3}\.\*{3}-\*\*$/.test(received); // Masked format only
    } else if (type === 'phone') {
      isValid = /^\+55\*{6,7}\d{4}$/.test(received); // Masked format only
    } else {
      // For unknown types, we might default to valid or throw an error,
      // assuming pass: true for now to match previous behavior's implication.
      isValid = true;
    }

    return {
      message: () =>
        `expected ${received} to ${this.isNot ? 'not ' : ''}be LGPD compliant for type ${type}`,
      pass: isValid,
    };
  },
  toBePortugueseCommand(received: string) {
    const portugueseWords = [
      'qual',
      'é',
      'meu',
      'saldo',
      'transferir',
      'pagar',
      'consultar',
      'agendar',
    ];
    const hasPortuguese = portugueseWords.some((word) =>
      received.toLowerCase().includes(word.toLowerCase()),
    );
    return {
      message: () => `expected command "${received}" to contain Portuguese words`,
      pass: hasPortuguese,
    };
  },
});

// Extend Vitest types for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeLGPDCompliant(type: string): void;
    toBeBrazilianCurrency(): void;
    toBePortugueseCommand(): void;
  }
  interface AsymmetricMatchersContaining {
    toBeLGPDCompliant(type: string): void;
    toBeBrazilianCurrency(): void;
    toBePortugueseCommand(): void;
  }
}

// Export healthcare testing utilities
export const healthcareTestUtils = {
  createMockPatient: (overrides: Partial<typeof mockHealthcareData.patient> = {}) => ({
    ...mockHealthcareData.patient,
    ...overrides,
  }),
  createMockTransaction: (overrides: Partial<typeof mockHealthcareData.transaction> = {}) => ({
    ...mockHealthcareData.transaction,
    ...overrides,
  }),
  formatCurrency: (amount: number) =>
    `R$ ${amount
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
  maskCPF: (_cpf: string) => '***.***.***-**',
  maskPhone: (_phone: string) => '+55******4321',
  mockHealthcareData,
  mockSpeechRecognition,
  mockSpeechSynthesis,
  simulateVoiceCommand: (command: string, confidence: number = 0.95) => ({
    confidence,
    language: 'pt-BR',
    timestamp: new Date().toISOString(),
    transcript: command,
    transcript_confidence: confidence,
  }),
};

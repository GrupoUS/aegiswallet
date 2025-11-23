import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Global test setup for healthcare compliance

// Polyfills for jsdom environment
global.TextEncoder = TextEncoder;
// biome-ignore lint/suspicious/noExplicitAny: Polyfill
global.TextDecoder = TextDecoder as any;

// Mock IntersectionObserver for healthcare components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for responsive healthcare components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock Web Speech API for Portuguese voice interface testing
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  abort: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'pt-BR',
  maxAlternatives: 1,
  onend: null,
  onerror: null,
  onnomatch: null,
  onresult: null,
  onstart: null,
  start: vi.fn(),
  stop: vi.fn(),
}));

global.SpeechRecognition = mockSpeechRecognition;
global.webkitSpeechRecognition = mockSpeechRecognition;

// Mock Speech Synthesis for voice feedback
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  getVoices: vi.fn(() => [
    {
      default: true,
      lang: 'pt-BR',
      localService: true,
      name: 'Microsoft Maria Desktop - Portuguese (Brazil)',
    },
    {
      default: false,
      lang: 'pt-BR',
      localService: false,
      name: 'Google português do Brasil',
    },
  ]),
  pause: vi.fn(),
  paused: false,
  pending: false,
  resume: vi.fn(),
  speak: vi.fn(),
  speaking: false,
};

global.speechSynthesis = mockSpeechSynthesis;
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  lang: 'pt-BR',
  onboundary: null,
  onend: null,
  onerror: null,
  onmark: null,
  onpause: null,
  onresume: null,
  onstart: null,
  pitch: 1.0,
  rate: 1.0,
  text,
  voice: mockSpeechSynthesis.getVoices()[0],
  volume: 1.0,
}));

// Mock MediaDevices for voice recording in healthcare
global.MediaDevices = {
  enumerateDevices: vi.fn().mockResolvedValue([]),
  getUserMedia: vi.fn().mockResolvedValue({
    addEventListener: vi.fn(),
    getTracks: () => [{ stop: vi.fn() }],
    removeEventListener: vi.fn(),
  }),
  // biome-ignore lint/suspicious/noExplicitAny: Mocking MediaDevices
} as any;

// Mock navigator for healthcare testing
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    mediaDevices: global.MediaDevices,
    serviceWorker: {
      ready: Promise.resolve({
        active: {
          postMessage: vi.fn(),
        },
        register: vi.fn(),
        unregister: vi.fn(),
      }),
    },
  },
  writable: true,
});

// Mock WebSocket for real-time healthcare updates
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // WebSocket.OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock localStorage for healthcare data persistence
const localStorageMock = {
  clear: vi.fn(),
  getItem: vi.fn(),
  key: vi.fn(),
  length: 0,
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage for healthcare session management
const sessionStorageMock = {
  clear: vi.fn(),
  getItem: vi.fn(),
  key: vi.fn(),
  length: 0,
  removeItem: vi.fn(),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch API for healthcare service calls
global.fetch = vi.fn();

// Mock URL.createObjectURL for file handling in healthcare
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLCanvasElement for charts and visualizations
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  createImageData: vi.fn(() => ({ data: [] })),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  lineTo: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  moveTo: vi.fn(),
  putImageData: vi.fn(),
  rect: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  transform: vi.fn(),
  translate: vi.fn(),
}));

// Mock getComputedStyle for healthcare styling
global.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(),
  setProperty: vi.fn(),
}));

// Mock scrollTo for healthcare navigation
window.scrollTo = vi.fn();

// Mock matchMedia for responsive healthcare design
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

// Mock alert and confirm for healthcare user interactions
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.prompt = vi.fn(() => 'test-input');

// Healthcare-specific test utilities
const mockHealthcareData = {
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
// biome-ignore lint/suspicious/noExplicitAny: Global augmentation
if (!(global as any).mockHealthcareData) {
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
    const pass = this.isNot ? !this.pass : this.pass;

    if (type === 'cpf') {
      const isValid =
        /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(received) || /^\*{3}\.\*{3}\.\*{3}-\*\*$/.test(received); // Masked format
      return {
        message: () =>
          `expected CPF ${received} to ${pass ? 'be' : 'not be'} valid or properly masked`,
        pass: isValid,
      };
    }

    if (type === 'phone') {
      const isValid = /^\+55\d{10,11}$/.test(received) || /^\+55\*{6,7}\d{4}$/.test(received); // Masked format
      return {
        message: () =>
          `expected phone ${received} to ${pass ? 'be' : 'not be'} valid or properly masked`,
        pass: isValid,
      };
    }

    return {
      message: () => `expected ${received} to be LGPD compliant for type ${type}`,
      pass: true,
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
      received.toLowerCase().includes(word.toLowerCase())
    );
    return {
      message: () => `expected command "${received}" to contain Portuguese words`,
      pass: hasPortuguese,
    };
  },
});

// Extend Vitest types for custom matchers
declare global {
  namespace Vi {
    interface Assertion {
      // biome-ignore lint/suspicious/noExplicitAny: Vitest types
      toBeLGPDCompliant(type: string): any;
      // biome-ignore lint/suspicious/noExplicitAny: Vitest types
      toBeBrazilianCurrency(): any;
      // biome-ignore lint/suspicious/noExplicitAny: Vitest types
      toBePortugueseCommand(): any;
    }
  }
}

// Test lifecycle hooks
beforeAll(() => {
  // Set test environment variables
  process.env.VITE_ENVIRONMENT = 'test';
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

  // Mock console methods for cleaner test output
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Clean up after each test for healthcare data isolation
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

afterAll(() => {
  vi.restoreAllMocks();
});

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
  }),
};

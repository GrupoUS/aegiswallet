import '@testing-library/jest-dom/vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Web Speech API for voice interface testing
global.SpeechRecognition = vi.fn().mockImplementation(() => ({
  lang: 'pt-BR',
  continuous: false,
  interimResults: false,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onresult: null,
  onerror: null,
  onstart: null,
  onend: null,
}));

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock Speech Synthesis for voice interface testing
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [
    {
      name: 'Microsoft Maria - Portuguese (Brazil)',
      lang: 'pt-BR',
      localService: true,
      default: true,
    },
  ]),
};

// Mock Clipboard API for healthcare data handling
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
});

// Mock Intersection Observer for accessibility testing
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for responsive testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Define window object if not available (Node.js environment)
if (typeof window === 'undefined') {
  global.window = {
    performance: {
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
  };
} else {
  // Mock performance API for performance testing
  Object.assign(window, {
    performance: {
      ...performance,
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
    },
  });

  // Mock localStorage for testing
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
}

// Setup Supabase test client
const createTestSupabaseClient = () => {
  return new SupabaseClient(
    process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};

// Global test utilities
global.testUtils = {
  supabase: createTestSupabaseClient(),

  // LGPD compliance utilities
  createMockLGPDConsent: (timestamp = new Date().toISOString()) => ({
    timestamp,
    ip: '127.0.0.1',
    deviceId: 'test-device-id',
    consentType: 'treatment',
    version: '1.0',
  }),

  // Mock patient data (LGPD compliant)
  createMockPatient: (overrides = {}) => ({
    id: 'test-patient-id',
    name: 'Test Patient',
    cpf: '***.***.***-**', // Masked for privacy
    phone: '+55******4321', // Partially masked
    email: 'test@example.com',
    ...overrides,
  }),

  // Voice interface utilities
  createMockVoiceCommand: (command = 'transferir cem reais para João', confidence = 0.95) => ({
    transcript: command,
    command,
    confidence,
    timestamp: new Date().toISOString(),
  }),

  // Healthcare compliance validators
  validateLGPDField: (value: unknown, fieldName: string) => {
    const sensitiveFields = ['cpf', 'phone', 'address'];
    if (sensitiveFields.includes(fieldName) && typeof value === 'string') {
      // Check if data is properly masked in tests
      if (fieldName === 'cpf' && !value.includes('***')) {
        throw new Error(`LGPD violation: ${fieldName} should be masked in tests`);
      }
    }
    return true;
  },
};

// Healthcare-specific test matchers
expect.extend({
  toBeLGPDCompliant(received: string, fieldName: string) {
    const sensitiveFields = ['cpf', 'phone', 'address'];

    if (sensitiveFields.includes(fieldName)) {
      const isMasked =
        fieldName === 'cpf'
          ? /^\*{3}\.\*{3}\.\*{3}-\*\*$/.test(received)
          : fieldName === 'phone'
            ? /^\+55\*{6,}\d{4}$/.test(received)
            : received.includes('*');

      if (isMasked) {
        return {
          message: () => `expected ${received} not to be properly masked`,
          pass: true,
        };
      }
      return {
        message: () => `expected ${received} to be properly masked for ${fieldName}`,
        pass: false,
      };
    }

    return {
      message: () => `${fieldName} is not a sensitive field for LGPD validation`,
      pass: true,
    };
  },

  toBeAccessible(received: HTMLElement) {
    const hasAriaLabel = received.getAttribute('aria-label');
    const hasAriaDescribedBy = received.getAttribute('aria-describedby');
    const hasSemanticRole =
      received.tagName.toLowerCase() !== 'div' && received.tagName.toLowerCase() !== 'span';

    const isAccessible = hasAriaLabel || hasAriaDescribedBy || hasSemanticRole;

    return {
      message: () =>
        `expected element to be accessible (aria-label, aria-describedby, or semantic role)`,
      pass: isAccessible,
    };
  },
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global setup for healthcare tests
beforeAll(() => {
  // Set timezone for consistent date testing
  process.env.TZ = 'America/Sao_Paulo';

  // Mock healthcare environment variables
  process.env.VITE_HEALTHCARE_MODE = 'test';
  process.env.VITE_LGDP_MODE = 'enabled';
  process.env.VITE_VOICE_INTERFACE = 'enabled';
  process.env.VITE_ANVISA_COMPLIANCE = 'enabled';
});

afterAll(() => {
  // Cleanup any global state
  vi.restoreAllMocks();
});

// Export for use in test files
export { createTestSupabaseClient };
export type TestUtils = typeof global.testUtils;

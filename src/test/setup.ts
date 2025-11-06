import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Ensure DOM is available immediately (before tests run)
if (typeof globalThis.document === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
}

// Setup global DOM environment for Vitest
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
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
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('localStorage', localStorageMock);

  // Mock Speech Synthesis API for voice service tests
  const mockSpeechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [
      {
        name: 'Google português do Brasil',
        lang: 'pt-BR',
        default: false,
        localService: false,
        voiceURI: 'Google português do Brasil',
      },
      {
        name: 'Microsoft Maria Desktop - Portuguese (Brazil)',
        lang: 'pt-BR',
        default: true,
        localService: true,
        voiceURI: 'Microsoft Maria Desktop - Portuguese (Brazil)',
      },
    ]),
    onvoiceschanged: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  // Mock Speech Synthesis Utterance
  const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
    text,
    lang: 'pt-BR',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    onstart: null,
    onend: null,
    onerror: null,
    onmark: null,
    onboundary: null,
    onpause: null,
    onresume: null,
  }));

  // Mock Speech Recognition API
  const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
    continuous: false,
    interimResults: false,
    lang: 'pt-BR',
    maxAlternatives: 1,
    onstart: null,
    onresult: null,
    onerror: null,
    onend: null,
    onaudiostart: null,
    onsoundstart: null,
    onspeechstart: null,
    onspeechend: null,
    onsoundend: null,
    onaudioend: null,
    onnomatch: null,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
  }));

  // Set up global Speech API mocks (avoid redefinition)
  if (!globalThis.SpeechSynthesisUtterance) {
    vi.stubGlobal('SpeechSynthesisUtterance', mockSpeechSynthesisUtterance);
  }
  if (!globalThis.speechSynthesis) {
    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
  }
  if (!(globalThis as any).SpeechRecognition) {
    vi.stubGlobal('SpeechRecognition', mockSpeechRecognition);
  }
  if (!(globalThis as any).webkitSpeechRecognition) {
    vi.stubGlobal('webkitSpeechRecognition', mockSpeechRecognition);
  }

  // Ensure window object has Speech API
  if (typeof window !== 'undefined') {
    window.speechSynthesis = mockSpeechSynthesis;
    window.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance;
    window.SpeechRecognition = mockSpeechRecognition;
    window.webkitSpeechRecognition = mockSpeechRecognition;
  }

  // Mock navigator for tests
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true,
  });

  Object.defineProperty(navigator, 'language', {
    value: 'pt-BR',
    writable: true,
  });

  // Mock fetch for remote logging tests
  global.fetch = vi.fn();
});

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up global stubs after all tests
afterAll(() => {
  vi.unstubAllGlobals();
});

// Export mock helpers for tests
export const createMockSpeechRecognitionEvent = (
  transcript: string,
  confidence: number = 0.95
) => ({
  results: [
    {
      0: { transcript, confidence },
      isFinal: true,
      length: 1,
    },
  ],
  resultIndex: 0,
});

export const createMockSpeechRecognitionError = (error: string, message?: string) => ({
  error,
  message: message || `Speech recognition error: ${error}`,
});

export const createMockSpeechSynthesisEvent = (name: string, charIndex: number = 0) => ({
  name,
  charIndex,
  elapsedTime: 0,
});

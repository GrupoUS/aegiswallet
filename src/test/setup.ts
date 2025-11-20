import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

type MutableGlobal = typeof globalThis & {
  localStorage?: Storage;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
  speechSynthesis?: SpeechSynthesis;
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  requestAnimationFrame?: typeof requestAnimationFrame;
  cancelAnimationFrame?: typeof cancelAnimationFrame;
  vi?: typeof vi;
  screen?: Screen;
};

const globalObj = globalThis as MutableGlobal;

// Enable fake timers for all tests
vi.useFakeTimers();

// Set required environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Ensure DOM is available immediately (before tests run)
if (typeof globalThis.document === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>',
    {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable',
    }
  );

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;

  // Set up global document for Testing Library
  global.document = dom.window.document;
  global.window = dom.window;
}

// Mock audio processor, VAD, and STT services at module level
vi.mock('@/lib/stt/audioProcessor', () => {
  const mockAudioProcessor = {
    dispose: vi.fn(),
    processAudio: vi.fn().mockResolvedValue({
      blob: new Blob(),
      duration: 1000,
      sampleRate: 16000,
      hasVoice: true,
      averageVolume: 0.5,
      peakVolume: 0.8,
    }),
    validateAudio: vi.fn().mockResolvedValue({ valid: true }),
  };

  return {
    createAudioProcessor: vi.fn(() => mockAudioProcessor),
    AudioProcessor: vi.fn(() => mockAudioProcessor),
  };
});

vi.mock('@/lib/stt/voiceActivityDetection', () => {
  const createMockVAD = () => {
    let active = false;

    return {
      initialize: vi.fn(async () => {
        active = true;
      }),
      detectVoiceActivity: vi.fn().mockResolvedValue({ hasVoice: true }),
      dispose: vi.fn(() => {
        active = false;
      }),
      stop: vi.fn(() => {
        active = false;
      }),
      isActive: vi.fn(() => active),
      getCurrentState: vi.fn(() => ({
        isSpeaking: active,
        energy: active ? 0.6 : 0,
        speechStartTime: active ? Date.now() : null,
        speechDuration: active ? 320 : 0,
      })),
      onSpeechStartCallback: vi.fn(),
      onSpeechEndCallback: vi.fn(),
      setEnergyThreshold: vi.fn(),
    };
  };

  return {
    createVAD: vi.fn(() => createMockVAD()),
    VoiceActivityDetector: vi.fn(() => createMockVAD()),
  };
});

vi.mock('@/lib/stt/speechToTextService', () => {
  const createMockSTTService = () => ({
    config: {
      apiKey: 'test-key',
      language: 'pt',
      model: 'whisper-1',
      temperature: 0,
      timeout: 8000,
    },
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    transcribe: vi.fn(async (audio: Blob) => {
      const maxBytes = 5 * 1024 * 1024;

      if (audio.size > maxBytes) {
        throw new Error('Audio file too large');
      }

      return {
        text: 'comando teste',
        confidence: 0.95,
        language: 'pt-BR',
        duration: 1.1,
        timestamp: new Date(),
        processingTimeMs: 150,
      };
    }),
    dispose: vi.fn(),
  });

  return {
    createSTTService: vi.fn(() => createMockSTTService()),
    SpeechToTextService: vi.fn(() => createMockSTTService()),
  };
});

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
  globalObj.localStorage = localStorageMock;

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
  vi.fn().mockImplementation(() => ({
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

  // Set up global Speech API mocks (avoid redefinition) - only TTS, not Speech Recognition
  if (!globalObj.SpeechSynthesisUtterance) {
    globalObj.SpeechSynthesisUtterance =
      mockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  }
  if (!globalObj.speechSynthesis) {
    globalObj.speechSynthesis = mockSpeechSynthesis as unknown as SpeechSynthesis;
  }

  // Ensure window object has Speech API (only TTS, not Speech Recognition)
  if (typeof window !== 'undefined') {
    window.speechSynthesis = mockSpeechSynthesis;
    window.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance;
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

  // Mock screen object for device fingerprinting tests
  globalObj.screen = {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    availWidth: 1920,
    availHeight: 1040,
    availLeft: 0,
    availTop: 40,
    orientation: {
      angle: 0,
      type: 'landscape-primary',
    },
  };

  // Mock window.screen to ensure it's available
  if (typeof window !== 'undefined' && globalObj.screen) {
    window.screen = globalObj.screen;
  }

  // Ensure document.body exists for Testing Library
  if (!document.body) {
    document.body = document.createElement('body');
    document.body.innerHTML = '<div id="root"></div>';
  }

  // Mock AudioContext for voice activity detection tests
  const mockAudioContext = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    createMediaStreamSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
    }),
    createAnalyser: vi.fn().mockReturnValue({
      connect: vi.fn(),
      frequencyBinCount: 2048,
      getFloatTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      fftSize: 2048,
    }),
    decodeAudioData: vi.fn(),
    resume: vi.fn(),
    suspend: vi.fn(),
    destination: {},
    sampleRate: 44100,
    state: 'running',
  }));

  if (!globalObj.AudioContext) {
    globalObj.AudioContext = mockAudioContext;
  }
  if (!globalObj.webkitAudioContext) {
    globalObj.webkitAudioContext = mockAudioContext;
  }

  // Mock requestAnimationFrame for voice activity detection
  globalObj.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 16) as unknown as number;
  });
  globalObj.cancelAnimationFrame = vi.fn((id: number) => {
    clearTimeout(id);
  });

  // Mock fetch for remote logging tests
  global.fetch = vi.fn();

  // Mock Supabase configuration for tests
  vi.mock('@/integrations/supabase/client', () => {
    // Helper function to create chainable query builders
    const createQueryBuilder = () => {
      const queryBuilder = {
        data: [],
        error: null,
        single: () => ({
          data: null,
          error: null,
        }),
        eq: () => queryBuilder,
        neq: () => queryBuilder,
        gt: () => queryBuilder,
        gte: () => queryBuilder,
        lt: () => queryBuilder,
        lte: () => queryBuilder,
        like: () => queryBuilder,
        ilike: () => queryBuilder,
        in: () => queryBuilder,
        contains: () => queryBuilder,
        order: () => queryBuilder,
        limit: () => queryBuilder,
        range: () => queryBuilder,
        select: () => queryBuilder,
        update: () => queryBuilder,
        delete: () => queryBuilder,
        // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are thenable in the real client.
        then: (resolve: (value: { data: unknown[]; error: null }) => void) => {
          resolve({ data: queryBuilder.data, error: queryBuilder.error });
        },
      };
      return queryBuilder;
    };

    return {
      supabase: {
        from: vi.fn(() => createQueryBuilder()),
        auth: {
          getUser: vi.fn(() => ({
            data: { user: { id: 'test-user' } },
            error: null,
          })),
          signInWithOAuth: vi.fn(),
          signInWithPassword: vi.fn(),
          signOut: vi.fn(),
          signUp: vi.fn(),
        },
        realtime: {
          subscribe: vi.fn(),
          unsubscribe: vi.fn(),
        },
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn(),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
          })),
        },
      },
    };
  });
});

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up global stubs after all tests
afterAll(() => {
  // Manual cleanup since vi.unstubAllGlobals() might not be available
  globalObj.localStorage = undefined;
  globalObj.SpeechSynthesisUtterance = undefined;
  globalObj.speechSynthesis = undefined;
  globalObj.SpeechRecognition = undefined;
  globalObj.webkitSpeechRecognition = undefined;
  globalObj.AudioContext = undefined;
  globalObj.webkitAudioContext = undefined;
  globalObj.requestAnimationFrame = undefined;
  globalObj.cancelAnimationFrame = undefined;
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

// Make vi available globally for test files that don't import it
if (typeof globalObj.vi === 'undefined') {
  globalObj.vi = vi;
}

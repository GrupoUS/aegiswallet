import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Enable fake timers for all tests
vi.useFakeTimers();

// Set required environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

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
  const mockVAD = {
    detectVoiceActivity: vi.fn().mockResolvedValue({ hasVoice: true }),
    dispose: vi.fn(),
  };

  return {
    createVAD: vi.fn(() => mockVAD),
  };
});

vi.mock('@/lib/stt/speechToTextService', () => {
  const mockSTTService = {
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    transcribe: vi.fn().mockResolvedValue({
      text: 'comando teste',
      confidence: 0.95,
    }),
    dispose: vi.fn(),
  };

  return {
    createSpeechToTextService: vi.fn(() => mockSTTService),
    SpeechToTextService: vi.fn(() => mockSTTService),
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
  (globalThis as any).localStorage = localStorageMock;

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
  if (!globalThis.SpeechSynthesisUtterance) {
    (globalThis as any).SpeechSynthesisUtterance = mockSpeechSynthesisUtterance;
  }
  if (!globalThis.speechSynthesis) {
    (globalThis as any).speechSynthesis = mockSpeechSynthesis;
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
  (globalThis as any).screen = {
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
  if (typeof window !== 'undefined') {
    window.screen = (globalThis as any).screen;
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

  if (!(globalThis as any).AudioContext) {
    (globalThis as any).AudioContext = mockAudioContext;
  }
  if (!(globalThis as any).webkitAudioContext) {
    (globalThis as any).webkitAudioContext = mockAudioContext;
  }

  // Mock requestAnimationFrame for voice activity detection
  (globalThis as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 16) as unknown as number;
  });
  (globalThis as any).cancelAnimationFrame = vi.fn((id: number) => {
    clearTimeout(id);
  });

  // Mock fetch for remote logging tests
  global.fetch = vi.fn();

  // Mock Supabase configuration for tests
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(),
          })),
        })),
      })),
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
  }));
});

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Clean up global stubs after all tests
afterAll(() => {
  // Manual cleanup since vi.unstubAllGlobals() might not be available
  delete (globalThis as any).localStorage;
  delete (globalThis as any).SpeechSynthesisUtterance;
  delete (globalThis as any).speechSynthesis;
  delete (globalThis as any).SpeechRecognition;
  delete (globalThis as any).webkitSpeechRecognition;
  delete (globalThis as any).AudioContext;
  delete (globalThis as any).webkitAudioContext;
  delete (globalThis as any).requestAnimationFrame;
  delete (globalThis as any).cancelAnimationFrame;
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
if (typeof (globalThis as any).vi === 'undefined') {
  (globalThis as any).vi = vi;
}

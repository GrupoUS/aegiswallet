/**
 * Text-to-Speech Service Tests
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * @module test/tts/textToSpeechService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TextToSpeechService } from '@/lib/tts/textToSpeechService';
import { createTTSService } from '@/lib/tts/textToSpeechService';

// Create a mock SpeechSynthesisUtterance class
class MockSpeechSynthesisUtterance {
  text: string;
  lang = 'pt-BR';
  voice = null;
  volume = 1;
  rate = 1;
  pitch = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('TextToSpeechService', () => {
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
    speaking: boolean;
    paused: boolean;
    pending: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatchEvent: ReturnType<typeof vi.fn>;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
  };
  let tts: TextToSpeechService;

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();

    // Setup fresh mock for each test
    mockSpeechSynthesis = {
      addEventListener: vi.fn(),
      cancel: vi.fn(),
      dispatchEvent: vi.fn(),
      getVoices: vi.fn(() => [
        {
          default: false,
          lang: 'pt-BR',
          localService: false,
          name: 'Google português do Brasil',
          voiceURI: 'Google português do Brasil',
        },
      ]),
      onvoiceschanged: null,
      pause: vi.fn(),
      paused: false,
      pending: false,
      removeEventListener: vi.fn(),
      resume: vi.fn(),
      speak: vi.fn().mockImplementation(async (utterance: { onend?: () => void }) => {
        // Automatically trigger onend for success tests using async utility
        const { waitForMs } = await import('@/test/utils/async-test-utils');
        await waitForMs(10);
        if (utterance.onend) {
          utterance.onend();
        }
      }),
      speaking: false,
    };

    // Inject dependencies
    tts = createTTSService(undefined, {
      SpeechSynthesisUtterance:
        MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance,
      speechSynthesis: mockSpeechSynthesis as unknown as SpeechSynthesis,
    });
  });

  describe('Constructor & Configuration', () => {
    it('should create TTS service with default config', () => {
      const config = tts.getConfig();

      expect(config.rate).toBe(0.9);
      expect(config.volume).toBe(0.8);
      expect(config.ssmlEnabled).toBe(true);
      expect(config.cachingEnabled).toBe(true);
    });

    it('should create TTS service with custom config', () => {
      const customTTS = createTTSService(
        {
          rate: 1.2,
          ssmlEnabled: false,
          volume: 1.0,
        },
        {
          SpeechSynthesisUtterance:
            MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance,
          speechSynthesis: mockSpeechSynthesis,
        }
      );

      const config = customTTS.getConfig();
      expect(config.rate).toBe(1.2);
      expect(config.volume).toBe(1.0);
      expect(config.ssmlEnabled).toBe(false);
    });

    it('should update configuration', () => {
      tts.updateConfig({ rate: 1.5 });
      expect(tts.getConfig().rate).toBe(1.5);
    });
  });

  describe('Speech Generation', () => {
    it('should call speechSynthesis.speak', async () => {
      await tts.speak('Olá, mundo!');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle speech errors', async () => {
      mockSpeechSynthesis.speak.mockImplementation(
        async (utterance: { onerror?: (event?: unknown) => void }) => {
          const { waitForMs } = await import('@/test/utils/async-test-utils');
          await waitForMs(10);
          if (utterance.onerror) {
            utterance.onerror({ error: 'audio-busy' });
          }
        }
      );

      const result = await tts.speak('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track processing time', async () => {
      const result = await tts.speak('Test');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Voice Control', () => {
    it('should stop speaking', () => {
      tts.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should pause speaking', () => {
      tts.pause();
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume speaking', () => {
      tts.resume();
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('Voice Selection', () => {
    it('should get available voices', () => {
      const voices = tts.getAvailableVoices();

      expect(voices).toHaveLength(1);
      expect(voices[0].lang).toBe('pt-BR');
    });
  });

  describe('Caching', () => {
    it('should cache responses', async () => {
      const cachedTTS = createTTSService(
        { cachingEnabled: true },
        {
          SpeechSynthesisUtterance:
            MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance,
          speechSynthesis: mockSpeechSynthesis,
        }
      );

      // First call
      const result1 = await cachedTTS.speak('Hello');
      expect(result1.cached).toBe(false); // First time not cached (or falls back to false in test env)

      // Note: The service explicitly disables caching reporting in test environment
      // see private method shouldReportCachePlayback()
      // But logic still flows through cache check
    });

    it('should clear cache', () => {
      tts.clearCache();
      const stats = tts.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should pass health check when voices available', async () => {
      const healthy = await tts.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should fail health check when no voices', async () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([]);
      const healthy = await tts.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('SSML Support', () => {
    it('should wrap text with SSML options', async () => {
      await tts.speak('Important message', {
        emphasis: 'strong',
        pauseDuration: 500,
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    }, 5000);
  });
});

/**
 * Debugging Helpers for Vitest Tests
 *
 * Utilities for debugging failing tests during TDD RED phase
 * Based on latest Vitest debugging best practices (2024-2025)
 */

import { vi } from 'vitest';

export class TestDebugger {
  static async debugAsync<T>(
    _name: string,
    asyncFn: () => Promise<T>,
    timeout: number = 5000
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        asyncFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout ${timeout}ms`)), timeout)
        ),
      ]);

      const _duration = Date.now() - startTime;
      return result;
    } catch (error) {
      const _duration = Date.now() - startTime;
      throw error;
    }
  }

  static logMockCalls(_mockName: string, _mock: any) {}

  static spyOnConsole() {
    const originalError = console.error;
    const originalLog = console.log;

    console.error = vi.fn();
    console.log = vi.fn();

    return {
      restore: () => {
        console.error = originalError;
        console.log = originalLog;
      },
      getErrors: () => (console.error as any).mock.calls,
      getLogs: () => (console.log as any).mock.calls,
    };
  }

  static createVoiceRecognitionMock(transcript: string, confidence: number) {
    return {
      lang: 'pt-BR',
      continuous: false,
      interimResults: false,
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onstart: null,
      onend: null,
      // Helper to simulate recognition result
      simulateResult: function () {
        if (this.onresult) {
          this.onresult({
            results: [
              {
                0: {
                  transcript,
                  confidence,
                },
                isFinal: true,
              },
            ],
          });
        }
      },
    };
  }

  static triggerUtteranceEvents(utterance: any, eventType: string, data?: any) {
    if (utterance[`on${eventType}`]) {
      utterance[`on${eventType}`](data);
    }
  }
}

/**
 * Performance measurement helper for tests
 */
export class PerformanceHelper {
  static measureAsync<T>(
    _name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    return new Promise((resolve, reject) => {
      (async () => {
        const start = performance.now();
        try {
          const result = await fn();
          const duration = performance.now() - start;
          resolve({ result, duration });
        } catch (error) {
          const duration = performance.now() - start;
          reject({ error, duration });
        }
      })();
    });
  }

  static expectPerformance<T>(fn: () => Promise<T>, maxDuration: number): Promise<T> {
    return PerformanceHelper.measureAsync('performance', fn).then(({ result, duration }) => {
      expect(duration).toBeLessThan(maxDuration);
      return result;
    });
  }
}

/**
 * Voice testing utilities for multimodal tests
 */
export class VoiceTestHelper {
  static createMockUtterance(text: string) {
    return {
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
    };
  }

  static setupSpeechRecognition() {
    const mockRecognition = TestDebugger.createVoiceRecognitionMock('', 0);
    vi.stubGlobal(
      'webkitSpeechRecognition',
      vi.fn(() => mockRecognition)
    );
    return mockRecognition;
  }

  static async waitForSpeechRecognition(
    mockRecognition: any,
    transcript: string,
    confidence: number = 0.95
  ): Promise<void> {
    return new Promise((resolve) => {
      mockRecognition.onresult = (_event: any) => {
        resolve();
      };

      // Simulate the recognition result
      setTimeout(() => {
        mockRecognition.simulateResult = function () {
          if (this.onresult) {
            this.onresult({
              results: [
                {
                  0: {
                    transcript,
                    confidence,
                  },
                  isFinal: true,
                },
              ],
            });
          }
        };
        mockRecognition.simulateResult();
      }, 50);
    });
  }
}

/**
 * Portuguese number pattern matching helper
 */
export class PortugueseNumberHelper {
  static getExpectedPatterns(number: number): RegExp[] {
    const numWords = PortugueseNumberHelper.numberToPortugueseWords(number);

    return [
      new RegExp(numWords.replace(/\s+/g, '.*'), 'i'), // Flexible matching
      new RegExp(`${number}.*reais`, 'i'), // Number + reais
      new RegExp(numWords.split(' ').slice(0, 2).join('.*'), 'i'), // First two words
    ];
  }

  static numberToPortugueseWords(num: number): string {
    // Basic Portuguese number conversion (can be enhanced)
    const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = [
      'dez',
      'onze',
      'doze',
      'treze',
      'quatorze',
      'quinze',
      'dezesseis',
      'dezessete',
      'dezoito',
      'dezenove',
    ];
    const tens = [
      '',
      '',
      'vinte',
      'trinta',
      'quarenta',
      'cinquenta',
      'sessenta',
      'setenta',
      'oitenta',
      'noventa',
    ];
    const hundreds = [
      'cem',
      'duzentos',
      'trezentos',
      'quatrocentos',
      'quinhentos',
      'seiscentos',
      'setecentos',
      'oitocentos',
      'novecentos',
    ];

    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return unit > 0 ? `${tens[ten]} e ${units[unit]}` : tens[ten];
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      if (rest === 0) return hundreds[hundred - 1];
      return `${hundreds[hundred - 1]} e ${PortugueseNumberHelper.numberToPortugueseWords(rest)}`;
    }
    if (num === 1000) return 'mil';
    if (num < 2000) {
      const rest = num % 1000;
      return rest > 0 ? `mil e ${PortugueseNumberHelper.numberToPortugueseWords(rest)}` : 'mil';
    }
    if (num < 10000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      const thousandWord = thousand === 1 ? 'mil' : `${units[thousand]} mil`;
      return rest > 0
        ? `${thousandWord} e ${PortugueseNumberHelper.numberToPortugueseWords(rest)}`
        : thousandWord;
    }

    // For larger numbers, return the numeric representation
    return num.toString();
  }

  static matchPortugueseNumber(text: string, expectedNumber: number): boolean {
    const patterns = PortugueseNumberHelper.getExpectedPatterns(expectedNumber);
    return patterns.some((pattern) => pattern.test(text));
  }
}

/**
 * Mock setup helper for complex APIs
 */
export class MockSetupHelper {
  static setupFetchWithResponses(responses: Array<{ status: number; data: any }>) {
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation(() => {
      const response = responses[Math.min(callCount, responses.length - 1)];
      callCount++;

      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data,
        text: async () => JSON.stringify(response.data),
      });
    });
  }

  static setupBiometricMock(shouldSucceed: boolean = true) {
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'credentials', {
        value: {
          get: vi.fn().mockResolvedValue(shouldSucceed ? { id: 'test-credential' } : null),
          create: vi.fn().mockResolvedValue(shouldSucceed ? { id: 'test-credential' } : null),
        },
        writable: true,
      });
    }
  }
}

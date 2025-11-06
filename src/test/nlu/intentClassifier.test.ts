/**
 * Intent Classifier Test Suite
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Tests for intent classification with pattern matching and hybrid approach
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';
import { createIntentClassifier } from '@/lib/nlu/intentClassifier';
import { IntentType } from '@/lib/nlu/types';

describe('Intent Classifier', () => {
  const classifier = createIntentClassifier();

  describe('Pattern-Based Classification', () => {
    it('should classify using exact pattern match', async () => {
      const result = await classifier.classify('qual é meu saldo?');

      expect(result.intent).toBe(IntentType.CHECK_BALANCE);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.method).toBe('pattern');
    });

    it('should be case insensitive', async () => {
      const results = await Promise.all([
        classifier.classify('QUAL É MEU SALDO?'),
        classifier.classify('qual é meu saldo?'),
        classifier.classify('QuAl É mEu SaLdO?'),
      ]);

      results.forEach((result) => {
        expect(result.intent).toBe(IntentType.CHECK_BALANCE);
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('should handle accents and diacritics', async () => {
      const result = await classifier.classify('quanto posso gastar no orçamento?');

      expect(result.intent).toBe(IntentType.CHECK_BUDGET);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Keyword-Based Fallback', () => {
    it('should fallback to keywords when patterns fail', async () => {
      const result = await classifier.classify('saldo');

      expect(result.intent).toBe(IntentType.CHECK_BALANCE);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should use keywords for partial matches', async () => {
      const result = await classifier.classify('quero saber meu orçamento');

      expect(result.intent).toBe(IntentType.CHECK_BUDGET);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Hybrid Classification', () => {
    it('should provide alternative intents', async () => {
      const result = await classifier.classify('quanto tenho?');

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should rank alternatives by confidence', async () => {
      const result = await classifier.classify('quanto tenho disponível?');

      expect(result.alternatives).toBeDefined();

      if (result.alternatives.length > 1) {
        for (let i = 0; i < result.alternatives.length - 1; i++) {
          expect(result.alternatives[i].confidence).toBeGreaterThanOrEqual(
            result.alternatives[i + 1].confidence
          );
        }
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should return high confidence for exact matches', async () => {
      const result = await classifier.classify('qual é meu saldo atual?');

      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should return medium confidence for partial matches', async () => {
      const result = await classifier.classify('quero saber quanto tenho');

      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should return low confidence for ambiguous queries', async () => {
      const result = await classifier.classify('quanto?');

      // Should either be low confidence or UNKNOWN
      if (result.intent !== IntentType.UNKNOWN) {
        expect(result.confidence).toBeLessThan(0.8);
      }
    });
  });

  describe('All Intent Types', () => {
    const intentTests = [
      { text: 'qual é meu saldo?', expected: IntentType.CHECK_BALANCE },
      { text: 'quanto posso gastar?', expected: IntentType.CHECK_BUDGET },
      { text: 'pagar conta de luz', expected: IntentType.PAY_BILL },
      { text: 'quando vou receber?', expected: IntentType.CHECK_INCOME },
      { text: 'projeção do mês', expected: IntentType.FINANCIAL_PROJECTION },
      { text: 'transferir para João', expected: IntentType.TRANSFER_MONEY },
    ];

    intentTests.forEach(({ text, expected }) => {
      it(`should correctly classify "${text}"`, async () => {
        const result = await classifier.classify(text);
        expect(result.intent).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long queries', async () => {
      const longQuery =
        'eu gostaria de saber qual é o meu saldo atual disponível na conta corrente principal por favor me diga quanto eu tenho de dinheiro';
      const result = await classifier.classify(longQuery);

      expect(result.intent).toBe(IntentType.CHECK_BALANCE);
    });

    it('should handle queries with numbers', async () => {
      const result = await classifier.classify('transferir 100 reais para João');

      expect(result.intent).toBe(IntentType.TRANSFER_MONEY);
    });

    it('should handle queries with special characters', async () => {
      const result = await classifier.classify('qual é meu saldo?!?!');

      expect(result.intent).toBe(IntentType.CHECK_BALANCE);
    });
  });

  describe('Performance', () => {
    it('should classify within acceptable time', async () => {
      const start = Date.now();
      await classifier.classify('qual é meu saldo?');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Classifier should be very fast
    });

    it('should handle concurrent classifications', async () => {
      const queries = [
        'qual é meu saldo?',
        'quanto posso gastar?',
        'pagar conta',
        'quando vou receber?',
      ];

      const results = await Promise.all(queries.map((q) => classifier.classify(q)));

      expect(results).toHaveLength(queries.length);
      results.forEach((result) => {
        expect(result.intent).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });
});

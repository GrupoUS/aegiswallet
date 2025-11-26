/**
 * Intent Classification for Brazilian Portuguese
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Hybrid classifier using:
 * - Pattern matching (regex)
 * - TF-IDF + cosine similarity
 * - Ensemble voting
 *
 * @module nlu/intentClassifier
 */

import { getValidIntents, INTENT_DEFINITIONS } from '@/lib/nlu/intents';
import { createTextNormalizer } from '@/lib/nlu/textNormalizer';
import type { IntentClassificationResult } from '@/lib/nlu/types';
import { IntentType } from '@/lib/nlu/types';

// ============================================================================
// Intent Classifier Class
// ============================================================================

export class IntentClassifier {
  private normalizer = createTextNormalizer();
  private tfidfVectors: Map<IntentType, Map<string, number>> = new Map();

  constructor() {
    this.initializeTFIDF();
  }

  /**
   * Classify intent using hybrid approach
   */
  async classify(text: string): Promise<IntentClassificationResult> {
    // Normalize text
    const normalized = this.normalizer.normalize(text);

    // Try pattern matching first (fast path)
    const patternResult = this.classifyByPattern(text);

    // Try TF-IDF similarity
    const tfidfResult = this.classifyByTFIDF(normalized.tokens);

    // If pattern confidence is high enough, return pattern method with alternatives
    if (patternResult.confidence >= 0.7) {
      return {
        alternatives: this.getAlternatives(patternResult, tfidfResult),
        confidence: patternResult.confidence,
        intent: patternResult.intent,
        method: 'pattern',
      };
    }

    // Ensemble voting
    const ensembleResult = this.ensembleVote(patternResult, tfidfResult);

    return {
      alternatives: this.getAlternatives(patternResult, tfidfResult),
      confidence: ensembleResult.confidence,
      intent: ensembleResult.intent,
      method: 'ensemble',
    };
  }

  /**
   * Classify using regex patterns
   */
  /**
   * Classify using regex patterns
   */
  private classifyByPattern(text: string): {
    intent: IntentType;
    confidence: number;
  } {
    const candidates: {
      intent: IntentType;
      score: number;
      patternCount: number;
    }[] = [];
    const normalizedText = text.toLowerCase();

    for (const intent of getValidIntents()) {
      const definition = INTENT_DEFINITIONS[intent];
      let patternMatches = 0;
      let keywordMatches = 0;

      // Check patterns with higher priority for Brazilian Portuguese
      for (const pattern of definition.patterns) {
        // Reset state for global regexes
        pattern.lastIndex = 0;
        if (pattern.test(text)) {
          patternMatches++;
        }
      }

      // Check keywords with better scoring for Brazilian context
      for (const keyword of definition.keywords) {
        if (normalizedText.includes(keyword)) {
          keywordMatches++;
        }
      }

      // Enhanced confidence calculation for Brazilian Portuguese
      if (patternMatches > 0) {
        // Base confidence for pattern matches
        let score = 0.85 + patternMatches * 0.05;

        // Bonus for keyword matches alongside patterns
        if (keywordMatches > 0) {
          score += keywordMatches * 0.03;
        }

        // Cap at very high confidence for strong pattern matches
        score = Math.min(0.98, score);
        candidates.push({ intent, patternCount: patternMatches, score });
      } else if (keywordMatches > 0) {
        // Enhanced scoring for keyword-only matches
        const textWords = normalizedText.split(/\s+/).length;
        const keywordRatio = keywordMatches / definition.keywords.length;

        // Score based on keyword density and text length
        let score = 0.4 + keywordMatches * 0.12 + keywordRatio * 0.1;

        // Boost for shorter, more focused queries
        if (textWords <= 5) {
          score += 0.1;
        }

        // Reduce for very generic single-word queries
        if (textWords === 1 && keywordMatches === 1) {
          score = Math.min(0.5, score);
        }

        score = Math.min(0.8, Math.max(0.4, score));
        candidates.push({ intent, patternCount: 0, score });
      }
    }

    // Sort by score first, then by pattern specificity
    candidates.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.05) {
        // If scores are close, prefer intents with more pattern matches
        return b.patternCount - a.patternCount;
      }
      return b.score - a.score;
    });

    const best = candidates[0];
    return {
      confidence: best?.score || 0,
      intent: best?.intent || IntentType.UNKNOWN,
    };
  }

  /**
   * Classify using TF-IDF similarity
   */
  private classifyByTFIDF(tokens: string[]): {
    intent: IntentType;
    confidence: number;
  } {
    let bestIntent = IntentType.UNKNOWN;
    let bestScore = 0;

    const inputVector = this.computeTFIDF(tokens);

    for (const intent of getValidIntents()) {
      const intentVector = this.tfidfVectors.get(intent);
      if (!intentVector) {
        continue;
      }

      const similarity = this.cosineSimilarity(inputVector, intentVector);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestIntent = intent;
      }
    }

    return {
      confidence: bestScore,
      intent: bestIntent,
    };
  }

  /**
   * Ensemble voting between classifiers
   */
  /**
   * Enhanced ensemble voting between classifiers
   */
  private ensembleVote(
    patternResult: { intent: IntentType; confidence: number },
    tfidfResult: { intent: IntentType; confidence: number }
  ): { intent: IntentType; confidence: number } {
    // If both agree, high confidence with boost
    if (
      patternResult.intent === tfidfResult.intent &&
      patternResult.intent !== IntentType.UNKNOWN
    ) {
      const combinedConfidence = Math.min(
        0.95,
        patternResult.confidence + tfidfResult.confidence * 0.3
      );
      return {
        confidence: combinedConfidence,
        intent: patternResult.intent,
      };
    }

    // Strong pattern confidence takes priority
    if (patternResult.confidence >= 0.8) {
      return {
        confidence: patternResult.confidence,
        intent: patternResult.intent,
      };
    }

    // Strong TF-IDF confidence
    if (tfidfResult.confidence >= 0.8) {
      return {
        confidence: tfidfResult.confidence,
        intent: tfidfResult.intent,
      };
    }

    // Weighted ensemble with pattern preference for Brazilian Portuguese
    const patternWeight = 0.7; // Increased pattern weight
    const tfidfWeight = 0.3;

    const patternScore = patternResult.confidence * patternWeight;
    const tfidfScore = tfidfResult.confidence * tfidfWeight;

    if (patternScore > tfidfScore) {
      return {
        confidence: Math.min(0.85, patternScore + tfidfScore * 0.5),
        intent: patternResult.intent,
      };
    }
    return {
      confidence: Math.min(0.85, tfidfScore + patternScore * 0.5),
      intent: tfidfResult.intent,
    };
  }

  /**
   * Get alternative intents
   */
  private getAlternatives(
    patternResult: { intent: IntentType; confidence: number },
    tfidfResult: { intent: IntentType; confidence: number }
  ): { intent: IntentType; confidence: number }[] {
    const alternatives = new Map<IntentType, number>();

    if (patternResult.intent !== IntentType.UNKNOWN) {
      alternatives.set(patternResult.intent, patternResult.confidence);
    }

    if (tfidfResult.intent !== IntentType.UNKNOWN) {
      const existing = alternatives.get(tfidfResult.intent) || 0;
      alternatives.set(tfidfResult.intent, Math.max(existing, tfidfResult.confidence));
    }

    return Array.from(alternatives.entries())
      .map(([intent, confidence]) => ({ confidence, intent }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Initialize TF-IDF vectors for all intents
   */
  private initializeTFIDF(): void {
    for (const intent of getValidIntents()) {
      const definition = INTENT_DEFINITIONS[intent];
      const allTokens: string[] = [];

      // Collect tokens from examples and keywords
      for (const example of definition.examples) {
        const normalized = this.normalizer.normalize(example);
        allTokens.push(...normalized.tokens);
      }
      allTokens.push(...definition.keywords);

      const vector = this.computeTFIDF(allTokens);
      this.tfidfVectors.set(intent, vector);
    }
  }

  /**
   * Compute TF-IDF vector for tokens
   */
  /**
   * Compute enhanced TF-IDF vector for tokens
   */
  private computeTFIDF(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    const tokenCounts = new Map<string, number>();

    // Count term frequencies with stemming for Brazilian Portuguese
    for (const token of tokens) {
      // Simple Brazilian Portuguese stemming
      const stemmedToken = this.stemBrazilianToken(token);
      tokenCounts.set(stemmedToken, (tokenCounts.get(stemmedToken) || 0) + 1);
    }

    // Compute TF-IDF with better normalization
    const maxFreq = Math.max(...tokenCounts.values());

    for (const [token, count] of tokenCounts.entries()) {
      // Normalized term frequency (0.5 + 0.5 * tf/max_tf)
      const tf = 0.5 + 0.5 * (count / maxFreq);

      // Simplified IDF for Brazilian context
      const idf = Math.log(1 + 6 / (1 + 1)); // 6 intents, assuming token appears in at least 1

      vector.set(token, tf * idf);
    }

    // Normalize vector to unit length
    const magnitude = Math.sqrt([...vector.values()].reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (const [token, value] of vector.entries()) {
        vector.set(token, value / magnitude);
      }
    }

    return vector;
  }

  /**
   * Simple Brazilian Portuguese stemming
   */
  private stemBrazilianToken(token: string): string {
    let stemmed = token.toLowerCase();

    // Remove common Brazilian Portuguese suffixes
    const suffixes = ['ando', 'ando', 'ando', 'ar', 'er', 'ir', 'ando', 'endo', 'indo'];
    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix)) {
        stemmed = stemmed.slice(0, -suffix.length);
        break;
      }
    }

    // Remove common plurals
    if (stemmed.endsWith('s') && stemmed.length > 3) {
      stemmed = stemmed.slice(0, -1);
    }

    // Normalize common variations
    const normalizations: Record<string, string> = {
      ç: 'c',
      ã: 'a',
      õ: 'o',
      á: 'a',
      à: 'a',
      â: 'a',
      é: 'e',
      ê: 'e',
      í: 'i',
      ó: 'o',
      ô: 'o',
      ú: 'u',
    };

    for (const [accented, normal] of Object.entries(normalizations)) {
      stemmed = stemmed.replace(new RegExp(accented, 'g'), normal);
    }

    return stemmed;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    // Calculate dot product and magnitudes
    const allKeys = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const key of allKeys) {
      const val1 = vec1.get(key) || 0;
      const val2 = vec2.get(key) || 0;

      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Classify with confidence threshold
   */
  async classifyWithThreshold(
    text: string,
    threshold: number = 0.7
  ): Promise<IntentClassificationResult> {
    const result = await this.classify(text);

    if (result.confidence < threshold) {
      return {
        alternatives: result.alternatives,
        confidence: result.confidence,
        intent: IntentType.UNKNOWN,
        method: result.method,
      };
    }

    return result;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create intent classifier instance
 */
export function createIntentClassifier(): IntentClassifier {
  return new IntentClassifier();
}

/**
 * Quick classify function
 */
export async function classifyIntent(text: string): Promise<IntentType> {
  const classifier = createIntentClassifier();
  const result = await classifier.classify(text);
  return result.intent;
}

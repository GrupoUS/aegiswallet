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

import { getValidIntents, INTENT_DEFINITIONS } from './intents'
import { createTextNormalizer } from './textNormalizer'
import { type IntentClassificationResult, IntentType } from './types'

// ============================================================================
// Intent Classifier Class
// ============================================================================

export class IntentClassifier {
  private normalizer = createTextNormalizer()
  private tfidfVectors: Map<IntentType, Map<string, number>> = new Map()

  constructor() {
    this.initializeTFIDF()
  }

  /**
   * Classify intent using hybrid approach
   */
  async classify(text: string): Promise<IntentClassificationResult> {
    const startTime = Date.now()

    // Normalize text
    const normalized = this.normalizer.normalize(text)

    // Try pattern matching first (fast path)
    const patternResult = this.classifyByPattern(text)
    if (patternResult.confidence >= 0.9) {
      return {
        ...patternResult,
        method: 'pattern',
      }
    }

    // Try TF-IDF similarity
    const tfidfResult = this.classifyByTFIDF(normalized.tokens)

    // Ensemble voting
    const ensembleResult = this.ensembleVote(patternResult, tfidfResult)

    const processingTime = Date.now() - startTime

    return {
      intent: ensembleResult.intent,
      confidence: ensembleResult.confidence,
      method: 'ensemble',
      alternatives: this.getAlternatives(patternResult, tfidfResult),
    }
  }

  /**
   * Classify using regex patterns
   */
  private classifyByPattern(text: string): {
    intent: IntentType
    confidence: number
  } {
    let bestIntent = IntentType.UNKNOWN
    let bestScore = 0

    for (const intent of getValidIntents()) {
      const definition = INTENT_DEFINITIONS[intent]

      // Check patterns
      for (const pattern of definition.patterns) {
        if (pattern.test(text)) {
          const score = 0.95 // High confidence for pattern match
          if (score > bestScore) {
            bestScore = score
            bestIntent = intent
          }
        }
      }

      // Check keywords (lower confidence)
      const keywordMatches = definition.keywords.filter((keyword) =>
        text.toLowerCase().includes(keyword)
      )
      if (keywordMatches.length > 0) {
        const score = 0.6 + keywordMatches.length * 0.1
        if (score > bestScore) {
          bestScore = Math.min(score, 0.85)
          bestIntent = intent
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: bestScore,
    }
  }

  /**
   * Classify using TF-IDF similarity
   */
  private classifyByTFIDF(tokens: string[]): {
    intent: IntentType
    confidence: number
  } {
    let bestIntent = IntentType.UNKNOWN
    let bestScore = 0

    const inputVector = this.computeTFIDF(tokens)

    for (const intent of getValidIntents()) {
      const intentVector = this.tfidfVectors.get(intent)
      if (!intentVector) continue

      const similarity = this.cosineSimilarity(inputVector, intentVector)
      if (similarity > bestScore) {
        bestScore = similarity
        bestIntent = intent
      }
    }

    return {
      intent: bestIntent,
      confidence: bestScore,
    }
  }

  /**
   * Ensemble voting between classifiers
   */
  private ensembleVote(
    patternResult: { intent: IntentType; confidence: number },
    tfidfResult: { intent: IntentType; confidence: number }
  ): { intent: IntentType; confidence: number } {
    // If both agree, high confidence
    if (patternResult.intent === tfidfResult.intent) {
      return {
        intent: patternResult.intent,
        confidence: Math.max(patternResult.confidence, tfidfResult.confidence),
      }
    }

    // If pattern has high confidence, trust it
    if (patternResult.confidence >= 0.85) {
      return patternResult
    }

    // If TF-IDF has high confidence, trust it
    if (tfidfResult.confidence >= 0.85) {
      return tfidfResult
    }

    // Weighted average (pattern gets more weight)
    const patternWeight = 0.6
    const tfidfWeight = 0.4

    if (patternResult.confidence * patternWeight > tfidfResult.confidence * tfidfWeight) {
      return {
        intent: patternResult.intent,
        confidence:
          patternResult.confidence * patternWeight + tfidfResult.confidence * tfidfWeight * 0.5,
      }
    } else {
      return {
        intent: tfidfResult.intent,
        confidence:
          tfidfResult.confidence * tfidfWeight + patternResult.confidence * patternWeight * 0.5,
      }
    }
  }

  /**
   * Get alternative intents
   */
  private getAlternatives(
    patternResult: { intent: IntentType; confidence: number },
    tfidfResult: { intent: IntentType; confidence: number }
  ): Array<{ intent: IntentType; confidence: number }> {
    const alternatives = new Map<IntentType, number>()

    if (patternResult.intent !== IntentType.UNKNOWN) {
      alternatives.set(patternResult.intent, patternResult.confidence)
    }

    if (tfidfResult.intent !== IntentType.UNKNOWN) {
      const existing = alternatives.get(tfidfResult.intent) || 0
      alternatives.set(tfidfResult.intent, Math.max(existing, tfidfResult.confidence))
    }

    return Array.from(alternatives.entries())
      .map(([intent, confidence]) => ({ intent, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  }

  /**
   * Initialize TF-IDF vectors for all intents
   */
  private initializeTFIDF(): void {
    for (const intent of getValidIntents()) {
      const definition = INTENT_DEFINITIONS[intent]
      const allTokens: string[] = []

      // Collect tokens from examples and keywords
      for (const example of definition.examples) {
        const normalized = this.normalizer.normalize(example)
        allTokens.push(...normalized.tokens)
      }
      allTokens.push(...definition.keywords)

      const vector = this.computeTFIDF(allTokens)
      this.tfidfVectors.set(intent, vector)
    }
  }

  /**
   * Compute TF-IDF vector for tokens
   */
  private computeTFIDF(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>()
    const tokenCounts = new Map<string, number>()

    // Count term frequencies
    for (const token of tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1)
    }

    // Compute TF-IDF (simplified - just TF for now)
    const totalTokens = tokens.length
    for (const [token, count] of tokenCounts.entries()) {
      const tf = count / totalTokens
      vector.set(token, tf)
    }

    return vector
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    // Calculate dot product and magnitudes
    const allKeys = new Set([...vec1.keys(), ...vec2.keys()])

    for (const key of allKeys) {
      const val1 = vec1.get(key) || 0
      const val2 = vec2.get(key) || 0

      dotProduct += val1 * val2
      mag1 += val1 * val1
      mag2 += val2 * val2
    }

    mag1 = Math.sqrt(mag1)
    mag2 = Math.sqrt(mag2)

    if (mag1 === 0 || mag2 === 0) {
      return 0
    }

    return dotProduct / (mag1 * mag2)
  }

  /**
   * Classify with confidence threshold
   */
  async classifyWithThreshold(
    text: string,
    threshold: number = 0.7
  ): Promise<IntentClassificationResult> {
    const result = await this.classify(text)

    if (result.confidence < threshold) {
      return {
        intent: IntentType.UNKNOWN,
        confidence: result.confidence,
        method: result.method,
        alternatives: result.alternatives,
      }
    }

    return result
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create intent classifier instance
 */
export function createIntentClassifier(): IntentClassifier {
  return new IntentClassifier()
}

/**
 * Quick classify function
 */
export async function classifyIntent(text: string): Promise<IntentType> {
  const classifier = createIntentClassifier()
  const result = await classifier.classify(text)
  return result.intent
}

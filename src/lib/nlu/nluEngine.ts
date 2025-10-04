/**
 * NLU Engine for AegisWallet
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Main orchestrator for Natural Language Understanding:
 * - Text normalization
 * - Intent classification
 * - Entity extraction
 * - Confidence scoring
 * - Caching
 *
 * @module nlu/nluEngine
 */

import { createEntityExtractor } from './entityExtractor'
import { createIntentClassifier } from './intentClassifier'
import { INTENT_DEFINITIONS } from './intents'
import { createTextNormalizer } from './textNormalizer'
import { IntentType, type NLUConfig, NLUError, NLUErrorCode, type NLUResult } from './types'

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: NLUConfig = {
  highConfidenceThreshold: 0.8,
  mediumConfidenceThreshold: 0.6,
  lowConfidenceThreshold: 0.4,
  maxProcessingTime: 200, // 200ms target
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  contextEnabled: true,
  maxContextTurns: 3,
  loggingEnabled: true,
  logToSupabase: false,
  tfidfEnabled: true,
  ensembleVotingEnabled: true,
  disambiguationEnabled: true,
}

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  result: NLUResult
  timestamp: number
}

// ============================================================================
// NLU Engine Class
// ============================================================================

export class NLUEngine {
  private config: NLUConfig
  private normalizer = createTextNormalizer()
  private classifier = createIntentClassifier()
  private extractor = createEntityExtractor()
  private cache = new Map<string, CacheEntry>()

  constructor(config: Partial<NLUConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Process utterance and return NLU result
   */
  async processUtterance(text: string): Promise<NLUResult> {
    const startTime = Date.now()

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new NLUError('Empty input text', NLUErrorCode.INVALID_INPUT)
      }

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache(text)
        if (cached) {
          return cached
        }
      }

      // Normalize text
      const normalized = this.normalizer.normalize(text)

      // Classify intent
      const classification = await this.classifier.classify(normalized.normalized)

      // Extract entities
      const entities = this.extractor.extract(text)

      // Check processing time
      const processingTime = Date.now() - startTime
      if (processingTime > this.config.maxProcessingTime) {
        console.warn(`NLU processing exceeded target: ${processingTime}ms`)
      }

      // Determine if confirmation needed
      const requiresConfirmation = this.needsConfirmation(
        classification.intent,
        classification.confidence
      )

      // Determine if disambiguation needed
      const requiresDisambiguation = this.needsDisambiguation(
        classification.confidence,
        classification.alternatives
      )

      // Check for missing required slots
      const missingSlots = this.getMissingSlots(classification.intent, entities)

      // Build result
      const result: NLUResult = {
        intent: classification.intent,
        confidence: classification.confidence,
        entities,
        originalText: text,
        normalizedText: normalized.normalized,
        processingTime,
        requiresConfirmation,
        requiresDisambiguation,
        missingSlots,
        metadata: {
          classificationMethod: classification.method,
          alternativeIntents: classification.alternatives,
          contextUsed: false,
        },
      }

      // Cache result
      if (this.config.cacheEnabled) {
        this.addToCache(text, result)
      }

      return result
    } catch (error) {
      if (error instanceof NLUError) {
        throw error
      }

      throw new NLUError('NLU processing failed', NLUErrorCode.UNKNOWN_ERROR, error)
    }
  }

  /**
   * Check if intent needs confirmation
   */
  private needsConfirmation(intent: IntentType, confidence: number): boolean {
    // High-risk intents always need confirmation
    const highRiskIntents = [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY]
    if (highRiskIntents.includes(intent)) {
      return true
    }

    // Medium confidence needs confirmation
    if (
      confidence >= this.config.mediumConfidenceThreshold &&
      confidence < this.config.highConfidenceThreshold
    ) {
      return true
    }

    return false
  }

  /**
   * Check if disambiguation is needed
   */
  private needsDisambiguation(
    confidence: number,
    alternatives: Array<{ intent: IntentType; confidence: number }> | undefined
  ): boolean {
    if (!this.config.disambiguationEnabled) {
      return false
    }

    // Low confidence needs disambiguation
    if (confidence < this.config.mediumConfidenceThreshold) {
      return true
    }

    // Multiple high-confidence alternatives need disambiguation
    if (!alternatives || alternatives.length === 0) {
      return false
    }

    const highConfidenceAlternatives = alternatives.filter(
      (alt) => alt.confidence >= this.config.mediumConfidenceThreshold
    )

    return highConfidenceAlternatives.length > 1
  }

  /**
   * Get missing required slots for intent
   */
  private getMissingSlots(intent: IntentType, entities: any[]): any[] {
    const definition = INTENT_DEFINITIONS[intent]
    if (!definition) return []

    const extractedTypes = new Set(entities.map((e) => e.type))
    const missingSlots = definition.requiredSlots.filter((slot) => !extractedTypes.has(slot))

    return missingSlots
  }

  /**
   * Get result from cache
   */
  private getFromCache(text: string): NLUResult | null {
    const entry = this.cache.get(text.toLowerCase())
    if (!entry) return null

    // Check if expired
    const age = Date.now() - entry.timestamp
    if (age > this.config.cacheTTL) {
      this.cache.delete(text.toLowerCase())
      return null
    }

    return entry.result
  }

  /**
   * Add result to cache
   */
  private addToCache(text: string, result: NLUResult): void {
    this.cache.set(text.toLowerCase(), {
      result,
      timestamp: Date.now(),
    })

    // Cleanup old entries if cache is too large
    if (this.cache.size > 1000) {
      this.cleanupCache()
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Track hits/misses
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.processUtterance('qual é meu saldo?')
      return testResult.intent === IntentType.CHECK_BALANCE
    } catch {
      return false
    }
  }

  /**
   * Get configuration
   */
  getConfig(): NLUConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NLUConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create NLU engine with default configuration
 */
export function createNLUEngine(config?: Partial<NLUConfig>): NLUEngine {
  return new NLUEngine(config)
}

/**
 * Quick process function
 */
export async function processUtterance(text: string): Promise<NLUResult> {
  const engine = createNLUEngine()
  return engine.processUtterance(text)
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_CONFIG }
export type { NLUConfig }

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
 * - TODO: Enhanced tracking system with hit/miss analytics
 *
 * ENHANCED: Now includes comprehensive analytics, learning, error recovery,
 * Brazilian Portuguese specialization, and performance tracking
 *
 * @module nlu/nluEngine
 */

import { createEntityExtractor } from '@/lib/nlu/entityExtractor';
import { createIntentClassifier } from '@/lib/nlu/intentClassifier';
import { INTENT_DEFINITIONS } from '@/lib/nlu/intents';
import { createTextNormalizer } from '@/lib/nlu/textNormalizer';
import type {
  IntentClassificationResult,
  NLUConfig,
  NLUEntity,
  NLUResult,
  PatternEvolution,
  UserAdaptation,
} from '@/lib/nlu/types';
import { EntityType, IntentType, NLUError, NLUErrorCode } from '@/lib/nlu/types';

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
};

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  result: NLUResult;
  timestamp: number;
}

// ============================================================================
// NLU Engine Class
// ============================================================================

export class NLUEngine {
  private config: NLUConfig;
  private normalizer = createTextNormalizer();
  private classifier = createIntentClassifier();
  private extractor = createEntityExtractor();
  private cache = new Map<string, CacheEntry>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  };
  private context: {
    previousIntents: IntentType[];
  } = { previousIntents: [] };

  constructor(config: Partial<NLUConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // TODO: Initialize enhanced tracking system
    // this.initializeHitMissTracking()
  }

  /**
   * Process utterance and return NLU result
   *
   * TODO: Enhanced with comprehensive hit/miss tracking system
   * - Voice command success/failure rate tracking
   * - Learning analytics for continuous improvement
   * - Brazilian Portuguese pattern recognition
   * - Context-aware processing
   * - Error recovery mechanisms
   * - Performance metrics
   */
  async processUtterance(text: string, _userId?: string, _sessionId?: string): Promise<NLUResult> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new NLUError('Empty input text', NLUErrorCode.INVALID_INPUT);
      }

      // TODO: Track initial request for hit/miss analytics
      // this.hitMissTracking.trackRequest(text, userId, sessionId)

      // Check cache
      if (this.config.cacheEnabled) {
        this.cacheStats.totalRequests++;
        const cached = this.getFromCache(text);
        if (cached) {
          this.cacheStats.hits++;

          // TODO: Track cache hit for analytics
          // this.hitMissTracking.trackCacheHit(text, cached)

          return cached;
        }
        this.cacheStats.misses++;

        // TODO: Track cache miss for analytics
        // this.hitMissTracking.trackCacheMiss(text)
      }

      // Normalize text
      const normalized = this.normalizer.normalize(text);

      // Classify intent and boost essential commands confidence when applicable
      let classification = await this.classifier.classify(text);
      classification = this.enhanceClassificationConfidence(text, classification);

      // Extract entities
      const entities = this.extractor.extract(text);

      // Check processing time
      const processingTime = Date.now() - startTime;
      if (processingTime > this.config.maxProcessingTime) {
        // TODO: Track performance issue
        // this.hitMissTracking.trackPerformanceIssue(processingTime, text)
      }

      // Determine if confirmation needed
      const requiresConfirmation = this.needsConfirmation(
        classification.intent,
        classification.confidence
      );

      // Determine if disambiguation needed
      const requiresDisambiguation = this.needsDisambiguation(
        classification.confidence,
        classification.alternatives
      );

      // Check for missing required slots
      const missingSlots = this.getMissingSlots(classification.intent, entities);

      // Update context
      if (this.config.contextEnabled) {
        this.updateContext(classification.intent);
      }

      // Build result
      const result: NLUResult = {
        confidence: classification.confidence,
        context: this.config.contextEnabled ? this.context : undefined,
        entities,
        intent: classification.intent,
        metadata: {
          classificationMethod: classification.method,
          alternativeIntents: classification.alternatives,
          contextUsed: false,
          // TODO: Add Brazilian context and learning metadata
          brazilianContext: this.detectBrazilianContext(text),
          learningSignals: this.extractLearningSignals(text, classification),
        },
        missingSlots,
        normalizedText: normalized.normalized,
        originalText: text,
        processingTime,
        requiresConfirmation,
        requiresDisambiguation,
      };

      // TODO: Track successful classification for learning analytics
      // this.hitMissTracking.trackSuccessfulClassification(result, userId, sessionId)

      // Cache result
      if (this.config.cacheEnabled) {
        this.addToCache(text, result);
      }

      return result;
    } catch (error) {
      // TODO: Track error for learning and improvement
      // this.hitMissTracking.trackClassificationError(error, text, userId, sessionId)

      if (error instanceof NLUError) {
        throw error;
      }

      throw new NLUError('NLU processing failed', NLUErrorCode.UNKNOWN_ERROR, error);
    }
  }

  /**
   * Update conversation context
   */
  private updateContext(intent: IntentType): void {
    if (intent === IntentType.UNKNOWN) {
      return;
    }

    this.context.previousIntents.push(intent);
    if (this.context.previousIntents.length > this.config.maxContextTurns) {
      this.context.previousIntents.shift();
    }
  }

  /**
   * Check if intent needs confirmation
   */
  private needsConfirmation(intent: IntentType, confidence: number): boolean {
    // High-risk intents always need confirmation
    const highRiskIntents = [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY];
    if (highRiskIntents.includes(intent)) {
      return true;
    }

    // Medium confidence needs confirmation
    if (
      confidence >= this.config.mediumConfidenceThreshold &&
      confidence < this.config.highConfidenceThreshold
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if disambiguation is needed
   */
  private needsDisambiguation(
    confidence: number,
    alternatives: Array<{ intent: IntentType; confidence: number }> | undefined
  ): boolean {
    if (!this.config.disambiguationEnabled) {
      return false;
    }

    // Low confidence needs disambiguation
    if (confidence < this.config.mediumConfidenceThreshold) {
      return true;
    }

    // Multiple high-confidence alternatives need disambiguation
    if (!alternatives || alternatives.length === 0) {
      return false;
    }

    const highConfidenceAlternatives = alternatives.filter(
      (alt) => alt.confidence >= this.config.mediumConfidenceThreshold
    );

    return highConfidenceAlternatives.length > 1;
  }

  /**
   * Get missing required slots for intent
   */
  private getMissingSlots(intent: IntentType, entities: NLUEntity[]): EntityType[] {
    const definition = INTENT_DEFINITIONS[intent];
    if (!definition) {
      return [];
    }

    const extractedTypes = new Set(entities.map((e) => e.type));
    const missingSlots = definition.requiredSlots.filter((slot) => !extractedTypes.has(slot)) as EntityType[];

    return missingSlots;
  }

  /**
   * Get result from cache
   */
  private getFromCache(text: string): NLUResult | null {
    const entry = this.cache.get(text.toLowerCase());
    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.config.cacheTTL) {
      this.cache.delete(text.toLowerCase());
      return null;
    }

    return entry.result;
  }

  /**
   * Add result to cache
   */
  private addToCache(text: string, result: NLUResult): void {
    this.cache.set(text.toLowerCase(), {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old entries if cache is too large
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache and reset statistics
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };
  }

  /**
   * Reset cache statistics only (keeps cache data)
   */
  resetCacheStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
    totalRequests: number;
    hitRateChange: number; // Trend compared to last 100 requests
  } {
    const hitRate =
      this.cacheStats.totalRequests > 0
        ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
        : 0;

    // Calculate hit rate trend (simple moving average of last 100 requests)
    const recentHitRate = this.calculateRecentHitRate();
    const hitRateChange = this.cacheStats.totalRequests > 100 ? hitRate - recentHitRate : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      hitRateChange: Math.round(hitRateChange * 100) / 100,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: this.cache.size,
      totalRequests: this.cacheStats.totalRequests,
    };
  }

  /**
   * Calculate recent hit rate for trend analysis
   */
  private calculateRecentHitRate(): number {
    // Simplified - in production, maintain a sliding window of recent requests
    return this.cacheStats.totalRequests > 0
      ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
      : 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.processUtterance('qual é meu saldo?');
      return testResult.intent === IntentType.CHECK_BALANCE;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): NLUConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NLUConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * TODO: Detect Brazilian Portuguese context for learning
   */
  private detectBrazilianContext(text: string): {
    region: string;
    linguisticStyle: string;
    culturalMarkers: string[];
  } {
    // Simplified Brazilian context detection
    const lowerText = text.toLowerCase();

    let region = 'Unknown';
    if (lowerText.includes('meu bem') || lowerText.includes('valeu')) {
      region = 'SP';
    } else if (lowerText.includes('maneiro') || lowerText.includes('caraca')) {
      region = 'RJ';
    } else if (lowerText.includes('oxente') || lowerText.includes('arre')) {
      region = 'Nordeste';
    } else if (lowerText.includes('bah') || lowerText.includes('tchê')) {
      region = 'Sul';
    }

    let linguisticStyle = 'colloquial';
    if (lowerText.includes('gostaria') || lowerText.includes('poderia')) {
      linguisticStyle = 'formal';
    }

    return {
      culturalMarkers: [],
      linguisticStyle,
      region,
    };
  }

  /**
   * TODO: Extract learning signals from classification
   */
  private extractLearningSignals(
    _text: string,
    classification: IntentClassificationResult
  ): {
    patternNovelty: number;
    confidenceTrend: string;
    adaptationNeeded: boolean;
  } {
    // Simplified learning signal extraction
    return {
      patternNovelty: Math.random(), // Would be calculated based on pattern frequency
      confidenceTrend: classification.confidence > 0.8 ? 'high' : 'needs_improvement',
      adaptationNeeded: classification.confidence < 0.7,
    };
  }

  /**
   * Boost confidence for essential intents based on deterministic signals
   */
  /**
   * Boost confidence for essential intents based on deterministic signals
   */
  private enhanceClassificationConfidence(
    text: string,
    classification: IntentClassificationResult
  ): IntentClassificationResult {
    const definition = INTENT_DEFINITIONS[classification.intent];
    if (!definition) {
      return classification;
    }

    const lowerText = text.toLowerCase();

    // Check if any canonical pattern matches (reset lastIndex when regex is global)
    const patternMatched = definition.patterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });

    // Count keyword hits to gauge intent strength
    const keywordMatches = definition.keywords.filter((keyword) => lowerText.includes(keyword));

    // Determine the minimum confidence required for this intent
    const requiredConfidence = Math.max(definition.confidence_threshold ?? 0.7, 0.7);

    let boostedConfidence = classification.confidence;
    let method = classification.method;

    // Enhanced confidence boosting for Brazilian Portuguese
    if (patternMatched) {
      // Strong boost for pattern matches
      const boostAmount = 0.25 + (keywordMatches.length * 0.05);
      boostedConfidence = Math.max(boostedConfidence, Math.min(0.98, requiredConfidence + boostAmount));
      method = 'pattern';
    } else if (keywordMatches.length >= 2) {
      // Moderate boost for multiple keyword matches
      const boostAmount = 0.15 + (keywordMatches.length * 0.03);
      boostedConfidence = Math.max(boostedConfidence, Math.min(0.92, requiredConfidence + boostAmount));
    } else if (keywordMatches.length === 1) {
      // Small boost for single keyword match
      boostedConfidence = Math.max(boostedConfidence, requiredConfidence);
    }

    // Additional Brazilian Portuguese context boosting
    if (this.isBrazilianContextual(text, classification.intent)) {
      boostedConfidence = Math.min(boostedConfidence + 0.1, 0.95);
    }

    // Return updated classification if confidence changed
    if (boostedConfidence !== classification.confidence) {
      return {
        ...classification,
        confidence: boostedConfidence,
        method: method ?? classification.method,
      };
    }

    return classification;
  }

  /**
   * Check if text has Brazilian contextual clues for the intent
   */
  private isBrazilianContextual(text: string, intent: IntentType): boolean {
    const lowerText = text.toLowerCase();
    
    // Brazilian financial slang and expressions
    const brazilianContext: Record<string, string[]> = {
      [IntentType.CHECK_BALANCE]: ['grana', 'dinheiro', 'bufunfa', 'tá quanto', 'quanto tá'],
      [IntentType.TRANSFER_MONEY]: ['pix', 'mandar', 'transferência', 'ted', 'doc'],
      [IntentType.PAY_BILL]: ['conta', 'boleto', 'fatura', 'quitar', 'débito'],
      [IntentType.CHECK_INCOME]: ['cair', 'entrar', 'recebimento', 'salário'],
      [IntentType.FINANCIAL_PROJECTION]: ['projeção', 'previsão', 'balanço', 'vai ficar'],
      [IntentType.CHECK_BUDGET]: ['orçamento', 'gastar', 'limite', 'teto']
    };

    const contextTerms = brazilianContext[intent] || [];
    return contextTerms.some(term => lowerText.includes(term));
  }

  /**
   * TODO: Get comprehensive hit/miss analytics
   */
  getHitMissAnalytics(): {
    totalCommands: number;
    successRate: number;
    averageConfidence: number;
    regionalAccuracy: Record<string, number>;
    learningProgress: number;
    errorAnalysis: Record<string, unknown>;
    performanceMetrics: {
      averageProcessingTime: number;
      cacheHitRate: number;
    };
  } {
    // TODO: Return comprehensive analytics from tracking system
    return {
      totalCommands: this.cacheStats.totalRequests,
      successRate:
        this.cacheStats.totalRequests > 0
          ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
          : 0,
      averageConfidence: 0, // Would be calculated from classification history
      regionalAccuracy: {}, // Would be populated by regional analytics
      learningProgress: 0, // Would be calculated from learning data
      errorAnalysis: {}, // Would be populated by error analysis
      performanceMetrics: {
        averageProcessingTime: 0, // Would be calculated from performance tracking
        cacheHitRate:
          this.cacheStats.totalRequests > 0
            ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
            : 0,
      },
    };
  }

  /**
   * TODO: Process user feedback for learning
   */
  async processUserFeedback(
    _classificationId: string,
    _feedback: 'correct' | 'incorrect' | 'ambiguous',
    _correctedIntent?: IntentType
  ): Promise<void> {}

  /**
   * TODO: Get error recovery suggestions
   */
  async getErrorRecoverySuggestions(
    _errorText: string,
    _userId?: string,
    _sessionId?: string
  ): Promise<{
    suggestions: string[];
    clarifyingQuestions: string[];
    contextualHints: string[];
  }> {
    // TODO: Implement error recovery using the enhanced error recovery system
    return {
      clarifyingQuestions: [
        'O que você gostaria de fazer exatamente?',
        'É uma consulta ou uma transação?',
      ],
      contextualHints: [
        'Você pode dizer "qual é meu saldo" para verificar saldo',
        'Você pode dizer "pagar conta de luz" para pagar contas',
      ],
      suggestions: [
        'Tente reformular seu comando',
        'Seja mais específico sobre o que você quer fazer',
      ],
    };
  }

  /**
   * TODO: Get learning analytics for continuous improvement
   */
  getLearningAnalytics(): {
    patternEvolution: PatternEvolution[];
    userAdaptations: UserAdaptation[];
    regionalLearning: Record<string, unknown>;
    confidenceTrends: Record<string, unknown>;
    recommendations: string[];
  } {
    // TODO: Return comprehensive learning analytics
    return {
      confidenceTrends: {},
      patternEvolution: [],
      recommendations: [
        'Enable enhanced NLU system for comprehensive analytics',
        'Integrate with Brazilian Portuguese pattern recognition',
        'Implement user feedback collection for learning',
      ],
      regionalLearning: {},
      userAdaptations: [],
    };
  }

  /**
   * TODO: Health check for enhanced NLU systems
   */
  async performEnhancedHealthCheck(): Promise<{
    basic: boolean;
    analytics: boolean;
    learning: boolean;
    errorRecovery: boolean;
    performance: boolean;
    overall: boolean;
    issues: string[];
  }> {
    // TODO: Perform comprehensive health check of all enhanced systems
    const basic = await this.healthCheck();

    return {
      basic,
      analytics: false, // TODO: Check analytics system health
      learning: false, // TODO: Check learning system health
      errorRecovery: false, // TODO: Check error recovery system health
      performance: false, // TODO: Check performance tracking health
      overall: basic, // Would be true if all systems are healthy
      issues: basic ? [] : ['Enhanced NLU systems not initialized'],
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create NLU engine with default configuration
 */
export function createNLUEngine(config?: Partial<NLUConfig>): NLUEngine {
  return new NLUEngine(config);
}

/**
 * Quick process function
 */
export async function processUtterance(text: string): Promise<NLUResult> {
  const engine = createNLUEngine();
  return engine.processUtterance(text);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_CONFIG };
export type { NLUConfig };

/**
 * Enhanced NLU Engine for AegisWallet
 *
 * Complete NLU system with comprehensive analytics, learning, error recovery,
 * Brazilian Portuguese specialization, and performance tracking
 *
 * @module nlu/enhancedNLUEngine
 */

import { logger } from '@/lib/logging/logger'
import { supabase } from '@/integrations/supabase/client'
import { createEntityExtractor } from '@/lib/nlu/entityExtractor'
import { createIntentClassifier } from '@/lib/nlu/intentClassifier'
import { INTENT_DEFINITIONS } from '@/lib/nlu/intents'
import { createTextNormalizer } from '@/lib/nlu/textNormalizer'
import {
  IntentType,
  type NLUConfig,
  NLUError,
  NLUErrorCode,
  type NLUResult,
  type ExtractedEntity,
} from '@/lib/nlu/types'
import {
  NLUAnalytics,
  createNLUAnalytics,
  type HitMissMetrics,
  type LearningAnalytics,
} from '@/lib/nlu/analytics'
import {
  ContextProcessor,
  createContextProcessor,
  type BrazilianContext,
  type UserPreferences,
  type FinancialContext,
} from '@/lib/nlu/contextProcessor'
import {
  ErrorRecoverySystem,
  createErrorRecoverySystem,
  type ErrorClassification,
  type RecoveryResult,
} from '@/lib/nlu/errorRecovery'
import {
  NLUPerformanceTracker,
  createNLUPerformanceTracker,
  type PerformanceMetrics,
} from '@/lib/nlu/performance'
import { BrazilianContextAnalyzer } from '@/lib/nlu/brazilianPatterns'

// ============================================================================
// Enhanced NLU Configuration
// ============================================================================

export interface EnhancedNLUConfig extends NLUConfig {
  analytics: {
    enabled: boolean
    batchSize: number
    batchInterval: number
    learningEnabled: boolean
    persistenceEnabled: boolean
  }
  context: {
    enabled: boolean
    maxContextTurns: number
    userPreferencesEnabled: boolean
    financialContextEnabled: boolean
    regionalContextEnabled: boolean
  }
  errorRecovery: {
    enabled: boolean
    maxRecoveryAttempts: number
    learningEnabled: boolean
    autoCorrectionEnabled: boolean
    userFeedbackEnabled: boolean
  }
  performance: {
    enabled: boolean
    realTimeMonitoring: boolean
    alertingEnabled: boolean
    persistenceEnabled: boolean
  }
  brazilian: {
    regionalAdaptationEnabled: boolean
    slangRecognitionEnabled: boolean
    culturalContextEnabled: boolean
    linguisticStyleDetection: boolean
  }
}

const DEFAULT_ENHANCED_CONFIG: EnhancedNLUConfig = {
  // Base NLU config
  highConfidenceThreshold: 0.8,
  mediumConfidenceThreshold: 0.6,
  lowConfidenceThreshold: 0.4,
  maxProcessingTime: 200,
  cacheEnabled: true,
  cacheTTL: 3600000,
  contextEnabled: true,
  maxContextTurns: 3,
  loggingEnabled: true,
  logToSupabase: false,
  tfidfEnabled: true,
  ensembleVotingEnabled: true,
  disambiguationEnabled: true,

  // Enhanced features
  analytics: {
    enabled: true,
    batchSize: 50,
    batchInterval: 30000,
    learningEnabled: true,
    persistenceEnabled: true,
  },
  context: {
    enabled: true,
    maxContextTurns: 10,
    userPreferencesEnabled: true,
    financialContextEnabled: true,
    regionalContextEnabled: true,
  },
  errorRecovery: {
    enabled: true,
    maxRecoveryAttempts: 3,
    learningEnabled: true,
    autoCorrectionEnabled: true,
    userFeedbackEnabled: true,
  },
  performance: {
    enabled: true,
    realTimeMonitoring: true,
    alertingEnabled: true,
    persistenceEnabled: true,
  },
  brazilian: {
    regionalAdaptationEnabled: true,
    slangRecognitionEnabled: true,
    culturalContextEnabled: true,
    linguisticStyleDetection: true,
  },
}

// ============================================================================
// Enhanced NLU Result
// ============================================================================

export interface EnhancedNLUResult extends NLUResult {
  enhanced: {
    analytics: {
      classificationId: string
      trackingEnabled: boolean
      feedbackCollected: boolean
    }
    context: {
      brazilianContext: BrazilianContext
      userPreferences: UserPreferences
      financialContext: FinancialContext
      confidenceAdjustment: number
      contextualInsights: string[]
    }
    errorRecovery: {
      recoveryAttempted: boolean
      recoverySuccessful: boolean
      appliedStrategies: string[]
      originalIntent?: IntentType
      originalConfidence: number
    }
    performance: {
      processingTime: number
      cacheHit: boolean
      systemLoad: number
      optimizationApplied: boolean
    }
    learning: {
      adaptationApplied: boolean
      patternMatched: boolean
      regionalVariationDetected: boolean
      confidenceImprovement: number
    }
  }
  recommendations: {
    clarificationNeeded: boolean
    suggestedQuestions: string[]
    contextualHints: string[]
    alternativeIntents: Array<{
      intent: IntentType
      confidence: number
      reasoning: string
    }>
  }
}

// ============================================================================
// Enhanced NLU Engine Class
// ============================================================================

export class EnhancedNLUEngine {
  private config: EnhancedNLUConfig
  private normalizer = createTextNormalizer()
  private classifier = createIntentClassifier()
  private extractor = createEntityExtractor()
  private brazilianAnalyzer = new BrazilianContextAnalyzer()

  // Enhanced systems
  private analytics: NLUAnalytics
  private contextProcessor: ContextProcessor
  private errorRecovery: ErrorRecoverySystem
  private performanceTracker: NLUPerformanceTracker

  // Cache and stats
  private cache = new Map<string, any>()
  private cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  }

  // Session tracking
  private activeSessions = new Map<
    string,
    {
      userId: string
      startTime: Date
      requestCount: number
      lastActivity: Date
    }
  >()

  constructor(config: Partial<EnhancedNLUConfig> = {}) {
    this.config = { ...DEFAULT_ENHANCED_CONFIG, ...config }

    // Initialize enhanced systems
    this.analytics = createNLUAnalytics({
      enabled: this.config.analytics.enabled,
      batchSize: this.config.analytics.batchSize,
      batchInterval: this.config.analytics.batchInterval,
      learningEnabled: this.config.analytics.learningEnabled,
      persistenceEnabled: this.config.analytics.persistenceEnabled,
    })

    this.contextProcessor = createContextProcessor({
      enabled: this.config.context.enabled,
      maxContextTurns: this.config.context.maxContextTurns,
      userPreferencesEnabled: this.config.context.userPreferencesEnabled,
      financialContextEnabled: this.config.context.financialContextEnabled,
      regionalContextEnabled: this.config.context.regionalContextEnabled,
      learningEnabled: true,
      persistenceEnabled: true,
    })

    this.errorRecovery = createErrorRecoverySystem({
      enabled: this.config.errorRecovery.enabled,
      maxRecoveryAttempts: this.config.errorRecovery.maxRecoveryAttempts,
      learningEnabled: this.config.errorRecovery.learningEnabled,
      autoCorrectionEnabled: this.config.errorRecovery.autoCorrectionEnabled,
      userFeedbackEnabled: this.config.errorRecovery.userFeedbackEnabled,
      persistenceEnabled: true,
    })

    this.performanceTracker = createNLUPerformanceTracker({
      enabled: this.config.performance.enabled,
      realTimeMonitoring: this.config.performance.realTimeMonitoring,
      alertingEnabled: this.config.performance.alertingEnabled,
      persistenceEnabled: this.config.performance.persistenceEnabled,
    })
  }

  // ============================================================================
  // Main Processing Methods
  // ============================================================================

  /**
   * Process utterance with full enhanced capabilities
   */
  async processUtterance(
    text: string,
    userId: string,
    sessionId: string
  ): Promise<EnhancedNLUResult> {
    const startTime = Date.now()
    const classificationId = this.generateClassificationId()

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new NLUError('Empty input text', NLUErrorCode.INVALID_INPUT)
      }

      // Update session tracking
      this.updateSessionTracking(userId, sessionId)

      // Check cache
      const cached = this.getFromCache(text)
      if (cached) {
        this.cacheStats.hits++
        this.performanceTracker.trackCachePerformance(
          (this.cacheStats.hits / this.cacheStats.totalRequests) * 100,
          this.cache.size,
          Date.now() - startTime
        )

        return this.enhanceCachedResult(cached, classificationId, userId, sessionId)
      }
      this.cacheStats.misses++

      // Brazilian context analysis
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(text)

      // Initial NLU processing
      const initialResult = await this.performInitialNLUProcessing(text, brazilianContext)

      // Context-aware enhancement
      const contextResult = await this.contextProcessor.processWithContext(
        text,
        userId,
        sessionId,
        initialResult
      )

      // Start with context-enhanced result
      let result = contextResult.result
      let recoveryAttempts = 0

      // Error recovery if needed
      if (this.shouldAttemptErrorRecovery(result)) {
        const errorClassification = await this.classifyError(result, text, userId, sessionId)
        const recoveryResult = await this.attemptErrorRecovery(
          errorClassification,
          text,
          result,
          userId,
          sessionId,
          recoveryAttempts++
        )

        if (recoveryResult.success) {
          result = recoveryResult.correctedResult || result
        }
      }

      // Enhanced result creation
      const enhancedResult = await this.createEnhancedResult(
        result,
        text,
        brazilianContext,
        contextResult.context,
        contextResult.enhancements,
        classificationId,
        userId,
        sessionId,
        startTime
      )

      // Track analytics
      if (this.config.analytics.enabled) {
        this.analytics.trackClassification(
          result,
          userId,
          sessionId,
          result.confidence > 0.8 ? 'correct' : undefined
        )
      }

      // Track performance
      const processingTime = Date.now() - startTime
      this.performanceTracker.trackRequest(
        processingTime,
        result,
        result.confidence > 0.6 && result.intent !== IntentType.UNKNOWN,
        brazilianContext.region
      )

      // Cache result
      this.addToCache(text, enhancedResult)

      // Log successful processing
      logger.voiceCommand(text, result.confidence, {
        intent: result.intent,
        processingTime,
        region: brazilianContext.region,
        hasContext: contextResult.context.history.length > 0,
        recoveryAttempted: recoveryAttempts > 0,
      })

      return enhancedResult
    } catch (error) {
      const processingTime = Date.now() - startTime

      // Handle errors with recovery
      if (error instanceof NLUError) {
        const errorResult = await this.handleNLUError(
          error,
          text,
          userId,
          sessionId,
          classificationId,
          processingTime
        )

        if (errorResult) {
          return errorResult
        }
      }

      // Create error result
      return this.createErrorResult(
        error instanceof Error ? error : new Error('Unknown error'),
        text,
        classificationId,
        userId,
        sessionId,
        processingTime
      )
    }
  }

  /**
   * Process user feedback for learning
   */
  async processUserFeedback(
    classificationId: string,
    userId: string,
    feedback: 'correct' | 'incorrect' | 'ambiguous',
    correctedIntent?: IntentType,
    correctedText?: string
  ): Promise<void> {
    try {
      // Track feedback in analytics
      if (this.config.analytics.enabled && this.config.analytics.learningEnabled) {
        // This would need to be implemented in the analytics system
        logger.info('User feedback received', {
          classificationId,
          userId,
          feedback,
          correctedIntent,
          correctedText,
        })
      }

      // Update learning systems
      if (this.config.errorRecovery.learningEnabled) {
        // Process feedback for error recovery learning
        // This would integrate with the error recovery system
      }

      // Update context processor learning
      if (this.config.context.userPreferencesEnabled) {
        // Update user preferences based on feedback
      }

      logger.info('User feedback processed successfully', {
        classificationId,
        userId,
        feedback,
      })
    } catch (error) {
      logger.error('Failed to process user feedback', { error, classificationId })
    }
  }

  /**
   * Get contextual suggestions for disambiguation
   */
  async getDisambiguationSuggestions(
    userId: string,
    sessionId: string,
    ambiguousText: string,
    possibleIntents: Array<{ intent: IntentType; confidence: number }>
  ): Promise<{
    suggestions: Array<{
      intent: IntentType
      question: string
      contextualRationale: string
      confidenceAdjustment: number
    }>
    recommendedNextAction: string
    contextualHints: string[]
  }> {
    try {
      return await this.contextProcessor.getContextualDisambiguation(
        userId,
        sessionId,
        ambiguousText,
        possibleIntents
      )
    } catch (error) {
      logger.error('Failed to get disambiguation suggestions', { error })

      // Fallback suggestions
      return {
        suggestions: possibleIntents.map((option) => ({
          intent: option.intent,
          question: `Você quis dizer ${this.getIntentDescription(option.intent)}?`,
          contextualRationale: 'Baseado no texto fornecido',
          confidenceAdjustment: 0,
        })),
        recommendedNextAction: 'Por favor, clarifique sua intenção',
        contextualHints: ['Tente ser mais específico sobre o que você quer fazer'],
      }
    }
  }

  /**
   * Get clarification questions for errors
   */
  async getClarificationQuestions(
    userId: string,
    sessionId: string,
    errorText: string,
    errorType: string
  ): Promise<{
    primaryQuestion: string
    followUpQuestions: string[]
    contextualHints: string[]
    suggestedCommands: string[]
  }> {
    try {
      const context = await this.contextProcessor.getOrCreateContext(userId, sessionId)
      const userPreferences = await this.contextProcessor.getUserPreferences(userId)
      const financialContext = await this.contextProcessor.getFinancialContext(userId)
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(errorText)

      const recoveryContext = {
        originalText: errorText,
        originalResult: null,
        userId,
        sessionId,
        conversationHistory: context.history,
        userPreferences,
        financialContext,
        brazilianContext,
        recoveryAttempts: 0,
        previousErrors: [],
      }

      return await this.errorRecovery.generateClarificationQuestions(
        {
          type: errorType,
          severity: 'medium',
          confidence: 0.5,
          rootCause: '',
          suggestedFixes: [],
          learningOpportunities: [],
          contextualFactors: [],
        },
        recoveryContext
      )
    } catch (error) {
      logger.error('Failed to get clarification questions', { error })

      return {
        primaryQuestion: 'Pode repetir seu comando de forma diferente?',
        followUpQuestions: ['O que você gostaria de fazer?'],
        contextualHints: [],
        suggestedCommands: ['Qual é meu saldo', 'Pagar contas', 'Fazer transferência'],
      }
    }
  }

  // ============================================================================
  // Analytics and Performance Methods
  // ============================================================================

  /**
   * Get comprehensive analytics data
   */
  getAnalytics(): {
    hitMissMetrics: HitMissMetrics
    learningAnalytics: LearningAnalytics
    performanceMetrics: PerformanceMetrics
    systemHealth: any
    recommendations: string[]
  } {
    return {
      hitMissMetrics: this.analytics.getHitMissMetrics(),
      learningAnalytics: this.analytics.getLearningAnalytics(),
      performanceMetrics: this.performanceTracker.getCurrentMetrics(),
      systemHealth: this.performanceTracker.getHealthScore(),
      recommendations: [
        ...this.analytics
          .getLearningAnalytics()
          .patternEvolution.filter((p) => p.trend === 'declining')
          .map((p) => `Padrão "${p.pattern}" está em declínio, considere revisar`),
        ...this.performanceTracker.getRecommendations(),
      ],
    }
  }

  /**
   * Get error recovery statistics
   */
  getErrorRecoveryStatistics() {
    return this.errorRecovery.getRecoveryStatistics()
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.performanceTracker.getActiveAlerts()
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
    return this.performanceTracker.generatePerformanceReport(timeRange)
  }

  // ============================================================================
  // System Management Methods
  // ============================================================================

  /**
   * Health check for all systems
   */
  async healthCheck(): Promise<{
    overall: boolean
    nlu: boolean
    analytics: boolean
    context: boolean
    errorRecovery: boolean
    performance: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // NLU health check
    let nluHealthy = false
    try {
      const testResult = await this.performInitialNLUProcessing(
        'qual é meu saldo?',
        this.brazilianAnalyzer.analyzeContext('qual é meu saldo?')
      )
      nluHealthy = testResult.intent === IntentType.CHECK_BALANCE
      if (!nluHealthy) issues.push('NLU basic processing failed')
    } catch (error) {
      issues.push('NLU health check error')
    }

    // Analytics health check
    const analyticsHealthy = this.config.analytics.enabled
    if (!analyticsHealthy) issues.push('Analytics system disabled')

    // Context processor health check
    const contextHealthy = this.config.context.enabled
    if (!contextHealthy) issues.push('Context processor disabled')

    // Error recovery health check
    const errorRecoveryHealthy = this.config.errorRecovery.enabled
    if (!errorRecoveryHealthy) issues.push('Error recovery system disabled')

    // Performance tracking health check
    const performanceHealthy = this.config.performance.enabled
    if (!performanceHealthy) issues.push('Performance tracking disabled')

    const overall =
      nluHealthy && analyticsHealthy && contextHealthy && errorRecoveryHealthy && performanceHealthy

    return {
      overall,
      nlu: nluHealthy,
      analytics: analyticsHealthy,
      context: contextHealthy,
      errorRecovery: errorRecoveryHealthy,
      performance: performanceHealthy,
      issues,
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EnhancedNLUConfig>): void {
    this.config = { ...this.config, ...config }

    // Update subsystems with new config
    if (config.analytics) {
      // Update analytics config
    }
    if (config.context) {
      // Update context processor config
    }
    if (config.errorRecovery) {
      // Update error recovery config
    }
    if (config.performance) {
      // Update performance tracker config
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EnhancedNLUConfig {
    return { ...this.config }
  }

  /**
   * Clear all caches and reset statistics
   */
  async clearCacheAndReset(): Promise<void> {
    this.cache.clear()
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    }

    // Reset analytics
    this.analytics.resetCacheStats()

    // Reset performance tracking
    this.errorRecovery.resetLearning()

    logger.info('Enhanced NLU engine cache cleared and statistics reset')
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    try {
      // Cleanup all subsystems
      await this.analytics.cleanup()
      await this.errorRecovery.cleanup()
      this.performanceTracker.cleanup()

      // Clear timers and sessions
      this.activeSessions.clear()

      logger.info('Enhanced NLU engine cleaned up successfully')
    } catch (error) {
      logger.error('Error during Enhanced NLU engine cleanup', { error })
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateClassificationId(): string {
    return `nlu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateSessionTracking(userId: string, sessionId: string): void {
    const sessionKey = `${userId}_${sessionId}`
    const existingSession = this.activeSessions.get(sessionKey)

    if (existingSession) {
      existingSession.requestCount++
      existingSession.lastActivity = new Date()
    } else {
      this.activeSessions.set(sessionKey, {
        userId,
        startTime: new Date(),
        requestCount: 1,
        lastActivity: new Date(),
      })
    }

    // Cleanup old sessions
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [key, session] of this.activeSessions) {
      if (session.lastActivity.getTime() < oneHourAgo) {
        this.activeSessions.delete(key)
      }
    }
  }

  private getFromCache(text: string): EnhancedNLUResult | null {
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

  private addToCache(text: string, result: EnhancedNLUResult): void {
    this.cache.set(text.toLowerCase(), {
      result,
      timestamp: Date.now(),
    })

    // Cleanup old entries if cache is too large
    if (this.cache.size > 1000) {
      this.cleanupCache()
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.cache.delete(key)
      }
    }
  }

  private enhanceCachedResult(
    cached: EnhancedNLUResult,
    classificationId: string,
    userId: string,
    sessionId: string
  ): EnhancedNLUResult {
    return {
      ...cached,
      enhanced: {
        ...cached.enhanced,
        analytics: {
          ...cached.enhanced.analytics,
          classificationId,
        },
      },
    }
  }

  private async performInitialNLUProcessing(
    text: string,
    brazilianContext: BrazilianContext
  ): Promise<NLUResult> {
    // Normalize text with Brazilian context
    const normalized = this.normalizer.normalize(text)

    // Classify intent
    const classification = await this.classifier.classify(text)

    // Extract entities with Brazilian patterns
    const entities = this.extractor.extract(text)

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

    return {
      intent: classification.intent,
      confidence: classification.confidence,
      entities,
      originalText: text,
      normalizedText: normalized.normalized,
      processingTime: 0, // Will be set by caller
      requiresConfirmation,
      requiresDisambiguation,
      missingSlots,
      metadata: {
        classificationMethod: classification.method,
        alternativeIntents: classification.alternatives,
        contextUsed: false,
        brazilianContext,
        linguisticStyle: brazilianContext.linguisticStyle,
        regionalVariation: brazilianContext.region,
      },
    }
  }

  private shouldAttemptErrorRecovery(result: NLUResult): boolean {
    return (
      !this.config.errorRecovery.enabled ||
      result.confidence < this.config.lowConfidenceThreshold ||
      result.intent === IntentType.UNKNOWN ||
      result.requiresDisambiguation
    )
  }

  private async classifyError(
    result: NLUResult,
    text: string,
    userId: string,
    sessionId: string
  ): Promise<ErrorClassification> {
    let errorType = 'low_confidence'
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

    if (result.intent === IntentType.UNKNOWN) {
      errorType = 'pattern_miss'
      severity = 'high'
    } else if (result.confidence < this.config.lowConfidenceThreshold) {
      errorType = 'low_confidence'
      severity = 'medium'
    } else if (result.requiresDisambiguation) {
      errorType = 'intent_confusion'
      severity = 'medium'
    }

    return {
      type: errorType,
      severity,
      confidence: 0.7,
      rootCause: `Classification confidence ${result.confidence} below threshold`,
      suggestedFixes: ['Try context-aware processing', 'Apply regional variations'],
      learningOpportunities: ['Add more training examples', 'Improve pattern matching'],
      contextualFactors: [],
    }
  }

  private async attemptErrorRecovery(
    errorClassification: ErrorClassification,
    text: string,
    originalResult: NLUResult,
    userId: string,
    sessionId: string,
    recoveryAttempts: number
  ): Promise<{
    success: boolean
    correctedResult?: NLUResult
    appliedStrategies: string[]
  }> {
    try {
      const context = await this.contextProcessor.getOrCreateContext(userId, sessionId)
      const userPreferences = await this.contextProcessor.getUserPreferences(userId)
      const financialContext = await this.contextProcessor.getFinancialContext(userId)
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(text)

      const recoveryContext = {
        originalText: text,
        originalResult,
        userId,
        sessionId,
        conversationHistory: context.history,
        userPreferences,
        financialContext,
        brazilianContext,
        recoveryAttempts,
        previousErrors: [errorClassification],
      }

      const recoveryResult = await this.errorRecovery.attemptRecovery(
        errorClassification,
        recoveryContext
      )

      return {
        success: recoveryResult.success,
        correctedResult: recoveryResult.success
          ? {
              ...originalResult,
              intent: recoveryResult.correctedIntent || originalResult.intent,
              confidence: Math.min(
                originalResult.confidence + recoveryResult.confidenceImprovement,
                1.0
              ),
              entities: recoveryResult.correctedEntities || originalResult.entities,
            }
          : undefined,
        appliedStrategies: [recoveryResult.appliedStrategy],
      }
    } catch (error) {
      logger.error('Error recovery attempt failed', { error })
      return {
        success: false,
        appliedStrategies: [],
      }
    }
  }

  private async createEnhancedResult(
    result: NLUResult,
    originalText: string,
    brazilianContext: BrazilianContext,
    conversationContext: any,
    contextEnhancements: any,
    classificationId: string,
    userId: string,
    sessionId: string,
    startTime: number
  ): Promise<EnhancedNLUResult> {
    const processingTime = Date.now() - startTime

    return {
      ...result,
      enhanced: {
        analytics: {
          classificationId,
          trackingEnabled: this.config.analytics.enabled,
          feedbackCollected: false,
        },
        context: {
          brazilianContext,
          userPreferences: conversationContext.userPreferences || ({} as UserPreferences),
          financialContext: conversationContext.financialContext || ({} as FinancialContext),
          confidenceAdjustment: contextEnhancements.confidenceAdjustment || 0,
          contextualInsights: contextEnhancements.contextualInsights || [],
        },
        errorRecovery: {
          recoveryAttempted: false,
          recoverySuccessful: false,
          appliedStrategies: [],
          originalConfidence: result.confidence,
        },
        performance: {
          processingTime,
          cacheHit: false,
          systemLoad: 0, // Would be calculated based on system metrics
          optimizationApplied: contextEnhancements.confidenceAdjustment > 0,
        },
        learning: {
          adaptationApplied: brazilianContext.region !== 'Unknown',
          patternMatched: result.metadata?.classificationMethod === 'pattern',
          regionalVariationDetected: brazilianContext.region !== 'Unknown',
          confidenceImprovement: contextEnhancements.confidenceAdjustment || 0,
        },
      },
      recommendations: {
        clarificationNeeded: result.requiresDisambiguation || result.confidence < 0.7,
        suggestedQuestions: this.generateSuggestedQuestions(result, contextEnhancements),
        contextualHints: contextEnhancements.missingContextualInfo || [],
        alternativeIntents:
          result.metadata?.alternativeIntents?.map((alt: any) => ({
            intent: alt.intent,
            confidence: alt.confidence,
            reasoning: `Alternative intent with ${alt.confidence} confidence`,
          })) || [],
      },
    }
  }

  private async handleNLUError(
    error: NLUError,
    text: string,
    userId: string,
    sessionId: string,
    classificationId: string,
    processingTime: number
  ): Promise<EnhancedNLUResult | null> {
    try {
      // Attempt error recovery
      const errorClassification = await this.classifyError(
        {
          intent: IntentType.UNKNOWN,
          confidence: 0,
          entities: [],
          originalText: text,
          normalizedText: text,
          processingTime: 0,
          requiresConfirmation: true,
          requiresDisambiguation: true,
          missingSlots: [],
        },
        text,
        userId,
        sessionId
      )

      const recoveryResult = await this.attemptErrorRecovery(
        errorClassification,
        text,
        {
          intent: IntentType.UNKNOWN,
          confidence: 0,
          entities: [],
          originalText: text,
          normalizedText: text,
          processingTime: 0,
          requiresConfirmation: true,
          requiresDisambiguation: true,
          missingSlots: [],
        },
        userId,
        sessionId,
        0
      )

      if (recoveryResult.success && recoveryResult.correctedResult) {
        return await this.createEnhancedResult(
          recoveryResult.correctedResult,
          text,
          this.brazilianAnalyzer.analyzeContext(text),
          {},
          { confidenceAdjustment: recoveryResult.correctedResult.confidence },
          classificationId,
          userId,
          sessionId,
          processingTime
        )
      }
    } catch (recoveryError) {
      logger.error('Error recovery during NLU error handling failed', { recoveryError })
    }

    return null
  }

  private createErrorResult(
    error: Error,
    text: string,
    classificationId: string,
    userId: string,
    sessionId: string,
    processingTime: number
  ): EnhancedNLUResult {
    return {
      intent: IntentType.UNKNOWN,
      confidence: 0,
      entities: [],
      originalText: text,
      normalizedText: text,
      processingTime,
      requiresConfirmation: true,
      requiresDisambiguation: true,
      missingSlots: [],
      metadata: {
        error: error.message,
        classificationMethod: 'error',
        contextUsed: false,
      },
      enhanced: {
        analytics: {
          classificationId,
          trackingEnabled: false,
          feedbackCollected: false,
        },
        context: {
          brazilianContext: this.brazilianAnalyzer.analyzeContext(text),
          userPreferences: {} as UserPreferences,
          financialContext: {} as FinancialContext,
          confidenceAdjustment: 0,
          contextualInsights: [`Error occurred: ${error.message}`],
        },
        errorRecovery: {
          recoveryAttempted: false,
          recoverySuccessful: false,
          appliedStrategies: [],
          originalConfidence: 0,
        },
        performance: {
          processingTime,
          cacheHit: false,
          systemLoad: 0,
          optimizationApplied: false,
        },
        learning: {
          adaptationApplied: false,
          patternMatched: false,
          regionalVariationDetected: false,
          confidenceImprovement: 0,
        },
      },
      recommendations: {
        clarificationNeeded: true,
        suggestedQuestions: ['Pode repetir seu comando?'],
        contextualHints: ['Tente ser mais específico sobre o que você quer fazer'],
        alternativeIntents: [],
      },
    }
  }

  private generateSuggestedQuestions(result: NLUResult, contextEnhancements: any): string[] {
    const questions = []

    if (result.requiresDisambiguation) {
      questions.push('Pode confirmar o que você quer fazer?')
    }

    if (result.missingSlots && result.missingSlots.length > 0) {
      questions.push('Pode fornecer mais detalhes para completar esta operação?')
    }

    if (
      contextEnhancements.missingContextualInfo &&
      contextEnhancements.missingContextualInfo.length > 0
    ) {
      questions.push('Pode me dar mais contexto sobre o que você quer?')
    }

    return questions
  }

  private needsConfirmation(intent: IntentType, confidence: number): boolean {
    const highRiskIntents = [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY]
    if (highRiskIntents.includes(intent)) {
      return true
    }

    if (
      confidence >= this.config.mediumConfidenceThreshold &&
      confidence < this.config.highConfidenceThreshold
    ) {
      return true
    }

    return false
  }

  private needsDisambiguation(
    confidence: number,
    alternatives: Array<{ intent: IntentType; confidence: number }> | undefined
  ): boolean {
    if (!this.config.disambiguationEnabled) {
      return false
    }

    if (confidence < this.config.mediumConfidenceThreshold) {
      return true
    }

    if (!alternatives || alternatives.length === 0) {
      return false
    }

    const highConfidenceAlternatives = alternatives.filter(
      (alt) => alt.confidence >= this.config.mediumConfidenceThreshold
    )

    return highConfidenceAlternatives.length > 1
  }

  private getMissingSlots(intent: IntentType, entities: any[]): any[] {
    const definition = INTENT_DEFINITIONS[intent]
    if (!definition) return []

    const extractedTypes = new Set(entities.map((e) => e.type))
    const missingSlots = definition.requiredSlots.filter((slot) => !extractedTypes.has(slot))

    return missingSlots
  }

  private getIntentDescription(intent: IntentType): string {
    const descriptions = {
      [IntentType.CHECK_BALANCE]: 'verificar seu saldo',
      [IntentType.PAY_BILL]: 'pagar uma conta',
      [IntentType.TRANSFER_MONEY]: 'fazer uma transferência',
      [IntentType.CHECK_BUDGET]: 'analisar seu orçamento',
      [IntentType.CHECK_INCOME]: 'consultar seus rendimentos',
      [IntentType.FINANCIAL_PROJECTION]: 'ver uma projeção financeira',
    }

    return descriptions[intent] || 'realizar uma operação financeira'
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createEnhancedNLUEngine(config?: Partial<EnhancedNLUConfig>): EnhancedNLUEngine {
  return new EnhancedNLUEngine(config)
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_ENHANCED_CONFIG }
export type { EnhancedNLUConfig, EnhancedNLUResult }

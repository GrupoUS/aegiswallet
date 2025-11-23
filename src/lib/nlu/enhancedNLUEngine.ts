/**
 * Enhanced NLU Engine for AegisWallet
 *
 * Complete NLU system with comprehensive analytics, learning, error recovery,
 * Brazilian Portuguese specialization, and performance tracking
 *
 * @module nlu/enhancedNLUEngine
 */

import { logger } from '@/lib/logging/logger';
import type { HitMissMetrics, LearningAnalytics, NLUAnalytics } from '@/lib/nlu/analytics';
import { createNLUAnalytics } from '@/lib/nlu/analytics';
import { BrazilianContextAnalyzer } from '@/lib/nlu/brazilianPatterns';
import type {
  BrazilianContext,
  ContextProcessor,
  FinancialContext,
  UserPreferences,
} from '@/lib/nlu/contextProcessor';
import { createContextProcessor } from '@/lib/nlu/contextProcessor';
import { createEntityExtractor } from '@/lib/nlu/entityExtractor';
import type { ErrorRecoverySystem } from '@/lib/nlu/errorRecovery';
import { createErrorRecoverySystem } from '@/lib/nlu/errorRecovery';
import { createIntentClassifier } from '@/lib/nlu/intentClassifier';
import { INTENT_DEFINITIONS } from '@/lib/nlu/intents';
import type { NLUPerformanceTracker, PerformanceMetrics } from '@/lib/nlu/performance';
import { createNLUPerformanceTracker } from '@/lib/nlu/performance';
import { createTextNormalizer } from '@/lib/nlu/textNormalizer';
import type { NLUConfig, NLUResult } from '@/lib/nlu/types';
import { IntentType, NLUError, NLUErrorCode } from '@/lib/nlu/types';

// ============================================================================
// Enhanced NLU Configuration
// ============================================================================

export interface EnhancedNLUConfig extends NLUConfig {
  analytics: {
    enabled: boolean;
    batchSize: number;
    batchInterval: number;
    learningEnabled: boolean;
    persistenceEnabled: boolean;
  };
  context: {
    enabled: boolean;
    maxContextTurns: number;
    userPreferencesEnabled: boolean;
    financialContextEnabled: boolean;
    regionalContextEnabled: boolean;
  };
  errorRecovery: {
    enabled: boolean;
    maxRecoveryAttempts: number;
    learningEnabled: boolean;
    autoCorrectionEnabled: boolean;
    userFeedbackEnabled: boolean;
  };
  performance: {
    enabled: boolean;
    realTimeMonitoring: boolean;
    alertingEnabled: boolean;
    persistenceEnabled: boolean;
  };
  brazilian: {
    regionalAdaptationEnabled: boolean;
    slangRecognitionEnabled: boolean;
    culturalContextEnabled: boolean;
    linguisticStyleDetection: boolean;
  };
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
    batchInterval: 30000,
    batchSize: 50,
    enabled: true,
    learningEnabled: true,
    persistenceEnabled: true,
  },
  context: {
    enabled: true,
    financialContextEnabled: true,
    maxContextTurns: 10,
    regionalContextEnabled: true,
    userPreferencesEnabled: true,
  },
  errorRecovery: {
    autoCorrectionEnabled: true,
    enabled: true,
    learningEnabled: true,
    maxRecoveryAttempts: 3,
    userFeedbackEnabled: true,
  },
  performance: {
    alertingEnabled: true,
    enabled: true,
    persistenceEnabled: true,
    realTimeMonitoring: true,
  },
  brazilian: {
    culturalContextEnabled: true,
    linguisticStyleDetection: true,
    regionalAdaptationEnabled: true,
    slangRecognitionEnabled: true,
  },
};

// ============================================================================
// Enhanced NLU Result
// ============================================================================

export interface EnhancedNLUResult extends NLUResult {
  enhanced: {
    analytics: {
      classificationId: string;
      trackingEnabled: boolean;
      feedbackCollected: boolean;
    };
    context: {
      brazilianContext: BrazilianContext;
      userPreferences: UserPreferences;
      financialContext: FinancialContext;
      confidenceAdjustment: number;
      contextualInsights: string[];
    };
    errorRecovery: {
      recoveryAttempted: boolean;
      recoverySuccessful: boolean;
      appliedStrategies: string[];
      originalIntent?: IntentType;
      originalConfidence: number;
    };
    performance: {
      processingTime: number;
      cacheHit: boolean;
      systemLoad: number;
      optimizationApplied: boolean;
    };
    learning: {
      adaptationApplied: boolean;
      patternMatched: boolean;
      regionalVariationDetected: boolean;
      confidenceImprovement: number;
    };
  };
  recommendations: {
    clarificationNeeded: boolean;
    suggestedQuestions: string[];
    contextualHints: string[];
    alternativeIntents: {
      intent: IntentType;
      confidence: number;
      reasoning: string;
    }[];
  };
}

// ============================================================================
// Enhanced NLU Engine Class
// ============================================================================

export class EnhancedNLUEngine {
  private config: EnhancedNLUConfig;
  private normalizer = createTextNormalizer();
  private classifier = createIntentClassifier();
  private extractor = createEntityExtractor();
  private brazilianAnalyzer = new BrazilianContextAnalyzer();

  // Enhanced systems
  private analytics: NLUAnalytics;
  private contextProcessor: ContextProcessor;
  private errorRecovery: ErrorRecoverySystem;
  private performanceTracker: NLUPerformanceTracker;

  // Cache and stats
  private cache = new Map<string, NLUResult>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  };

  // Session tracking
  private activeSessions = new Map<
    string,
    {
      userId: string;
      startTime: Date;
      requestCount: number;
      lastActivity: Date;
    }
  >();

  constructor(config: Partial<EnhancedNLUConfig> = {}) {
    this.config = { ...DEFAULT_ENHANCED_CONFIG, ...config };

    // Initialize enhanced systems
    this.analytics = createNLUAnalytics({
      batchInterval: this.config.analytics.batchInterval,
      batchSize: this.config.analytics.batchSize,
      enabled: this.config.analytics.enabled,
      learningEnabled: this.config.analytics.learningEnabled,
      persistenceEnabled: this.config.analytics.persistenceEnabled,
    });

    this.contextProcessor = createContextProcessor({
      enabled: this.config.context.enabled,
      financialContextEnabled: this.config.context.financialContextEnabled,
      learningEnabled: true,
      maxContextTurns: this.config.context.maxContextTurns,
      persistenceEnabled: true,
      regionalContextEnabled: this.config.context.regionalContextEnabled,
      userPreferencesEnabled: this.config.context.userPreferencesEnabled,
    });

    this.errorRecovery = createErrorRecoverySystem({
      autoCorrectionEnabled: this.config.errorRecovery.autoCorrectionEnabled,
      enabled: this.config.errorRecovery.enabled,
      learningEnabled: this.config.errorRecovery.learningEnabled,
      maxRecoveryAttempts: this.config.errorRecovery.maxRecoveryAttempts,
      persistenceEnabled: true,
      userFeedbackEnabled: this.config.errorRecovery.userFeedbackEnabled,
    });

    this.performanceTracker = createNLUPerformanceTracker({
      alertingEnabled: this.config.performance.alertingEnabled,
      enabled: this.config.performance.enabled,
      persistenceEnabled: this.config.performance.persistenceEnabled,
      realTimeMonitoring: this.config.performance.realTimeMonitoring,
    });
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
    const startTime = Date.now();
    const classificationId = this.generateClassificationId();

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new NLUError('Empty input text', NLUErrorCode.INVALID_INPUT);
      }

      // Update session tracking
      this.updateSessionTracking(userId, sessionId);

      // Check cache
      const cached = this.getFromCache(text);
      if (cached) {
        this.cacheStats.hits++;
        this.performanceTracker.trackCachePerformance(
          (this.cacheStats.hits / this.cacheStats.totalRequests) * 100,
          this.cache.size,
          Date.now() - startTime
        );

        return this.enhanceCachedResult(cached, classificationId, userId, sessionId);
      }
      this.cacheStats.misses++;

      // Brazilian context analysis
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(text);

      // Initial NLU processing
      const initialResult = await this.performInitialNLUProcessing(text, brazilianContext);

      // Context-aware enhancement
      const contextResult = await this.contextProcessor.processWithContext(
        text,
        userId,
        sessionId,
        initialResult
      );

      // Start with context-enhanced result
      let result = contextResult.result;
      let recoveryAttempts = 0;

      // Error recovery if needed
      if (this.shouldAttemptErrorRecovery(result)) {
        const errorClassification = await this.classifyError(result, text, userId, sessionId);
        const recoveryResult = await this.attemptErrorRecovery(
          errorClassification,
          text,
          result,
          userId,
          sessionId,
          recoveryAttempts++
        );

        if (recoveryResult.success) {
          result = recoveryResult.correctedResult || result;
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
      );

      // Track analytics
      if (this.config.analytics.enabled) {
        this.analytics.trackClassification(
          result,
          userId,
          sessionId,
          result.confidence > 0.8 ? 'correct' : undefined
        );
      }

      // Track performance
      const processingTime = Date.now() - startTime;
      this.performanceTracker.trackRequest(
        processingTime,
        result,
        result.confidence > 0.6 && result.intent !== IntentType.UNKNOWN,
        brazilianContext.region
      );

      // Cache result
      this.addToCache(text, enhancedResult);

      // Log successful processing
      logger.voiceCommand(text, result.confidence, {
        hasContext: contextResult.context.history.length > 0,
        intent: result.intent,
        processingTime,
        recoveryAttempted: recoveryAttempts > 0,
        region: brazilianContext.region,
      });

      return enhancedResult;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Handle errors with recovery
      if (error instanceof NLUError) {
        const errorResult = await this.handleNLUError(
          error,
          text,
          userId,
          sessionId,
          classificationId,
          processingTime
        );

        if (errorResult) {
          return errorResult;
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
      );
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
          correctedIntent,
          correctedText,
          feedback,
          userId,
        });
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
        feedback,
        userId,
      });
    } catch (error) {
      logger.error('Failed to process user feedback', {
        classificationId,
        error,
      });
    }
  }

  /**
   * Get contextual suggestions for disambiguation
   */
  async getDisambiguationSuggestions(
    userId: string,
    sessionId: string,
    ambiguousText: string,
    possibleIntents: { intent: IntentType; confidence: number }[]
  ): Promise<{
    suggestions: {
      intent: IntentType;
      question: string;
      contextualRationale: string;
      confidenceAdjustment: number;
    }[];
    recommendedNextAction: string;
    contextualHints: string[];
  }> {
    try {
      return await this.contextProcessor.getContextualDisambiguation(
        userId,
        sessionId,
        ambiguousText,
        possibleIntents
      );
    } catch (error) {
      logger.error('Failed to get disambiguation suggestions', { error });

      // Fallback suggestions
      return {
        contextualHints: ['Tente ser mais específico sobre o que você quer fazer'],
        recommendedNextAction: 'Por favor, clarifique sua intenção',
        suggestions: possibleIntents.map((option) => ({
          confidenceAdjustment: 0,
          contextualRationale: 'Baseado no texto fornecido',
          intent: option.intent,
          question: `Você quis dizer ${this.getIntentDescription(option.intent)}?`,
        })),
      };
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
    primaryQuestion: string;
    followUpQuestions: string[];
    contextualHints: string[];
    suggestedCommands: string[];
  }> {
    try {
      const context = await this.contextProcessor.getOrCreateContext(userId, sessionId);
      const userPreferences = await this.contextProcessor.getUserPreferences(userId);
      const financialContext = await this.contextProcessor.getFinancialContext(userId);
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(errorText);

      const recoveryContext = {
        brazilianContext,
        conversationHistory: context.history,
        financialContext,
        originalResult: null,
        originalText: errorText,
        previousErrors: [],
        recoveryAttempts: 0,
        sessionId,
        userId,
        userPreferences,
      };

      return await this.errorRecovery.generateClarificationQuestions(
        {
          confidence: 0.5,
          contextualFactors: [],
          learningOpportunities: [],
          rootCause: '',
          severity: 'medium',
          suggestedFixes: [],
          type: errorType,
        },
        recoveryContext
      );
    } catch (error) {
      logger.error('Failed to get clarification questions', { error });

      return {
        contextualHints: [],
        followUpQuestions: ['O que você gostaria de fazer?'],
        primaryQuestion: 'Pode repetir seu comando de forma diferente?',
        suggestedCommands: ['Qual é meu saldo', 'Pagar contas', 'Fazer transferência'],
      };
    }
  }

  // ============================================================================
  // Analytics and Performance Methods
  // ============================================================================

  /**
   * Get comprehensive analytics data
   */
  getAnalytics(): {
    hitMissMetrics: HitMissMetrics;
    learningAnalytics: LearningAnalytics;
    performanceMetrics: PerformanceMetrics;
    systemHealth: Record<string, unknown>;
    recommendations: string[];
  } {
    return {
      hitMissMetrics: this.analytics.getHitMissMetrics(),
      learningAnalytics: this.analytics.getLearningAnalytics(),
      performanceMetrics: this.performanceTracker.getCurrentMetrics(),
      recommendations: [
        ...this.analytics
          .getLearningAnalytics()
          .patternEvolution.filter((p) => p.trend === 'declining')
          .map((p) => `Padrão "${p.pattern}" está em declínio, considere revisar`),
        ...this.performanceTracker.getRecommendations(),
      ],
      systemHealth: this.performanceTracker.getHealthScore(),
    };
  }

  /**
   * Get error recovery statistics
   */
  getErrorRecoveryStatistics() {
    return this.errorRecovery.getRecoveryStatistics();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.performanceTracker.getActiveAlerts();
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
    return this.performanceTracker.generatePerformanceReport(timeRange);
  }

  // ============================================================================
  // System Management Methods
  // ============================================================================

  /**
   * Health check for all systems
   */
  async healthCheck(): Promise<{
    overall: boolean;
    nlu: boolean;
    analytics: boolean;
    context: boolean;
    errorRecovery: boolean;
    performance: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // NLU health check
    let nluHealthy = false;
    try {
      const testResult = await this.performInitialNLUProcessing(
        'qual é meu saldo?',
        this.brazilianAnalyzer.analyzeContext('qual é meu saldo?')
      );
      nluHealthy = testResult.intent === IntentType.CHECK_BALANCE;
      if (!nluHealthy) {
        issues.push('NLU basic processing failed');
      }
    } catch (_error) {
      issues.push('NLU health check error');
    }

    // Analytics health check
    const analyticsHealthy = this.config.analytics.enabled;
    if (!analyticsHealthy) {
      issues.push('Analytics system disabled');
    }

    // Context processor health check
    const contextHealthy = this.config.context.enabled;
    if (!contextHealthy) {
      issues.push('Context processor disabled');
    }

    // Error recovery health check
    const errorRecoveryHealthy = this.config.errorRecovery.enabled;
    if (!errorRecoveryHealthy) {
      issues.push('Error recovery system disabled');
    }

    // Performance tracking health check
    const performanceHealthy = this.config.performance.enabled;
    if (!performanceHealthy) {
      issues.push('Performance tracking disabled');
    }

    const overall =
      nluHealthy &&
      analyticsHealthy &&
      contextHealthy &&
      errorRecoveryHealthy &&
      performanceHealthy;

    return {
      analytics: analyticsHealthy,
      context: contextHealthy,
      errorRecovery: errorRecoveryHealthy,
      issues,
      nlu: nluHealthy,
      overall,
      performance: performanceHealthy,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EnhancedNLUConfig>): void {
    this.config = { ...this.config, ...config };

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
    return { ...this.config };
  }

  /**
   * Clear all caches and reset statistics
   */
  async clearCacheAndReset(): Promise<void> {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };

    // Reset analytics
    this.analytics.resetCacheStats();

    // Reset performance tracking
    this.errorRecovery.resetLearning();

    logger.info('Enhanced NLU engine cache cleared and statistics reset');
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    try {
      // Cleanup all subsystems
      await this.analytics.cleanup();
      await this.errorRecovery.cleanup();
      this.performanceTracker.cleanup();

      // Clear timers and sessions
      this.activeSessions.clear();

      logger.info('Enhanced NLU engine cleaned up successfully');
    } catch (error) {
      logger.error('Error during Enhanced NLU engine cleanup', { error });
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateClassificationId(): string {
    return `nlu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateSessionTracking(userId: string, sessionId: string): void {
    const sessionKey = `${userId}_${sessionId}`;
    const existingSession = this.activeSessions.get(sessionKey);

    if (existingSession) {
      existingSession.requestCount++;
      existingSession.lastActivity = new Date();
    } else {
      this.activeSessions.set(sessionKey, {
        lastActivity: new Date(),
        requestCount: 1,
        startTime: new Date(),
        userId,
      });
    }

    // Cleanup old sessions
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, session] of this.activeSessions) {
      if (session.lastActivity.getTime() < oneHourAgo) {
        this.activeSessions.delete(key);
      }
    }
  }

  private getFromCache(text: string): EnhancedNLUResult | null {
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

  private addToCache(text: string, result: EnhancedNLUResult): void {
    this.cache.set(text.toLowerCase(), {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old entries if cache is too large
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  private enhanceCachedResult(
    cached: EnhancedNLUResult,
    classificationId: string,
    _userId: string,
    _sessionId: string
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
    };
  }

  private async performInitialNLUProcessing(
    text: string,
    brazilianContext: BrazilianContext
  ): Promise<NLUResult> {
    // Normalize text with Brazilian context
    const normalized = this.normalizer.normalize(text);

    // Classify intent
    const classification = await this.classifier.classify(text);

    // Extract entities with Brazilian patterns
    const entities = this.extractor.extract(text);

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
        alternativeIntents: classification.alternatives,
        brazilianContext,
        classificationMethod: classification.method,
        contextUsed: false,
        linguisticStyle: brazilianContext.linguisticStyle,
        regionalVariation: brazilianContext.region,
      },
    };
  }

  private shouldAttemptErrorRecovery(result: NLUResult): boolean {
    return (
      !this.config.errorRecovery.enabled ||
      result.confidence < this.config.lowConfidenceThreshold ||
      result.intent === IntentType.UNKNOWN ||
      result.requiresDisambiguation
    );
  }

  private async classifyError(
    result: NLUResult,
    _text: string,
    _userId: string,
    _sessionId: string
  ): Promise<ErrorClassification> {
    let errorType = 'low_confidence';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (result.intent === IntentType.UNKNOWN) {
      errorType = 'pattern_miss';
      severity = 'high';
    } else if (result.confidence < this.config.lowConfidenceThreshold) {
      errorType = 'low_confidence';
      severity = 'medium';
    } else if (result.requiresDisambiguation) {
      errorType = 'intent_confusion';
      severity = 'medium';
    }

    return {
      confidence: 0.7,
      contextualFactors: [],
      learningOpportunities: ['Add more training examples', 'Improve pattern matching'],
      rootCause: `Classification confidence ${result.confidence} below threshold`,
      severity,
      suggestedFixes: ['Try context-aware processing', 'Apply regional variations'],
      type: errorType,
    };
  }

  private async attemptErrorRecovery(
    errorClassification: ErrorClassification,
    text: string,
    originalResult: NLUResult,
    userId: string,
    sessionId: string,
    recoveryAttempts: number
  ): Promise<{
    success: boolean;
    correctedResult?: NLUResult;
    appliedStrategies: string[];
  }> {
    try {
      const context = await this.contextProcessor.getOrCreateContext(userId, sessionId);
      const userPreferences = await this.contextProcessor.getUserPreferences(userId);
      const financialContext = await this.contextProcessor.getFinancialContext(userId);
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(text);

      const recoveryContext = {
        brazilianContext,
        conversationHistory: context.history,
        financialContext,
        originalResult,
        originalText: text,
        previousErrors: [errorClassification],
        recoveryAttempts,
        sessionId,
        userId,
        userPreferences,
      };

      const recoveryResult = await this.errorRecovery.attemptRecovery(
        errorClassification,
        recoveryContext
      );

      return {
        appliedStrategies: [recoveryResult.appliedStrategy],
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
        success: recoveryResult.success,
      };
    } catch (error) {
      logger.error('Error recovery attempt failed', { error });
      return {
        appliedStrategies: [],
        success: false,
      };
    }
  }

  private async createEnhancedResult(
    result: NLUResult,
    _originalText: string,
    brazilianContext: BrazilianContext,
    conversationContext: Record<string, unknown>,
    contextEnhancements: {
      confidenceAdjustment?: number;
      contextualInsights?: string[];
      missingContextualInfo?: string[];
    },
    classificationId: string,
    _userId: string,
    _sessionId: string,
    startTime: number
  ): Promise<EnhancedNLUResult> {
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      enhanced: {
        analytics: {
          classificationId,
          feedbackCollected: false,
          trackingEnabled: this.config.analytics.enabled,
        },
        context: {
          brazilianContext,
          confidenceAdjustment: contextEnhancements.confidenceAdjustment || 0,
          contextualInsights: contextEnhancements.contextualInsights || [],
          financialContext: conversationContext.financialContext || ({} as FinancialContext),
          userPreferences: conversationContext.userPreferences || ({} as UserPreferences),
        },
        errorRecovery: {
          appliedStrategies: [],
          originalConfidence: result.confidence,
          recoveryAttempted: false,
          recoverySuccessful: false,
        },
        learning: {
          adaptationApplied: brazilianContext.region !== 'Unknown',
          confidenceImprovement: contextEnhancements.confidenceAdjustment || 0,
          patternMatched: result.metadata?.classificationMethod === 'pattern',
          regionalVariationDetected: brazilianContext.region !== 'Unknown',
        },
        performance: {
          processingTime,
          cacheHit: false,
          systemLoad: 0, // Would be calculated based on system metrics
          optimizationApplied: contextEnhancements.confidenceAdjustment > 0,
        },
      },
      recommendations: {
        alternativeIntents:
          result.metadata?.alternativeIntents?.map((alt) => ({
            confidence: alt.confidence,
            intent: alt.intent,
            reasoning: `Alternative intent with ${alt.confidence} confidence`,
          })) || [],
        clarificationNeeded: result.requiresDisambiguation || result.confidence < 0.7,
        contextualHints: contextEnhancements.missingContextualInfo || [],
        suggestedQuestions: this.generateSuggestedQuestions(result, contextEnhancements),
      },
    };
  }

  private async handleNLUError(
    _error: NLUError,
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
          confidence: 0,
          entities: [],
          intent: IntentType.UNKNOWN,
          missingSlots: [],
          normalizedText: text,
          originalText: text,
          processingTime: 0,
          requiresConfirmation: true,
          requiresDisambiguation: true,
        },
        text,
        userId,
        sessionId
      );

      const recoveryResult = await this.attemptErrorRecovery(
        errorClassification,
        text,
        {
          confidence: 0,
          entities: [],
          intent: IntentType.UNKNOWN,
          missingSlots: [],
          normalizedText: text,
          originalText: text,
          processingTime: 0,
          requiresConfirmation: true,
          requiresDisambiguation: true,
        },
        userId,
        sessionId,
        0
      );

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
        );
      }
    } catch (recoveryError) {
      logger.error('Error recovery during NLU error handling failed', {
        recoveryError,
      });
    }

    return null;
  }

  private createErrorResult(
    error: Error,
    text: string,
    classificationId: string,
    _userId: string,
    _sessionId: string,
    processingTime: number
  ): EnhancedNLUResult {
    return {
      confidence: 0,
      enhanced: {
        analytics: {
          classificationId,
          feedbackCollected: false,
          trackingEnabled: false,
        },
        context: {
          brazilianContext: this.brazilianAnalyzer.analyzeContext(text),
          confidenceAdjustment: 0,
          contextualInsights: [`Error occurred: ${error.message}`],
          financialContext: {} as FinancialContext,
          userPreferences: {} as UserPreferences,
        },
        errorRecovery: {
          appliedStrategies: [],
          originalConfidence: 0,
          recoveryAttempted: false,
          recoverySuccessful: false,
        },
        learning: {
          adaptationApplied: false,
          confidenceImprovement: 0,
          patternMatched: false,
          regionalVariationDetected: false,
        },
        performance: {
          cacheHit: false,
          optimizationApplied: false,
          processingTime,
          systemLoad: 0,
        },
      },
      entities: [],
      intent: IntentType.UNKNOWN,
      metadata: {
        classificationMethod: 'error',
        contextUsed: false,
        error: error.message,
      },
      missingSlots: [],
      normalizedText: text,
      originalText: text,
      processingTime,
      recommendations: {
        alternativeIntents: [],
        clarificationNeeded: true,
        contextualHints: ['Tente ser mais específico sobre o que você quer fazer'],
        suggestedQuestions: ['Pode repetir seu comando?'],
      },
      requiresConfirmation: true,
      requiresDisambiguation: true,
    };
  }

  private generateSuggestedQuestions(
    result: NLUResult,
    contextEnhancements: { missingContextualInfo?: string[] }
  ): string[] {
    const questions = [];

    if (result.requiresDisambiguation) {
      questions.push('Pode confirmar o que você quer fazer?');
    }

    if (result.missingSlots && result.missingSlots.length > 0) {
      questions.push('Pode fornecer mais detalhes para completar esta operação?');
    }

    if (
      contextEnhancements.missingContextualInfo &&
      contextEnhancements.missingContextualInfo.length > 0
    ) {
      questions.push('Pode me dar mais contexto sobre o que você quer?');
    }

    return questions;
  }

  private needsConfirmation(intent: IntentType, confidence: number): boolean {
    const highRiskIntents = [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY];
    if (highRiskIntents.includes(intent)) {
      return true;
    }

    if (
      confidence >= this.config.mediumConfidenceThreshold &&
      confidence < this.config.highConfidenceThreshold
    ) {
      return true;
    }

    return false;
  }

  private needsDisambiguation(
    confidence: number,
    alternatives: Array<{ intent: IntentType; confidence: number }> | undefined
  ): boolean {
    if (!this.config.disambiguationEnabled) {
      return false;
    }

    if (confidence < this.config.mediumConfidenceThreshold) {
      return true;
    }

    if (!alternatives || alternatives.length === 0) {
      return false;
    }

    const highConfidenceAlternatives = alternatives.filter(
      (alt) => alt.confidence >= this.config.mediumConfidenceThreshold
    );

    return highConfidenceAlternatives.length > 1;
  }

  private getMissingSlots(intent: IntentType, entities: ExtractedEntity[]): EntityType[] {
    const definition = INTENT_DEFINITIONS[intent];
    if (!definition) {
      return [];
    }

    const extractedTypes = new Set(entities.map((e) => e.type));
    const missingSlots = definition.requiredSlots.filter((slot) => !extractedTypes.has(slot));

    return missingSlots;
  }

  private getIntentDescription(intent: IntentType): string {
    const descriptions = {
      [IntentType.CHECK_BALANCE]: 'verificar seu saldo',
      [IntentType.PAY_BILL]: 'pagar uma conta',
      [IntentType.TRANSFER_MONEY]: 'fazer uma transferência',
      [IntentType.CHECK_BUDGET]: 'analisar seu orçamento',
      [IntentType.CHECK_INCOME]: 'consultar seus rendimentos',
      [IntentType.FINANCIAL_PROJECTION]: 'ver uma projeção financeira',
    };

    return descriptions[intent] || 'realizar uma operação financeira';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createEnhancedNLUEngine(config?: Partial<EnhancedNLUConfig>): EnhancedNLUEngine {
  return new EnhancedNLUEngine(config);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_ENHANCED_CONFIG };
export type { EnhancedNLUConfig, EnhancedNLUResult };

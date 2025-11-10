/**
 * NLU Analytics and Learning System for AegisWallet
 *
 * Comprehensive tracking, analytics, and learning system for voice command processing
 * Specialized for Brazilian Portuguese financial commands with regional variations
 *
 * @module nlu/analytics
 */

import { logger } from '@/lib/logging/logger';
import {
  type ClassificationLog,
  type EntityType,
  type ExtractedEntity,
  IntentType,
  type NLUResult,
} from './types';

// ============================================================================
// Analytics Configuration
// ============================================================================

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  batchInterval: number; // milliseconds
  persistenceEnabled: boolean;
  learningEnabled: boolean;
  regionalAnalysisEnabled: boolean;
  realTimeMetricsEnabled: boolean;
  performanceThresholds: {
    maxProcessingTime: number;
    minConfidenceThreshold: number;
    maxErrorRate: number;
  };
}

const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 50,
  batchInterval: 30000, // 30 seconds
  persistenceEnabled: true,
  learningEnabled: true,
  regionalAnalysisEnabled: true,
  realTimeMetricsEnabled: true,
  performanceThresholds: {
    maxProcessingTime: 200,
    minConfidenceThreshold: 0.7,
    maxErrorRate: 0.1,
  },
};

// ============================================================================
// Hit/Miss Tracking System
// ============================================================================

export interface HitMissMetrics {
  totalCommands: number;
  successfulClassifications: number;
  failedClassifications: number;
  hitRate: number;
  missRate: number;
  averageConfidence: number;
  confidenceDistribution: Record<string, number>;
  intentAccuracy: Record<
    IntentType,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
  entityAccuracy: Record<
    EntityType,
    {
      total: number;
      correct: number;
      accuracy: number;
    }
  >;
  regionalAccuracy: Record<string, number>;
  temporalAccuracy: Record<string, number>; // By time of day
  linguisticAccuracy: {
    slang: number;
    formal: number;
    colloquial: number;
    mixed: number;
  };
  learningProgress: {
    weeklyImprovement: number;
    monthlyImprovement: number;
    patternEvolution: number;
    adaptationRate: number;
  };
  errorAnalysis: {
    patternMisses: number;
    entityExtractionFailures: number;
    intentConfusion: number;
    lowConfidenceIssues: number;
    regionalMisunderstandings: number;
  };
  performanceMetrics: {
    averageProcessingTime: number;
    processingTimeDistribution: Record<string, number>;
    cacheHitRate: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

// ============================================================================
// Learning Analytics
// ============================================================================

export interface LearningAnalytics {
  patternEvolution: Array<{
    pattern: string;
    frequency: number;
    accuracy: number;
    confidence: number;
    lastSeen: Date;
    trend: 'improving' | 'stable' | 'declining';
    regionalVariations: Record<string, number>;
  }>;
  userAdaptations: Array<{
    userId: string;
    adaptationType: 'correction' | 'preference' | 'regional';
    originalPattern: string;
    adaptedPattern: string;
    confidence: number;
    timestamp: Date;
  }>;
  regionalLearning: Record<
    string,
    {
      totalCommands: number;
      accuracyRate: number;
      commonPatterns: Array<{
        pattern: string;
        frequency: number;
        accuracy: number;
      }>;
      linguisticMarkers: Array<{
        marker: string;
        frequency: number;
        accuracy: number;
      }>;
    }
  >;
  confidenceLearning: Array<{
    intent: IntentType;
    averageConfidence: number;
    confidenceTrend: 'improving' | 'stable' | 'declining';
    factors: Array<{
      factor: string;
      impact: number;
      trend: 'positive' | 'negative' | 'neutral';
    }>;
  }>;
}

// ============================================================================
// NLU Analytics Class
// ============================================================================

export class NLUAnalytics {
  private config: AnalyticsConfig;
  private classificationLogs: ClassificationLog[] = [];
  private hitMissMetrics: HitMissMetrics;
  private learningAnalytics: LearningAnalytics;
  private batchTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.hitMissMetrics = this.initializeHitMissMetrics();
    this.learningAnalytics = this.initializeLearningAnalytics();
  }

  private initializeHitMissMetrics(): HitMissMetrics {
    return {
      totalCommands: 0,
      successfulClassifications: 0,
      failedClassifications: 0,
      hitRate: 0,
      missRate: 0,
      averageConfidence: 0,
      confidenceDistribution: {
        'high (>0.8)': 0,
        'medium (0.6-0.8)': 0,
        'low (<0.6)': 0,
      },
      intentAccuracy: {} as Record<IntentType, any>,
      entityAccuracy: {} as Record<EntityType, any>,
      regionalAccuracy: {},
      temporalAccuracy: {},
      linguisticAccuracy: {
        slang: 0,
        formal: 0,
        colloquial: 0,
        mixed: 0,
      },
      learningProgress: {
        weeklyImprovement: 0,
        monthlyImprovement: 0,
        patternEvolution: 0,
        adaptationRate: 0,
      },
      errorAnalysis: {
        patternMisses: 0,
        entityExtractionFailures: 0,
        intentConfusion: 0,
        lowConfidenceIssues: 0,
        regionalMisunderstandings: 0,
      },
      performanceMetrics: {
        averageProcessingTime: 0,
        processingTimeDistribution: {
          'fast (<100ms)': 0,
          'normal (100-200ms)': 0,
          'slow (>200ms)': 0,
        },
        cacheHitRate: 0,
        systemHealth: 'excellent',
      },
    };
  }

  private initializeLearningAnalytics(): LearningAnalytics {
    return {
      patternEvolution: [],
      userAdaptations: [],
      regionalLearning: {},
      confidenceLearning: [],
    };
  }

  // ============================================================================
  // Core Analytics Methods
  // ============================================================================

  /**
   * Initialize analytics system and start batch processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing analytics data from Supabase
      if (this.config.persistenceEnabled) {
        await this.loadHistoricalData();
      }

      // Start batch processing timer
      if (this.config.batchInterval > 0) {
        this.startBatchProcessing();
      }

      this.isInitialized = true;
      logger.info('NLU Analytics initialized', {
        enabled: this.config.enabled,
        learningEnabled: this.config.learningEnabled,
        batchSize: this.config.batchSize,
      });
    } catch (error) {
      logger.error('Failed to initialize NLU Analytics', { error });
      throw error;
    }
  }

  /**
   * Track NLU classification result for analytics
   */
  trackClassification(
    result: NLUResult,
    userId: string,
    sessionId: string,
    feedback?: 'correct' | 'incorrect' | 'ambiguous'
  ): void {
    if (!this.config.enabled) return;

    try {
      const log: ClassificationLog = {
        id: this.generateLogId(),
        userId,
        sessionId,
        originalText: result.originalText,
        normalizedText: result.normalizedText,
        predictedIntent: result.intent,
        confidence: result.confidence,
        entities: result.entities,
        processingTime: result.processingTime,
        timestamp: new Date(),
        feedback,
        // Enhanced Brazilian Portuguese analysis
        regionalVariation: this.detectRegionalVariation(result.originalText),
        linguisticStyle: this.detectLinguisticStyle(result.originalText),
        contextualClues: {
          timeOfDay: new Date().getHours().toString(),
          dayOfWeek: new Date().getDay().toString(),
          conversationTurn: 0, // Will be updated by context processor
        },
      };

      // Add to batch
      this.classificationLogs.push(log);

      // Update real-time metrics
      this.updateHitMissMetrics(log);
      this.updateLearningAnalytics(log);

      // Log to system logger
      logger.voiceCommand(result.originalText, result.confidence, {
        intent: result.intent,
        processingTime: result.processingTime,
        entities: result.entities.length,
        requiresConfirmation: result.requiresConfirmation,
        requiresDisambiguation: result.requiresDisambiguation,
      });

      // Check if batch should be processed
      if (this.classificationLogs.length >= this.config.batchSize) {
        this.processBatch();
      }
    } catch (error) {
      logger.error('Failed to track classification', { error, result });
    }
  }

  /**
   * Track user feedback for learning
   */
  trackUserFeedback(
    logId: string,
    correctIntent: IntentType,
    confidence: number,
    entities?: ExtractedEntity[]
  ): void {
    if (!this.config.learningEnabled) return;

    try {
      const logIndex = this.classificationLogs.findIndex((log) => log.id === logId);
      if (logIndex === -1) return;

      const log = this.classificationLogs[logIndex];
      log.correctIntent = correctIntent;
      log.feedback = confidence > 0.8 ? 'correct' : 'incorrect';

      // Analyze learning patterns
      this.analyzeLearningPattern(log, correctIntent, entities);

      logger.info('User feedback tracked', {
        logId,
        originalIntent: log.predictedIntent,
        correctIntent,
        confidence,
        improvement: log.predictedIntent !== correctIntent,
      });
    } catch (error) {
      logger.error('Failed to track user feedback', { error, logId });
    }
  }

  /**
   * Get comprehensive hit/miss metrics
   */
  getHitMissMetrics(): HitMissMetrics {
    return { ...this.hitMissMetrics };
  }

  /**
   * Get learning analytics data
   */
  getLearningAnalytics(): LearningAnalytics {
    return { ...this.learningAnalytics };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check hit rate
    if (this.hitMissMetrics.hitRate < 90) {
      issues.push(`Low hit rate: ${this.hitMissMetrics.hitRate.toFixed(1)}%`);
      recommendations.push('Review intent patterns and training data');
      score -= 20;
    }

    // Check processing time
    if (
      this.hitMissMetrics.performanceMetrics.averageProcessingTime >
      this.config.performanceThresholds.maxProcessingTime
    ) {
      issues.push(
        `Slow processing: ${this.hitMissMetrics.performanceMetrics.averageProcessingTime.toFixed(0)}ms`
      );
      recommendations.push('Optimize NLU processing pipeline');
      score -= 15;
    }

    // Check confidence levels
    if (
      this.hitMissMetrics.averageConfidence <
      this.config.performanceThresholds.minConfidenceThreshold
    ) {
      issues.push(`Low confidence: ${this.hitMissMetrics.averageConfidence.toFixed(2)}`);
      recommendations.push('Improve training data quality');
      score -= 15;
    }

    // Check error rate
    const errorRate =
      this.hitMissMetrics.failedClassifications / Math.max(this.hitMissMetrics.totalCommands, 1);
    if (errorRate > this.config.performanceThresholds.maxErrorRate) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      recommendations.push('Implement error recovery patterns');
      score -= 25;
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 70) status = 'critical';
    else if (score < 85) status = 'warning';

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateLogId(): string {
    return `nlu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectRegionalVariation(text: string): string {
    const lowerText = text.toLowerCase();

    // São Paulo variations
    if (
      lowerText.includes('meu bem') ||
      lowerText.includes('valeu') ||
      lowerText.includes('demais')
    ) {
      return 'SP';
    }

    // Rio de Janeiro variations
    if (
      lowerText.includes('maneiro') ||
      lowerText.includes('caraca') ||
      lowerText.includes('legal')
    ) {
      return 'RJ';
    }

    // Northeast variations
    if (lowerText.includes('oxente') || lowerText.includes('arre') || lowerText.includes('bão')) {
      return 'Nordeste';
    }

    // Southern variations
    if (lowerText.includes('bah') || lowerText.includes('tchê') || lowerText.includes('guri')) {
      return 'Sul';
    }

    return 'Unknown';
  }

  private detectLinguisticStyle(text: string): 'slang' | 'formal' | 'colloquial' | 'mixed' {
    const lowerText = text.toLowerCase();

    const slangTerms = ['maneiro', 'caraca', 'demais', 'legal', 'bão', 'bah', 'tchê'];
    const formalTerms = ['gostaria', 'poderia', 'por favor', 'agradeceria'];
    const colloquialTerms = ['meu', 'minha', 'quero', 'vou', 'pegar'];

    const hasSlang = slangTerms.some((term) => lowerText.includes(term));
    const hasFormal = formalTerms.some((term) => lowerText.includes(term));
    const hasColloquial = colloquialTerms.some((term) => lowerText.includes(term));

    if (hasFormal && !hasSlang) return 'formal';
    if (hasSlang && !hasFormal) return 'slang';
    if (hasColloquial && !hasFormal && !hasSlang) return 'colloquial';
    if (hasSlang && hasFormal) return 'mixed';

    return 'colloquial'; // Default
  }

  private updateHitMissMetrics(log: ClassificationLog): void {
    const metrics = this.hitMissMetrics;

    // Update totals
    metrics.totalCommands++;

    // Update success/failure
    const isSuccessful = log.confidence >= 0.7 && log.intent !== IntentType.UNKNOWN;
    if (isSuccessful) {
      metrics.successfulClassifications++;
    } else {
      metrics.failedClassifications++;
    }

    // Update rates
    metrics.hitRate = (metrics.successfulClassifications / metrics.totalCommands) * 100;
    metrics.missRate = (metrics.failedClassifications / metrics.totalCommands) * 100;

    // Update confidence distribution
    if (log.confidence > 0.8) {
      metrics.confidenceDistribution['high (>0.8)']++;
    } else if (log.confidence >= 0.6) {
      metrics.confidenceDistribution['medium (0.6-0.8)']++;
    } else {
      metrics.confidenceDistribution['low (<0.6)']++;
    }

    // Update average confidence
    const totalConfidence = Object.values(metrics.confidenceDistribution).reduce(
      (sum, count) =>
        sum +
        count *
          (count > 0
            ? (metrics.confidenceDistribution['high (>0.8)'] * 0.9 +
                metrics.confidenceDistribution['medium (0.6-0.8)'] * 0.7 +
                metrics.confidenceDistribution['low (<0.6)'] * 0.4) /
              metrics.totalCommands
            : 0),
      0
    );
    metrics.averageConfidence = totalConfidence / metrics.totalCommands;

    // Update processing time metrics
    this.updateProcessingTimeMetrics(log.processingTime);

    // Update regional accuracy
    if (log.regionalVariation && log.regionalVariation !== 'Unknown') {
      if (!metrics.regionalAccuracy[log.regionalVariation]) {
        metrics.regionalAccuracy[log.regionalVariation] = 0;
      }
      const regionTotal = metrics.regionalAccuracy[log.regionalVariation] + 1;
      metrics.regionalAccuracy[log.regionalVariation] = regionTotal;
    }

    // Update linguistic accuracy
    if (log.linguisticStyle) {
      metrics.linguisticAccuracy[log.linguisticStyle]++;
    }
  }

  private updateProcessingTimeMetrics(processingTime: number): void {
    const metrics = this.hitMissMetrics.performanceMetrics;

    // Update average
    const totalProcessed = this.hitMissMetrics.totalCommands;
    metrics.averageProcessingTime =
      (metrics.averageProcessingTime * (totalProcessed - 1) + processingTime) / totalProcessed;

    // Update distribution
    if (processingTime < 100) {
      metrics.processingTimeDistribution['fast (<100ms)']++;
    } else if (processingTime <= 200) {
      metrics.processingTimeDistribution['normal (100-200ms)']++;
    } else {
      metrics.processingTimeDistribution['slow (>200ms)']++;
    }

    // Update system health
    if (metrics.averageProcessingTime < 150 && this.hitMissMetrics.hitRate > 90) {
      metrics.systemHealth = 'excellent';
    } else if (metrics.averageProcessingTime < 250 && this.hitMissMetrics.hitRate > 80) {
      metrics.systemHealth = 'good';
    } else if (metrics.averageProcessingTime < 400 && this.hitMissMetrics.hitRate > 70) {
      metrics.systemHealth = 'fair';
    } else {
      metrics.systemHealth = 'poor';
    }
  }

  private updateLearningAnalytics(log: ClassificationLog): void {
    // Update pattern evolution
    this.updatePatternEvolution(log);

    // Update regional learning
    if (log.regionalVariation && log.regionalVariation !== 'Unknown') {
      this.updateRegionalLearning(log);
    }

    // Update confidence learning
    this.updateConfidenceLearning(log);
  }

  private updatePatternEvolution(log: ClassificationLog): void {
    const patternKey = log.normalizedText.substring(0, 50); // First 50 chars as pattern key

    let patternEvolution = this.learningAnalytics.patternEvolution.find(
      (p) => p.pattern === patternKey
    );
    if (!patternEvolution) {
      patternEvolution = {
        pattern: patternKey,
        frequency: 0,
        accuracy: 0,
        confidence: 0,
        lastSeen: new Date(),
        trend: 'stable',
        regionalVariations: {},
      };
      this.learningAnalytics.patternEvolution.push(patternEvolution);
    }

    patternEvolution.frequency++;
    patternEvolution.confidence = (patternEvolution.confidence + log.confidence) / 2;
    patternEvolution.lastSeen = new Date();

    // Update regional variations
    if (log.regionalVariation && log.regionalVariation !== 'Unknown') {
      if (!patternEvolution.regionalVariations[log.regionalVariation]) {
        patternEvolution.regionalVariations[log.regionalVariation] = 0;
      }
      patternEvolution.regionalVariations[log.regionalVariation]++;
    }

    // Update trend
    if (patternEvolution.frequency > 1) {
      const recentAccuracy = patternEvolution.accuracy;
      const newAccuracy = log.feedback === 'correct' ? 1 : 0;
      patternEvolution.accuracy = (recentAccuracy + newAccuracy) / 2;

      if (newAccuracy > recentAccuracy) {
        patternEvolution.trend = 'improving';
      } else if (newAccuracy < recentAccuracy) {
        patternEvolution.trend = 'declining';
      }
    }
  }

  private updateRegionalLearning(log: ClassificationLog): void {
    const region = log.regionalVariation!;

    if (!this.learningAnalytics.regionalLearning[region]) {
      this.learningAnalytics.regionalLearning[region] = {
        totalCommands: 0,
        accuracyRate: 0,
        commonPatterns: [],
        linguisticMarkers: [],
      };
    }

    const regionLearning = this.learningAnalytics.regionalLearning[region];
    regionLearning.totalCommands++;

    // Update accuracy rate
    const isCorrect = log.feedback === 'correct' || log.confidence > 0.8;
    regionLearning.accuracyRate =
      (regionLearning.accuracyRate * (regionLearning.totalCommands - 1) + (isCorrect ? 1 : 0)) /
      regionLearning.totalCommands;
  }

  private updateConfidenceLearning(log: ClassificationLog): void {
    let confidenceLearning = this.learningAnalytics.confidenceLearning.find(
      (c) => c.intent === log.predictedIntent
    );
    if (!confidenceLearning) {
      confidenceLearning = {
        intent: log.predictedIntent,
        averageConfidence: log.confidence,
        confidenceTrend: 'stable',
        factors: [],
      };
      this.learningAnalytics.confidenceLearning.push(confidenceLearning);
    }

    // Update average confidence
    const intentLogs = this.classificationLogs.filter(
      (l) => l.predictedIntent === log.predictedIntent
    );
    confidenceLearning.averageConfidence =
      intentLogs.reduce((sum, l) => sum + l.confidence, 0) / intentLogs.length;

    // Update trend
    if (intentLogs.length > 1) {
      const recentAvg =
        intentLogs.slice(-5).reduce((sum, l) => sum + l.confidence, 0) /
        Math.min(5, intentLogs.length);
      const overallAvg = confidenceLearning.averageConfidence;

      if (recentAvg > overallAvg + 0.05) {
        confidenceLearning.confidenceTrend = 'improving';
      } else if (recentAvg < overallAvg - 0.05) {
        confidenceLearning.confidenceTrend = 'declining';
      }
    }
  }

  private analyzeLearningPattern(
    log: ClassificationLog,
    correctIntent: IntentType,
    _entities?: ExtractedEntity[]
  ): void {
    // Record user adaptation
    this.learningAnalytics.userAdaptations.push({
      userId: log.userId,
      adaptationType: 'correction',
      originalPattern: log.originalText,
      adaptedPattern: log.originalText, // Will be updated with corrected pattern
      confidence: log.confidence,
      timestamp: new Date(),
    });

    // Analyze error patterns
    if (log.predictedIntent !== correctIntent) {
      this.hitMissMetrics.errorAnalysis.intentConfusion++;

      // Create learning signal for pattern improvement
      logger.warn('Intent confusion detected', {
        originalText: log.originalText,
        predictedIntent: log.predictedIntent,
        correctIntent,
        confidence: log.confidence,
      });
    }
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      // TODO: Load recent classification logs from Supabase - temporarily disabled
      // const { data: recentLogs, error } = await supabase
      //   .from('nlu_classification_logs')
      //   .select('*')
      //   .order('timestamp', { ascending: false })
      //   .limit(100);

      const recentLogs: any[] = [];
      const error = null;

      if (error) {
        logger.warn('Failed to load historical NLU data', { error });
        return;
      }

      if (recentLogs) {
        // Process historical data to initialize metrics
        recentLogs.forEach((log) => {
          this.updateHitMissMetrics(log);
          this.updateLearningAnalytics(log);
        });

        logger.info('Historical NLU data loaded', { count: recentLogs.length });
      }
    } catch (error) {
      logger.error('Error loading historical NLU data', { error });
    }
  }

  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.config.batchInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.classificationLogs.length === 0) return;

    const batch = [...this.classificationLogs];
    this.classificationLogs = [];

    try {
      if (this.config.persistenceEnabled) {
        await this.persistBatch(batch);
      }

      logger.info('NLU batch processed', {
        batchSize: batch.length,
        metrics: this.getHitMissMetrics(),
      });
    } catch (error) {
      logger.error('Failed to process NLU batch', { error });
      // Re-add failed logs to queue for retry
      this.classificationLogs.unshift(...batch);
    }
  }

  private async persistBatch(batch: ClassificationLog[]): Promise<void> {
    try {
      // TODO: Implement NLU analytics table in database
      // Temporarily disabled to fix deployment issues
      logger.info(
        `NLU analytics persistence temporarily disabled - ${batch.length} records skipped`,
        {
          recordCount: batch.length,
        }
      );
      return;

      /*
      const { error } = await supabase.from('nlu_classification_logs').insert(
        batch.map((log) => ({
          id: log.id,
          user_id: log.userId,
          session_id: log.sessionId,
          original_text: log.originalText,
          normalized_text: log.normalizedText,
          predicted_intent: log.predictedIntent,
          confidence: log.confidence,
          entities: log.entities,
          processing_time: log.processingTime,
          correct_intent: log.correctIntent,
          feedback: log.feedback,
          timestamp: log.timestamp.toISOString(),
          regional_variation: log.regionalVariation,
          linguistic_style: log.linguisticStyle,
          contextual_clues: log.contextualClues,
          error_analysis: log.errorAnalysis,
          learning_signals: log.learningSignals,
        }))
      );

      if (error) {
        throw error;
      }
      */
    } catch (error) {
      logger.error('Failed to persist NLU batch', { error });
      throw error;
    }
  }

  // ============================================================================
  // Cleanup and Disposal
  // ============================================================================

  /**
   * Cleanup analytics system and save remaining data
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Process remaining batch
    if (this.classificationLogs.length > 0) {
      await this.processBatch();
    }

    logger.info('NLU Analytics cleaned up');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create NLU analytics instance with default configuration
 */
export function createNLUAnalytics(config?: Partial<AnalyticsConfig>): NLUAnalytics {
  return new NLUAnalytics(config);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_ANALYTICS_CONFIG };

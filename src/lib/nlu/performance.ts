/**
 * NLU Performance Tracking System for AegisWallet
 *
 * Real-time performance monitoring, metrics collection, and analytics
 * for NLU system optimization and health monitoring
 *
 * @module nlu/performance
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';
import type { EntityType, IntentType, NLUResult } from './types';

// ============================================================================
// Performance Configuration
// ============================================================================

export interface PerformanceConfig {
  enabled: boolean;
  realTimeMonitoring: boolean;
  persistenceEnabled: boolean;
  alertingEnabled: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    maxProcessingTime: number;
    minAccuracy: number;
    maxErrorRate: number;
    minCacheHitRate: number;
    maxMemoryUsage: number;
  };
  performanceTargets: {
    p95ProcessingTime: number;
    averageAccuracy: number;
    systemUptime: number;
    errorRecoveryRate: number;
  };
  monitoringIntervals: {
    metrics: number; // milliseconds
    health: number; // milliseconds
    persistence: number; // milliseconds
    alerts: number; // milliseconds
  };
}

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  realTimeMonitoring: true,
  persistenceEnabled: true,
  alertingEnabled: true,
  metricsRetentionDays: 30,
  alertThresholds: {
    maxProcessingTime: 500,
    minAccuracy: 85,
    maxErrorRate: 15,
    minCacheHitRate: 60,
    maxMemoryUsage: 512, // MB
  },
  performanceTargets: {
    p95ProcessingTime: 200,
    averageAccuracy: 90,
    systemUptime: 99.9, // percentage
    errorRecoveryRate: 80,
  },
  monitoringIntervals: {
    metrics: 30000, // 30 seconds
    health: 60000, // 1 minute
    persistence: 300000, // 5 minutes
    alerts: 15000, // 15 seconds
  },
};

// ============================================================================
// Performance Metrics
// ============================================================================

export interface PerformanceMetrics {
  timestamp: Date;
  processing: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageProcessingTime: number;
    p95ProcessingTime: number;
    p99ProcessingTime: number;
    minProcessingTime: number;
    maxProcessingTime: number;
    requestsPerSecond: number;
  };
  accuracy: {
    overallAccuracy: number;
    intentAccuracy: Record<IntentType, number>;
    entityAccuracy: Record<EntityType, number>;
    confidenceDistribution: {
      high: number; // >0.8
      medium: number; // 0.6-0.8
      low: number; // <0.6
    };
    confusionMatrix: Record<string, Record<string, number>>;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
    averageLookupTime: number;
  };
  system: {
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    uptime: number; // milliseconds
    activeContexts: number;
    queuedRequests: number;
  };
  errors: {
    errorRate: number;
    errorTypes: Record<string, number>;
    recoveryRate: number;
    averageRecoveryTime: number;
  };
  regional: {
    accuracyByRegion: Record<string, number>;
    requestVolumeByRegion: Record<string, number>;
    processingTimeByRegion: Record<string, number>;
  };
  temporal: {
    accuracyByHour: Record<number, number>;
    requestVolumeByHour: Record<number, number>;
    accuracyByDayOfWeek: Record<number, number>;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'accuracy' | 'system' | 'error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  healthScore: number;
  recommendations: string[];
}

// ============================================================================
// Performance Tracker Class
// ============================================================================

export class NLUPerformanceTracker {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private processingTimes: number[] = [];
  private requestBuffer: Array<{
    timestamp: Date;
    processingTime: number;
    success: boolean;
    intent: IntentType;
    confidence: number;
    region?: string;
  }> = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private startTime = Date.now();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  // ============================================================================
  // Core Tracking Methods
  // ============================================================================

  /**
   * Track NLU request performance
   */
  trackRequest(processingTime: number, result: NLUResult, success: boolean, region?: string): void {
    if (!this.config.enabled) return;

    try {
      const request = {
        timestamp: new Date(),
        processingTime,
        success,
        intent: result.intent,
        confidence: result.confidence,
        region,
      };

      // Add to request buffer
      this.requestBuffer.push(request);
      this.processingTimes.push(processingTime);

      // Keep buffer size manageable
      if (this.requestBuffer.length > 1000) {
        this.requestBuffer = this.requestBuffer.slice(-800);
      }
      if (this.processingTimes.length > 1000) {
        this.processingTimes = this.processingTimes.slice(-800);
      }

      // Update real-time metrics
      this.updateProcessingMetrics(request);
      this.updateAccuracyMetrics(request);
      this.updateErrorMetrics(request);

      // Check for alerts
      if (this.config.alertingEnabled) {
        this.checkAlerts(request);
      }

      // Log performance data
      logger.debug('NLU request tracked', {
        processingTime,
        intent: result.intent,
        confidence: result.confidence,
        success,
        region,
      });
    } catch (error) {
      logger.error('Failed to track NLU request', { error });
    }
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(hitRate: number, size: number, lookupTime: number): void {
    if (!this.config.enabled) return;

    this.metrics.cache.hitRate = hitRate;
    this.metrics.cache.missRate = 100 - hitRate;
    this.metrics.cache.size = size;
    this.metrics.cache.averageLookupTime = lookupTime;

    // Check cache performance alerts
    if (hitRate < this.config.alertThresholds.minCacheHitRate) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Low Cache Hit Rate',
        message: `Cache hit rate is ${hitRate.toFixed(1)}%, below threshold of ${this.config.alertThresholds.minCacheHitRate}%`,
        threshold: this.config.alertThresholds.minCacheHitRate,
        currentValue: hitRate,
      });
    }
  }

  /**
   * Track system resource usage
   */
  trackSystemResources(memoryUsage: number, cpuUsage: number): void {
    if (!this.config.enabled) return;

    this.metrics.system.memoryUsage = memoryUsage;
    this.metrics.system.cpuUsage = cpuUsage;

    // Check system resource alerts
    if (memoryUsage > this.config.alertThresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'system',
        severity: 'critical',
        title: 'High Memory Usage',
        message: `Memory usage is ${memoryUsage.toFixed(1)}MB, above threshold of ${this.config.alertThresholds.maxMemoryUsage}MB`,
        threshold: this.config.alertThresholds.maxMemoryUsage,
        currentValue: memoryUsage,
      });
    }
  }

  /**
   * Track error recovery performance
   */
  trackErrorRecovery(errorType: string, recoveryTime: number, recoverySuccess: boolean): void {
    if (!this.config.enabled) return;

    // Update error metrics
    if (!this.metrics.errors.errorTypes[errorType]) {
      this.metrics.errors.errorTypes[errorType] = 0;
    }
    this.metrics.errors.errorTypes[errorType]++;

    // Update recovery metrics
    const totalRecoveries = this.metrics.errors.errorTypes[errorType];
    if (recoverySuccess) {
      this.metrics.errors.recoveryRate =
        (this.metrics.errors.recoveryRate * (totalRecoveries - 1) + 100) / totalRecoveries;
    } else {
      this.metrics.errors.recoveryRate =
        (this.metrics.errors.recoveryRate * (totalRecoveries - 1) + 0) / totalRecoveries;
    }

    this.metrics.errors.averageRecoveryTime =
      (this.metrics.errors.averageRecoveryTime * (totalRecoveries - 1) + recoveryTime) /
      totalRecoveries;

    // Log recovery performance
    logger.info('Error recovery tracked', {
      errorType,
      recoveryTime,
      recoverySuccess,
      recoveryRate: this.metrics.errors.recoveryRate,
    });
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    // Update derived metrics before returning
    this.updateDerivedMetrics();
    return { ...this.metrics };
  }

  /**
   * Get performance health score
   */
  getHealthScore(): {
    overall: number;
    processing: number;
    accuracy: number;
    system: number;
    factors: Array<{
      name: string;
      score: number;
      weight: number;
      impact: string;
    }>;
  } {
    const factors = [];

    // Processing performance score
    const processingScore = this.calculateProcessingScore();
    factors.push({
      name: 'Processing Performance',
      score: processingScore,
      weight: 0.3,
      impact:
        processingScore < 70 ? 'High processing times detected' : 'Processing times within targets',
    });

    // Accuracy score
    const accuracyScore = this.calculateAccuracyScore();
    factors.push({
      name: 'Accuracy',
      score: accuracyScore,
      weight: 0.4,
      impact: accuracyScore < 80 ? 'Accuracy below target' : 'Accuracy within acceptable range',
    });

    // System health score
    const systemScore = this.calculateSystemScore();
    factors.push({
      name: 'System Health',
      score: systemScore,
      weight: 0.2,
      impact: systemScore < 70 ? 'System resources under stress' : 'System resources healthy',
    });

    // Error handling score
    const errorScore = this.calculateErrorScore();
    factors.push({
      name: 'Error Handling',
      score: errorScore,
      weight: 0.1,
      impact: errorScore < 60 ? 'High error rate detected' : 'Error rate within acceptable range',
    });

    // Calculate overall score
    const overall = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);

    return {
      overall: Math.round(overall),
      processing: Math.round(processingScore),
      accuracy: Math.round(accuracyScore),
      system: Math.round(systemScore),
      factors,
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations = [];
    const metrics = this.getCurrentMetrics();

    // Processing recommendations
    if (metrics.processing.p95ProcessingTime > this.config.performanceTargets.p95ProcessingTime) {
      recommendations.push('Consider optimizing NLU processing pipeline to reduce P95 latency');
    }

    if (metrics.processing.averageProcessingTime > 300) {
      recommendations.push('Average processing time is high, consider performance optimizations');
    }

    // Accuracy recommendations
    if (metrics.accuracy.overallAccuracy < this.config.performanceTargets.averageAccuracy) {
      recommendations.push('Overall accuracy is below target, consider improving training data');
    }

    for (const [intent, accuracy] of Object.entries(metrics.accuracy.intentAccuracy)) {
      if (accuracy < 80) {
        recommendations.push(
          `Intent "${intent}" has low accuracy (${accuracy.toFixed(1)}%), consider adding more training examples`
        );
      }
    }

    // Cache recommendations
    if (metrics.cache.hitRate < 70) {
      recommendations.push('Cache hit rate is low, consider increasing cache size or TTL');
    }

    // System recommendations
    if (metrics.system.memoryUsage > 400) {
      recommendations.push('Memory usage is high, consider optimizing memory management');
    }

    if (metrics.errors.errorRate > 10) {
      recommendations.push('Error rate is high, review error patterns and improve error handling');
    }

    // Regional recommendations
    for (const [region, accuracy] of Object.entries(metrics.regional.accuracyByRegion)) {
      if (accuracy < 75) {
        recommendations.push(
          `Regional accuracy for "${region}" is low (${accuracy.toFixed(1)}%), consider adding regional training data`
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(_timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): {
    summary: {
      totalRequests: number;
      successRate: number;
      averageProcessingTime: number;
      overallAccuracy: number;
      healthScore: number;
      activeAlerts: number;
    };
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    recommendations: string[];
    trends: {
      processingTime: 'improving' | 'stable' | 'degrading';
      accuracy: 'improving' | 'stable' | 'degrading';
      errorRate: 'improving' | 'stable' | 'degrading';
    };
  } {
    const metrics = this.getCurrentMetrics();
    const alerts = this.getActiveAlerts();
    const healthScore = this.getHealthScore();
    const recommendations = this.getRecommendations();

    const summary = {
      totalRequests: metrics.processing.totalRequests,
      successRate:
        metrics.processing.totalRequests > 0
          ? (metrics.processing.successfulRequests / metrics.processing.totalRequests) * 100
          : 0,
      averageProcessingTime: metrics.processing.averageProcessingTime,
      overallAccuracy: metrics.accuracy.overallAccuracy,
      healthScore: healthScore.overall,
      activeAlerts: alerts.length,
    };

    // Calculate trends (simplified)
    const trends = {
      processingTime: this.calculateTrend(this.processingTimes.slice(-10)) as
        | 'improving'
        | 'stable'
        | 'degrading',
      accuracy: this.calculateTrend(Object.values(metrics.accuracy.intentAccuracy).slice(-5)) as
        | 'improving'
        | 'stable'
        | 'degrading',
      errorRate: this.calculateTrend([metrics.errors.errorRate]) as
        | 'improving'
        | 'stable'
        | 'degrading',
    };

    return {
      summary,
      metrics,
      alerts,
      recommendations,
      trends,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private initializeMetrics(): PerformanceMetrics {
    const now = new Date();

    return {
      timestamp: now,
      processing: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageProcessingTime: 0,
        p95ProcessingTime: 0,
        p99ProcessingTime: 0,
        minProcessingTime: Infinity,
        maxProcessingTime: 0,
        requestsPerSecond: 0,
      },
      accuracy: {
        overallAccuracy: 0,
        intentAccuracy: {} as Record<IntentType, number>,
        entityAccuracy: {} as Record<EntityType, number>,
        confidenceDistribution: {
          high: 0,
          medium: 0,
          low: 0,
        },
        confusionMatrix: {},
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        size: 0,
        evictions: 0,
        averageLookupTime: 0,
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
        activeContexts: 0,
        queuedRequests: 0,
      },
      errors: {
        errorRate: 0,
        errorTypes: {},
        recoveryRate: 0,
        averageRecoveryTime: 0,
      },
      regional: {
        accuracyByRegion: {},
        requestVolumeByRegion: {},
        processingTimeByRegion: {},
      },
      temporal: {
        accuracyByHour: {},
        requestVolumeByHour: {},
        accuracyByDayOfWeek: {},
      },
    };
  }

  private startMonitoring(): void {
    if (!this.config.enabled) return;

    // Start metrics collection
    if (this.config.realTimeMonitoring) {
      this.timers.set(
        'metrics',
        setInterval(() => {
          this.collectMetrics();
        }, this.config.monitoringIntervals.metrics)
      );
    }

    // Start health monitoring
    this.timers.set(
      'health',
      setInterval(() => {
        this.checkHealth();
      }, this.config.monitoringIntervals.health)
    );

    // Start persistence
    if (this.config.persistenceEnabled) {
      this.timers.set(
        'persistence',
        setInterval(() => {
          this.persistMetrics();
        }, this.config.monitoringIntervals.persistence)
      );
    }

    // Start alert monitoring
    if (this.config.alertingEnabled) {
      this.timers.set(
        'alerts',
        setInterval(() => {
          this.checkAlertThresholds();
        }, this.config.monitoringIntervals.alerts)
      );
    }

    logger.info('NLU performance monitoring started', {
      enabled: this.config.enabled,
      realTimeMonitoring: this.config.realTimeMonitoring,
      persistenceEnabled: this.config.persistenceEnabled,
      alertingEnabled: this.config.alertingEnabled,
    });
  }

  private updateProcessingMetrics(request: any): void {
    const processing = this.metrics.processing;

    processing.totalRequests++;

    if (request.success) {
      processing.successfulRequests++;
    } else {
      processing.failedRequests++;
    }

    // Update processing time statistics
    processing.averageProcessingTime =
      (processing.averageProcessingTime * (processing.totalRequests - 1) + request.processingTime) /
      processing.totalRequests;

    processing.minProcessingTime = Math.min(processing.minProcessingTime, request.processingTime);
    processing.maxProcessingTime = Math.max(processing.maxProcessingTime, request.processingTime);

    // Calculate percentiles
    const sortedTimes = [...this.processingTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    processing.p95ProcessingTime = sortedTimes[p95Index] || 0;
    processing.p99ProcessingTime = sortedTimes[p99Index] || 0;

    // Calculate requests per second (last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requestBuffer.filter((r) => r.timestamp.getTime() > oneMinuteAgo);
    processing.requestsPerSecond = recentRequests.length / 60;

    // Update regional metrics
    if (request.region) {
      if (!this.metrics.regional.processingTimeByRegion[request.region]) {
        this.metrics.regional.processingTimeByRegion[request.region] = 0;
      }
      this.metrics.regional.processingTimeByRegion[request.region] =
        (this.metrics.regional.processingTimeByRegion[request.region] *
          (this.metrics.regional.requestVolumeByRegion[request.region] || 0) +
          request.processingTime) /
        ((this.metrics.regional.requestVolumeByRegion[request.region] || 0) + 1);

      this.metrics.regional.requestVolumeByRegion[request.region] =
        (this.metrics.regional.requestVolumeByRegion[request.region] || 0) + 1;
    }

    // Update temporal metrics
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    this.metrics.temporal.requestVolumeByHour[hour] =
      (this.metrics.temporal.requestVolumeByHour[hour] || 0) + 1;
    this.metrics.temporal.requestVolumeByDayOfWeek[dayOfWeek] =
      (this.metrics.temporal.requestVolumeByDayOfWeek[dayOfWeek] || 0) + 1;
  }

  private updateAccuracyMetrics(request: any): void {
    const accuracy = this.metrics.accuracy;

    // Update confidence distribution
    if (request.confidence > 0.8) {
      accuracy.confidenceDistribution.high++;
    } else if (request.confidence >= 0.6) {
      accuracy.confidenceDistribution.medium++;
    } else {
      accuracy.confidenceDistribution.low++;
    }

    // Update intent accuracy (simplified - assumes successful requests are accurate)
    if (!accuracy.intentAccuracy[request.intent]) {
      accuracy.intentAccuracy[request.intent] = 0;
    }

    const totalIntentRequests = accuracy.intentAccuracy[request.intent] + 1;
    accuracy.intentAccuracy[request.intent] =
      (accuracy.intentAccuracy[request.intent] * (totalIntentRequests - 1) +
        (request.success ? 100 : 0)) /
      totalIntentRequests;

    // Update overall accuracy
    const totalRequests = Object.values(accuracy.intentAccuracy).reduce((sum, acc) => sum + acc, 0);
    const totalCorrect = Object.values(accuracy.intentAccuracy).reduce(
      (sum, acc) => sum + (acc * totalRequests) / 100,
      0
    );
    accuracy.overallAccuracy = totalRequests > 0 ? totalCorrect / totalRequests : 0;

    // Update regional accuracy
    if (request.region) {
      if (!this.metrics.regional.accuracyByRegion[request.region]) {
        this.metrics.regional.accuracyByRegion[request.region] = 0;
      }

      const regionalTotal = this.metrics.regional.requestVolumeByRegion[request.region] || 0;
      this.metrics.regional.accuracyByRegion[request.region] =
        (this.metrics.regional.accuracyByRegion[request.region] * (regionalTotal - 1) +
          (request.success ? 100 : 0)) /
        regionalTotal;
    }

    // Update temporal accuracy
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    if (!this.metrics.temporal.accuracyByHour[hour]) {
      this.metrics.temporal.accuracyByHour[hour] = 0;
    }
    this.metrics.temporal.accuracyByHour[hour] =
      (this.metrics.temporal.accuracyByHour[hour] *
        (this.metrics.temporal.requestVolumeByHour[hour] - 1) +
        (request.success ? 100 : 0)) /
      this.metrics.temporal.requestVolumeByHour[hour];

    if (!this.metrics.temporal.accuracyByDayOfWeek[dayOfWeek]) {
      this.metrics.temporal.accuracyByDayOfWeek[dayOfWeek] = 0;
    }
    this.metrics.temporal.accuracyByDayOfWeek[dayOfWeek] =
      (this.metrics.temporal.accuracyByDayOfWeek[dayOfWeek] *
        (this.metrics.temporal.requestVolumeByDayOfWeek[dayOfWeek] - 1) +
        (request.success ? 100 : 0)) /
      this.metrics.temporal.requestVolumeByDayOfWeek[dayOfWeek];
  }

  private updateErrorMetrics(request: any): void {
    if (!request.success) {
      const errors = this.metrics.errors;

      // Update error rate
      errors.errorRate =
        (errors.errorRate * (errors.errorRate > 0 ? this.metrics.processing.totalRequests - 1 : 0) +
          1) /
        this.metrics.processing.totalRequests;
    }
  }

  private updateDerivedMetrics(): void {
    // Update system uptime
    this.metrics.system.uptime = Date.now() - this.startTime;

    // Update error rate if not already calculated
    if (this.metrics.processing.totalRequests > 0) {
      this.metrics.errors.errorRate =
        (this.metrics.processing.failedRequests / this.metrics.processing.totalRequests) * 100;
    }
  }

  private checkAlerts(request: any): void {
    // Processing time alert
    if (request.processingTime > this.config.alertThresholds.maxProcessingTime) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'High Processing Time',
        message: `Processing time of ${request.processingTime}ms exceeds threshold of ${this.config.alertThresholds.maxProcessingTime}ms`,
        threshold: this.config.alertThresholds.maxProcessingTime,
        currentValue: request.processingTime,
      });
    }

    // Low confidence alert
    if (request.confidence < 0.5) {
      this.createAlert({
        type: 'accuracy',
        severity: 'info',
        title: 'Low Confidence Result',
        message: `Confidence score of ${(request.confidence * 100).toFixed(1)}% is below optimal threshold`,
        threshold: 50,
        currentValue: request.confidence * 100,
      });
    }

    // Failed request alert
    if (!request.success) {
      this.createAlert({
        type: 'error',
        severity: 'warning',
        title: 'Request Failed',
        message: 'NLU request processing failed',
        threshold: 0,
        currentValue: 1,
      });
    }
  }

  private checkAlertThresholds(): void {
    const metrics = this.getCurrentMetrics();

    // Check overall error rate
    if (metrics.errors.errorRate > this.config.alertThresholds.maxErrorRate) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'High Error Rate',
        message: `Error rate of ${metrics.errors.errorRate.toFixed(1)}% exceeds threshold of ${this.config.alertThresholds.maxErrorRate}%`,
        threshold: this.config.alertThresholds.maxErrorRate,
        currentValue: metrics.errors.errorRate,
      });
    }

    // Check accuracy
    if (metrics.accuracy.overallAccuracy < this.config.alertThresholds.minAccuracy) {
      this.createAlert({
        type: 'accuracy',
        severity: 'warning',
        title: 'Low Accuracy',
        message: `Overall accuracy of ${metrics.accuracy.overallAccuracy.toFixed(1)}% is below threshold of ${this.config.alertThresholds.minAccuracy}%`,
        threshold: this.config.alertThresholds.minAccuracy,
        currentValue: metrics.accuracy.overallAccuracy,
      });
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter((a) => a.timestamp.getTime() > oneDayAgo);

    // Log alert
    logger.warn('NLU performance alert created', {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
    });
  }

  private collectMetrics(): void {
    try {
      this.updateDerivedMetrics();

      // Create performance snapshot
      const snapshot: PerformanceSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date(),
        metrics: { ...this.metrics },
        alerts: this.getActiveAlerts(),
        healthScore: this.getHealthScore().overall,
        recommendations: this.getRecommendations(),
      };

      this.snapshots.push(snapshot);

      // Keep only recent snapshots (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.snapshots = this.snapshots.filter((s) => s.timestamp.getTime() > oneDayAgo);

      logger.debug('Performance metrics collected', {
        totalRequests: this.metrics.processing.totalRequests,
        averageProcessingTime: this.metrics.processing.averageProcessingTime,
        overallAccuracy: this.metrics.accuracy.overallAccuracy,
        healthScore: snapshot.healthScore,
      });
    } catch (error) {
      logger.error('Failed to collect performance metrics', { error });
    }
  }

  private checkHealth(): void {
    try {
      const healthScore = this.getHealthScore();

      // Log health status
      if (healthScore.overall < 70) {
        logger.warn('NLU system health degraded', {
          overall: healthScore.overall,
          processing: healthScore.processing,
          accuracy: healthScore.accuracy,
          system: healthScore.system,
        });
      } else if (healthScore.overall >= 90) {
        logger.info('NLU system health excellent', {
          overall: healthScore.overall,
        });
      }
    } catch (error) {
      logger.error('Failed to check system health', { error });
    }
  }

  private async persistMetrics(): Promise<void> {
    if (!this.config.persistenceEnabled) return;

    try {
      // Persist current metrics to Supabase
      const { error } = await supabase.from('nlu_performance_metrics').insert({
        timestamp: new Date().toISOString(),
        processing_metrics: this.metrics.processing,
        accuracy_metrics: this.metrics.accuracy,
        cache_metrics: this.metrics.cache,
        system_metrics: this.metrics.system,
        error_metrics: this.metrics.errors,
        regional_metrics: this.metrics.regional,
        temporal_metrics: this.metrics.temporal,
      });

      if (error) {
        throw error;
      }

      // Persist active alerts
      const activeAlerts = this.getActiveAlerts();
      if (activeAlerts.length > 0) {
        const { error: alertError } = await supabase.from('nlu_performance_alerts').upsert(
          activeAlerts.map((alert) => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            threshold: alert.threshold,
            current_value: alert.currentValue,
            timestamp: alert.timestamp.toISOString(),
            resolved: alert.resolved,
            resolved_at: alert.resolvedAt?.toISOString(),
            resolution_notes: alert.resolutionNotes,
          }))
        );

        if (alertError) {
          throw alertError;
        }
      }

      logger.debug('Performance metrics persisted to database');
    } catch (error) {
      logger.error('Failed to persist performance metrics', { error });
    }
  }

  private calculateProcessingScore(): number {
    const processing = this.metrics.processing;
    let score = 100;

    // P95 processing time score
    if (processing.p95ProcessingTime > this.config.performanceTargets.p95ProcessingTime) {
      score -= 30;
    }

    // Average processing time score
    if (processing.averageProcessingTime > 300) {
      score -= 20;
    } else if (processing.averageProcessingTime > 200) {
      score -= 10;
    }

    // Success rate score
    const successRate =
      processing.totalRequests > 0
        ? (processing.successfulRequests / processing.totalRequests) * 100
        : 100;
    if (successRate < 95) {
      score -= 95 - successRate;
    }

    return Math.max(0, score);
  }

  private calculateAccuracyScore(): number {
    const accuracy = this.metrics.accuracy;
    let score = 100;

    // Overall accuracy score
    if (accuracy.overallAccuracy < this.config.performanceTargets.averageAccuracy) {
      score -= this.config.performanceTargets.averageAccuracy - accuracy.overallAccuracy;
    }

    // Confidence distribution score
    const highConfidenceRatio =
      accuracy.confidenceDistribution.high /
      (accuracy.confidenceDistribution.high +
        accuracy.confidenceDistribution.medium +
        accuracy.confidenceDistribution.low);
    if (highConfidenceRatio < 0.7) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  private calculateSystemScore(): number {
    const system = this.metrics.system;
    let score = 100;

    // Memory usage score
    if (system.memoryUsage > this.config.alertThresholds.maxMemoryUsage) {
      score -= 30;
    } else if (system.memoryUsage > 300) {
      score -= 15;
    }

    // CPU usage score
    if (system.cpuUsage > 80) {
      score -= 25;
    } else if (system.cpuUsage > 60) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private calculateErrorScore(): number {
    const errors = this.metrics.errors;
    let score = 100;

    // Error rate score
    if (errors.errorRate > this.config.alertThresholds.maxErrorRate) {
      score -= errors.errorRate - this.config.alertThresholds.maxErrorRate;
    }

    // Recovery rate score
    if (errors.recoveryRate < 50) {
      score -= 30;
    } else if (errors.recoveryRate < 70) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(-Math.min(5, values.length));
    const older = values.slice(0, Math.max(0, values.length - 5));

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'degrading';
    return 'stable';
  }

  // ============================================================================
  // Cleanup and Disposal
  // ============================================================================

  /**
   * Cleanup performance tracker
   */
  cleanup(): void {
    // Clear all timers
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
      logger.debug(`Cleared performance monitoring timer: ${name}`);
    }
    this.timers.clear();

    // Final metrics collection
    this.collectMetrics();

    // Persist final metrics
    if (this.config.persistenceEnabled) {
      this.persistMetrics().catch((error) => {
        logger.error('Failed to persist final metrics', { error });
      });
    }

    logger.info('NLU performance tracker cleaned up');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createNLUPerformanceTracker(
  config?: Partial<PerformanceConfig>
): NLUPerformanceTracker {
  return new NLUPerformanceTracker(config);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_PERFORMANCE_CONFIG };
export type { PerformanceConfig, PerformanceMetrics, PerformanceAlert, PerformanceSnapshot };

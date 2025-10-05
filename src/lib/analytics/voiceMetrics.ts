/**
 * Voice Metrics Collection Service
 *
 * Story: 01.05 - Observabilidade e Treinamento Contínuo
 *
 * Comprehensive metrics collection for voice commands:
 * - Performance tracking (latency, confidence)
 * - Success/failure tracking
 * - Regional and device analytics
 * - Real-time monitoring
 *
 * @module analytics/voiceMetrics
 */

import { supabase } from '@/integrations/supabase/client'

// ============================================================================
// Types
// ============================================================================

export interface VoiceMetric {
  userId: string
  sessionId: string
  commandType: string
  intentType?: string
  transcript: string
  confidenceScore: number
  processingTimeMs: number
  sttTimeMs?: number
  nluTimeMs?: number
  responseTimeMs?: number
  success: boolean
  errorType?: string
  errorMessage?: string
  userRegion?: string
  deviceType?: string
  browser?: string
  metadata?: Record<string, any>
}

export interface MetricsSummary {
  totalCommands: number
  successfulCommands: number
  failedCommands: number
  accuracyPercent: number
  avgLatencyMs: number
  p95LatencyMs: number
  avgConfidence: number
}

export interface AlertThreshold {
  metric: 'accuracy' | 'latency' | 'error_rate'
  threshold: number
  durationMinutes: number
}

// ============================================================================
// Voice Metrics Service
// ============================================================================

export class VoiceMetricsService {
  /**
   * Track voice command metric
   */
  async trackMetric(metric: VoiceMetric): Promise<void> {
    try {
      const { error } = await supabase.from('voice_metrics').insert({
        user_id: metric.userId,
        session_id: metric.sessionId,
        command_type: metric.commandType,
        intent_type: metric.intentType,
        transcript: metric.transcript,
        confidence_score: metric.confidenceScore,
        processing_time_ms: metric.processingTimeMs,
        stt_time_ms: metric.sttTimeMs,
        nlu_time_ms: metric.nluTimeMs,
        response_time_ms: metric.responseTimeMs,
        success: metric.success,
        error_type: metric.errorType,
        error_message: metric.errorMessage,
        user_region: metric.userRegion,
        device_type: metric.deviceType,
        browser: metric.browser,
        metadata: metric.metadata,
      })

      if (error) {
        console.error('Failed to track voice metric:', error)
      }
    } catch (error) {
      console.error('Error tracking voice metric:', error)
    }
  }

  /**
   * Get metrics summary for period
   */
  async getMetricsSummary(days: number = 7): Promise<MetricsSummary> {
    try {
      const { data, error } = await supabase
        .from('voice_metrics')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        throw error
      }

      const totalCommands = data.length
      const successfulCommands = data.filter((m) => m.success).length
      const failedCommands = totalCommands - successfulCommands
      const accuracyPercent = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0

      const latencies = data
        .filter((m) => m.success && m.processing_time_ms)
        .map((m) => m.processing_time_ms)
        .sort((a, b) => a - b)

      const avgLatencyMs =
        latencies.length > 0 ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length : 0

      const p95Index = Math.floor(latencies.length * 0.95)
      const p95LatencyMs = latencies.length > 0 ? latencies[p95Index] : 0

      const confidences = data
        .filter((m) => m.confidence_score !== null)
        .map((m) => m.confidence_score)

      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((sum, val) => sum + val, 0) / confidences.length
          : 0

      return {
        totalCommands,
        successfulCommands,
        failedCommands,
        accuracyPercent,
        avgLatencyMs,
        p95LatencyMs,
        avgConfidence,
      }
    } catch (error) {
      console.error('Error getting metrics summary:', error)
      return {
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        accuracyPercent: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        avgConfidence: 0,
      }
    }
  }

  /**
   * Get accuracy by command type
   */
  async getAccuracyByCommand(_days: number = 7): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase.from('accuracy_by_command').select('*')

      if (error) {
        throw error
      }

      const result: Record<string, number> = {}
      data.forEach((row) => {
        result[row.command_type] = row.accuracy_percent
      })

      return result
    } catch (error) {
      console.error('Error getting accuracy by command:', error)
      return {}
    }
  }

  /**
   * Get latency percentiles
   */
  async getLatencyPercentiles(): Promise<{
    p50: number
    p95: number
    p99: number
    avg: number
    max: number
  }> {
    try {
      const { data, error } = await supabase.from('latency_percentiles').select('*').single()

      if (error) {
        throw error
      }

      return {
        p50: data.p50_latency_ms || 0,
        p95: data.p95_latency_ms || 0,
        p99: data.p99_latency_ms || 0,
        avg: data.avg_latency_ms || 0,
        max: data.max_latency_ms || 0,
      }
    } catch (error) {
      console.error('Error getting latency percentiles:', error)
      return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0 }
    }
  }

  /**
   * Get error rate by type
   */
  async getErrorRateByType(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase.from('error_rate_by_type').select('*')

      if (error) {
        throw error
      }

      const result: Record<string, number> = {}
      data.forEach((row) => {
        result[row.error_type] = row.error_rate_percent
      })

      return result
    } catch (error) {
      console.error('Error getting error rate by type:', error)
      return {}
    }
  }

  /**
   * Get regional performance
   */
  async getRegionalPerformance(): Promise<
    Array<{
      region: string
      totalCommands: number
      accuracyPercent: number
      avgLatencyMs: number
    }>
  > {
    try {
      const { data, error } = await supabase.from('regional_performance').select('*')

      if (error) {
        throw error
      }

      return data.map((row) => ({
        region: row.user_region,
        totalCommands: row.total_commands,
        accuracyPercent: row.accuracy_percent,
        avgLatencyMs: row.avg_latency_ms,
      }))
    } catch (error) {
      console.error('Error getting regional performance:', error)
      return []
    }
  }

  /**
   * Check if metrics are below threshold
   */
  async checkThresholds(thresholds: AlertThreshold[]): Promise<
    Array<{
      metric: string
      currentValue: number
      threshold: number
      violated: boolean
    }>
  > {
    const results: Array<{
      metric: string
      currentValue: number
      threshold: number
      violated: boolean
    }> = []

    for (const threshold of thresholds) {
      let currentValue = 0
      let violated = false

      switch (threshold.metric) {
        case 'accuracy': {
          const summary = await this.getMetricsSummary(threshold.durationMinutes / (24 * 60))
          currentValue = summary.accuracyPercent
          violated = currentValue < threshold.threshold
          break
        }
        case 'latency': {
          const latency = await this.getLatencyPercentiles()
          currentValue = latency.p95
          violated = currentValue > threshold.threshold
          break
        }
        case 'error_rate': {
          const summary = await this.getMetricsSummary(threshold.durationMinutes / (24 * 60))
          currentValue =
            summary.totalCommands > 0 ? (summary.failedCommands / summary.totalCommands) * 100 : 0
          violated = currentValue > threshold.threshold
          break
        }
      }

      results.push({
        metric: threshold.metric,
        currentValue,
        threshold: threshold.threshold,
        violated,
      })
    }

    return results
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create voice metrics service
 */
export function createVoiceMetricsService(): VoiceMetricsService {
  return new VoiceMetricsService()
}

/**
 * Quick track function
 */
export async function trackVoiceMetric(metric: VoiceMetric): Promise<void> {
  const service = createVoiceMetricsService()
  return service.trackMetric(metric)
}

/**
 * Get current metrics summary
 */
export async function getCurrentMetrics(days: number = 7): Promise<MetricsSummary> {
  const service = createVoiceMetricsService()
  return service.getMetricsSummary(days)
}

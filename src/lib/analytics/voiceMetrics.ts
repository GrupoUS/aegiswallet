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
        command: metric.transcript, // Use transcript as command since that's what the schema expects
        confidence_score: metric.confidenceScore,
        processing_time_ms: metric.processingTimeMs,
        success: metric.success,
        error_type: metric.errorType,
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
        .map((m) => m.confidence_score as number)

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
      // Since we don't have the complex view tables, calculate from voice_metrics
      const { data, error } = await supabase.from('voice_metrics').select('command, success')

      if (error) {
        throw error
      }

      // Group by command and calculate accuracy
      const commandStats: Record<string, { success: number; total: number }> = {}
      data.forEach((row) => {
        if (!commandStats[row.command]) {
          commandStats[row.command] = { success: 0, total: 0 }
        }
        commandStats[row.command].total++
        if (row.success) {
          commandStats[row.command].success++
        }
      })

      const result: Record<string, number> = {}
      Object.entries(commandStats).forEach(([command, stats]) => {
        result[command] = stats.total > 0 ? (stats.success / stats.total) * 100 : 0
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
      // Calculate percentiles from voice_metrics table
      const { data, error } = await supabase
        .from('voice_metrics')
        .select('processing_time_ms')
        .eq('success', true)

      if (error) {
        throw error
      }

      const latencies = data.map((row) => row.processing_time_ms).sort((a, b) => a - b)

      if (latencies.length === 0) {
        return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0 }
      }

      const p50Index = Math.floor(latencies.length * 0.5)
      const p95Index = Math.floor(latencies.length * 0.95)
      const p99Index = Math.floor(latencies.length * 0.99)

      return {
        p50: latencies[p50Index] || 0,
        p95: latencies[p95Index] || 0,
        p99: latencies[p99Index] || 0,
        avg: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
        max: Math.max(...latencies),
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
      // Calculate error rates from voice_metrics table
      const { data, error } = await supabase.from('voice_metrics').select('error_type, success')

      if (error) {
        throw error
      }

      // Group by error_type and calculate error rates
      const errorStats: Record<string, { errors: number; total: number }> = {}
      data.forEach((row) => {
        const errorType = row.error_type || 'unknown'
        if (!errorStats[errorType]) {
          errorStats[errorType] = { errors: 0, total: 0 }
        }
        errorStats[errorType].total++
        if (!row.success) {
          errorStats[errorType].errors++
        }
      })

      const result: Record<string, number> = {}
      Object.entries(errorStats).forEach(([errorType, stats]) => {
        result[errorType] = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0
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
      // Note: regional_performance table doesn't exist yet
      // Returning empty array for now until the table is created
      return []
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

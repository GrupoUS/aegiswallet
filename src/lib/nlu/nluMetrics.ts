/**
 * NLU Metrics and Logging System
 * Story: 01.02 - NLU dos 6 Comandos Essenciais (AC 5)
 *
 * Tracks classification accuracy, logs false positives/negatives,
 * and provides analytics for model retraining
 *
 * @module nlu/nluMetrics
 */

import { type ClassificationLog, IntentType, type NLUMetrics } from './types';

// ============================================================================
// In-Memory Metrics Store (Replace with Supabase in production)
// ============================================================================

class MetricsStore {
  private logs: ClassificationLog[] = [];
  private metrics: NLUMetrics = {
    totalProcessed: 0,
    successfulClassifications: 0,
    failedClassifications: 0,
    averageConfidence: 0,
    averageProcessingTime: 0,
    intentDistribution: {} as Record<IntentType, number>,
    accuracyByIntent: {} as Record<IntentType, number>,
    falsePositives: 0,
    falseNegatives: 0,
    disambiguationRate: 0,
  };

  constructor() {
    // Initialize intent counters
    for (const intent of Object.values(IntentType)) {
      this.metrics.intentDistribution[intent as IntentType] = 0;
      this.metrics.accuracyByIntent[intent as IntentType] = 0;
    }
  }

  addLog(log: ClassificationLog): void {
    this.logs.push(log);
    this.updateMetrics(log);
  }

  private updateMetrics(log: ClassificationLog): void {
    this.metrics.totalProcessed++;

    // Update intent distribution
    this.metrics.intentDistribution[log.predictedIntent]++;

    // Update averages
    const totalConfidence = this.logs.reduce((sum, l) => sum + l.confidence, 0);
    this.metrics.averageConfidence = totalConfidence / this.logs.length;

    const totalTime = this.logs.reduce((sum, l) => sum + l.processingTime, 0);
    this.metrics.averageProcessingTime = totalTime / this.logs.length;

    // Update success/failure counts based on feedback
    if (log.feedback === 'correct') {
      this.metrics.successfulClassifications++;
    } else if (log.feedback === 'incorrect') {
      this.metrics.failedClassifications++;

      // Track false positives/negatives
      if (log.correctIntent) {
        if (
          log.predictedIntent !== IntentType.UNKNOWN &&
          log.correctIntent === IntentType.UNKNOWN
        ) {
          this.metrics.falsePositives++;
        } else if (
          log.predictedIntent === IntentType.UNKNOWN &&
          log.correctIntent !== IntentType.UNKNOWN
        ) {
          this.metrics.falseNegatives++;
        }
      }
    }

    // Update accuracy by intent
    this.updateAccuracyByIntent();
  }

  private updateAccuracyByIntent(): void {
    const intentCounts: Record<string, { total: number; correct: number }> = {};

    // Initialize counters
    for (const intent of Object.values(IntentType)) {
      intentCounts[intent] = { total: 0, correct: 0 };
    }

    // Count correct predictions per intent
    for (const log of this.logs) {
      if (log.correctIntent) {
        intentCounts[log.correctIntent].total++;
        if (log.predictedIntent === log.correctIntent) {
          intentCounts[log.correctIntent].correct++;
        }
      }
    }

    // Calculate accuracy percentages
    for (const intent of Object.values(IntentType)) {
      const { total, correct } = intentCounts[intent];
      this.metrics.accuracyByIntent[intent as IntentType] = total > 0 ? (correct / total) * 100 : 0;
    }
  }

  getMetrics(): NLUMetrics {
    return { ...this.metrics };
  }

  getLogs(filters?: {
    intent?: IntentType;
    feedback?: 'correct' | 'incorrect' | 'ambiguous';
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): ClassificationLog[] {
    let filtered = [...this.logs];

    if (filters) {
      if (filters.intent) {
        filtered = filtered.filter((log) => log.predictedIntent === filters.intent);
      }

      if (filters.feedback) {
        filtered = filtered.filter((log) => log.feedback === filters.feedback);
      }

      if (filters.startDate) {
        filtered = filtered.filter((log) => log.timestamp >= filters.startDate);
      }

      if (filters.endDate) {
        filtered = filtered.filter((log) => log.timestamp <= filters.endDate);
      }

      if (filters.userId) {
        filtered = filtered.filter((log) => log.userId === filters.userId);
      }
    }

    return filtered;
  }

  getFalsePositives(): ClassificationLog[] {
    return this.logs.filter(
      (log) =>
        log.feedback === 'incorrect' &&
        log.correctIntent === IntentType.UNKNOWN &&
        log.predictedIntent !== IntentType.UNKNOWN
    );
  }

  getFalseNegatives(): ClassificationLog[] {
    return this.logs.filter(
      (log) =>
        log.feedback === 'incorrect' &&
        log.correctIntent !== IntentType.UNKNOWN &&
        log.predictedIntent === IntentType.UNKNOWN
    );
  }

  getConfusionMatrix(): Record<IntentType, Record<IntentType, number>> {
    const matrix: Record<string, Record<string, number>> = {};

    // Initialize matrix
    for (const actual of Object.values(IntentType)) {
      matrix[actual] = {};
      for (const predicted of Object.values(IntentType)) {
        matrix[actual][predicted] = 0;
      }
    }

    // Fill matrix with actual predictions
    for (const log of this.logs) {
      if (log.correctIntent) {
        matrix[log.correctIntent][log.predictedIntent]++;
      }
    }

    return matrix as Record<IntentType, Record<IntentType, number>>;
  }

  getIntentAccuracy(intent: IntentType): number {
    return this.metrics.accuracyByIntent[intent] || 0;
  }

  getPrecisionRecallF1(intent: IntentType): {
    precision: number;
    recall: number;
    f1Score: number;
  } {
    const matrix = this.getConfusionMatrix();

    // True Positives: correctly predicted as this intent
    const tp = matrix[intent][intent] || 0;

    // False Positives: incorrectly predicted as this intent
    let fp = 0;
    for (const actualIntent of Object.values(IntentType)) {
      if (actualIntent !== intent) {
        fp += matrix[actualIntent as IntentType][intent] || 0;
      }
    }

    // False Negatives: this intent incorrectly predicted as something else
    let fn = 0;
    for (const predictedIntent of Object.values(IntentType)) {
      if (predictedIntent !== intent) {
        fn += matrix[intent][predictedIntent as IntentType] || 0;
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;

    return {
      precision: precision * 100,
      recall: recall * 100,
      f1Score: f1Score * 100,
    };
  }

  clear(): void {
    this.logs = [];
    this.metrics = {
      totalProcessed: 0,
      successfulClassifications: 0,
      failedClassifications: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      intentDistribution: {} as Record<IntentType, number>,
      accuracyByIntent: {} as Record<IntentType, number>,
      falsePositives: 0,
      falseNegatives: 0,
      disambiguationRate: 0,
    };

    // Reinitialize intent counters
    for (const intent of Object.values(IntentType)) {
      this.metrics.intentDistribution[intent as IntentType] = 0;
      this.metrics.accuracyByIntent[intent as IntentType] = 0;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const metricsStore = new MetricsStore();

// ============================================================================
// Public API
// ============================================================================

/**
 * Log a classification for metrics tracking
 */
export function logClassification(log: Omit<ClassificationLog, 'id' | 'timestamp'>): void {
  const fullLog: ClassificationLog = {
    ...log,
    id: generateId(),
    timestamp: new Date(),
  };

  metricsStore.addLog(fullLog);
}

/**
 * Provide feedback on a classification
 */
export function provideFeedback(
  logId: string,
  feedback: 'correct' | 'incorrect' | 'ambiguous',
  correctIntent?: IntentType
): void {
  const logs = metricsStore.getLogs();
  const log = logs.find((l) => l.id === logId);

  if (log) {
    log.feedback = feedback;
    if (correctIntent) {
      log.correctIntent = correctIntent;
    }
    // Re-add to update metrics
    metricsStore.addLog(log);
  }
}

/**
 * Get overall metrics
 */
export function getMetrics(): NLUMetrics {
  return metricsStore.getMetrics();
}

/**
 * Get classification logs with optional filters
 */
export function getLogs(filters?: Parameters<typeof metricsStore.getLogs>[0]): ClassificationLog[] {
  return metricsStore.getLogs(filters);
}

/**
 * Get false positives for retraining
 */
export function getFalsePositives(): ClassificationLog[] {
  return metricsStore.getFalsePositives();
}

/**
 * Get false negatives for retraining
 */
export function getFalseNegatives(): ClassificationLog[] {
  return metricsStore.getFalseNegatives();
}

/**
 * Get confusion matrix
 */
export function getConfusionMatrix(): Record<IntentType, Record<IntentType, number>> {
  return metricsStore.getConfusionMatrix();
}

/**
 * Get accuracy for specific intent
 */
export function getIntentAccuracy(intent: IntentType): number {
  return metricsStore.getIntentAccuracy(intent);
}

/**
 * Get precision, recall, and F1 score for specific intent
 */
export function getIntentMetrics(intent: IntentType): {
  precision: number;
  recall: number;
  f1Score: number;
} {
  return metricsStore.getPrecisionRecallF1(intent);
}

/**
 * Generate metrics report
 */
export function generateReport(): {
  summary: NLUMetrics;
  intentMetrics: Record<IntentType, ReturnType<typeof getIntentMetrics>>;
  retrainingCandidates: {
    falsePositives: ClassificationLog[];
    falseNegatives: ClassificationLog[];
    lowConfidenceCorrect: ClassificationLog[];
    highConfidenceIncorrect: ClassificationLog[];
  };
} {
  const metrics = getMetrics();
  const intentMetrics: Record<IntentType, ReturnType<typeof getIntentMetrics>> =
    {} as Record<IntentType, ReturnType<typeof getIntentMetrics>>;

  for (const intent of Object.values(IntentType)) {
    if (intent !== IntentType.UNKNOWN) {
      intentMetrics[intent] = getIntentMetrics(intent as IntentType);
    }
  }

  const logs = getLogs();

  return {
    summary: metrics,
    intentMetrics,
    retrainingCandidates: {
      falsePositives: getFalsePositives(),
      falseNegatives: getFalseNegatives(),
      lowConfidenceCorrect: logs.filter(
        (log) => log.feedback === 'correct' && log.confidence < 0.7
      ),
      highConfidenceIncorrect: logs.filter(
        (log) => log.feedback === 'incorrect' && log.confidence > 0.8
      ),
    },
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metricsStore.clear();
}

/**
 * Export metrics to JSON
 */
export function exportMetrics(): string {
  return JSON.stringify(generateReport(), null, 2);
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Exports
// ============================================================================

export { MetricsStore };
export type { ClassificationLog, NLUMetrics };

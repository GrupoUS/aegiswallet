/**
 * Brazilian Portuguese Learning and Pattern Recognition System
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais (Enhanced Learning)
 *
 * Specialized learning system for Brazilian Portuguese financial commands
 * with regional variation detection and pattern evolution tracking
 *
 * @module nlu/brazilianLearner
 */

import {
  IntentType,
  EntityType,
  type ClassificationLog,
  type ExtractedEntity,
  type TrainingUtterance,
} from './types'

// ============================================================================
// Brazilian Regional Variations
// ============================================================================

interface RegionalPattern {
  region: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste'
  patterns: string[]
  slangTerms: Record<string, string> // slang -> standard
  commonPhrases: string[]
  confidence: number
}

interface PatternEvolution {
  pattern: string
  frequency: number
  successRate: number
  lastSeen: Date
  trend: 'improving' | 'declining' | 'stable'
  contexts: string[] // Contexts where pattern works well
}

interface LearningMetrics {
  regionalAccuracy: Record<string, number>
  linguisticStyleAccuracy: Record<string, number>
  temporalPatterns: Record<string, number>
  vocabularyGrowth: number
  adaptationRate: number
  userSatisfactionScore: number
}

// ============================================================================
// Brazilian Portuguese Knowledge Base
// ============================================================================

const BRAZILIAN_REGIONAL_PATTERNS: RegionalPattern[] = [
  {
    region: 'SP',
    patterns: [
      'qual tah o saldo',
      'quanto tah na conta',
      'vai cair quanto',
      'posso sacar quanto',
      'tinha quanto lá',
    ],
    slangTerms: {
      tah: 'tá',
      cê: 'você',
      vaih: 'vai',
      tinh: 'tinha',
      tô: 'estou',
    },
    commonPhrases: ['tipo assim', 'entendeu', 'né', 'maneiro'],
    confidence: 0.85,
  },
  {
    region: 'RJ',
    patterns: [
      'qual é o meu saldão',
      'quanto de grana eu tenho',
      'vai entrar quantos conto',
      'da pra gastar quanto',
      'tem quilo na conta',
    ],
    slangTerms: {
      grana: 'dinheiro',
      conto: 'mil reais',
      quilo: 'dinheiro',
      saldão: 'saldo grande',
      véi: 'cara',
    },
    commonPhrases: ['você vai', 'cara', 'legal', 'massa'],
    confidence: 0.82,
  },
  {
    region: 'Nordeste',
    patterns: [
      'quanto tá teno',
      'moiá no banco',
      'vai chová quanto',
      'dá pra gastá bão',
      'tem dinheiro na poupança',
    ],
    slangTerms: {
      teno: 'tendo',
      moiá: 'moeda/dinheiro',
      chová: 'chover/cair (dinheiro)',
      bão: 'bom',
      assim: 'assim mesmo',
    },
    commonPhrases: ['oxente', 'pois é', 'meu filho', 'nóis'],
    confidence: 0.78,
  },
  {
    region: 'Sul',
    patterns: [
      'qual é o saldo lá',
      'quanto tem na conta',
      'vai entrar quando',
      'posso usar quanto',
      'tem dinheiro disponível',
    ],
    slangTerms: {
      bah: 'uau/surpresa',
      tchê: 'cara/amigo',
      guri: 'menino/rapaz',
      guria: 'menina/moça',
    },
    commonPhrases: ['bah', 'tchê', 'legal', 'então'],
    confidence: 0.88,
  },
]

// ============================================================================
// Brazilian Learning Engine
// ============================================================================

export class BrazilianLearner {
  private patternEvolution: Map<string, PatternEvolution> = new Map()
  private learningMetrics: LearningMetrics
  private userPatterns: Map<string, UserPatternProfile> = new Map()

  constructor() {
    this.learningMetrics = this.initializeMetrics()
    this.initializePatternEvolution()
  }

  /**
   * Detect regional variation in utterance
   */
  detectRegionalVariation(text: string): {
    region: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste' | 'Unknown'
    confidence: number
    indicators: string[]
  } {
    const normalizedText = text.toLowerCase()
    const regionScores: Record<string, { score: number; indicators: string[] }> = {}

    for (const regionalPattern of BRAZILIAN_REGIONAL_PATTERNS) {
      let score = 0
      const indicators: string[] = []

      // Check for regional patterns
      for (const pattern of regionalPattern.patterns) {
        if (normalizedText.includes(pattern.toLowerCase())) {
          score += 3
          indicators.push(`pattern: ${pattern}`)
        }
      }

      // Check for slang terms
      for (const [slang, standard] of Object.entries(regionalPattern.slangTerms)) {
        if (normalizedText.includes(slang.toLowerCase())) {
          score += 2
          indicators.push(`slang: ${slang}`)
        }
      }

      // Check for common phrases
      for (const phrase of regionalPattern.commonPhrases) {
        if (normalizedText.includes(phrase.toLowerCase())) {
          score += 1
          indicators.push(`phrase: ${phrase}`)
        }
      }

      if (score > 0) {
        regionScores[regionalPattern.region] = { score, indicators }
      }
    }

    if (Object.keys(regionScores).length === 0) {
      return { region: 'Unknown', confidence: 0, indicators: [] }
    }

    // Find region with highest score
    const bestRegion = Object.entries(regionScores).reduce((a, b) =>
      a[1].score > b[1].score ? a : b
    )

    const maxScore = Math.max(...Object.values(regionScores).map((r) => r.score))
    const confidence = (Math.min(maxScore / 10, 1.0) * bestRegion[1].score) / 10

    return {
      region: bestRegion[0] as any,
      confidence: Math.round(confidence * 100) / 100,
      indicators: bestRegion[1].indicators,
    }
  }

  /**
   * Detect linguistic style (slang, formal, colloquial)
   */
  detectLinguisticStyle(text: string): {
    style: 'slang' | 'formal' | 'colloquial' | 'mixed'
    confidence: number
    features: string[]
  } {
    const normalizedText = text.toLowerCase()
    let slangCount = 0
    let formalCount = 0
    let colloquialCount = 0

    const features: string[] = []

    // Check for slang indicators
    const slangIndicators = ['grana', 'bufunfa', 'tah', 'cê', 'véi', 'mano', 'parça']
    for (const slang of slangIndicators) {
      if (normalizedText.includes(slang)) {
        slangCount++
        features.push(`slang: ${slang}`)
      }
    }

    // Check for formal indicators
    const formalIndicators = ['gostaria', 'poderia', 'por favor', 'agradeceria', 'solicito']
    for (const formal of formalIndicators) {
      if (normalizedText.includes(formal)) {
        formalCount++
        features.push(`formal: ${formal}`)
      }
    }

    // Check for colloquial indicators
    const colloquialIndicators = ['né', 'tá bom', 'entendeu', 'tipo assim', 'meu amigo']
    for (const colloquial of colloquialIndicators) {
      if (normalizedText.includes(colloquial)) {
        colloquialCount++
        features.push(`colloquial: ${colloquial}`)
      }
    }

    // Determine style
    const total = slangCount + formalCount + colloquialCount
    if (total === 0) {
      return { style: 'mixed', confidence: 0.5, features: ['no clear indicators'] }
    }

    const slangRatio = slangCount / total
    const formalRatio = formalCount / total
    const colloquialRatio = colloquialCount / total

    if (slangRatio > 0.6) {
      return { style: 'slang', confidence: slangRatio, features }
    } else if (formalRatio > 0.6) {
      return { style: 'formal', confidence: formalRatio, features }
    } else if (colloquialRatio > 0.6) {
      return { style: 'colloquial', confidence: colloquialRatio, features }
    } else {
      return { style: 'mixed', confidence: 0.5, features }
    }
  }

  /**
   * Learn from classification result
   */
  learnFromClassification(log: ClassificationLog): void {
    // Detect regional and linguistic features
    const regional = this.detectRegionalVariation(log.originalText)
    const style = this.detectLinguisticStyle(log.originalText)

    // Update learning metrics
    this.updateLearningMetrics(log, regional, style)

    // Update pattern evolution
    this.updatePatternEvolution(log)

    // Update user profile
    this.updateUserProfile(log, regional, style)

    // Generate improvement suggestions
    this.generateImprovementSuggestions(log)
  }

  /**
   * Suggest pattern improvements based on learning data
   */
  suggestPatternImprovements(intent: IntentType): Array<{
    type: 'new_pattern' | 'regional_variant' | 'slang_inclusion' | 'entity_improvement'
    suggestion: string
    confidence: number
    supportingData: number
  }> {
    const suggestions: Array<{
      type: 'new_pattern' | 'regional_variant' | 'slang_inclusion' | 'entity_improvement'
      suggestion: string
      confidence: number
      supportingData: number
    }> = []

    // Analyze failed classifications for this intent
    const failedLogs = this.getFailedClassificationsForIntent(intent)

    // Find common patterns in failures
    const commonMistakes = this.analyzeCommonMistakes(failedLogs)

    // Generate suggestions based on mistakes
    for (const mistake of commonMistakes) {
      if (mistake.frequency >= 3 && mistake.accuracy < 0.6) {
        suggestions.push({
          type: 'new_pattern',
          suggestion: `Add pattern for: "${mistake.pattern}"`,
          confidence: mistake.frequency / 10,
          supportingData: mistake.frequency,
        })
      }
    }

    // Check for regional variants that need support
    for (const region of ['SP', 'RJ', 'Nordeste', 'Sul'] as const) {
      const regionalAccuracy = this.learningMetrics.regionalAccuracy[region]
      if (regionalAccuracy < 0.75) {
        suggestions.push({
          type: 'regional_variant',
          suggestion: `Add ${region} regional patterns for ${intent}`,
          confidence: 0.75 - regionalAccuracy,
          supportingData: Math.floor(regionalAccuracy * 100),
        })
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get learning analytics report
   */
  getLearningReport(): {
    summary: LearningMetrics
    topPerformingPatterns: Array<{
      pattern: string
      successRate: number
      frequency: number
      region?: string
    }>
    improvementOpportunities: Array<{
      intent: IntentType
      issue: string
      impact: number
      suggestion: string
    }>
    regionalInsights: Record<
      string,
      {
        accuracy: number
        commonPatterns: string[]
        recommendations: string[]
      }
    >
  } {
    const summary = this.learningMetrics
    const topPatterns = this.getTopPerformingPatterns()
    const opportunities = this.getImprovementOpportunities()
    const regionalInsights = this.getRegionalInsights()

    return {
      summary,
      topPerformingPatterns: topPatterns,
      improvementOpportunities: opportunities,
      regionalInsights,
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeMetrics(): LearningMetrics {
    return {
      regionalAccuracy: {},
      linguisticStyleAccuracy: {},
      temporalPatterns: {},
      vocabularyGrowth: 0,
      adaptationRate: 0,
      userSatisfactionScore: 0,
    }
  }

  private initializePatternEvolution(): void {
    // Initialize with known good patterns
    const knownPatterns = [
      'qual é meu saldo',
      'quanto posso gastar',
      'pagar conta de',
      'quando vou receber',
      'transferir para',
      'projeção do mês',
    ]

    for (const pattern of knownPatterns) {
      this.patternEvolution.set(pattern, {
        pattern,
        frequency: 1,
        successRate: 0.9,
        lastSeen: new Date(),
        trend: 'stable',
        contexts: ['general'],
      })
    }
  }

  private updateLearningMetrics(log: ClassificationLog, regional: any, style: any): void {
    // Update regional accuracy
    if (regional.region !== 'Unknown') {
      const current = this.learningMetrics.regionalAccuracy[regional.region] || 0
      const newAccuracy = log.feedback === 'correct' ? 1 : 0
      this.learningMetrics.regionalAccuracy[regional.region] = (current + newAccuracy) / 2
    }

    // Update linguistic style accuracy
    if (style.style !== 'mixed') {
      const current = this.learningMetrics.linguisticStyleAccuracy[style.style] || 0
      const newAccuracy = log.feedback === 'correct' ? 1 : 0
      this.learningMetrics.linguisticStyleAccuracy[style.style] = (current + newAccuracy) / 2
    }

    // Update temporal patterns
    const hour = new Date(log.timestamp).getHours().toString()
    const current = this.learningMetrics.temporalPatterns[hour] || 0
    const newAccuracy = log.feedback === 'correct' ? 1 : 0
    this.learningMetrics.temporalPatterns[hour] = (current + newAccuracy) / 2
  }

  private updatePatternEvolution(log: ClassificationLog): void {
    const key = log.normalizedText.substring(0, 50) // Use first 50 chars as key
    const existing = this.patternEvolution.get(key)

    if (existing) {
      existing.frequency++
      existing.successRate = (existing.successRate + (log.feedback === 'correct' ? 1 : 0)) / 2
      existing.lastSeen = new Date()

      // Update trend
      if (existing.successRate > 0.8) {
        existing.trend = 'improving'
      } else if (existing.successRate < 0.4) {
        existing.trend = 'declining'
      } else {
        existing.trend = 'stable'
      }
    } else {
      this.patternEvolution.set(key, {
        pattern: log.originalText,
        frequency: 1,
        successRate: log.feedback === 'correct' ? 1 : 0,
        lastSeen: new Date(),
        trend: 'stable',
        contexts: [log.predictedIntent],
      })
    }
  }

  private updateUserProfile(log: ClassificationLog, regional: any, style: any): void {
    const userId = log.userId
    let profile = this.userPatterns.get(userId)

    if (!profile) {
      profile = {
        userId,
        region: regional.region,
        preferredStyle: style.style,
        commonPhrases: [],
        accuracyRate: 0,
        lastActivity: new Date(),
      }
      this.userPatterns.set(userId, profile)
    }

    // Update profile
    profile.accuracyRate = (profile.accuracyRate + (log.feedback === 'correct' ? 1 : 0)) / 2
    profile.lastActivity = new Date()

    // Track common phrases
    if (style.features.length > 0) {
      profile.commonPhrases.push(...style.features)
      // Keep only recent phrases
      profile.commonPhrases = profile.commonPhrases.slice(-20)
    }
  }

  private generateImprovementSuggestions(log: ClassificationLog): void {
    if (log.feedback === 'incorrect' && log.errorAnalysis) {
      // Analyze what went wrong and suggest improvements
      const errorType = log.errorAnalysis.errorType

      switch (errorType) {
        case 'pattern_miss':
          // Suggest new pattern additions
          break
        case 'entity_extraction':
          // Suggest entity pattern improvements
          break
        case 'intent_confusion':
          // Suggest intent boundary clarification
          break
        case 'low_confidence':
          // Suggest more training data
          break
      }
    }
  }

  private getFailedClassificationsForIntent(intent: IntentType): ClassificationLog[] {
    // This would typically query a database
    // For now, return empty array
    return []
  }

  private analyzeCommonMistakes(logs: ClassificationLog[]): Array<{
    pattern: string
    frequency: number
    accuracy: number
  }> {
    const mistakes: Record<string, { count: number; correct: number }> = {}

    for (const log of logs) {
      const key = log.originalText.toLowerCase().substring(0, 30)
      if (!mistakes[key]) {
        mistakes[key] = { count: 0, correct: 0 }
      }
      mistakes[key].count++
      if (log.feedback === 'correct') {
        mistakes[key].correct++
      }
    }

    return Object.entries(mistakes)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        accuracy: data.correct / data.count,
      }))
      .filter((m) => m.accuracy < 0.6)
  }

  private getTopPerformingPatterns(): Array<{
    pattern: string
    successRate: number
    frequency: number
    region?: string
  }> {
    return Array.from(this.patternEvolution.entries())
      .map(([key, evolution]) => ({
        pattern: evolution.pattern,
        successRate: evolution.successRate,
        frequency: evolution.frequency,
        region: evolution.contexts[0], // Simplified
      }))
      .sort((a, b) => b.successRate * b.frequency - a.successRate * a.frequency)
      .slice(0, 10)
  }

  private getImprovementOpportunities(): Array<{
    intent: IntentType
    issue: string
    impact: number
    suggestion: string
  }> {
    const opportunities: Array<{
      intent: IntentType
      issue: string
      impact: number
      suggestion: string
    }> = []

    // Analyze low-performing regions
    for (const [region, accuracy] of Object.entries(this.learningMetrics.regionalAccuracy)) {
      if (accuracy < 0.75) {
        opportunities.push({
          intent: IntentType.UNKNOWN,
          issue: `Low accuracy in ${region} region`,
          impact: (0.75 - accuracy) * 100,
          suggestion: `Add more ${region} regional patterns and slang terms`,
        })
      }
    }

    return opportunities.sort((a, b) => b.impact - a.impact).slice(0, 5)
  }

  private getRegionalInsights(): Record<
    string,
    {
      accuracy: number
      commonPatterns: string[]
      recommendations: string[]
    }
  > {
    const insights: Record<string, any> = {}

    for (const region of ['SP', 'RJ', 'Nordeste', 'Sul'] as const) {
      const accuracy = this.learningMetrics.regionalAccuracy[region] || 0
      const regionalData = BRAZILIAN_REGIONAL_PATTERNS.find((p) => p.region === region)

      insights[region] = {
        accuracy,
        commonPatterns: regionalData?.patterns || [],
        recommendations: this.generateRegionalRecommendations(region, accuracy),
      }
    }

    return insights
  }

  private generateRegionalRecommendations(region: string, accuracy: number): string[] {
    const recommendations: string[] = []

    if (accuracy < 0.8) {
      recommendations.push('Increase training data for this region')
      recommendations.push('Add more regional slang terms')
    }

    if (accuracy < 0.6) {
      recommendations.push('Consider region-specific model fine-tuning')
      recommendations.push('Add regional accent handling in speech processing')
    }

    return recommendations
  }
}

// ============================================================================
// Types
// ============================================================================

interface UserPatternProfile {
  userId: string
  region: string
  preferredStyle: string
  commonPhrases: string[]
  accuracyRate: number
  lastActivity: Date
}

// ============================================================================
// Factory Function
// ============================================================================

export function createBrazilianLearner(): BrazilianLearner {
  return new BrazilianLearner()
}

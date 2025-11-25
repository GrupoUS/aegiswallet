/**
 * Error Recovery System for AegisWallet NLU
 *
 * Intelligent error recovery and clarification mechanisms
 * for misunderstood voice commands with learning capabilities
 *
 * @module nlu/errorRecovery
 */

import { logger } from '@/lib/logging/logger';
import type { BrazilianContext } from '@/lib/nlu/brazilianPatterns';
import { BrazilianContextAnalyzer } from '@/lib/nlu/brazilianPatterns';
import type { ExtractedEntity, NLUResult } from '@/lib/nlu/types';
import { EntityType, IntentType, NLUError, NLUErrorCode } from '@/lib/nlu/types';

// Recovery context for error handling
export interface RecoveryContext {
  lastIntent?: IntentType;
  lastEntities?: ExtractedEntity[];
  errorHistory: Array<{ code: NLUErrorCode; timestamp: Date }>;
  recoveryAttempts: number;
  userFeedback?: string;
}

// Financial context for recovery
export interface FinancialContext {
  recentTransactions?: Array<{ type: string; amount: number; date: Date }>;
  frequentRecipients?: string[];
  commonCategories?: string[];
  averageSpending?: number;
  accountSummary?: {
    totalBalance: number;
    availableBalance: number;
    pendingTransactions: number;
    scheduledPayments: number;
  };
  billPatterns?: {
    upcomingBills: Array<{
      type: string;
      amount: number;
      dueDate: Date;
      status: 'pending' | 'overdue' | 'paid';
    }>;
    averageBillAmount: number;
    mostCommonBills: string[];
  };
}

// ============================================================================
// Error Recovery Configuration
// ============================================================================

export interface ErrorRecoveryConfig {
  enabled: boolean;
  maxRecoveryAttempts: number;
  learningEnabled: boolean;
  regionalAdaptationEnabled: boolean;
  contextualRecoveryEnabled: boolean;
  autoCorrectionEnabled: boolean;
  userFeedbackEnabled: boolean;
  persistenceEnabled: boolean;
  confidenceThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  recoveryStrategies: {
    patternMatching: boolean;
    entityExtraction: boolean;
    contextualInference: boolean;
    userHistory: boolean;
    regionalVariation: boolean;
  };
}

const DEFAULT_ERROR_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  autoCorrectionEnabled: true,
  confidenceThresholds: {
    high: 0.8,
    low: 0.4,
    medium: 0.6,
  },
  contextualRecoveryEnabled: true,
  enabled: true,
  learningEnabled: true,
  maxRecoveryAttempts: 3,
  persistenceEnabled: true,
  recoveryStrategies: {
    contextualInference: true,
    entityExtraction: true,
    patternMatching: true,
    regionalVariation: true,
    userHistory: true,
  },
  regionalAdaptationEnabled: true,
  userFeedbackEnabled: true,
};

// ============================================================================
// Error Classification and Analysis
// ============================================================================

export interface ErrorClassification {
  type:
    | 'pattern_miss'
    | 'entity_extraction'
    | 'intent_confusion'
    | 'low_confidence'
    | 'regional_misunderstanding'
    | 'processing_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  rootCause: string;
  suggestedFixes: string[];
  learningOpportunities: string[];
  contextualFactors: string[];
  regionalFactors?: string[];
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrors: string[];
  priority: number;
  successRate: number;
  averageConfidenceImprovement: number;
  implementation: (error: ErrorClassification, context: RecoveryContext) => Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  correctedIntent?: IntentType;
  correctedEntities?: ExtractedEntity[];
  confidenceImprovement: number;
  appliedStrategy: string;
  reasoning: string;
  requiresUserConfirmation: boolean;
  suggestedUserResponse?: string;
  suggestedCorrection?: string;
  alternativeOptions?: RecoveryResult[];
}

export interface RecoveryContext {
  originalText: string;
  originalResult: NLUResult | null;
  userId: string;
  sessionId: string;
  conversationHistory: {
    text: string;
    result: NLUResult;
    timestamp: Date;
  }[];
  userPreferences: Record<string, unknown>;
  financialContext: FinancialContext;
  brazilianContext: BrazilianContext;
  recoveryAttempts: number;
  previousErrors: ErrorClassification[];
}

export interface LearningData {
  originalText: string;
  correctedText: string;
  errorType: string;
  strategy: string;
  errorPattern?: string;
  correctionApplied?: string;
  success: boolean;
  confidenceImprovement: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  regionalVariation?: string;
  linguisticStyle?: string;
  timestamp: Date;
  userId?: string;
}

// ============================================================================
// Error Recovery Class
// ============================================================================

export class ErrorRecoverySystem {
  private config: ErrorRecoveryConfig;
  private brazilianAnalyzer = new BrazilianContextAnalyzer();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private learningData: LearningData[] = [];
  private errorPatterns = new Map<string, ErrorClassification[]>();

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_RECOVERY_CONFIG, ...config };
    this.initializeRecoveryStrategies();
  }

  // ============================================================================
  // Main Error Recovery Methods
  // ============================================================================

  /**
   * Analyze and classify NLU error
   */
  async classifyError(
    error: Error | NLUError,
    originalText: string,
    originalResult: NLUResult | null,
    context: Partial<RecoveryContext>
  ): Promise<ErrorClassification> {
    try {
      const classification = await this.performErrorClassification(
        error,
        originalText,
        originalResult,
        context
      );

      // Log error classification
      logger.warn('NLU error classified', {
        confidence: classification.confidence,
        errorType: classification.type,
        originalText: originalText.substring(0, 50),
        rootCause: classification.rootCause,
        severity: classification.severity,
      });

      // Store error pattern for learning
      this.storeErrorPattern(originalText, classification);

      return classification;
    } catch (classifyError) {
      logger.error('Failed to classify NLU error', { error: classifyError });

      // Return generic classification
      return {
        confidence: 0.5,
        contextualFactors: [],
        learningOpportunities: ['Improve error classification'],
        rootCause: 'Error classification failed',
        severity: 'medium',
        suggestedFixes: ['Try rephrasing the command'],
        type: 'processing_error',
      };
    }
  }

  /**
   * Attempt to recover from NLU error
   */
  async attemptRecovery(
    errorClassification: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!this.config.enabled) {
      return {
        appliedStrategy: 'none',
        confidenceImprovement: 0,
        reasoning: 'Error recovery is disabled',
        requiresUserConfirmation: false,
        success: false,
      };
    }

    if (context.recoveryAttempts >= this.config.maxRecoveryAttempts) {
      return {
        appliedStrategy: 'max_attempts_reached',
        confidenceImprovement: 0,
        reasoning: 'Maximum recovery attempts exceeded',
        requiresUserConfirmation: true,
        success: false,
        suggestedUserResponse: 'Por favor, tente reformular seu comando de forma diferente',
      };
    }

    try {
      // Get applicable recovery strategies
      const applicableStrategies = this.getApplicableStrategies(errorClassification);

      // Sort by priority and success rate
      applicableStrategies.sort((a, b) => {
        const bPriorityScore = b.priority * 0.6 + b.successRate * 0.4;
        const aPriorityScore = a.priority * 0.6 + a.successRate * 0.4;
        return bPriorityScore - aPriorityScore;
      });

      // Try strategies in order
      for (const strategy of applicableStrategies) {
        try {
          const result = await strategy.implementation(errorClassification, context);

          if (result.success) {
            // Log successful recovery
            logger.info('NLU error recovery successful', {
              confidenceImprovement: result.confidenceImprovement,
              originalText: context.originalText.substring(0, 50),
              strategy: strategy.name,
            });

            // Update strategy success rate
            this.updateStrategySuccessRate(strategy.id, true);

            // Store learning data
            if (this.config.learningEnabled) {
              const learningDataEntry: LearningData = {
                originalText: context.originalText,
                correctedText: result.suggestedCorrection || context.originalText,
                errorType: errorClassification.type,
                strategy: strategy.name,
                success: result.confidenceImprovement > 0,
                confidenceImprovement: result.confidenceImprovement,
                timestamp: new Date(),
              };
              this.learningData.push(learningDataEntry);
              this.persistLearningData(learningDataEntry);
            }

            return result;
          }

          // Update strategy failure rate
          this.updateStrategySuccessRate(strategy.id, false);
        } catch (strategyError) {
          logger.warn('Recovery strategy failed', {
            error: strategyError,
            strategy: strategy.name,
          });
        }
      }

      // All strategies failed
      return {
        appliedStrategy: 'all_failed',
        confidenceImprovement: 0,
        reasoning: 'All recovery strategies failed',
        requiresUserConfirmation: true,
        success: false,
        suggestedUserResponse: this.generateFallbackSuggestion(errorClassification, context),
      };
    } catch (recoveryError) {
      logger.error('Error recovery process failed', { error: recoveryError });

      return {
        appliedStrategy: 'process_failed',
        confidenceImprovement: 0,
        reasoning: 'Recovery process encountered an error',
        requiresUserConfirmation: true,
        success: false,
        suggestedUserResponse: 'Por favor, tente novamente mais tarde',
      };
    }
  }

  /**
   * Generate clarification questions for user
   */
  async generateClarificationQuestions(
    errorClassification: ErrorClassification,
    context: RecoveryContext
  ): Promise<{
    primaryQuestion: string;
    followUpQuestions: string[];
    contextualHints: string[];
    suggestedCommands: string[];
  }> {
    try {
      const questions = {
        contextualHints: [] as string[],
        followUpQuestions: [] as string[],
        primaryQuestion: '',
        suggestedCommands: [] as string[],
      };

      // Generate questions based on error type
      switch (errorClassification.type) {
        case 'intent_confusion':
          questions.primaryQuestion = 'O que você gostaria de fazer exatamente?';
          questions.followUpQuestions = [
            'Você quer verificar saldo, pagar contas ou fazer transferências?',
            'É uma consulta ou uma transação financeira?',
          ];
          questions.suggestedCommands = [
            'Qual é meu saldo',
            'Pagar conta de luz',
            'Transferir dinheiro para o João',
          ];
          break;

        case 'entity_extraction':
          questions.primaryQuestion = 'Pode me dar mais detalhes sobre a transação?';
          questions.followUpQuestions = ['Qual é o valor?', 'Para quem ou para que é a transação?'];
          questions.suggestedCommands = [
            'Transferir R$ 100 para o João',
            'Pagar R$ 150 de conta de luz',
            'Verificar saldo da conta corrente',
          ];
          break;

        case 'low_confidence':
          questions.primaryQuestion = 'Pode confirmar o que você quis dizer?';
          questions.followUpQuestions = [
            'É isso mesmo que você quer fazer?',
            'Você pode reformular de outra forma?',
          ];
          questions.contextualHints = this.generateContextualHints(errorClassification, context);
          break;

        case 'regional_misunderstanding':
          questions.primaryQuestion = 'Não reconheci alguns termos. Pode explicar de outra forma?';
          questions.followUpQuestions = [
            'Você está se referindo a alguma conta específica?',
            'É um pagamento ou uma consulta?',
          ];
          questions.contextualHints = [
            'Tente usar termos mais comuns como "saldo", "pagar", "transferir"',
          ];
          break;

        default:
          questions.primaryQuestion = 'Pode repetir seu comando de forma diferente?';
          questions.followUpQuestions = [
            'O que você gostaria de fazer com suas finanças?',
            'É uma consulta ou uma ação?',
          ];
          questions.suggestedCommands = ['Qual é meu saldo', 'Pagar contas', 'Fazer transferência'];
      }

      // Add Brazilian regional context
      if (this.config.recoveryStrategies.regionalVariation) {
        this.addRegionalContextToQuestions(questions, context.brazilianContext);
      }

      return questions;
    } catch (error) {
      logger.error('Failed to generate clarification questions', { error });

      return {
        contextualHints: [],
        followUpQuestions: ['O que você gostaria de fazer?'],
        primaryQuestion: 'Pode repetir seu comando?',
        suggestedCommands: ['Qual é meu saldo', 'Pagar contas'],
      };
    }
  }

  /**
   * Process user feedback for learning
   */
  async processUserFeedback(
    originalText: string,
    originalResult: NLUResult | null,
    correctedText: string,
    correctedResult: NLUResult,
    feedback: 'positive' | 'negative' | 'neutral',
    userId: string
  ): Promise<void> {
    if (!this.config.learningEnabled) {
      return;
    }

    try {
      const learningData: LearningData = {
        originalText,
        correctedText,
        errorType: 'user_correction',
        strategy: 'feedback_learning',
        confidenceImprovement: correctedResult.confidence - (originalResult?.confidence || 0),
        correctionApplied: correctedText,
        errorPattern: originalText,
        linguisticStyle: this.brazilianAnalyzer.analyzeContext(originalText).linguisticStyle,
        regionalVariation: this.brazilianAnalyzer.analyzeContext(originalText).region,
        success: feedback === 'positive',
        timestamp: new Date(),
        userFeedback: feedback,
        userId,
      };

      // Store learning data
      this.learningData.push(learningData);

      // Update patterns based on feedback
      if (feedback === 'positive' || feedback === 'negative') {
        await this.updatePatternsFromFeedback(learningData, feedback === 'positive');
      }

      // Persist learning data
      if (this.config.persistenceEnabled) {
        await this.persistLearningData(learningData);
      }

      logger.info('User feedback processed for learning', {
        confidenceImprovement: learningData.confidenceImprovement,
        correctedText: correctedText.substring(0, 50),
        feedback,
        originalText: originalText.substring(0, 50),
      });
    } catch (error) {
      logger.error('Failed to process user feedback', { error });
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async performErrorClassification(
    error: Error | NLUError,
    originalText: string,
    originalResult: NLUResult | null,
    context: Partial<RecoveryContext>
  ): Promise<ErrorClassification> {
    // Text is already processed by caller - use originalText instead
    void originalText;

    // Analyze error characteristics
    let errorType: ErrorClassification['type'] = 'processing_error';
    let severity: ErrorClassification['severity'] = 'medium';
    const confidence = 0.5;
    let rootCause = 'Unknown error';
    let suggestedFixes: string[] = [];
    let learningOpportunities: string[] = [];
    const contextualFactors: string[] = [];

    // Classify based on error type
    if (error instanceof NLUError) {
      switch (error.code) {
        case NLUErrorCode.CLASSIFICATION_FAILED:
          errorType = 'intent_confusion';
          severity = 'high';
          rootCause = 'Intent classification algorithm failed';
          suggestedFixes = ['Try pattern matching fallback', 'Use contextual inference'];
          learningOpportunities = ['Improve training data', 'Add more patterns'];
          break;

        case NLUErrorCode.ENTITY_EXTRACTION_FAILED:
          errorType = 'entity_extraction';
          severity = 'medium';
          rootCause = 'Entity extraction algorithm failed';
          suggestedFixes = ['Try entity pattern matching', 'Use contextual hints'];
          learningOpportunities = ['Improve entity patterns', 'Add Brazilian variations'];
          break;

        case NLUErrorCode.PROCESSING_TIMEOUT:
          errorType = 'processing_error';
          severity = 'critical';
          rootCause = 'Processing timeout exceeded';
          suggestedFixes = ['Optimize processing pipeline', 'Reduce input complexity'];
          learningOpportunities = ['Improve performance optimization'];
          break;

        case NLUErrorCode.INVALID_INPUT:
          errorType = 'pattern_miss';
          severity = 'low';
          rootCause = 'Input validation failed';
          suggestedFixes = ['Guide user to proper format', 'Provide examples'];
          learningOpportunities = ['Improve input validation', 'Better user guidance'];
          break;

        default:
          errorType = 'processing_error';
          severity = 'medium';
          rootCause = 'Unknown NLU error';
          suggestedFixes = ['Retry with different approach', 'Log for investigation'];
          learningOpportunities = ['Improve error handling'];
      }
    }

    // Analyze based on original result
    if (originalResult) {
      if (originalResult.confidence < this.config.confidenceThresholds.low) {
        errorType = 'low_confidence';
        severity = 'medium';
        rootCause = 'Low confidence in classification';
        suggestedFixes = ['Request clarification', 'Use contextual inference'];
        learningOpportunities = ['Improve confidence scoring', 'Add training examples'];
      }

      if (originalResult.intent === IntentType.UNKNOWN) {
        errorType = 'pattern_miss';
        severity = 'high';
        rootCause = 'No matching intent patterns found';
        suggestedFixes = ['Try fuzzy matching', 'Use regional variations'];
        learningOpportunities = ['Add more intent patterns', 'Include regional variations'];
      }
    }

    // Check for regional misunderstandings
    const brazilianContext = this.brazilianAnalyzer.analyzeContext(originalText);
    if (
      brazilianContext.region !== 'Unknown' &&
      (errorType === 'pattern_miss' || errorType === 'intent_confusion')
    ) {
      errorType = 'regional_misunderstanding';
      severity = 'medium';
      rootCause = `Regional variation not recognized: ${brazilianContext.region}`;
      suggestedFixes = ['Apply regional pattern matching', 'Use local slang dictionary'];
      learningOpportunities = ['Add regional patterns', 'Improve slang recognition'];
      contextualFactors.push(`Regional variation: ${brazilianContext.region}`);
      contextualFactors.push(`Linguistic style: ${brazilianContext.linguisticStyle}`);
    }

    // Add contextual factors
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      contextualFactors.push('Conversation context available');
    }

    if (context.userPreferences) {
      contextualFactors.push('User preferences available');
    }

    return {
      confidence,
      contextualFactors,
      learningOpportunities,
      regionalFactors:
        brazilianContext.region !== 'Unknown' ? [brazilianContext.region] : undefined,
      rootCause,
      severity,
      suggestedFixes,
      type: errorType,
    };
  }

  private initializeRecoveryStrategies(): void {
    // Pattern matching recovery
    this.recoveryStrategies.set('pattern_matching', {
      applicableErrors: ['pattern_miss', 'intent_confusion', 'regional_misunderstanding'],
      averageConfidenceImprovement: 0.25,
      description: 'Uses enhanced pattern matching with Brazilian variations',
      id: 'pattern_matching',
      implementation: async (error, context) => {
        return this.performPatternMatchingRecovery(error, context);
      },
      name: 'Pattern Matching Recovery',
      priority: 9,
      successRate: 0.75,
    });

    // Entity extraction recovery
    this.recoveryStrategies.set('entity_extraction', {
      applicableErrors: ['entity_extraction', 'low_confidence'],
      averageConfidenceImprovement: 0.2,
      description: 'Enhanced entity extraction with contextual hints',
      id: 'entity_extraction',
      implementation: async (error, context) => {
        return this.performEntityExtractionRecovery(error, context);
      },
      name: 'Entity Extraction Recovery',
      priority: 8,
      successRate: 0.65,
    });

    // Contextual inference recovery
    this.recoveryStrategies.set('contextual_inference', {
      applicableErrors: ['low_confidence', 'intent_confusion'],
      averageConfidenceImprovement: 0.3,
      description: 'Uses conversation and financial context for inference',
      id: 'contextual_inference',
      implementation: async (error, context) => {
        return this.performContextualInferenceRecovery(error, context);
      },
      name: 'Contextual Inference Recovery',
      priority: 7,
      successRate: 0.7,
    });

    // User history recovery
    this.recoveryStrategies.set('user_history', {
      applicableErrors: ['intent_confusion', 'low_confidence', 'entity_extraction'],
      averageConfidenceImprovement: 0.22,
      description: "Leverages user's historical patterns and preferences",
      id: 'user_history',
      implementation: async (error, context) => {
        return this.performUserHistoryRecovery(error, context);
      },
      name: 'User History Recovery',
      priority: 6,
      successRate: 0.6,
    });

    // Regional variation recovery
    this.recoveryStrategies.set('regional_variation', {
      applicableErrors: ['regional_misunderstanding', 'pattern_miss', 'intent_confusion'],
      averageConfidenceImprovement: 0.35,
      description: 'Adapts to Brazilian regional variations and slang',
      id: 'regional_variation',
      implementation: async (error, context) => {
        return this.performRegionalVariationRecovery(error, context);
      },
      name: 'Regional Variation Recovery',
      priority: 8,
      successRate: 0.8,
    });
  }

  private getApplicableStrategies(errorClassification: ErrorClassification): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values()).filter(
      (strategy) =>
        strategy.applicableErrors.includes(errorClassification.type) &&
        this.isStrategyEnabled(strategy.id)
    );
  }

  private isStrategyEnabled(strategyId: string): boolean {
    switch (strategyId) {
      case 'pattern_matching':
        return this.config.recoveryStrategies.patternMatching;
      case 'entity_extraction':
        return this.config.recoveryStrategies.entityExtraction;
      case 'contextual_inference':
        return this.config.recoveryStrategies.contextualInference;
      case 'user_history':
        return this.config.recoveryStrategies.userHistory;
      case 'regional_variation':
        return this.config.recoveryStrategies.regionalVariation;
      default:
        return true;
    }
  }

  // ============================================================================
  // Recovery Strategy Implementations
  // ============================================================================

  private async performPatternMatchingRecovery(
    error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const text = context.originalText.toLowerCase();

    // Enhanced Brazilian pattern matching
    const intentPatterns = {
      [IntentType.CHECK_BALANCE]: [
        /qual.*saldo|quanto.*tenho|como.*conta|meu.*dinheiro|quanto.*fica/i,
        /saldo.*conta|verificar.*saldo|consultar.*saldo/i,
        // Brazilian variations
        /quanto.*tá.*na.*conta|meu.*bem.*tá|como.*tá.*minha.*grana/i,
      ],
      [IntentType.PAY_BILL]: [
        /pagar.*conta|quitar.*fatura|efetuar.*pagamento/i,
        // Brazilian variations
        /pagar.*boleta|acertar.*contas|liquidar.*débito|regularizar/i,
      ],
      [IntentType.TRANSFER_MONEY]: [
        /transferir.*para|enviar.*dinheiro|fazer.*transferência/i,
        // Brazilian variations
        /mandar.*grana|passar.*dinheiro|fazer.*pix|depositar.*para/i,
      ],
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            appliedStrategy: 'pattern_matching',
            confidenceImprovement: 0.3,
            correctedIntent: intent as IntentType,
            reasoning: `Pattern matched: ${pattern.source}`,
            requiresUserConfirmation: error.severity === 'high',
            success: true,
            suggestedUserResponse: `Você quis dizer ${this.getIntentDescription(intent as IntentType)}?`,
          };
        }
      }
    }

    return {
      appliedStrategy: 'pattern_matching',
      confidenceImprovement: 0,
      reasoning: 'No enhanced patterns matched',
      requiresUserConfirmation: false,
      success: false,
    };
  }

  private async performEntityExtractionRecovery(
    _error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const text = context.originalText;
    const extractedEntities: ExtractedEntity[] = [];

    // Enhanced Brazilian entity extraction
    const entityPatterns = [
      {
        extract: (match: RegExpExecArray) => ({
          confidence: 0.8,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
          normalizedValue: parseFloat(match[1].replace(',', '.')),
          startIndex: match.index,
          type: EntityType.AMOUNT,
          value: match[1],
        }),
        pattern: /R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s*(reais|r\$|real|reis)/gi,
        type: EntityType.AMOUNT,
      },
      {
        extract: (match: RegExpExecArray) => ({
          confidence: 0.9,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
          normalizedValue: match[2].toLowerCase(),
          startIndex: match.index,
          type: EntityType.BILL_TYPE,
          value: match[2],
        }),
        pattern: /(conta de )?(luz|energia|água|telefone|internet|gás|condomínio)/gi,
        type: EntityType.BILL_TYPE,
      },
      {
        extract: (match: RegExpExecArray) => ({
          confidence: 0.7,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
          normalizedValue: { type: 'name', value: match[1] },
          startIndex: match.index,
          type: EntityType.RECIPIENT,
          value: match[1],
        }),
        pattern: /para\s+([A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+)/gi,
        type: EntityType.RECIPIENT,
      },
    ];

    // Extract entities using enhanced patterns
    for (const entityPattern of entityPatterns) {
      let match: RegExpExecArray | null = entityPattern.pattern.exec(text);
      while (match !== null) {
        extractedEntities.push(entityPattern.extract(match));
        match = entityPattern.pattern.exec(text);
      }
    }

    if (extractedEntities.length > 0) {
      return {
        appliedStrategy: 'entity_extraction',
        confidenceImprovement: 0.2,
        correctedEntities: extractedEntities,
        reasoning: `Extracted ${extractedEntities.length} entities using enhanced patterns`,
        requiresUserConfirmation: true,
        success: true,
        suggestedUserResponse: 'Encontrei algumas informações. Posso prosseguir?',
      };
    }

    return {
      appliedStrategy: 'entity_extraction',
      confidenceImprovement: 0,
      reasoning: 'No entities could be extracted',
      requiresUserConfirmation: false,
      success: false,
    };
  }

  private async performContextualInferenceRecovery(
    _error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // Use conversation history and financial context for inference
    const recentIntents = context.conversationHistory.slice(-3).map((h) => h.result.intent);
    const text = context.originalText.toLowerCase();

    // Infer intent from context
    if (
      (recentIntents.includes(IntentType.TRANSFER_MONEY) && text.includes('saldo')) ||
      text.includes('quanto')
    ) {
      return {
        appliedStrategy: 'contextual_inference',
        confidenceImprovement: 0.25,
        correctedIntent: IntentType.CHECK_BALANCE,
        reasoning: 'Inferred balance check after transfer based on conversation flow',
        requiresUserConfirmation: true,
        success: true,
        suggestedUserResponse: 'Você quer verificar seu saldo após a transferência?',
      };
    }

    // Use financial context
    const upcomingBills = context.financialContext?.billPatterns?.upcomingBills ?? [];
    if (
      (upcomingBills && upcomingBills.length > 0 && text.includes('pagar')) ||
      text.includes('conta')
    ) {
      return {
        appliedStrategy: 'contextual_inference',
        confidenceImprovement: 0.3,
        correctedIntent: IntentType.PAY_BILL,
        reasoning: `Inferred bill payment - ${upcomingBills?.length ?? 0} bills pending`,
        requiresUserConfirmation: true,
        success: true,
        suggestedUserResponse: 'Você quer pagar suas contas pendentes?',
      };
    }

    return {
      appliedStrategy: 'contextual_inference',
      confidenceImprovement: 0,
      reasoning: 'No contextual inference could be made',
      requiresUserConfirmation: false,
      success: false,
    };
  }

  private async performUserHistoryRecovery(
    _error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // Analyze user's historical patterns
    const userHistory = context.conversationHistory;
    // Note: context.originalText available if needed for future pattern matching

    // Find most frequent intent
    const intentFrequency = userHistory.reduce(
      (acc, turn) => {
        acc[turn.result.intent] = (acc[turn.result.intent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostFrequentIntent = Object.entries(intentFrequency).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as IntentType;

    if (mostFrequentIntent && intentFrequency[mostFrequentIntent] >= 3) {
      return {
        appliedStrategy: 'user_history',
        confidenceImprovement: 0.15,
        correctedIntent: mostFrequentIntent,
        reasoning: `Inferred based on user's most frequent intent: ${mostFrequentIntent}`,
        requiresUserConfirmation: true,
        success: true,
        suggestedUserResponse: `Baseado no seu histórico, você quis ${this.getIntentDescription(mostFrequentIntent)}?`,
      };
    }

    return {
      appliedStrategy: 'user_history',
      confidenceImprovement: 0,
      reasoning: 'Insufficient user history for inference',
      requiresUserConfirmation: false,
      success: false,
    };
  }

  private async performRegionalVariationRecovery(
    error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    const brazilianContext = context.brazilianContext;
    const text = context.originalText.toLowerCase();

    // Regional pattern mappings
    const regionalMappings = {
      Nordeste: {
        arre: 'surpresa',
        bão: 'bom',
        oxente: 'ei',
      },
      RJ: {
        caraca: 'surpresa',
        maneiro: 'bom',
        pixar: 'transferir',
      },
      SP: {
        boleta: 'boleto',
        grana: 'dinheiro',
        'meu bem': 'saldo',
      },
      Sul: {
        bah: 'surpresa',
        guri: 'pessoa',
        tchê: 'amigo',
      },
    };

    const regionMappings =
      regionalMappings[brazilianContext.region as keyof typeof regionalMappings];
    if (!regionMappings) {
      return {
        appliedStrategy: 'regional_variation',
        confidenceImprovement: 0,
        reasoning: `No regional mappings for ${brazilianContext.region}`,
        requiresUserConfirmation: false,
        success: false,
      };
    }

    // Apply regional mappings
    let normalizedText = text;
    let appliedMappings = 0;

    for (const [regional, standard] of Object.entries(regionMappings)) {
      if (normalizedText.includes(regional)) {
        normalizedText = normalizedText.replace(new RegExp(regional, 'g'), standard);
        appliedMappings++;
      }
    }

    if (appliedMappings > 0) {
      // Try pattern matching with normalized text
      const patternResult = await this.performPatternMatchingRecovery(error, {
        ...context,
        originalText: normalizedText,
      });

      if (patternResult.success) {
        return {
          ...patternResult,
          appliedStrategy: 'regional_variation',
          reasoning: `Applied ${appliedMappings} regional mappings for ${brazilianContext.region}`,
          confidenceImprovement: patternResult.confidenceImprovement + 0.1,
        };
      }
    }

    return {
      appliedStrategy: 'regional_variation',
      confidenceImprovement: 0,
      reasoning: 'Regional variations did not help resolve the error',
      requiresUserConfirmation: false,
      success: false,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getIntentDescription(intent: IntentType): string {
    const descriptions = {
      [IntentType.CHECK_BALANCE]: 'verificar seu saldo',
      [IntentType.PAY_BILL]: 'pagar uma conta',
      [IntentType.TRANSFER_MONEY]: 'fazer uma transferência',
      [IntentType.CHECK_BUDGET]: 'analisar seu orçamento',
      [IntentType.CHECK_INCOME]: 'consultar seus rendimentos',
      [IntentType.FINANCIAL_PROJECTION]: 'ver uma projeção financeira',
    } as Record<IntentType, string>;

    return descriptions[intent] || 'realizar uma operação financeira';
  }

  private generateFallbackSuggestion(
    errorClassification: ErrorClassification,
    _context: RecoveryContext
  ): string {
    switch (errorClassification.type) {
      case 'intent_confusion':
        return 'Tente ser mais específico sobre o que você quer fazer';
      case 'entity_extraction':
        return 'Inclua valores ou nomes completos na sua solicitação';
      case 'low_confidence':
        return 'Fale de forma mais clara e pausada';
      case 'regional_misunderstanding':
        return 'Tente usar termos mais comuns em português brasileiro';
      default:
        return 'Tente reformular seu comando de forma simples';
    }
  }

  private generateContextualHints(
    _errorClassification: ErrorClassification,
    context: RecoveryContext
  ): string[] {
    const hints = [];

    if (
      context.financialContext?.accountSummary &&
      context.financialContext.accountSummary.availableBalance > 0
    ) {
      hints.push('Você pode consultar seu saldo disponível');
    }

    const pendingBills = context.financialContext?.billPatterns?.upcomingBills;
    if (pendingBills && pendingBills.length > 0) {
      hints.push('Você tem contas para pagar este mês');
    }

    if (context.conversationHistory.length > 0) {
      const lastIntent =
        context.conversationHistory[context.conversationHistory.length - 1].result.intent;
      hints.push(`Sua última ação foi: ${this.getIntentDescription(lastIntent)}`);
    }

    return hints;
  }

  private addRegionalContextToQuestions(
    questions: { contextualHints: string[] },
    brazilianContext: BrazilianContext
  ): void {
    if (brazilianContext.region === 'SP') {
      questions.contextualHints.push('Tente usar termos como "saldo", "pagar", "transferir"');
    } else if (brazilianContext.region === 'RJ') {
      questions.contextualHints.push('Tente ser claro sobre PIX, contas ou transferências');
    } else if (brazilianContext.region === 'Nordeste') {
      questions.contextualHints.push('Oxente, tente explicar o que você quer de forma simples');
    }
  }

  private storeErrorPattern(text: string, classification: ErrorClassification): void {
    const pattern = text.toLowerCase().substring(0, 100);

    if (!this.errorPatterns.has(pattern)) {
      this.errorPatterns.set(pattern, []);
    }

    this.errorPatterns.get(pattern)?.push(classification);

    // Keep only recent patterns
    if (this.errorPatterns.size > 1000) {
      const entries = Array.from(this.errorPatterns.entries());
      entries.sort((a, b) => b[1].length - a[1].length);
      this.errorPatterns = new Map(entries.slice(0, 800));
    }
  }

  private updateStrategySuccessRate(strategyId: string, success: boolean): void {
    const strategy = this.recoveryStrategies.get(strategyId);
    if (!strategy) {
      return;
    }

    // Simple moving average update
    const learningRate = 0.1;
    const targetValue = success ? 1 : 0;
    strategy.successRate += learningRate * (targetValue - strategy.successRate);
  }

  // TODO: Implement nlu_learning_data table in database
  // Schema should include: learning_id (UUID), user_id (UUID), original_text (text), error_pattern (text),
  // correction_applied (text), success (boolean), confidence_improvement (number), original_confidence (number),
  // timestamp (timestamp), linguistic_style (text), regional_variation (text), user_feedback (text)
  private async persistLearningData(learningData: LearningData): Promise<void> {
    try {
      // Temporarily store learning data locally until database table is created
      // TODO: Replace with database insert when nlu_learning_data table is implemented
      logger.debug('Learning data persistence disabled - nlu_learning_data table not implemented', {
        learningData,
      });
    } catch (error) {
      logger.error('Failed to persist learning data', { error });
    }
  }

  private async updatePatternsFromFeedback(
    learningData: LearningData,
    isPositive: boolean
  ): Promise<void> {
    // Update patterns based on feedback
    logger.debug(`Updating patterns from ${isPositive ? 'positive' : 'negative'} feedback`, {
      originalText: learningData.originalText.substring(0, 50),
      strategy: learningData.strategy,
    });
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get error recovery statistics
   */
  getRecoveryStatistics(): {
    totalErrors: number;
    successfulRecoveries: number;
    recoveryRate: number;
    strategyPerformance: Record<
      string,
      {
        usage: number;
        successRate: number;
        averageConfidenceImprovement: number;
      }
    >;
    regionalAccuracy: Record<string, number>;
  } {
    const totalErrors = this.errorPatterns.size;
    let successfulRecoveries = 0;

    const strategyPerformance: Record<
      string,
      { usage: number; successRate: number; averageConfidenceImprovement: number }
    > = {};
    for (const [id, strategy] of this.recoveryStrategies) {
      strategyPerformance[id] = {
        usage: 0, // TODO: Track usage
        successRate: strategy.successRate,
        averageConfidenceImprovement: strategy.averageConfidenceImprovement,
      };
    }

    const regionalAccuracy = this.learningData.reduce(
      (acc, data) => {
        const region = data.regionalVariation ?? 'unknown';
        if (!acc[region]) {
          acc[region] = { success: 0, total: 0 };
        }
        acc[region].total++;
        if (data.success) {
          acc[region].success++;
          successfulRecoveries++;
        }
        return acc;
      },
      {} as Record<string, { success: number; total: number }>
    );

    // Convert to accuracy percentages
    const regionalAccuracyPercentages: Record<string, number> = {};
    for (const [region, data] of Object.entries(regionalAccuracy)) {
      regionalAccuracyPercentages[region] = data.total > 0 ? (data.success / data.total) * 100 : 0;
    }

    return {
      recoveryRate: totalErrors > 0 ? (successfulRecoveries / totalErrors) * 100 : 0,
      regionalAccuracy: regionalAccuracyPercentages,
      strategyPerformance,
      successfulRecoveries,
      totalErrors,
    };
  }

  /**
   * Reset learning data and statistics
   */
  resetLearning(): void {
    this.learningData = [];
    this.errorPatterns.clear();

    // Reset strategy performance
    for (const strategy of this.recoveryStrategies.values()) {
      strategy.successRate = 0.5;
      strategy.averageConfidenceImprovement = 0.2;
    }

    logger.info('Error recovery learning data reset');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createErrorRecoverySystem(
  config?: Partial<ErrorRecoveryConfig>
): ErrorRecoverySystem {
  return new ErrorRecoverySystem(config);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_ERROR_RECOVERY_CONFIG };

/**
 * Error Recovery System for AegisWallet NLU
 *
 * Intelligent error recovery and clarification mechanisms
 * for misunderstood voice commands with learning capabilities
 *
 * @module nlu/errorRecovery
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';
import { type BrazilianContext, BrazilianContextAnalyzer } from '@/lib/nlu/brazilianPatterns';
import {
  EntityType,
  type ExtractedEntity,
  IntentType,
  NLUError,
  NLUErrorCode,
  type NLUResult,
} from '@/lib/nlu/types';

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
  enabled: true,
  maxRecoveryAttempts: 3,
  learningEnabled: true,
  regionalAdaptationEnabled: true,
  contextualRecoveryEnabled: true,
  autoCorrectionEnabled: true,
  userFeedbackEnabled: true,
  persistenceEnabled: true,
  confidenceThresholds: {
    low: 0.4,
    medium: 0.6,
    high: 0.8,
  },
  recoveryStrategies: {
    patternMatching: true,
    entityExtraction: true,
    contextualInference: true,
    userHistory: true,
    regionalVariation: true,
  },
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
  alternativeOptions?: RecoveryResult[];
}

export interface RecoveryContext {
  originalText: string;
  originalResult: NLUResult | null;
  userId: string;
  sessionId: string;
  conversationHistory: Array<{
    text: string;
    result: NLUResult;
    timestamp: Date;
  }>;
  userPreferences: Record<string, unknown>;
  financialContext: FinancialContext;
  brazilianContext: BrazilianContext;
  recoveryAttempts: number;
  previousErrors: ErrorClassification[];
}

export interface LearningData {
  errorPattern: string;
  correctionApplied: string;
  success: boolean;
  confidenceImprovement: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  regionalVariation: string;
  linguisticStyle: string;
  timestamp: Date;
  userId: string;
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
        errorType: classification.type,
        severity: classification.severity,
        confidence: classification.confidence,
        rootCause: classification.rootCause,
        originalText: originalText.substring(0, 50),
      });

      // Store error pattern for learning
      this.storeErrorPattern(originalText, classification);

      return classification;
    } catch (classifyError) {
      logger.error('Failed to classify NLU error', { error: classifyError });

      // Return generic classification
      return {
        type: 'processing_error',
        severity: 'medium',
        confidence: 0.5,
        rootCause: 'Error classification failed',
        suggestedFixes: ['Try rephrasing the command'],
        learningOpportunities: ['Improve error classification'],
        contextualFactors: [],
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
        success: false,
        confidenceImprovement: 0,
        appliedStrategy: 'none',
        reasoning: 'Error recovery is disabled',
        requiresUserConfirmation: false,
      };
    }

    if (context.recoveryAttempts >= this.config.maxRecoveryAttempts) {
      return {
        success: false,
        confidenceImprovement: 0,
        appliedStrategy: 'max_attempts_reached',
        reasoning: 'Maximum recovery attempts exceeded',
        requiresUserConfirmation: true,
        suggestedUserResponse: 'Por favor, tente reformular seu comando de forma diferente',
      };
    }

    try {
      // Get applicable recovery strategies
      const applicableStrategies = this.getApplicableStrategies(errorClassification);

      // Sort by priority and success rate
      applicableStrategies.sort((a, b) => {
        const _priorityScore = b.priority * 0.6 + b.successRate * 0.4;
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
              strategy: strategy.name,
              confidenceImprovement: result.confidenceImprovement,
              originalText: context.originalText.substring(0, 50),
            });

            // Update strategy success rate
            this.updateStrategySuccessRate(strategy.id, true);

            // Store learning data
            if (this.config.learningEnabled) {
              this.storeLearningData(context, errorClassification, strategy, result);
            }

            return result;
          }

          // Update strategy failure rate
          this.updateStrategySuccessRate(strategy.id, false);
        } catch (strategyError) {
          logger.warn('Recovery strategy failed', {
            strategy: strategy.name,
            error: strategyError,
          });
        }
      }

      // All strategies failed
      return {
        success: false,
        confidenceImprovement: 0,
        appliedStrategy: 'all_failed',
        reasoning: 'All recovery strategies failed',
        requiresUserConfirmation: true,
        suggestedUserResponse: this.generateFallbackSuggestion(errorClassification, context),
      };
    } catch (recoveryError) {
      logger.error('Error recovery process failed', { error: recoveryError });

      return {
        success: false,
        confidenceImprovement: 0,
        appliedStrategy: 'process_failed',
        reasoning: 'Recovery process encountered an error',
        requiresUserConfirmation: true,
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
        primaryQuestion: '',
        followUpQuestions: [] as string[],
        contextualHints: [] as string[],
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
        primaryQuestion: 'Pode repetir seu comando?',
        followUpQuestions: ['O que você gostaria de fazer?'],
        contextualHints: [],
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
    if (!this.config.learningEnabled) return;

    try {
      const learningData: LearningData = {
        errorPattern: originalText,
        correctionApplied: correctedText,
        success: feedback === 'positive',
        confidenceImprovement: correctedResult.confidence - (originalResult?.confidence || 0),
        userFeedback: feedback,
        regionalVariation: this.brazilianAnalyzer.analyzeContext(originalText).region,
        linguisticStyle: this.brazilianAnalyzer.analyzeContext(originalText).linguisticStyle,
        timestamp: new Date(),
        userId,
      };

      // Store learning data
      this.learningData.push(learningData);

      // Update patterns based on feedback
      if (feedback === 'positive') {
        await this.updatePatternsFromPositiveFeedback(learningData);
      } else if (feedback === 'negative') {
        await this.updatePatternsFromNegativeFeedback(learningData);
      }

      // Persist learning data
      if (this.config.persistenceEnabled) {
        await this.persistLearningData(learningData);
      }

      logger.info('User feedback processed for learning', {
        originalText: originalText.substring(0, 50),
        correctedText: correctedText.substring(0, 50),
        feedback,
        confidenceImprovement: learningData.confidenceImprovement,
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
    const _lowerText = originalText.toLowerCase();

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
      type: errorType,
      severity,
      confidence,
      rootCause,
      suggestedFixes,
      learningOpportunities,
      contextualFactors,
      regionalFactors:
        brazilianContext.region !== 'Unknown' ? [brazilianContext.region] : undefined,
    };
  }

  private initializeRecoveryStrategies(): void {
    // Pattern matching recovery
    this.recoveryStrategies.set('pattern_matching', {
      id: 'pattern_matching',
      name: 'Pattern Matching Recovery',
      description: 'Uses enhanced pattern matching with Brazilian variations',
      applicableErrors: ['pattern_miss', 'intent_confusion', 'regional_misunderstanding'],
      priority: 9,
      successRate: 0.75,
      averageConfidenceImprovement: 0.25,
      implementation: async (error, context) => {
        return this.performPatternMatchingRecovery(error, context);
      },
    });

    // Entity extraction recovery
    this.recoveryStrategies.set('entity_extraction', {
      id: 'entity_extraction',
      name: 'Entity Extraction Recovery',
      description: 'Enhanced entity extraction with contextual hints',
      applicableErrors: ['entity_extraction', 'low_confidence'],
      priority: 8,
      successRate: 0.65,
      averageConfidenceImprovement: 0.2,
      implementation: async (error, context) => {
        return this.performEntityExtractionRecovery(error, context);
      },
    });

    // Contextual inference recovery
    this.recoveryStrategies.set('contextual_inference', {
      id: 'contextual_inference',
      name: 'Contextual Inference Recovery',
      description: 'Uses conversation and financial context for inference',
      applicableErrors: ['low_confidence', 'intent_confusion'],
      priority: 7,
      successRate: 0.7,
      averageConfidenceImprovement: 0.3,
      implementation: async (error, context) => {
        return this.performContextualInferenceRecovery(error, context);
      },
    });

    // User history recovery
    this.recoveryStrategies.set('user_history', {
      id: 'user_history',
      name: 'User History Recovery',
      description: "Leverages user's historical patterns and preferences",
      applicableErrors: ['intent_confusion', 'low_confidence', 'entity_extraction'],
      priority: 6,
      successRate: 0.6,
      averageConfidenceImprovement: 0.22,
      implementation: async (error, context) => {
        return this.performUserHistoryRecovery(error, context);
      },
    });

    // Regional variation recovery
    this.recoveryStrategies.set('regional_variation', {
      id: 'regional_variation',
      name: 'Regional Variation Recovery',
      description: 'Adapts to Brazilian regional variations and slang',
      applicableErrors: ['regional_misunderstanding', 'pattern_miss', 'intent_confusion'],
      priority: 8,
      successRate: 0.8,
      averageConfidenceImprovement: 0.35,
      implementation: async (error, context) => {
        return this.performRegionalVariationRecovery(error, context);
      },
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
            success: true,
            correctedIntent: intent as IntentType,
            confidenceImprovement: 0.3,
            appliedStrategy: 'pattern_matching',
            reasoning: `Pattern matched: ${pattern.source}`,
            requiresUserConfirmation: error.severity === 'high',
            suggestedUserResponse: `Você quis dizer ${this.getIntentDescription(intent as IntentType)}?`,
          };
        }
      }
    }

    return {
      success: false,
      confidenceImprovement: 0,
      appliedStrategy: 'pattern_matching',
      reasoning: 'No enhanced patterns matched',
      requiresUserConfirmation: false,
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
        type: EntityType.AMOUNT,
        pattern: /R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s*(reais|r\$|real|reis)/gi,
        extract: (match: RegExpExecArray) => ({
          type: EntityType.AMOUNT,
          value: match[1],
          normalizedValue: parseFloat(match[1].replace(',', '.')),
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
        }),
      },
      {
        type: EntityType.BILL_TYPE,
        pattern: /(conta de )?(luz|energia|água|telefone|internet|gás|condomínio)/gi,
        extract: (match: RegExpExecArray) => ({
          type: EntityType.BILL_TYPE,
          value: match[2],
          normalizedValue: match[2].toLowerCase(),
          confidence: 0.9,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
        }),
      },
      {
        type: EntityType.RECIPIENT,
        pattern: /para\s+([A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z][a-z]+)/gi,
        extract: (match: RegExpExecArray) => ({
          type: EntityType.RECIPIENT,
          value: match[1],
          normalizedValue: { type: 'name', value: match[1] },
          confidence: 0.7,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          metadata: { extracted_by: 'error_recovery' },
        }),
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
        success: true,
        correctedEntities: extractedEntities,
        confidenceImprovement: 0.2,
        appliedStrategy: 'entity_extraction',
        reasoning: `Extracted ${extractedEntities.length} entities using enhanced patterns`,
        requiresUserConfirmation: true,
        suggestedUserResponse: 'Encontrei algumas informações. Posso prosseguir?',
      };
    }

    return {
      success: false,
      confidenceImprovement: 0,
      appliedStrategy: 'entity_extraction',
      reasoning: 'No entities could be extracted',
      requiresUserConfirmation: false,
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
        success: true,
        correctedIntent: IntentType.CHECK_BALANCE,
        confidenceImprovement: 0.25,
        appliedStrategy: 'contextual_inference',
        reasoning: 'Inferred balance check after transfer based on conversation flow',
        requiresUserConfirmation: true,
        suggestedUserResponse: 'Você quer verificar seu saldo após a transferência?',
      };
    }

    // Use financial context
    if (
      (context.financialContext?.billPatterns?.upcomingBills?.length > 0 &&
        text.includes('pagar')) ||
      text.includes('conta')
    ) {
      return {
        success: true,
        correctedIntent: IntentType.PAY_BILL,
        confidenceImprovement: 0.3,
        appliedStrategy: 'contextual_inference',
        reasoning: `Inferred bill payment - ${context.financialContext.billPatterns.upcomingBills.length} bills pending`,
        requiresUserConfirmation: true,
        suggestedUserResponse: 'Você quer pagar suas contas pendentes?',
      };
    }

    return {
      success: false,
      confidenceImprovement: 0,
      appliedStrategy: 'contextual_inference',
      reasoning: 'No contextual inference could be made',
      requiresUserConfirmation: false,
    };
  }

  private async performUserHistoryRecovery(
    _error: ErrorClassification,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // Analyze user's historical patterns
    const userHistory = context.conversationHistory;
    const _text = context.originalText.toLowerCase();

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
        success: true,
        correctedIntent: mostFrequentIntent,
        confidenceImprovement: 0.15,
        appliedStrategy: 'user_history',
        reasoning: `Inferred based on user's most frequent intent: ${mostFrequentIntent}`,
        requiresUserConfirmation: true,
        suggestedUserResponse: `Baseado no seu histórico, você quis ${this.getIntentDescription(mostFrequentIntent)}?`,
      };
    }

    return {
      success: false,
      confidenceImprovement: 0,
      appliedStrategy: 'user_history',
      reasoning: 'Insufficient user history for inference',
      requiresUserConfirmation: false,
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
      SP: {
        'meu bem': 'saldo',
        grana: 'dinheiro',
        boleta: 'boleto',
      },
      RJ: {
        maneiro: 'bom',
        caraca: 'surpresa',
        pixar: 'transferir',
      },
      Nordeste: {
        oxente: 'ei',
        bão: 'bom',
        arre: 'surpresa',
      },
      Sul: {
        bah: 'surpresa',
        tchê: 'amigo',
        guri: 'pessoa',
      },
    };

    const regionMappings =
      regionalMappings[brazilianContext.region as keyof typeof regionalMappings];
    if (!regionMappings) {
      return {
        success: false,
        confidenceImprovement: 0,
        appliedStrategy: 'regional_variation',
        reasoning: `No regional mappings for ${brazilianContext.region}`,
        requiresUserConfirmation: false,
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
      success: false,
      confidenceImprovement: 0,
      appliedStrategy: 'regional_variation',
      reasoning: 'Regional variations did not help resolve the error',
      requiresUserConfirmation: false,
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
    };

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

    if (context.financialContext?.accountSummary?.availableBalance > 0) {
      hints.push('Você pode consultar seu saldo disponível');
    }

    if (context.financialContext?.billPatterns?.upcomingBills?.length > 0) {
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
    if (!strategy) return;

    // Simple moving average update
    const learningRate = 0.1;
    const targetValue = success ? 1 : 0;
    strategy.successRate =
      strategy.successRate + learningRate * (targetValue - strategy.successRate);
  }

  private storeLearningData(
    context: RecoveryContext,
    _errorClassification: ErrorClassification,
    _strategy: RecoveryStrategy,
    result: RecoveryResult
  ): void {
    const learningData: LearningData = {
      errorPattern: context.originalText,
      correctionApplied: result.correctedIntent || result.appliedStrategy,
      success: result.success,
      confidenceImprovement: result.confidenceImprovement,
      regionalVariation: context.brazilianContext.region,
      linguisticStyle: context.brazilianContext.linguisticStyle,
      timestamp: new Date(),
      userId: context.userId,
    };

    this.learningData.push(learningData);

    // Keep only recent learning data
    if (this.learningData.length > 5000) {
      this.learningData = this.learningData.slice(-4000);
    }
  }

  private async updatePatternsFromPositiveFeedback(learningData: LearningData): Promise<void> {
    // Update patterns based on positive feedback
    logger.debug('Updating patterns from positive feedback', {
      pattern: learningData.errorPattern.substring(0, 50),
      correction: learningData.correctionApplied.substring(0, 50),
    });
  }

  private async updatePatternsFromNegativeFeedback(learningData: LearningData): Promise<void> {
    // Update patterns based on negative feedback
    logger.debug('Updating patterns from negative feedback', {
      pattern: learningData.errorPattern.substring(0, 50),
      correction: learningData.correctionApplied.substring(0, 50),
    });
  }

  private async persistLearningData(learningData: LearningData): Promise<void> {
    try {
      const { error } = await supabase.from('nlu_learning_data').insert({
        error_pattern: learningData.errorPattern,
        correction_applied: learningData.correctionApplied,
        success: learningData.success,
        confidence_improvement: learningData.confidenceImprovement,
        user_feedback: learningData.userFeedback,
        regional_variation: learningData.regionalVariation,
        linguistic_style: learningData.linguisticStyle,
        timestamp: learningData.timestamp.toISOString(),
        user_id: learningData.userId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to persist learning data', { error });
    }
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

    const strategyPerformance: Record<string, { attempts: number; successes: number; failures: number }> = {};
    for (const [id, strategy] of this.recoveryStrategies) {
      strategyPerformance[id] = {
        usage: 0, // TODO: Track usage
        successRate: strategy.successRate,
        averageConfidenceImprovement: strategy.averageConfidenceImprovement,
      };
    }

    const regionalAccuracy = this.learningData.reduce(
      (acc, data) => {
        if (!acc[data.regionalVariation]) {
          acc[data.regionalVariation] = { success: 0, total: 0 };
        }
        acc[data.regionalVariation].total++;
        if (data.success) {
          acc[data.regionalVariation].success++;
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
      totalErrors,
      successfulRecoveries,
      recoveryRate: totalErrors > 0 ? (successfulRecoveries / totalErrors) * 100 : 0,
      strategyPerformance,
      regionalAccuracy: regionalAccuracyPercentages,
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
export type {
  ErrorRecoveryConfig,
  ErrorClassification,
  RecoveryStrategy,
  RecoveryResult,
  RecoveryContext,
  LearningData,
};

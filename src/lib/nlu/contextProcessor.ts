/**
 * Context-Aware Processing for AegisWallet NLU
 *
 * Advanced context processing system for understanding user intent,
 * preferences, and financial context in multi-turn conversations
 *
 * @module nlu/contextProcessor
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';
import { type BrazilianContext, BrazilianContextAnalyzer } from '@/lib/nlu/brazilianPatterns';
import {
  type ConversationContext,
  type ConversationTurn,
  EntityType,
  type ExtractedEntity,
  IntentType,
  type NLUResult,
} from '@/lib/nlu/types';
import type { TransactionEntity } from '@/types/nlu.types';

// ============================================================================
// Context Processing Configuration
// ============================================================================

export interface ContextConfig {
  enabled: boolean;
  maxContextTurns: number;
  contextTimeoutMs: number;
  userPreferencesEnabled: boolean;
  financialContextEnabled: boolean;
  regionalContextEnabled: boolean;
  temporalContextEnabled: boolean;
  learningEnabled: boolean;
  persistenceEnabled: boolean;
}

const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  enabled: true,
  maxContextTurns: 10,
  contextTimeoutMs: 1800000, // 30 minutes
  userPreferencesEnabled: true,
  financialContextEnabled: true,
  regionalContextEnabled: true,
  temporalContextEnabled: true,
  learningEnabled: true,
  persistenceEnabled: true,
};

// ============================================================================
// User Preferences
// ============================================================================

export interface UserPreferences {
  id: string;
  userId: string;
  preferredLanguage: 'pt-BR';
  regionalVariation: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste' | 'Unknown';
  linguisticStyle: 'formal' | 'colloquial' | 'slang' | 'mixed';
  financialHabits: {
    commonBills: string[];
    preferredPaymentMethods: string[];
    typicalTransferRecipients: Array<{
      name: string;
      identifier: string;
      frequency: number;
      lastUsed: Date;
    }>;
    spendingCategories: Array<{
      category: string;
      typicalAmount: number;
      frequency: string;
    }>;
  };
  interactionPreferences: {
    confirmationLevel: 'high' | 'medium' | 'low';
    verbosityLevel: 'concise' | 'detailed' | 'friendly';
    feedbackFrequency: 'always' | 'on_error' | 'never';
  };
  temporalPatterns: {
    mostActiveHours: number[];
    preferredDays: number[];
    typicalSessionDuration: number;
  };
  learningProfile: {
    adaptabilityScore: number; // 0-1
    errorCorrectionRate: number;
    patternRecognitionScore: number;
    confidenceLevel: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Financial Context
// ============================================================================

export interface FinancialContext {
  userId: string;
  accountSummary: {
    totalBalance: number;
    availableBalance: number;
    pendingTransactions: number;
    scheduledPayments: number;
  };
  recentActivity: {
    lastLogin: Date;
    lastTransaction: Date;
    lastBillPayment: Date;
    lastTransfer: Date;
  };
  spendingPatterns: {
    monthlyAverage: number;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    unusualSpending: Array<{
      category: string;
      amount: number;
      date: Date;
      reason: string;
    }>;
  };
  billPatterns: {
    upcomingBills: Array<{
      type: string;
      amount: number;
      dueDate: Date;
      status: 'pending' | 'overdue' | 'paid';
    }>;
    averageBillAmount: number;
    mostCommonBills: string[];
  };
  transferPatterns: {
    frequentRecipients: Array<{
      name: string;
      identifier: string;
      totalAmount: number;
      frequency: string;
      lastTransfer: Date;
    }>;
    averageTransferAmount: number;
    preferredTransferTimes: string[];
  };
  incomePatterns: {
    monthlyIncome: number;
    incomeSources: Array<{
      source: string;
      amount: number;
      frequency: string;
      reliability: number;
    }>;
    nextExpectedIncome: Date;
  };
  lastUpdated: Date;
}

// ============================================================================
// Context-Aware Processing Class
// ============================================================================

export class ContextProcessor {
  private config: ContextConfig;
  private brazilianAnalyzer = new BrazilianContextAnalyzer();
  private activeContexts = new Map<string, ConversationContext>();
  private userPreferencesCache = new Map<string, UserPreferences>();
  private financialContextCache = new Map<string, FinancialContext>();

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
  }

  // ============================================================================
  // Core Context Processing
  // ============================================================================

  /**
   * Process utterance with context awareness
   */
  async processWithContext(
    text: string,
    userId: string,
    sessionId: string,
    nluResult: NLUResult
  ): Promise<{
    result: NLUResult;
    context: ConversationContext;
    enhancements: {
      improvedIntent?: IntentType;
      suggestedEntities?: ExtractedEntity[];
      contextualInsights?: string[];
      confidenceAdjustment: number;
      missingContextualInfo?: string[];
    };
  }> {
    if (!this.config.enabled) {
      return {
        result: nluResult,
        context: this.createBasicContext(userId, sessionId),
        enhancements: { confidenceAdjustment: 0 },
      };
    }

    try {
      // Get or create conversation context
      const context = await this.getOrCreateContext(userId, sessionId);

      // Get user preferences
      const userPreferences = await this.getUserPreferences(userId);

      // Get financial context
      const financialContext = await this.getFinancialContext(userId);

      // Analyze Brazilian context
      const brazilianContext = this.brazilianAnalyzer.analyzeContext(text);

      // Apply context-aware enhancements
      const enhancements = await this.applyContextualEnhancements(
        text,
        nluResult,
        context,
        userPreferences,
        financialContext,
        brazilianContext
      );

      // Update conversation context
      this.updateConversationContext(context, text, nluResult, enhancements);

      // Learn from this interaction
      if (this.config.learningEnabled) {
        await this.learnFromInteraction(
          userId,
          text,
          nluResult,
          context,
          userPreferences,
          brazilianContext
        );
      }

      // Persist context if enabled
      if (this.config.persistenceEnabled) {
        await this.persistContext(context);
      }

      logger.info('Context-aware processing completed', {
        userId,
        sessionId,
        originalIntent: nluResult.intent,
        enhancedIntent: enhancements.improvedIntent,
        confidenceAdjustment: enhancements.confidenceAdjustment,
        contextTurns: context.history.length,
      });

      return {
        result: enhancements.improvedIntent
          ? { ...nluResult, intent: enhancements.improvedIntent }
          : nluResult,
        context,
        enhancements,
      };
    } catch (error) {
      logger.error('Context-aware processing failed', {
        error,
        userId,
        sessionId,
        text: text.substring(0, 50),
      });

      // Fallback to basic processing
      return {
        result: nluResult,
        context: this.createBasicContext(userId, sessionId),
        enhancements: { confidenceAdjustment: 0 },
      };
    }
  }

  /**
   * Get contextual suggestions for disambiguation
   */
  async getContextualDisambiguation(
    userId: string,
    sessionId: string,
    _ambiguousText: string,
    possibleIntents: Array<{ intent: IntentType; confidence: number }>
  ): Promise<{
    suggestions: Array<{
      intent: IntentType;
      question: string;
      contextualRationale: string;
      confidenceAdjustment: number;
    }>;
    recommendedNextAction: string;
  }> {
    try {
      const context = await this.getOrCreateContext(userId, sessionId);
      const userPreferences = await this.getUserPreferences(userId);
      const financialContext = await this.getFinancialContext(userId);

      const suggestions = possibleIntents.map((option) => {
        const contextualRationale = this.generateContextualRationale(
          option.intent,
          context,
          userPreferences,
          financialContext
        );

        const confidenceAdjustment = this.calculateContextualConfidenceAdjustment(
          option.intent,
          context,
          userPreferences,
          financialContext
        );

        return {
          intent: option.intent,
          question: this.generateDisambiguationQuestion(option.intent, contextualRationale),
          contextualRationale,
          confidenceAdjustment,
        };
      });

      // Sort by adjusted confidence
      suggestions.sort(
        (a, b) => b.confidence + b.confidenceAdjustment - (a.confidence + a.confidenceAdjustment)
      );

      const recommendedNextAction = this.generateRecommendedAction(
        suggestions[0]?.intent,
        context,
        userPreferences
      );

      return {
        suggestions,
        recommendedNextAction,
      };
    } catch (error) {
      logger.error('Contextual disambiguation failed', { error, userId });

      // Fallback to basic suggestions
      return {
        suggestions: possibleIntents.map((option) => ({
          intent: option.intent,
          question: `Você quis dizer ${this.getIntentDescription(option.intent)}?`,
          contextualRationale: 'Baseado no texto fornecido',
          confidenceAdjustment: 0,
        })),
        recommendedNextAction: 'Por favor, clarifique sua intenção',
      };
    }
  }

  /**
   * Get contextual error recovery suggestions
   */
  async getContextualErrorRecovery(
    userId: string,
    sessionId: string,
    errorText: string,
    errorType: 'unknown_intent' | 'low_confidence' | 'missing_entities' | 'processing_error'
  ): Promise<{
    recoverySuggestions: Array<{
      suggestedText: string;
      rationale: string;
      confidenceImprovement: number;
    }>;
    clarifyingQuestions: string[];
    contextualHints: string[];
  }> {
    try {
      const context = await this.getOrCreateContext(userId, sessionId);
      const userPreferences = await this.getUserPreferences(userId);
      const financialContext = await this.getFinancialContext(userId);

      const recoverySuggestions = this.generateRecoverySuggestions(
        errorText,
        errorType,
        context,
        userPreferences,
        financialContext
      );

      const clarifyingQuestions = this.generateClarifyingQuestions(
        errorType,
        context,
        userPreferences
      );

      const contextualHints = this.generateContextualHints(
        errorType,
        context,
        userPreferences,
        financialContext
      );

      return {
        recoverySuggestions,
        clarifyingQuestions,
        contextualHints,
      };
    } catch (error) {
      logger.error('Contextual error recovery failed', { error, userId });

      // Fallback suggestions
      return {
        recoverySuggestions: [
          {
            suggestedText: 'Pode repetir de outra forma?',
            rationale: 'Erro no processamento',
            confidenceImprovement: 0.1,
          },
        ],
        clarifyingQuestions: ['O que você gostaria de fazer?'],
        contextualHints: ['Tente ser mais específico sobre sua intenção'],
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getOrCreateContext(
    userId: string,
    sessionId: string
  ): Promise<ConversationContext> {
    const contextKey = `${userId}_${sessionId}`;
    let context = this.activeContexts.get(contextKey);

    if (!context || this.isContextExpired(context)) {
      // Try to load from persistence
      if (this.config.persistenceEnabled) {
        context = await this.loadContextFromPersistence(userId, sessionId);
      }

      if (!context) {
        context = this.createNewContext(userId, sessionId);
      }

      this.activeContexts.set(contextKey, context);
    }

    return context;
  }

  private createNewContext(userId: string, sessionId: string): ConversationContext {
    return {
      userId,
      sessionId,
      history: [],
      timestamp: new Date(),
    };
  }

  private createBasicContext(userId: string, sessionId: string): ConversationContext {
    return {
      userId,
      sessionId,
      history: [],
      timestamp: new Date(),
    };
  }

  private isContextExpired(context: ConversationContext): boolean {
    const now = Date.now();
    const contextAge = now - context.timestamp.getTime();
    return contextAge > this.config.contextTimeoutMs;
  }

  private async applyContextualEnhancements(
    _text: string,
    nluResult: NLUResult,
    context: ConversationContext,
    userPreferences: UserPreferences,
    financialContext: FinancialContext,
    brazilianContext: BrazilianContext
  ): Promise<{
    improvedIntent?: IntentType;
    suggestedEntities?: ExtractedEntity[];
    contextualInsights?: string[];
    confidenceAdjustment: number;
    missingContextualInfo?: string[];
  }> {
    const enhancements = {
      contextualInsights: [] as string[],
      confidenceAdjustment: 0,
      missingContextualInfo: [] as string[],
    };

    // Apply Brazilian regional context
    const regionalAdjustment = this.applyRegionalContext(
      nluResult,
      userPreferences,
      brazilianContext
    );
    enhancements.confidenceAdjustment += regionalAdjustment.adjustment;
    enhancements.contextualInsights.push(...regionalAdjustment.insights);

    // Apply financial context
    const financialAdjustment = this.applyFinancialContext(nluResult, financialContext, context);
    enhancements.confidenceAdjustment += financialAdjustment.adjustment;
    enhancements.contextualInsights.push(...financialAdjustment.insights);
    enhancements.missingContextualInfo.push(...financialAdjustment.missingInfo);

    // Apply conversation context
    const conversationAdjustment = this.applyConversationContext(
      nluResult,
      context,
      userPreferences
    );
    enhancements.confidenceAdjustment += conversationAdjustment.adjustment;
    enhancements.contextualInsights.push(...conversationAdjustment.insights);

    // Apply user preferences
    const preferenceAdjustment = this.applyUserPreferences(nluResult, userPreferences);
    enhancements.confidenceAdjustment += preferenceAdjustment.adjustment;
    enhancements.contextualInsights.push(...preferenceAdjustment.insights);

    // Determine if intent should be improved
    const improvedIntent = this.determineImprovedIntent(
      nluResult,
      context,
      userPreferences,
      financialContext
    );

    // Suggest missing entities
    const suggestedEntities = this.suggestMissingEntities(nluResult, context, financialContext);

    return {
      improvedIntent,
      suggestedEntities,
      contextualInsights: enhancements.contextualInsights,
      confidenceAdjustment: Math.max(-0.3, Math.min(0.3, enhancements.confidenceAdjustment)),
      missingContextualInfo: enhancements.missingContextualInfo,
    };
  }

  private applyRegionalContext(
    _nluResult: NLUResult,
    userPreferences: UserPreferences,
    brazilianContext: BrazilianContext
  ): { adjustment: number; insights: string[] } {
    const insights: string[] = [];
    let adjustment = 0;

    // Regional variation bonus
    if (
      brazilianContext.region === userPreferences.regionalVariation &&
      brazilianContext.region !== 'Unknown'
    ) {
      adjustment += 0.05;
      insights.push(`Padrão regional ${brazilianContext.region} reconhecido`);
    }

    // Linguistic style match
    if (brazilianContext.linguisticStyle === userPreferences.linguisticStyle) {
      adjustment += 0.03;
      insights.push(`Estilo linguístico ${brazilianContext.linguisticStyle} compatível`);
    }

    // Cultural context understanding
    if (brazilianContext.culturalMarkers.length > 0) {
      adjustment += 0.02;
      insights.push('Contexto cultural brasileiro identificado');
    }

    return { adjustment, insights };
  }

  private applyFinancialContext(
    nluResult: NLUResult,
    financialContext: FinancialContext,
    _conversationContext: ConversationContext
  ): { adjustment: number; insights: string[]; missingInfo: string[] } {
    const insights: string[] = [];
    const missingInfo: string[] = [];
    let adjustment = 0;

    // Balance-related intent enhancement
    if (nluResult.intent === IntentType.CHECK_BALANCE) {
      if (financialContext.accountSummary.availableBalance > 0) {
        adjustment += 0.05;
        insights.push('Saldo disponível para consulta');
      }
    }

    // Bill payment context
    if (nluResult.intent === IntentType.PAY_BILL) {
      if (financialContext.billPatterns.upcomingBills.length > 0) {
        adjustment += 0.08;
        insights.push(
          `${financialContext.billPatterns.upcomingBills.length} contas pendentes identificadas`
        );
      } else {
        missingInfo.push('Nenhuma conta pendente encontrada');
      }
    }

    // Transfer context
    if (nluResult.intent === IntentType.TRANSFER_MONEY) {
      if (financialContext.transferPatterns.frequentRecipients.length > 0) {
        adjustment += 0.06;
        insights.push(
          `${financialContext.transferPatterns.frequentRecipients.length} destinatários frequentes disponíveis`
        );
      }

      if (
        financialContext.accountSummary.availableBalance >
        financialContext.transferPatterns.averageTransferAmount
      ) {
        adjustment += 0.04;
        insights.push('Saldo suficiente para transferência típica');
      } else {
        missingInfo.push('Saldo pode ser insuficiente para transferência');
      }
    }

    // Budget analysis context
    if (nluResult.intent === IntentType.CHECK_BUDGET) {
      if (financialContext.spendingPatterns.monthlyAverage > 0) {
        adjustment += 0.07;
        insights.push('Padrões de gastos identificados');
      }

      if (financialContext.spendingPatterns.unusualSpending.length > 0) {
        adjustment += 0.05;
        insights.push(
          `${financialContext.spendingPatterns.unusualSpending.length} gastos incomuns detectados`
        );
      }
    }

    return { adjustment, insights, missingInfo };
  }

  private applyConversationContext(
    nluResult: NLUResult,
    context: ConversationContext,
    _userPreferences: UserPreferences
  ): { adjustment: number; insights: string[] } {
    const insights: string[] = [];
    let adjustment = 0;

    // Previous intent consistency
    if (context.lastIntent && context.lastIntent === nluResult.intent) {
      adjustment += 0.04;
      insights.push('Consistência com intenção anterior');
    }

    // Conversation flow
    if (context.history.length > 0) {
      const lastTurn = context.history[context.history.length - 1];

      // Logical flow detection
      if (this.isLogicalFlow(lastTurn.nluResult.intent, nluResult.intent)) {
        adjustment += 0.06;
        insights.push('Fluxo conversacional lógico');
      }

      // Entity continuity
      const entityContinuity = this.checkEntityContinuity(
        lastTurn.nluResult.entities,
        nluResult.entities
      );
      if (entityContinuity > 0.5) {
        adjustment += 0.03;
        insights.push('Continuidade de entidades mantida');
      }
    }

    // Session length consideration
    if (context.history.length < 3) {
      adjustment += 0.02; // Bonus for early conversation clarity
    } else if (context.history.length > 8) {
      adjustment -= 0.02; // Slight penalty for very long conversations
    }

    return { adjustment, insights };
  }

  private applyUserPreferences(
    nluResult: NLUResult,
    userPreferences: UserPreferences
  ): { adjustment: number; insights: string[] } {
    const insights: string[] = [];
    let adjustment = 0;

    // Preferred bills match
    if (nluResult.intent === IntentType.PAY_BILL) {
      const billEntity = nluResult.entities.find((e) => e.type === EntityType.BILL_TYPE);
      if (billEntity && userPreferences.financialHabits.commonBills.includes(billEntity.value)) {
        adjustment += 0.05;
        insights.push('Conta comum para o usuário');
      }
    }

    // Preferred payment method
    if (nluResult.intent === IntentType.TRANSFER_MONEY) {
      if (userPreferences.financialHabits.preferredPaymentMethods.includes('PIX')) {
        adjustment += 0.03;
        insights.push('Método de pagamento preferido (PIX)');
      }
    }

    // Typical transfer recipients
    if (nluResult.intent === IntentType.TRANSFER_MONEY) {
      const recipientEntity = nluResult.entities.find((e) => e.type === EntityType.RECIPIENT);
      if (recipientEntity) {
        const frequentRecipient = userPreferences.financialHabits.typicalTransferRecipients.find(
          (r) =>
            r.name.toLowerCase().includes(recipientEntity.value.toLowerCase()) ||
            recipientEntity.value.toLowerCase().includes(r.name.toLowerCase())
        );
        if (frequentRecipient) {
          adjustment += 0.08;
          insights.push(`Destinatário frequente: ${frequentRecipient.name}`);
        }
      }
    }

    // Learning profile consideration
    const learningBonus = userPreferences.learningProfile.adaptabilityScore * 0.05;
    adjustment += learningBonus;
    if (learningBonus > 0.02) {
      insights.push('Alta capacidade de aprendizado do usuário');
    }

    return { adjustment, insights };
  }

  private determineImprovedIntent(
    nluResult: NLUResult,
    context: ConversationContext,
    _userPreferences: UserPreferences,
    financialContext: FinancialContext
  ): IntentType | undefined {
    // Only improve if confidence is medium and we have strong contextual evidence
    if (nluResult.confidence >= 0.6 && nluResult.confidence < 0.8) {
      // Check for bill payment confusion
      if (
        nluResult.intent === IntentType.CHECK_BALANCE &&
        financialContext.billPatterns.upcomingBills.length > 0
      ) {
        const overdueBills = financialContext.billPatterns.upcomingBills.filter(
          (b) => b.status === 'overdue'
        );
        if (overdueBills.length > 0) {
          return IntentType.PAY_BILL;
        }
      }

      // Check for transfer vs balance confusion
      if (
        nluResult.intent === IntentType.CHECK_BALANCE &&
        context.lastIntent === IntentType.TRANSFER_MONEY
      ) {
        return IntentType.TRANSFER_MONEY;
      }

      // Check for budget vs income confusion
      if (
        nluResult.intent === IntentType.CHECK_INCOME &&
        financialContext.spendingPatterns.monthlyAverage > 0
      ) {
        return IntentType.CHECK_BUDGET;
      }
    }

    return undefined;
  }

  private suggestMissingEntities(
    nluResult: NLUResult,
    _context: ConversationContext,
    financialContext: FinancialContext
  ): ExtractedEntity[] {
    const suggestions: ExtractedEntity[] = [];

    // Suggest amount if missing and contextually relevant
    if (!nluResult.entities.some((e) => e.type === EntityType.AMOUNT)) {
      if (nluResult.intent === IntentType.TRANSFER_MONEY) {
        const avgAmount = financialContext.transferPatterns.averageTransferAmount;
        if (avgAmount > 0) {
          suggestions.push({
            type: EntityType.AMOUNT,
            value: avgAmount.toString(),
            normalizedValue: avgAmount,
            confidence: 0.7,
            startIndex: 0,
            endIndex: 0,
            metadata: { suggested: true, source: 'user_average' },
          });
        }
      }
    }

    // Suggest recipient for transfers
    if (
      nluResult.intent === IntentType.TRANSFER_MONEY &&
      !nluResult.entities.some((e) => e.type === EntityType.RECIPIENT)
    ) {
      const frequentRecipients = financialContext.transferPatterns.frequentRecipients;
      if (frequentRecipients.length > 0) {
        const mostFrequent = frequentRecipients[0];
        suggestions.push({
          type: EntityType.RECIPIENT,
          value: mostFrequent.name,
          normalizedValue: { type: 'name', value: mostFrequent.name },
          confidence: 0.8,
          startIndex: 0,
          endIndex: 0,
          metadata: { suggested: true, source: 'frequent_recipient' },
        });
      }
    }

    return suggestions;
  }

  private updateConversationContext(
    context: ConversationContext,
    text: string,
    nluResult: NLUResult,
    enhancements: any
  ): void {
    const turn: ConversationTurn = {
      userInput: text,
      nluResult: enhancements.improvedIntent
        ? { ...nluResult, intent: enhancements.improvedIntent }
        : nluResult,
      systemResponse: '', // Will be populated by the voice response system
      timestamp: new Date(),
    };

    context.history.push(turn);
    context.lastIntent = nluResult.intent;
    context.lastEntities = nluResult.entities;
    context.timestamp = new Date();

    // Maintain context size limit
    if (context.history.length > this.config.maxContextTurns) {
      context.history = context.history.slice(-this.config.maxContextTurns);
    }
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Check cache first
    if (this.userPreferencesCache.has(userId)) {
      return this.userPreferencesCache.get(userId)!;
    }

    try {
      // Load from Supabase
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Create default preferences
        const defaultPreferences: UserPreferences = {
          id: `pref_${Date.now()}`,
          userId,
          preferredLanguage: 'pt-BR',
          regionalVariation: 'Unknown',
          linguisticStyle: 'colloquial',
          financialHabits: {
            commonBills: [],
            preferredPaymentMethods: ['PIX'],
            typicalTransferRecipients: [],
            spendingCategories: [],
          },
          interactionPreferences: {
            confirmationLevel: 'medium',
            verbosityLevel: 'friendly',
            feedbackFrequency: 'on_error',
          },
          temporalPatterns: {
            mostActiveHours: [9, 14, 19],
            preferredDays: [1, 2, 3, 4, 5],
            typicalSessionDuration: 300,
          },
          learningProfile: {
            adaptabilityScore: 0.5,
            errorCorrectionRate: 0.5,
            patternRecognitionScore: 0.5,
            confidenceLevel: 0.7,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.userPreferencesCache.set(userId, defaultPreferences);
        return defaultPreferences;
      }

      const preferences: UserPreferences = {
        id: data.id,
        userId: data.user_id || '',
        preferredLanguage: 'pt-BR', // Default for Brazilian users
        regionalVariation: 'Unknown', // Will be detected
        linguisticStyle: 'formal', // Default
        financialHabits: {}, // Empty for now
        interactionPreferences: {}, // Empty for now
        temporalPatterns: {}, // Empty for now
        learningProfile: {}, // Empty for now
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
      };

      this.userPreferencesCache.set(userId, preferences);
      return preferences;
    } catch (error) {
      logger.error('Failed to load user preferences', { error, userId });

      // Return default preferences on error
      const defaultPreferences: UserPreferences = {
        id: `pref_${Date.now()}`,
        userId,
        preferredLanguage: 'pt-BR',
        regionalVariation: 'Unknown',
        linguisticStyle: 'colloquial',
        financialHabits: {
          commonBills: [],
          preferredPaymentMethods: ['PIX'],
          typicalTransferRecipients: [],
          spendingCategories: [],
        },
        interactionPreferences: {
          confirmationLevel: 'medium',
          verbosityLevel: 'friendly',
          feedbackFrequency: 'on_error',
        },
        temporalPatterns: {
          mostActiveHours: [9, 14, 19],
          preferredDays: [1, 2, 3, 4, 5],
          typicalSessionDuration: 300,
        },
        learningProfile: {
          adaptabilityScore: 0.5,
          errorCorrectionRate: 0.5,
          patternRecognitionScore: 0.5,
          confidenceLevel: 0.7,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.userPreferencesCache.set(userId, defaultPreferences);
      return defaultPreferences;
    }
  }

  private async getFinancialContext(userId: string): Promise<FinancialContext> {
    // Check cache first
    if (this.financialContextCache.has(userId)) {
      const cached = this.financialContextCache.get(userId)!;
      // Cache for 5 minutes
      if (Date.now() - cached.lastUpdated.getTime() < 300000) {
        return cached;
      }
    }

    try {
      // Load financial data from Supabase
      const { data: accountData, error: accountError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (accountError) {
        logger.error('Failed to load bank accounts for financial context', {
          userId,
          error: accountError,
        });
      }

      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionError) {
        logger.error('Failed to load transactions for financial context', {
          userId,
          error: transactionError,
        });
      }

      const transactionsList = transactionData ?? [];

      // Build financial context from data
      const financialContext: FinancialContext = {
        userId,
        accountSummary: {
          totalBalance: accountData?.balance || 0,
          availableBalance: accountData?.available_balance || 0,
          pendingTransactions: transactionsList.filter((t) => t.status === 'pending').length || 0,
          scheduledPayments: 0, // TODO: Load from scheduled payments table
        },
        recentActivity: {
          lastLogin: new Date(), // TODO: Load from auth logs
          lastTransaction: transactionsList[0]
            ? new Date(transactionsList[0].created_at)
            : new Date(),
          lastBillPayment: new Date(), // TODO: Load from bill payments
          lastTransfer: new Date(), // TODO: Load from transfers
        },
        spendingPatterns: {
          monthlyAverage: this.calculateMonthlyAverage(transactionsList),
          topCategories: this.calculateTopCategories(transactionsList),
          unusualSpending: [], // TODO: Implement anomaly detection
        },
        billPatterns: {
          upcomingBills: [], // TODO: Load from bills table
          averageBillAmount: 0,
          mostCommonBills: [],
        },
        transferPatterns: {
          frequentRecipients: [], // TODO: Load from transfers table
          averageTransferAmount: this.calculateAverageTransfer(transactionsList),
          preferredTransferTimes: [],
        },
        incomePatterns: {
          monthlyIncome: this.calculateMonthlyIncome(transactionsList),
          incomeSources: [], // TODO: Load from income sources
          nextExpectedIncome: new Date(), // TODO: Calculate from patterns
        },
        lastUpdated: new Date(),
      };

      this.financialContextCache.set(userId, financialContext);
      return financialContext;
    } catch (error) {
      logger.error('Failed to load financial context', { error, userId });

      // Return empty financial context on error
      const emptyContext: FinancialContext = {
        userId,
        accountSummary: {
          totalBalance: 0,
          availableBalance: 0,
          pendingTransactions: 0,
          scheduledPayments: 0,
        },
        recentActivity: {
          lastLogin: new Date(),
          lastTransaction: new Date(),
          lastBillPayment: new Date(),
          lastTransfer: new Date(),
        },
        spendingPatterns: {
          monthlyAverage: 0,
          topCategories: [],
          unusualSpending: [],
        },
        billPatterns: {
          upcomingBills: [],
          averageBillAmount: 0,
          mostCommonBills: [],
        },
        transferPatterns: {
          frequentRecipients: [],
          averageTransferAmount: 0,
          preferredTransferTimes: [],
        },
        incomePatterns: {
          monthlyIncome: 0,
          incomeSources: [],
          nextExpectedIncome: new Date(),
        },
        lastUpdated: new Date(),
      };

      this.financialContextCache.set(userId, emptyContext);
      return emptyContext;
    }
  }

  // ============================================================================
  // Helper Methods for Context Analysis
  // ============================================================================

  private isLogicalFlow(previousIntent: IntentType, currentIntent: IntentType): boolean {
    const logicalFlows = [
      [IntentType.CHECK_BALANCE, IntentType.TRANSFER_MONEY],
      [IntentType.CHECK_BALANCE, IntentType.PAY_BILL],
      [IntentType.CHECK_BUDGET, IntentType.CHECK_INCOME],
      [IntentType.PAY_BILL, IntentType.CHECK_BALANCE],
      [IntentType.TRANSFER_MONEY, IntentType.CHECK_BALANCE],
    ];

    return logicalFlows.some((flow) => flow[0] === previousIntent && flow[1] === currentIntent);
  }

  private checkEntityContinuity(
    previousEntities: ExtractedEntity[],
    currentEntities: ExtractedEntity[]
  ): number {
    if (previousEntities.length === 0 || currentEntities.length === 0) return 0;

    const matches = currentEntities.filter((current) =>
      previousEntities.some(
        (previous) => previous.type === current.type && previous.value === current.value
      )
    );

    return matches.length / currentEntities.length;
  }

  private generateContextualRationale(
    intent: IntentType,
    context: ConversationContext,
    _userPreferences: UserPreferences,
    financialContext: FinancialContext
  ): string {
    switch (intent) {
      case IntentType.PAY_BILL:
        if (financialContext.billPatterns.upcomingBills.length > 0) {
          const overdueCount = financialContext.billPatterns.upcomingBills.filter(
            (b) => b.status === 'overdue'
          ).length;
          if (overdueCount > 0) {
            return `Você tem ${overdueCount} conta(s) vencida(s) que precisam ser paga(s)`;
          }
          return `Você tem ${financialContext.billPatterns.upcomingBills.length} conta(s) para pagar este mês`;
        }
        return 'Parece que você quer gerenciar suas contas';

      case IntentType.TRANSFER_MONEY:
        if (financialContext.transferPatterns.frequentRecipients.length > 0) {
          return `Você costuma transferir para ${financialContext.transferPatterns.frequentRecipients[0].name}`;
        }
        return 'Parece que você quer fazer uma transferência';

      case IntentType.CHECK_BALANCE:
        if (
          context.lastIntent === IntentType.TRANSFER_MONEY ||
          context.lastIntent === IntentType.PAY_BILL
        ) {
          return 'Você acabou de fazer uma transação, quer verificar seu saldo?';
        }
        return 'Parece que você quer consultar seu saldo';

      default:
        return 'Baseado no contexto da conversa';
    }
  }

  private calculateContextualConfidenceAdjustment(
    intent: IntentType,
    context: ConversationContext,
    _userPreferences: UserPreferences,
    financialContext: FinancialContext
  ): number {
    let adjustment = 0;

    // Previous intent consistency
    if (context.lastIntent === intent) {
      adjustment += 0.1;
    }

    // Financial context relevance
    switch (intent) {
      case IntentType.PAY_BILL:
        if (financialContext.billPatterns.upcomingBills.length > 0) {
          adjustment += 0.15;
        }
        break;
      case IntentType.TRANSFER_MONEY:
        if (financialContext.accountSummary.availableBalance > 0) {
          adjustment += 0.1;
        }
        break;
    }

    return Math.max(0, Math.min(0.3, adjustment));
  }

  private generateDisambiguationQuestion(intent: IntentType, rationale: string): string {
    const questions = {
      [IntentType.CHECK_BALANCE]: `Você quer verificar seu saldo? ${rationale}`,
      [IntentType.PAY_BILL]: `Você quer pagar uma conta? ${rationale}`,
      [IntentType.TRANSFER_MONEY]: `Você quer fazer uma transferência? ${rationale}`,
      [IntentType.CHECK_BUDGET]: `Você quer analisar seu orçamento? ${rationale}`,
      [IntentType.CHECK_INCOME]: `Você quer consultar seus rendimentos? ${rationale}`,
      [IntentType.FINANCIAL_PROJECTION]: `Você quer ver uma projeção financeira? ${rationale}`,
    };

    return questions[intent] || `Você quis dizer ${this.getIntentDescription(intent)}?`;
  }

  private generateRecommendedAction(
    intent: IntentType,
    _context: ConversationContext,
    _userPreferences: UserPreferences
  ): string {
    switch (intent) {
      case IntentType.CHECK_BALANCE:
        return 'Posso consultar seu saldo imediatamente';
      case IntentType.PAY_BILL:
        return 'Posso mostrar suas contas pendentes e ajudar a pagar';
      case IntentType.TRANSFER_MONEY:
        return 'Posso ajudar você a fazer uma transferência';
      default:
        return 'Posso ajudar com essa operação';
    }
  }

  private getIntentDescription(intent: IntentType): string {
    const descriptions = {
      [IntentType.CHECK_BALANCE]: 'verificar saldo',
      [IntentType.PAY_BILL]: 'pagar conta',
      [IntentType.TRANSFER_MONEY]: 'transferir dinheiro',
      [IntentType.CHECK_BUDGET]: 'analisar orçamento',
      [IntentType.CHECK_INCOME]: 'consultar rendimentos',
      [IntentType.FINANCIAL_PROJECTION]: 'ver projeção financeira',
    };

    return descriptions[intent] || 'comando financeiro';
  }

  private generateRecoverySuggestions(
    errorText: string,
    errorType: string,
    context: ConversationContext,
    _userPreferences: UserPreferences,
    _financialContext: FinancialContext
  ): Array<{
    suggestedText: string;
    rationale: string;
    confidenceImprovement: number;
  }> {
    const suggestions = [];

    switch (errorType) {
      case 'unknown_intent':
        suggestions.push({
          suggestedText: 'Quero verificar meu saldo',
          rationale: 'Comando claro para verificar saldo',
          confidenceImprovement: 0.4,
        });
        suggestions.push({
          suggestedText: 'Pagar a conta de luz',
          rationale: 'Comando claro para pagar conta',
          confidenceImprovement: 0.4,
        });
        break;

      case 'low_confidence':
        suggestions.push({
          suggestedText: `${errorText}, por favor`,
          rationale: 'Adicionar polidez para melhor reconhecimento',
          confidenceImprovement: 0.2,
        });
        break;

      case 'missing_entities':
        if (context.lastIntent === IntentType.TRANSFER_MONEY) {
          suggestions.push({
            suggestedText: 'Transferir R$ 100 para o João',
            rationale: 'Incluir valor e destinatário',
            confidenceImprovement: 0.3,
          });
        }
        break;
    }

    return suggestions;
  }

  private generateClarifyingQuestions(
    errorType: string,
    _context: ConversationContext,
    _userPreferences: UserPreferences
  ): string[] {
    switch (errorType) {
      case 'unknown_intent':
        return [
          'O que você gostaria de fazer com suas finanças?',
          'Você quer verificar saldo, pagar contas ou fazer transferências?',
        ];
      case 'missing_entities':
        return [
          'Para qual valor ou pessoa você está se referindo?',
          'Pode me dar mais detalhes sobre a transação?',
        ];
      default:
        return ['Pode repetir de outra forma?'];
    }
  }

  private generateContextualHints(
    _errorType: string,
    _context: ConversationContext,
    _userPreferences: UserPreferences,
    financialContext: FinancialContext
  ): string[] {
    const hints = [];

    if (financialContext.billPatterns.upcomingBills.length > 0) {
      hints.push('Você pode dizer "pagar conta de luz" para pagar suas contas');
    }

    if (financialContext.transferPatterns.frequentRecipients.length > 0) {
      hints.push(
        `Você pode dizer "transferir para ${financialContext.transferPatterns.frequentRecipients[0].name}"`
      );
    }

    hints.push('Você pode dizer "qual é meu saldo" para verificar seu saldo');

    return hints;
  }

  // ============================================================================
  // Data Processing Helpers
  // ============================================================================

  private calculateMonthlyAverage(transactions: TransactionEntity[]): number {
    if (transactions.length === 0) return 0;

    const monthlyTotal = transactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);

    return monthlyTotal / 1; // TODO: Calculate based on actual months
  }

  private calculateTopCategories(
    transactions: TransactionEntity[]
  ): Array<{ category: string; amount: number; percentage: number }> {
    const categoryTotals = transactions.reduce(
      (acc, transaction) => {
        const category = transaction.category || 'outros';
        acc[category] = (acc[category] || 0) + Math.abs(transaction.amount || 0);
        return acc;
      },
      {} as Record<string, number>
    );

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private calculateAverageTransfer(transactions: TransactionEntity[]): number {
    const transfers = transactions.filter((t) => t.type === 'transfer');
    if (transfers.length === 0) return 0;

    const total = transfers.reduce((sum, transfer) => sum + Math.abs(transfer.amount || 0), 0);
    return total / transfers.length;
  }

  private calculateMonthlyIncome(transactions: TransactionEntity[]): number {
    const income = transactions.filter((t) => (t.amount || 0) > 0);
    if (income.length === 0) return 0;

    return income.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  }

  private async learnFromInteraction(
    userId: string,
    _text: string,
    nluResult: NLUResult,
    _context: ConversationContext,
    userPreferences: UserPreferences,
    brazilianContext: BrazilianContext
  ): Promise<void> {
    try {
      // Update user preferences based on interaction
      if (
        brazilianContext.region !== 'Unknown' &&
        userPreferences.regionalVariation === 'Unknown'
      ) {
        userPreferences.regionalVariation = brazilianContext.region;
        userPreferences.updatedAt = new Date();
        await this.updateUserPreferences(userPreferences);
      }

      // Update learning profile
      userPreferences.learningProfile.confidenceLevel =
        (userPreferences.learningProfile.confidenceLevel + nluResult.confidence) / 2;
      userPreferences.updatedAt = new Date();

      logger.debug('Learning from interaction', {
        userId,
        intent: nluResult.intent,
        confidence: nluResult.confidence,
        region: brazilianContext.region,
      });
    } catch (error) {
      logger.error('Failed to learn from interaction', { error, userId });
    }
  }

  private async updateUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        id: preferences.id,
        user_id: preferences.userId,
        preferred_language: preferences.preferredLanguage,
        regional_variation: preferences.regionalVariation,
        linguistic_style: preferences.linguisticStyle,
        financial_habits: preferences.financialHabits,
        interaction_preferences: preferences.interactionPreferences,
        temporal_patterns: preferences.temporalPatterns,
        learning_profile: preferences.learningProfile,
        updated_at: preferences.updatedAt.toISOString(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to update user preferences', { error });
    }
  }

  private async persistContext(context: ConversationContext): Promise<void> {
    try {
      const { error } = await supabase.from('conversation_contexts').upsert({
        user_id: context.userId,
        session_id: context.sessionId,
        history: context.history,
        last_intent: context.lastIntent,
        last_entities: context.lastEntities,
        timestamp: context.timestamp.toISOString(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to persist context', { error });
    }
  }

  private async loadContextFromPersistence(
    userId: string,
    sessionId: string
  ): Promise<ConversationContext | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_contexts')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        sessionId: data.session_id,
        history: data.history || [],
        lastIntent: data.last_intent,
        lastEntities: data.last_entities || [],
        timestamp: new Date(data.timestamp),
      };
    } catch (error) {
      logger.error('Failed to load context from persistence', { error });
      return null;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createContextProcessor(config?: Partial<ContextConfig>): ContextProcessor {
  return new ContextProcessor(config);
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_CONTEXT_CONFIG };
export type { ContextConfig, UserPreferences, FinancialContext, BrazilianContext };

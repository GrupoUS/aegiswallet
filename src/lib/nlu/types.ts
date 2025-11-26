/**
 * NLU Type Definitions for AegisWallet
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Defines types for Natural Language Understanding engine
 * supporting 6 essential Brazilian Portuguese voice commands
 *
 * @module nlu/types
 */

// ============================================================================
// Intent Types
// ============================================================================

/**
 * Supported intent types for voice commands
 */
export enum IntentType {
  CHECK_BALANCE = 'check_balance',
  CHECK_BUDGET = 'check_budget',
  PAY_BILL = 'pay_bill',
  CHECK_INCOME = 'check_income',
  FINANCIAL_PROJECTION = 'financial_projection',
  TRANSFER_MONEY = 'transfer_money',
  UNKNOWN = 'unknown',
}

/**
 * Intent definition with patterns and slots
 */
export interface IntentDefinition {
  type: IntentType;
  name: string;
  description: string;
  patterns: RegExp[]; // Regex patterns for matching
  keywords: string[]; // Keywords for fallback matching
  requiredSlots: EntityType[];
  optionalSlots: EntityType[];
  examples: string[]; // Example utterances
  confidence_threshold: number; // Minimum confidence to accept
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Supported entity types for extraction
 */
export enum EntityType {
  AMOUNT = 'amount', // Money amounts: R$ 100, cem reais
  DATE = 'date', // Dates: hoje, amanhã, próxima sexta
  PERSON = 'person', // Names: João, Maria Silva
  CATEGORY = 'category', // Categories: energia, água, internet
  ACCOUNT = 'account', // Account types: corrente, poupança
  PERIOD = 'period', // Time periods: mês, semana, ano
  BILL_TYPE = 'bill_type', // Bill types: energia, água, telefone
  RECIPIENT = 'recipient', // Transfer recipients: CPF, phone, email
}

/**
 * Extracted entity with metadata
 */
export interface ExtractedEntity {
  type: EntityType;
  value: string; // Original text value
  normalizedValue: unknown; // Normalized/parsed value
  confidence: number; // Confidence score (0-1)
  startIndex: number; // Start position in text
  endIndex: number; // End position in text
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Entity pattern for extraction
 */
export interface EntityPattern {
  type: EntityType;
  pattern: RegExp;
  normalizer: (match: string) => unknown;
  validator?: (value: unknown) => boolean;
}

// ============================================================================
// NLU Result Types
// ============================================================================

/**
 * Complete NLU processing result
 */
export interface NLUResult {
  intent: IntentType;
  confidence: number; // Intent classification confidence (0-1)
  entities: ExtractedEntity[];
  originalText: string;
  normalizedText: string;
  processingTime: number; // Processing time in milliseconds
  requiresConfirmation: boolean;
  requiresDisambiguation: boolean;
  missingSlots: EntityType[]; // Required slots not found
  context?: {
    previousIntents: IntentType[];
  };
  metadata?: {
    classificationMethod?: 'pattern' | 'tfidf' | 'ensemble' | 'keyword';
    alternativeIntents?: { intent: IntentType; confidence: number }[];
    contextUsed?: boolean;
    brazilianContext?: Record<string, unknown>;
    learningSignals?: Record<string, unknown>;
  };
}

/**
 * Intent classification result
 */
export interface IntentClassificationResult {
  intent: IntentType;
  confidence: number;
  method: 'pattern' | 'tfidf' | 'ensemble' | 'keyword';
  alternatives: { intent: IntentType; confidence: number }[];
}

// ============================================================================
// Disambiguation Types
// ============================================================================

/**
 * Disambiguation request when intent is ambiguous
 */
export interface DisambiguationRequest {
  originalText: string;
  possibleIntents: { intent: IntentType; confidence: number }[];
  question: string; // Question to ask user
  options: DisambiguationOption[];
  timeout: number; // Timeout in milliseconds
  context?: ConversationContext;
}

/**
 * Disambiguation option for user selection
 */
export interface DisambiguationOption {
  label: string;
  value: IntentType;
  description?: string;
}

/**
 * Conversation context for multi-turn interactions
 */
export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: ConversationTurn[];
  lastIntent?: IntentType;
  lastEntities?: ExtractedEntity[];
  timestamp: Date;
}

/**
 * Single conversation turn
 */
export interface ConversationTurn {
  userInput: string;
  nluResult: NLUResult;
  systemResponse: string;
  timestamp: Date;
}

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * NLU performance metrics
 */
export interface NLUMetrics {
  totalProcessed: number;
  successfulClassifications: number;
  failedClassifications: number;
  averageConfidence: number;
  averageProcessingTime: number;
  intentDistribution: Record<IntentType, number>;
  accuracyByIntent: Record<IntentType, number>;
  falsePositives: number;
  falseNegatives: number;
  disambiguationRate: number;
  // Enhanced metrics for Brazilian Portuguese learning
  regionalAccuracy: Record<string, number>;
  slangCorrectness: number;
  formalCorrectness: number;
  colloquialCorrectness: number;
  temporalAccuracy: Record<string, number>; // Accuracy by time of day
  learningProgress: number; // Improvement rate over time
  patternEvolution: {
    pattern: string;
    frequency: number;
    accuracy: number;
    lastSeen: Date;
  }[];
}

/**
 * Enhanced classification log entry for tracking and learning
 */
export interface ClassificationLog {
  id: string;
  userId: string;
  sessionId: string;
  originalText: string;
  normalizedText: string;
  predictedIntent: IntentType;
  confidence: number;
  entities: ExtractedEntity[];
  processingTime: number;
  correctIntent?: IntentType; // For feedback/training
  feedback?: 'correct' | 'incorrect' | 'ambiguous';
  timestamp: Date;
  // Enhanced Brazilian Portuguese learning fields
  regionalVariation?: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste' | 'Unknown';
  linguisticStyle?: 'slang' | 'formal' | 'colloquial' | 'mixed';
  contextualClues?: {
    previousIntent?: IntentType;
    timeOfDay: string;
    dayOfWeek: string;
    conversationTurn: number;
  };
  errorAnalysis?: {
    errorType: 'pattern_miss' | 'entity_extraction' | 'intent_confusion' | 'low_confidence';
    confusedWith?: IntentType;
    missedEntities?: EntityType[];
    patternUsed?: string;
  };
  learningSignals?: {
    userCorrection: boolean;
    repetition: boolean;
    userFrustration: boolean; // Inferred from repeated failures
    adaptationSuccess: boolean;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * NLU engine configuration
 */
export interface NLUConfig {
  // Classification thresholds
  highConfidenceThreshold: number; // >0.8: Accept immediately
  mediumConfidenceThreshold: number; // 0.6-0.8: Request confirmation
  lowConfidenceThreshold: number; // <0.6: Reject or disambiguate

  // Performance settings
  maxProcessingTime: number; // Maximum processing time in ms
  cacheEnabled: boolean;
  cacheTTL: number; // Cache TTL in milliseconds

  // Context settings
  contextEnabled: boolean;
  maxContextTurns: number; // Maximum conversation turns to keep

  // Logging settings
  loggingEnabled: boolean;
  logToSupabase: boolean;

  // Feature flags
  tfidfEnabled: boolean;
  ensembleVotingEnabled: boolean;
  disambiguationEnabled: boolean;
}

// ============================================================================
// Utterance Dataset Types
// ============================================================================

/**
 * Training utterance with intent label
 */
export interface TrainingUtterance {
  text: string;
  intent: IntentType;
  entities?: {
    type: EntityType;
    value: string;
    startIndex: number;
    endIndex: number;
  }[];
  region?: 'SP' | 'RJ' | 'Nordeste' | 'Sul' | 'Norte' | 'Centro-Oeste';
  metadata?: {
    slang?: boolean;
    formal?: boolean;
    colloquial?: boolean;
  };
}

/**
 * Utterance dataset structure
 */
export interface UtteranceDataset {
  version: string;
  lastUpdated: string;
  totalUtterances: number;
  utterancesByIntent: Record<IntentType, TrainingUtterance[]>;
  regionalVariations: Record<string, number>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * NLU processing error
 */
export class NLUError extends Error {
  constructor(
    message: string,
    public code: NLUErrorCode,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'NLUError';
  }
}

/**
 * NLU error codes
 */
export enum NLUErrorCode {
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  CLASSIFICATION_FAILED = 'CLASSIFICATION_FAILED',
  ENTITY_EXTRACTION_FAILED = 'ENTITY_EXTRACTION_FAILED',
  DISAMBIGUATION_TIMEOUT = 'DISAMBIGUATION_TIMEOUT',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Text normalization result
 */
export interface NormalizedText {
  original: string;
  normalized: string;
  tokens: string[];
  removedStopwords: string[];
  expandedContractions: Record<string, string>;
}

/**
 * Confidence score with explanation
 */
export interface ConfidenceScore {
  value: number; // 0-1
  level: 'high' | 'medium' | 'low';
  explanation: string;
  factors: Record<string, number>; // Contributing factors
}

// ============================================================================
// NLU Learning Types
// ============================================================================

/**
 * NLU Entity for learning and pattern evolution
 */
export interface NLUEntity {
  type: EntityType;
  value: string;
  normalizedValue: unknown;
  confidence: number;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, unknown>;
}

/**
 * Pattern evolution for NLU improvement
 */
export interface PatternEvolution {
  pattern: string;
  confidence: number;
  usage: number;
  successRate: number;
  lastUpdated: Date;
}

/**
 * User adaptation for personalized NLU
 */
export interface UserAdaptation {
  userId: string;
  patterns: Record<string, PatternEvolution>;
  preferences: Record<string, number>;
  adaptationLevel: number;
  lastAdapted: Date;
}

/**
 * Voice Types for AegisWallet
 *
 * Type definitions for voice interface functionality
 * Used across all voice components and services
 */

// ============================================================================
// Voice Command Types
// ============================================================================

export type VoiceCommandIntent =
  | 'balance_query'
  | 'payment_query'
  | 'transfer_query'
  | 'statement_query'
  | 'investment_query'
  | 'help_query'
  | 'unknown';

export interface VoiceCommandParameters {
  amount?: number;
  recipient?: string;
  account?: string;
  description?: string;
  category?: string;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface VoiceCommand {
  id: string;
  command: string;
  intent: VoiceCommandIntent;
  confidence: number;
  parameters?: VoiceCommandParameters;
  response?: string;
  timestamp: Date;
  processingTime: number;
  provider: 'web-speech' | 'cloud-fallback';
}

export interface VoiceCommandResult {
  success: boolean;
  command?: VoiceCommand;
  error?: string;
  suggestions?: string[];
}

// ============================================================================
// Speech Recognition Types
// ============================================================================

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
  errorCode?: number;
}

// ============================================================================
// Brazilian Portuguese Regional Types
// ============================================================================

export type BrazilianRegion =
  | 'pt-BR' // Padrão brasileiro
  | 'pt-BR-SP' // São Paulo
  | 'pt-BR-RJ' // Rio de Janeiro
  | 'pt-BR-NE' // Nordeste
  | 'pt-BR-SUL'; // Sul

export interface RegionalAccent {
  region: BrazilianRegion;
  name: string;
  characteristics: string[];
  commonPhrases: string[];
}

// ============================================================================
// Audio Processing Types
// ============================================================================

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: 'webm' | 'wav' | 'mp3' | 'ogg';
}

export interface NoiseDetectionResult {
  hasNoise: boolean;
  noiseLevel: number; // 0-1
  noiseType: 'background' | 'white' | 'pink' | 'impulse';
  recommendedAction: 'proceed' | 'retry' | 'adjust';
}

// ============================================================================
// Performance Metrics Types
// ============================================================================

export interface VoicePerformanceMetrics {
  totalRecognitions: number;
  successfulRecognitions: number;
  averageResponseTime: number;
  averageConfidence: number;
  fallbackUsage: number;
  successRate: number;
  fallbackRate: number;
  regionalAccuracy: Record<BrazilianRegion, number>;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // milliseconds
  minConfidence: number; // 0-1
  minSuccessRate: number; // 0-1
  maxFallbackRate: number; // 0-1
}

// ============================================================================
// Essential Voice Commands
// ============================================================================

export const ESSENTIAL_VOICE_COMMANDS = [
  {
    command: 'saldo',
    examples: ['qual o meu saldo', 'quanto tenho na conta', 'ver saldo'],
    intent: 'balance_query' as const,
    keywords: ['saldo', 'tenho', 'conta', 'disponível'],
  },
  {
    command: 'transferir',
    examples: ['transferir dinheiro', 'fazer pix', 'enviar valor'],
    intent: 'transfer_query' as const,
    keywords: ['transferir', 'pix', 'enviar', 'mandar'],
  },
  {
    command: 'pagar',
    examples: ['pagar conta', 'fazer pagamento', 'pagar boleto'],
    intent: 'payment_query' as const,
    keywords: ['pagar', 'conta', 'boleto', 'fatura'],
  },
  {
    command: 'extrato',
    examples: ['ver extrato', 'movimentações', 'consultar extrato'],
    intent: 'statement_query' as const,
    keywords: ['extrato', 'movimentações', 'lançamentos', 'consultar'],
  },
  {
    command: 'investir',
    examples: ['investir dinheiro', 'aplicações', 'rendimentos'],
    intent: 'investment_query' as const,
    keywords: ['investir', 'aplicar', 'aplicações', 'rendimento'],
  },
  {
    command: 'ajuda',
    examples: ['o que posso fazer', 'ajuda', 'comandos disponíveis'],
    intent: 'help_query' as const,
    keywords: ['ajuda', 'comandos', 'posso fazer', 'disponível'],
  },
] as const;

// ============================================================================
// Error Types
// ============================================================================

export type VoiceErrorCode =
  | 'MICROPHONE_DENIED'
  | 'MICROPHONE_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SPEECH_NOT_SUPPORTED'
  | 'RECOGNITION_TIMEOUT'
  | 'AUDIO_QUALITY_LOW'
  | 'CONFIDENCE_LOW'
  | 'UNKNOWN_ERROR';

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  isRetryable: boolean;
  suggestion?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface VoiceConfig {
  language: string;
  region: BrazilianRegion;
  confidenceThreshold: number;
  enableFallback: boolean;
  enableContinuousRecognition: boolean;
  performanceThresholds: PerformanceThresholds;
  audioConfig: AudioConfig;
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  audioConfig: {
    bitDepth: 16,
    channels: 1,
    format: 'webm',
    sampleRate: 16000,
  },
  confidenceThreshold: 0.85,
  enableContinuousRecognition: false,
  enableFallback: true,
  language: 'pt-BR',
  performanceThresholds: {
    maxResponseTime: 1000, // 1 second
    minConfidence: 0.85,
    minSuccessRate: 0.95,
    maxFallbackRate: 0.1,
  },
  region: 'pt-BR',
};

/**
 * Voice Service for AegisWallet
 * Integrates Web Speech API with AI services for voice commands
 */

import { logger } from '../lib/logging/logger';

// TypeScript interfaces for Web Speech API (not available globally)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onaudiostart: ((event: Event) => void) | null;
  onsoundstart: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onsoundend: ((event: Event) => void) | null;
  onaudioend: ((event: Event) => void) | null;
  onnomatch: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechSynthesisErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechSynthesis extends EventTarget {
  pending: boolean;
  speaking: boolean;
  paused: boolean;
  onvoiceschanged: ((event: Event) => void) | null;
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
}

interface SpeechSynthesisUtterance extends EventTarget {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null;
  onpause: ((event: Event) => void) | null;
  onresume: ((event: Event) => void) | null;
  onmark: ((event: SpeechSynthesisEvent) => void) | null;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null;
}

interface SpeechSynthesisEvent extends Event {
  name: string;
  charIndex: number;
  elapsedTime: number;
}

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  error: string;
}

interface SpeechSynthesisVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechSynthesisUtterance: new (text: string) => SpeechSynthesisUtterance;
  }
}

// Voice command patterns in Portuguese
export const VOICE_COMMANDS = {
  BALANCE: ['qual é meu saldo', 'mostrar saldo', 'ver saldo', 'saldo'],
  BILLS: ['quais contas tenho que pagar', 'contas a pagar', 'contas', 'pagamentos'],
  BUDGET: ['como está meu orçamento', 'ver orçamento', 'orçamento', 'gastos'],
  DASHBOARD: ['ir para dashboard', 'dashboard', 'início', 'home'],
  PIX: ['fazer um pix', 'transferir', 'enviar dinheiro', 'pix'],
  TRANSACTIONS: ['ver transações', 'transações', 'histórico'],
} as const;

export type VoiceCommandType = keyof typeof VOICE_COMMANDS;

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  command?: VoiceCommandType;
  intent?: string;
}

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private config: VoiceServiceConfig;

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      language: 'pt-BR',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      ...config,
    };

    this.initializeRecognition();
    this.initializeSynthesis();
  }

  private initializeRecognition() {
    try {
      this.recognition = this.getSpeechRecognition();
      if (this.recognition) {
        this.recognition.lang = this.config.language || 'pt-BR';
        this.recognition.continuous = this.config.continuous || false;
        this.recognition.interimResults = this.config.interimResults || false;
        this.recognition.maxAlternatives = this.config.maxAlternatives || 1;
      }
    } catch (error) {
      logger.warn('Failed to initialize Speech Recognition', {
        error: error instanceof Error ? error.message : String(error),
        userAgent: navigator.userAgent,
      });
    }
  }

  private getSpeechRecognition(): SpeechRecognition | null {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }
    return new SpeechRecognition();
  }

  private initializeSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      logger.warn('Speech Synthesis API not supported in this browser', {
        feature: 'speechSynthesis',
        userAgent: navigator.userAgent,
      });
    }
  }

  /**
   * Start listening for voice commands
   */
  startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.recognition) {
      onError?.(new Error('Speech Recognition not available'));
      return;
    }

    if (this.isListening) {
      logger.warn('Already listening to voice commands', {
        action: 'startListening',
        component: 'VoiceService',
      });
      return;
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;

      const command = this.detectCommand(transcript);

      onResult({
        command,
        confidence,
        intent: command ? this.getCommandIntent(command) : undefined,
        transcript,
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.voiceError(`Speech recognition error: ${event.error}`, {
        action: 'recognition',
        component: 'VoiceService',
        error: event.error,
        errorMessage: event.message,
      });
      this.isListening = false;
      onError?.(new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
      logger.voiceCommand('Voice recognition started', 1.0, {
        action: 'startListening',
        component: 'VoiceService',
        continuous: this.config.continuous,
        language: this.config.language,
      });
    } catch (error) {
      logger.voiceError('Error starting recognition', {
        action: 'startRecognition',
        component: 'VoiceService',
        error: error instanceof Error ? error.message : String(error),
      });
      onError?.(error as Error);
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Detect command from transcript
   */
  private detectCommand(transcript: string): VoiceCommandType | undefined {
    for (const [command, patterns] of Object.entries(VOICE_COMMANDS)) {
      for (const pattern of patterns) {
        if (transcript.includes(pattern)) {
          return command as VoiceCommandType;
        }
      }
    }
    return undefined;
  }

  /**
   * Get command intent (route path)
   */
  private getCommandIntent(command: VoiceCommandType): string {
    const intentMap: Record<VoiceCommandType, string> = {
      BALANCE: '/saldo',
      BILLS: '/contas',
      BUDGET: '/orcamento',
      DASHBOARD: '/dashboard',
      PIX: '/pix',
      TRANSACTIONS: '/transactions',
    };
    return intentMap[command];
  }

  /**
   * Speak text using Text-to-Speech
   */
  speak(text: string, options?: Partial<SpeechSynthesisUtterance>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech Synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language || 'pt-BR';
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if Speech Recognition is supported
   */
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Check if Speech Synthesis is supported
   */
  static isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  /**
   * Get Portuguese voices
   */
  getPortugueseVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter((voice) => voice.lang.startsWith('pt'));
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null;

/**
 * Get or create VoiceService instance
 */
export function getVoiceService(config?: VoiceServiceConfig): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config);
  }
  return voiceServiceInstance;
}

/**
 * Voice feedback messages in Portuguese
 */
export const VOICE_FEEDBACK = {
  BALANCE_RESPONSE: (amount: number) =>
    `Seu saldo total é ${new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(amount)}`,
  BILLS_RESPONSE: (count: number) => `Você tem ${count} contas pendentes`,
  BUDGET_RESPONSE: (percentage: number) => `Você utilizou ${percentage}% do seu orçamento mensal`,
  ERROR: 'Desculpe, não entendi o comando',
  LISTENING: 'Estou ouvindo...',
  NAVIGATING: (destination: string) => `Navegando para ${destination}`,
  NOT_SUPPORTED: 'Reconhecimento de voz não suportado neste navegador',
  PROCESSING: 'Processando comando...',
} as const;

export default VoiceService;

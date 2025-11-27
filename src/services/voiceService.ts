/**
 * Voice Service for AegisWallet
 * Integrates Web Speech API with AI services for voice commands
 */

import { logger } from '../lib/logging/logger';

// Web Speech API types - these are available in TypeScript's lib.dom.d.ts
// Using type assertions to access Web Speech API when available

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
  onstart: ((event: SpeechSynthesisEvent) => void) | null;
  onend: ((event: SpeechSynthesisEvent) => void) | null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null;
  onpause: ((event: SpeechSynthesisEvent) => void) | null;
  onresume: ((event: SpeechSynthesisEvent) => void) | null;
  onmark: ((event: SpeechSynthesisEvent) => void) | null;
  onboundary: ((event: SpeechSynthesisEvent) => void) | null;
}

interface SpeechSynthesisEvent extends Event {
  utterance: SpeechSynthesisUtterance;
  name: string;
  charIndex: number;
  charLength: number;
  elapsedTime: number;
}

interface SpeechSynthesisVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

// Web Speech API global types are declared in @/types/speech-recognition.d.ts

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
  private recognition: any = null;
  private synthesis: any = null;
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

  private getSpeechRecognition(): any {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }
    return new SpeechRecognition();
  }

  private initializeSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis as unknown as SpeechSynthesis;
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

    this.recognition.onresult = (event: any) => {
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

    this.recognition.onerror = (event: any) => {
      const errorType = event.error;

      // Special handling for 'no-speech' error - treat as informational, not critical
      if (errorType === 'no-speech') {
        logger.warn('No speech detected during voice recognition', {
          action: 'recognition',
          component: 'VoiceService',
          error: errorType,
          isNoSpeech: true,
        });
        this.isListening = false;
        // Create a special error that can be identified by the hook
        const noSpeechError = new Error('no-speech') as Error & { isNoSpeech: boolean };
        noSpeechError.isNoSpeech = true;
        onError?.(noSpeechError);
        return;
      }

      logger.voiceError(`Speech recognition error: ${errorType}`, {
        action: 'recognition',
        component: 'VoiceService',
        error: errorType,
        errorMessage: event.message,
      });
      this.isListening = false;
      onError?.(new Error(`Speech recognition error: ${errorType}`));
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

      // Use the global SpeechSynthesisUtterance to avoid type conflicts
      const utterance = new (
        globalThis.SpeechSynthesisUtterance as typeof SpeechSynthesisUtterance
      )(text);
      utterance.lang = this.config.language || 'pt-BR';
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        const errorEvent = event as unknown as { error: string };
        reject(new Error(`Speech synthesis error: ${errorEvent.error}`));
      };

      (this.synthesis as unknown as globalThis.SpeechSynthesis).speak(
        utterance as globalThis.SpeechSynthesisUtterance
      );
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

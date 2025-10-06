/**
 * Voice Service for AegisWallet
 * Integrates Web Speech API with AI services for voice commands
 */

// Voice command patterns in Portuguese
export const VOICE_COMMANDS = {
  BALANCE: ['qual é meu saldo', 'mostrar saldo', 'ver saldo', 'saldo'],
  BUDGET: ['como está meu orçamento', 'ver orçamento', 'orçamento', 'gastos'],
  BILLS: ['quais contas tenho que pagar', 'contas a pagar', 'contas', 'pagamentos'],
  PIX: ['fazer um pix', 'transferir', 'enviar dinheiro', 'pix'],
  DASHBOARD: ['ir para dashboard', 'dashboard', 'início', 'home'],
  TRANSACTIONS: ['ver transações', 'transações', 'histórico'],
} as const

export type VoiceCommandType = keyof typeof VOICE_COMMANDS

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  command?: VoiceCommandType
  intent?: string
}

export interface VoiceServiceConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

class VoiceService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private config: VoiceServiceConfig

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      language: 'pt-BR',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      ...config,
    }

    this.initializeRecognition()
    this.initializeSynthesis()
  }

  private initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition API not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    if (this.recognition) {
      this.recognition.lang = this.config.language || 'pt-BR'
      this.recognition.continuous = this.config.continuous || false
      this.recognition.interimResults = this.config.interimResults || false
      this.recognition.maxAlternatives = this.config.maxAlternatives || 1
    }
  }

  private initializeSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    } else {
      console.warn('Speech Synthesis API not supported in this browser')
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
      onError?.(new Error('Speech Recognition not available'))
      return
    }

    if (this.isListening) {
      console.warn('Already listening')
      return
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript.toLowerCase().trim()
      const confidence = result[0].confidence

      const command = this.detectCommand(transcript)

      onResult({
        transcript,
        confidence,
        command,
        intent: command ? this.getCommandIntent(command) : undefined,
      })
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      this.isListening = false
      onError?.(new Error(`Speech recognition error: ${event.error}`))
    }

    this.recognition.onend = () => {
      this.isListening = false
    }

    try {
      this.recognition.start()
      this.isListening = true
    } catch (error) {
      console.error('Error starting recognition:', error)
      onError?.(error as Error)
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Detect command from transcript
   */
  private detectCommand(transcript: string): VoiceCommandType | undefined {
    for (const [command, patterns] of Object.entries(VOICE_COMMANDS)) {
      for (const pattern of patterns) {
        if (transcript.includes(pattern)) {
          return command as VoiceCommandType
        }
      }
    }
    return undefined
  }

  /**
   * Get command intent (route path)
   */
  private getCommandIntent(command: VoiceCommandType): string {
    const intentMap: Record<VoiceCommandType, string> = {
      BALANCE: '/saldo',
      BUDGET: '/orcamento',
      BILLS: '/contas',
      PIX: '/pix',
      DASHBOARD: '/dashboard',
      TRANSACTIONS: '/transactions',
    }
    return intentMap[command]
  }

  /**
   * Speak text using Text-to-Speech
   */
  speak(text: string, options?: SpeechSynthesisUtterance): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech Synthesis not available'))
        return
      }

      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = this.config.language || 'pt-BR'
      utterance.rate = options?.rate || 1.0
      utterance.pitch = options?.pitch || 1.0
      utterance.volume = options?.volume || 1.0

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      this.synthesis.speak(utterance)
    })
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * Check if Speech Recognition is supported
   */
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  /**
   * Check if Speech Synthesis is supported
   */
  static isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  /**
   * Get Portuguese voices
   */
  getPortugueseVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter((voice) => voice.lang.startsWith('pt'))
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null

/**
 * Get or create VoiceService instance
 */
export function getVoiceService(config?: VoiceServiceConfig): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config)
  }
  return voiceServiceInstance
}

/**
 * Voice feedback messages in Portuguese
 */
export const VOICE_FEEDBACK = {
  LISTENING: 'Estou ouvindo...',
  PROCESSING: 'Processando comando...',
  NAVIGATING: (destination: string) => `Navegando para ${destination}`,
  ERROR: 'Desculpe, não entendi o comando',
  NOT_SUPPORTED: 'Reconhecimento de voz não suportado neste navegador',
  BALANCE_RESPONSE: (amount: number) =>
    `Seu saldo total é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}`,
  BILLS_RESPONSE: (count: number) => `Você tem ${count} contas pendentes`,
  BUDGET_RESPONSE: (percentage: number) => `Você utilizou ${percentage}% do seu orçamento mensal`,
} as const

export default VoiceService

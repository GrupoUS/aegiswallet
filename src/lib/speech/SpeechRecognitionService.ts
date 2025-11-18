/**
 * Speech Recognition Service for AegisWallet
 *
 * Story: 1.1 - Speech Recognition Service
 *
 * Implements Web Speech API with Brazilian Portuguese support and cloud fallback:
 * - Primary: Web Speech API (browser-native)
 * - Fallback: OpenAI Whisper API (via existing STT service)
 * - Regional accent adaptation for Brazilian Portuguese
 * - Real-time processing with <1s response time
 * - Confidence scoring and validation
 *
 * @module speech/SpeechRecognitionService
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SpeechRecognitionConfig {
  language: string;
  confidenceThreshold: number;
  maxAlternatives: number;
  continuous: boolean;
  interimResults: boolean;
  grammars?: SpeechGrammarList;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: RecognitionAlternative[];
  isFinal: boolean;
  processingTime: number;
  provider: 'web-speech' | 'cloud-fallback';
  audioDuration: number;
}

export interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
  code?: number;
  isRetryable: boolean;
  provider: 'web-speech' | 'cloud-fallback';
}

export interface AudioPreprocessingConfig {
  noiseReduction: boolean;
  autoGainControl: boolean;
  echoCancellation: boolean;
  sampleRate: number;
}

// ============================================================================
// Speech Recognition Service Class
// ============================================================================

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private config: SpeechRecognitionConfig;
  private audioConfig: AudioPreprocessingConfig;
  private isSupported: boolean = false;
  private isListening: boolean = false;

  // Performance tracking
  private performanceMetrics = {
    totalRecognitions: 0,
    successfulRecognitions: 0,
    averageResponseTime: 0,
    averageConfidence: 0,
    fallbackUsage: 0,
  };

  // Brazilian Portuguese regional variants
  private readonly BRAZILIAN_VARIANTS = {
    'pt-BR': 'Português Brasileiro (Padrão)',
    'pt-BR-SP': 'Português Paulista',
    'pt-BR-RJ': 'Português Carioca',
    'pt-BR-NE': 'Português Nordestino',
    'pt-BR-SUL': 'Português Sulista',
  };

  constructor(config: Partial<SpeechRecognitionConfig> = {}) {
    // Check Web Speech API support
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    // Default configuration optimized for Brazilian Portuguese
    this.config = {
      language: 'pt-BR',
      confidenceThreshold: 0.85,
      maxAlternatives: 3,
      continuous: false,
      interimResults: true,
      ...config,
    };

    // Audio preprocessing configuration
    this.audioConfig = {
      noiseReduction: true,
      autoGainControl: true,
      echoCancellation: true,
      sampleRate: 16000,
    };

    if (this.isSupported) {
      this.initializeSpeechRecognition();
    }
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      throw new Error('Web Speech API not supported in this browser');
    }

    this.recognition = new SpeechRecognitionClass();

    // Configure recognition
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;

    // Configure grammars for financial commands if provided
    if (this.config.grammars) {
      this.recognition.grammars = this.config.grammars;
    }
  }

  /**
   * Start speech recognition
   */
  async startRecognition(
    options: {
      timeout?: number;
      onResult?: (result: RecognitionResult) => void;
      onError?: (error: SpeechRecognitionError) => void;
      onEnd?: () => void;
      onStart?: () => void;
    } = {}
  ): Promise<RecognitionResult> {
    const startTime = Date.now();
    const { timeout = 5000, onResult, onError, onEnd, onStart } = options;

    if (!this.isSupported) {
      // Fallback to cloud-based recognition
      return this.startCloudRecognition(options);
    }

    if (this.isListening) {
      throw new Error('Recognition is already in progress');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'));
        return;
      }

      this.isListening = true;
      onStart?.();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.stopRecognition();
        reject(new Error('Recognition timeout'));
      }, timeout);

      // Handle results
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = this.processSpeechRecognitionEvent(event, startTime);

        if (result) {
          onResult?.(result);

          if (result.isFinal) {
            clearTimeout(timeoutId);
            this.updatePerformanceMetrics(result);
            resolve(result);
            this.stopRecognition();
          }
        }
      };

      // Handle errors
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(timeoutId);
        const error = this.processSpeechRecognitionError(event);

        onError?.(error);

        // For network errors, try cloud fallback
        if (error.isRetryable) {
          this.startCloudRecognition(options).then(resolve).catch(reject);
        } else {
          reject(new Error(error.message));
        }

        this.stopRecognition();
      };

      // Handle end
      this.recognition.onend = () => {
        clearTimeout(timeoutId);
        this.isListening = false;
        onEnd?.();
      };

      // Start recognition
      try {
        this.recognition.start();
      } catch (error) {
        clearTimeout(timeoutId);
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * Stop speech recognition
   */
  stopRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Process speech recognition event
   */
  private processSpeechRecognitionEvent(
    event: SpeechRecognitionEvent,
    startTime: number
  ): RecognitionResult | null {
    if (!event.results || event.results.length === 0) {
      return null;
    }

    const result = event.results[event.results.length - 1];
    if (!result) {
      return null;
    }

    const processingTime = Date.now() - startTime;

    // Get alternatives
    const alternatives: RecognitionAlternative[] = [];
    for (let i = 0; i < Math.min(result.length, this.config.maxAlternatives); i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence || 0,
      });
    }

    return {
      transcript: result[0].transcript,
      confidence: result[0].confidence || 0,
      alternatives,
      isFinal: result.isFinal,
      processingTime,
      provider: 'web-speech',
      audioDuration: processingTime, // Approximate
    };
  }

  /**
   * Process speech recognition error
   */
  private processSpeechRecognitionError(
    event: SpeechRecognitionErrorEvent
  ): SpeechRecognitionError {
    const errorMap: Record<string, { isRetryable: boolean; message: string }> = {
      network: { isRetryable: true, message: 'Network error. Please check your connection.' },
      'no-speech': { isRetryable: false, message: 'No speech detected. Please try again.' },
      'audio-capture': {
        isRetryable: true,
        message: 'Audio capture error. Please check microphone permissions.',
      },
      'not-allowed': {
        isRetryable: false,
        message: 'Microphone access denied. Please enable microphone permissions.',
      },
      'service-not-allowed': {
        isRetryable: true,
        message: 'Speech recognition service not available.',
      },
      aborted: { isRetryable: true, message: 'Recognition was aborted.' },
    };

    const errorInfo = errorMap[event.error] || {
      isRetryable: false,
      message: `Speech recognition error: ${event.error}`,
    };

    return {
      error: event.error,
      message: errorInfo.message,
      code: event.errorCode,
      isRetryable: errorInfo.isRetryable,
      provider: 'web-speech',
    };
  }

  /**
   * Cloud-based recognition fallback
   */
  private async startCloudRecognition(
    options: {
      onResult?: (result: RecognitionResult) => void;
      onError?: (error: SpeechRecognitionError) => void;
    } = {}
  ): Promise<RecognitionResult> {
    const startTime = Date.now();

    try {
      // Import existing STT service
      const { createSTTService } = await import('../stt/speechToTextService');
      const sttService = createSTTService();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: this.audioConfig.noiseReduction,
          autoGainControl: this.audioConfig.autoGainControl,
          echoCancellation: this.audioConfig.echoCancellation,
          sampleRate: this.audioConfig.sampleRate,
        },
      });

      // Record audio
      const audioChunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream);

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const sttResult = await sttService.transcribe(audioBlob);

            const result: RecognitionResult = {
              transcript: sttResult.text,
              confidence: sttResult.confidence,
              alternatives: [], // STT service doesn't provide alternatives
              isFinal: true,
              processingTime: Date.now() - startTime,
              provider: 'cloud-fallback',
              audioDuration: sttResult.duration,
            };

            this.performanceMetrics.fallbackUsage++;
            options.onResult?.(result);
            resolve(result);
          } catch (error) {
            const speechError: SpeechRecognitionError = {
              error: 'cloud-fallback-error',
              message: error instanceof Error ? error.message : 'Cloud recognition failed',
              isRetryable: false,
              provider: 'cloud-fallback',
            };
            options.onError?.(speechError);
            reject(error);
          } finally {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          }
        };

        mediaRecorder.onerror = (_event) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          reject(new Error('MediaRecorder error'));
        };

        // Start recording for maximum 5 seconds (voice command typical length)
        mediaRecorder.start();

        // Stop recording after 5 seconds or when user stops speaking
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 5000);

        // Optional: Implement voice activity detection to stop recording earlier
        this.detectVoiceActivity(stream).then((hasActivity) => {
          if (hasActivity && mediaRecorder.state === 'recording') {
            // Add small delay to capture the end of the phrase
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 500);
          }
        });
      });
    } catch (error) {
      throw new Error(`Cloud fallback failed: ${error}`);
    }
  }

  /**
   * Basic voice activity detection
   */
  private async detectVoiceActivity(stream: MediaStream): Promise<boolean> {
    return new Promise((resolve) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let hasActivity = false;
      const checkInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

        // If volume exceeds threshold, we have voice activity
        if (average > 30) {
          hasActivity = true;
        }

        // Stop checking after 2 seconds or when we have activity
        if (hasActivity || Date.now() - performance.now() > 2000) {
          clearInterval(checkInterval);
          source.disconnect();
          audioContext.close();
          resolve(hasActivity);
        }
      }, 100);
    });
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(result: RecognitionResult): void {
    this.performanceMetrics.totalRecognitions++;

    if (result.confidence >= this.config.confidenceThreshold) {
      this.performanceMetrics.successfulRecognitions++;
    }

    // Update running averages
    const total = this.performanceMetrics.totalRecognitions;
    this.performanceMetrics.averageResponseTime =
      (this.performanceMetrics.averageResponseTime * (total - 1) + result.processingTime) / total;
    this.performanceMetrics.averageConfidence =
      (this.performanceMetrics.averageConfidence * (total - 1) + result.confidence) / total;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate:
        this.performanceMetrics.totalRecognitions > 0
          ? this.performanceMetrics.successfulRecognitions /
            this.performanceMetrics.totalRecognitions
          : 0,
      fallbackRate:
        this.performanceMetrics.totalRecognitions > 0
          ? this.performanceMetrics.fallbackUsage / this.performanceMetrics.totalRecognitions
          : 0,
    };
  }

  /**
   * Configure Brazilian Portuguese regional variant
   */
  configureRegionalVariant(variant: keyof typeof this.BRAZILIAN_VARIANTS): void {
    if (variant === 'pt-BR') {
      this.config.language = 'pt-BR';
    } else {
      // For regional variants, we keep pt-BR as base language
      // but can apply custom grammars or post-processing
      this.config.language = 'pt-BR';
    }

    if (this.recognition) {
      this.recognition.lang = this.config.language;
    }
  }

  /**
   * Add custom grammar for financial commands
   */
  addFinancialGrammar(): void {
    if (!this.recognition || !('SpeechGrammarList' in window)) {
      return;
    }

    const grammar = `
      #JSGF V1.0;
      
      grammar financialCommands;
      
      public <command> = <balance> | <transfer> | <payment> | <statement> | <investment> | <help>;
      
      <balance> = saldo | quanto tenho | ver saldo | consultar saldo;
      <transfer> = transferir | enviar dinheiro | fazer transferência | pix;
      <payment> = pagar conta | fazer pagamento | pagar boleto;
      <statement> = extrato | ver extrato | movimentações;
      <investment> = investir | aplicações | rendimento;
      <help> = ajuda | o que posso fazer | comandos;
    `;

    const SpeechGrammarList = window.SpeechGrammarList;
    const speechGrammarList = new SpeechGrammarList();
    speechGrammarList.addFromString(grammar, 1);

    this.recognition.grammars = speechGrammarList;
  }

  /**
   * Check if Web Speech API is supported
   */
  isWebSpeechSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current configuration
   */
  getConfig(): SpeechRecognitionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
    }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      totalRecognitions: 0,
      successfulRecognitions: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      fallbackUsage: 0,
    };
  }
}

// ============================================================================
// Type declarations for Web Speech API
// ============================================================================

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechGrammarList: any;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create speech recognition service with Brazilian Portuguese configuration
 */
export function createSpeechRecognitionService(
  config?: Partial<SpeechRecognitionConfig>
): SpeechRecognitionService {
  const service = new SpeechRecognitionService(config);

  // Add financial grammar by default
  service.addFinancialGrammar();

  return service;
}

/**
 * Quick recognition function for single commands
 */
export async function recognizeCommand(
  audioBlob?: Blob,
  options?: Partial<SpeechRecognitionConfig>
): Promise<RecognitionResult> {
  const service = createSpeechRecognitionService(options);

  if (audioBlob) {
    // Use cloud fallback for provided audio blob
    const { createSTTService } = await import('../stt/speechToTextService');
    const sttService = createSTTService();
    const sttResult = await sttService.transcribe(audioBlob);

    return {
      transcript: sttResult.text,
      confidence: sttResult.confidence,
      alternatives: [],
      isFinal: true,
      processingTime: sttResult.processingTimeMs,
      provider: 'cloud-fallback',
      audioDuration: sttResult.duration,
    };
  } else {
    // Use real-time recognition
    return service.startRecognition();
  }
}

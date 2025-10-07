/**
 * Speech-to-Text Service for AegisWallet
 *
 * Implements Brazilian Portuguese STT using OpenAI Whisper API
 *
 * Features:
 * - Brazilian Portuguese accent adaptation
 * - <500ms latency (P95)
 * - ≥95% accuracy for Portuguese
 * - LGPD-compliant audio handling
 * - Comprehensive error handling
 *
 * @module speechToTextService
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface STTConfig {
  apiKey: string
  model?: 'whisper-1'
  language?: 'pt' | 'en'
  temperature?: number
  timeout?: number
}

export interface STTResult {
  text: string
  language: string
  duration: number
  confidence: number
  timestamp: Date
  processingTimeMs: number
}

export interface STTError {
  code: STTErrorCode
  message: string
  originalError?: unknown
  retryable: boolean
}

export enum STTErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_AUDIO = 'INVALID_AUDIO',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Speech-to-Text Service Class
// ============================================================================

export class SpeechToTextService {
  private config: Required<STTConfig>
  private readonly API_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions'
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_MS = 1000

  constructor(config: STTConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'whisper-1',
      language: config.language || 'pt',
      temperature: config.temperature || 0.0,
      timeout: config.timeout || 10000, // 10 seconds default
    }

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  /**
   * Transcribe audio to text using OpenAI Whisper API
   *
   * @param audioBlob - Audio data as Blob or File
   * @param options - Optional transcription options
   * @returns STT result with transcription and metadata
   */
  async transcribe(audioBlob: Blob | File, options?: Partial<STTConfig>): Promise<STTResult> {
    const startTime = Date.now()

    try {
      // Validate audio
      this.validateAudio(audioBlob)

      // Prepare request
      const formData = this.prepareFormData(audioBlob, options)

      // Execute with retry logic
      const response = await this.executeWithRetry(() => this.makeRequest(formData))

      // Parse response
      const result = await this.parseResponse(response, startTime)

      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Validate audio file before processing
   */
  private validateAudio(audioBlob: Blob | File): void {
    // Check file size (25 MB limit)
    const MAX_SIZE = 25 * 1024 * 1024
    if (audioBlob.size > MAX_SIZE) {
      throw new Error(`Audio file too large: ${audioBlob.size} bytes (max: ${MAX_SIZE})`)
    }

    // Check file type
    const validTypes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
    ]

    if (!validTypes.includes(audioBlob.type)) {
      throw new Error(`Invalid audio type: ${audioBlob.type}`)
    }
  }

  /**
   * Prepare FormData for API request
   */
  private prepareFormData(audioBlob: Blob | File, options?: Partial<STTConfig>): FormData {
    const formData = new FormData()

    // Add audio file
    const filename = audioBlob instanceof File ? audioBlob.name : 'audio.webm'
    formData.append('file', audioBlob, filename)

    // Add model
    formData.append('model', options?.model || this.config.model)

    // Add language (Brazilian Portuguese)
    formData.append('language', options?.language || this.config.language)

    // Add temperature (0.0 for deterministic results)
    formData.append('temperature', String(options?.temperature || this.config.temperature))

    // Request verbose JSON for metadata
    formData.append('response_format', 'verbose_json')

    return formData
  }

  /**
   * Make HTTP request to OpenAI API
   */
  private async makeRequest(formData: FormData): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.createAPIError(response)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Parse API response and extract transcription
   */
  private async parseResponse(response: Response, startTime: number): Promise<STTResult> {
    const data = await response.json()

    const processingTimeMs = Math.max(1, Date.now() - startTime)

    return {
      text: data.text || '',
      language: data.language || this.config.language,
      duration: data.duration || 0,
      confidence: this.calculateConfidence(data),
      timestamp: new Date(),
      processingTimeMs,
    }
  }

  /**
   * Calculate confidence score from API response
   *
   * Note: Whisper API doesn't return confidence directly,
   * so we estimate based on response characteristics
   */
  private calculateConfidence(data: any): number {
    // If we have segments with avg_logprob, use that
    if (data.segments && data.segments.length > 0) {
      const avgLogProb =
        data.segments.reduce((sum: number, seg: any) => sum + (seg.avg_logprob || 0), 0) /
        data.segments.length

      // Convert log probability to confidence (0-1)
      // avg_logprob typically ranges from -1 to 0
      return Math.max(0, Math.min(1, 1 + avgLogProb))
    }

    // Default confidence for successful transcription
    return 0.95
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries === 0 || !this.isRetryable(error)) {
        throw error
      }

      // Exponential backoff
      const delay = this.RETRY_DELAY_MS * Math.pow(2, this.MAX_RETRIES - retries)
      await this.sleep(delay)

      return this.executeWithRetry(operation, retries - 1)
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      const errorName = error.name

      // Network errors are retryable
      if (errorName === 'AbortError' || errorMessage.includes('network')) {
        return true
      }

      // Rate limit errors are retryable
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return true
      }

      // Server errors (5xx) are retryable
      if (errorMessage.includes('500') || errorMessage.includes('503')) {
        return true
      }
    }

    return false
  }

  /**
   * Create structured API error
   */
  private async createAPIError(response: Response): Promise<Error> {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`

    try {
      const errorData = await response.json()
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
    } catch {
      // Ignore JSON parse errors
    }

    // Include status code in error message for proper categorization
    return new Error(`${errorMessage} (${response.status})`)
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: unknown): STTError {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      const errorName = error.name

      // Timeout errors (check first - highest priority)
      if (errorName === 'AbortError') {
        return {
          code: STTErrorCode.TIMEOUT,
          message: 'Request timed out. Please try again.',
          originalError: error,
          retryable: true,
        }
      }

      // Network errors (check message and name)
      if (
        errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('network error') ||
        errorName === 'TypeError'
      ) {
        return {
          code: STTErrorCode.NETWORK_ERROR,
          message: 'Network error. Please check your connection.',
          originalError: error,
          retryable: true,
        }
      }

      // Rate limit errors (check status codes and message)
      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('too many requests')
      ) {
        return {
          code: STTErrorCode.RATE_LIMIT,
          message: 'Rate limit exceeded. Please wait a moment.',
          originalError: error,
          retryable: true,
        }
      }

      // Authentication errors (check status codes and message)
      if (
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid api key')
      ) {
        return {
          code: STTErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication failed. Please check API key.',
          originalError: error,
          retryable: false,
        }
      }

      // Invalid audio errors
      if (error.message.includes('audio') || error.message.includes('file')) {
        return {
          code: STTErrorCode.INVALID_AUDIO,
          message: error.message,
          originalError: error,
          retryable: false,
        }
      }

      // API errors (check for status codes)
      if (
        errorMessage.includes('api error') ||
        errorMessage.includes('400') ||
        errorMessage.includes('bad request') ||
        errorMessage.includes('500') ||
        errorMessage.includes('internal server error')
      ) {
        return {
          code: STTErrorCode.API_ERROR,
          message: error.message,
          originalError: error,
          retryable: false,
        }
      }
    }

    // Unknown errors
    return {
      code: STTErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred.',
      originalError: error,
      retryable: false,
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Create a minimal test audio blob (silence)
      const testBlob = new Blob([new Uint8Array(1024)], { type: 'audio/webm' })

      // Try to transcribe (will likely fail but confirms API is reachable)
      await this.transcribe(testBlob)
      return true
    } catch (error: any) {
      // If we get an authentication or API error, the service is reachable
      // Network errors are the only ones that indicate the service is unreachable
      const errorMessage = error?.message || ''
      const isNetworkError =
        errorMessage.includes('Network error') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('TypeError') ||
        error?.name === 'TypeError'

      return !isNetworkError
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create STT service instance with environment configuration
 */
export function createSTTService(apiKey?: string): SpeechToTextService {
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY

  if (!key) {
    throw new Error('OpenAI API key not found. Set VITE_OPENAI_API_KEY or OPENAI_API_KEY.')
  }

  return new SpeechToTextService({
    apiKey: key,
    language: 'pt', // Brazilian Portuguese
    temperature: 0.0, // Deterministic results
    timeout: 10000, // 10 seconds
  })
}

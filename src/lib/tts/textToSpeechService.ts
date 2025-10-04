/**
 * Text-to-Speech Service for AegisWallet
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Professional TTS service with:
 * - Brazilian Portuguese voices
 * - SSML support for natural speech
 * - Audio caching
 * - Fallback to Web Speech API
 * - Performance optimization
 *
 * @module tts/textToSpeechService
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TTSConfig {
  voice: 'pt-BR-Francisca' | 'pt-BR-Antonio' | 'default'
  rate: number // 0.5 - 2.0
  pitch: number // 0.5 - 2.0
  volume: number // 0.0 - 1.0
  ssmlEnabled: boolean
  cachingEnabled: boolean
}

export interface SSMLOptions {
  emphasis?: 'strong' | 'moderate' | 'reduced'
  pauseDuration?: number // milliseconds
  prosody?: {
    rate?: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast'
    pitch?: 'x-low' | 'low' | 'medium' | 'high' | 'x-high'
    volume?: 'silent' | 'x-soft' | 'soft' | 'medium' | 'loud' | 'x-loud'
  }
}

export interface TTSResponse {
  success: boolean
  duration: number // in milliseconds
  cached: boolean
  error?: string
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: TTSConfig = {
  voice: 'default',
  rate: 0.9, // Slightly slower for clarity
  pitch: 1.0,
  volume: 0.8,
  ssmlEnabled: true,
  cachingEnabled: true,
}

// ============================================================================
// Audio Cache
// ============================================================================

interface CacheEntry {
  audio: string // Base64 audio data or blob URL
  timestamp: number
  config: TTSConfig
}

class AudioCache {
  private cache = new Map<string, CacheEntry>()
  private maxCacheSize = 50 // Store up to 50 common phrases
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours

  get(text: string, config: TTSConfig): string | null {
    const key = this.getCacheKey(text, config)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return entry.audio
  }

  set(text: string, config: TTSConfig, audio: string): void {
    const key = this.getCacheKey(text, config)

    // Cleanup if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupOldEntries()
    }

    this.cache.set(key, {
      audio,
      timestamp: Date.now(),
      config,
    })
  }

  private getCacheKey(text: string, config: TTSConfig): string {
    return `${text}_${config.voice}_${config.rate}_${config.pitch}`
  }

  private cleanupOldEntries(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    // Remove oldest 20% of entries
    const removeCount = Math.ceil(entries.length * 0.2)
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// ============================================================================
// TTS Service
// ============================================================================

export class TextToSpeechService {
  private config: TTSConfig
  private cache: AudioCache
  private synth: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor(config?: Partial<TTSConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.cache = new AudioCache()

    // Initialize Web Speech API if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
    }
  }

  /**
   * Speak text with TTS
   */
  async speak(text: string, options?: SSMLOptions): Promise<TTSResponse> {
    const startTime = Date.now()

    try {
      // Check cache first
      if (this.config.cachingEnabled) {
        const cachedAudio = this.cache.get(text, this.config)
        if (cachedAudio) {
          await this.playAudio(cachedAudio)
          return {
            success: true,
            duration: Date.now() - startTime,
            cached: true,
          }
        }
      }

      // Generate speech
      const processedText = this.config.ssmlEnabled
        ? this.wrapWithSSML(text, options)
        : text

      await this.generateSpeech(processedText)

      const duration = Date.now() - startTime

      return {
        success: true,
        duration,
        cached: false,
      }
    } catch (error) {
      console.error('TTS Error:', error)
      return {
        success: false,
        duration: Date.now() - startTime,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate speech using Web Speech API
   */
  private async generateSpeech(text: string): Promise<void> {
    if (!this.synth) {
      throw new Error('Speech synthesis not supported')
    }

    // Stop any ongoing speech
    this.stop()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance = utterance

      // Configure utterance
      utterance.lang = 'pt-BR'
      utterance.rate = this.config.rate
      utterance.pitch = this.config.pitch
      utterance.volume = this.config.volume

      // Try to find Brazilian Portuguese voice
      const voices = this.synth!.getVoices()
      const ptBRVoice = voices.find(
        (voice) =>
          voice.lang === 'pt-BR' ||
          voice.name.includes('Portuguese') ||
          voice.name.includes('Brasil')
      )

      if (ptBRVoice) {
        utterance.voice = ptBRVoice
      }

      // Handle events
      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      // Speak
      this.synth!.speak(utterance)
    })
  }

  /**
   * Play cached audio
   */
  private async playAudio(audioData: string): Promise<void> {
    // For Web Speech API, we just speak again
    // In production, this would play actual audio data
    return this.generateSpeech(audioData)
  }

  /**
   * Wrap text with SSML tags
   */
  private wrapWithSSML(text: string, options?: SSMLOptions): string {
    if (!options) return text

    let ssml = text

    // Add emphasis
    if (options.emphasis) {
      ssml = `<emphasis level="${options.emphasis}">${ssml}</emphasis>`
    }

    // Add pause
    if (options.pauseDuration) {
      ssml = `${ssml}<break time="${options.pauseDuration}ms"/>`
    }

    // Add prosody
    if (options.prosody) {
      const { rate, pitch, volume } = options.prosody
      let prosodyAttrs = ''

      if (rate) prosodyAttrs += ` rate="${rate}"`
      if (pitch) prosodyAttrs += ` pitch="${pitch}"`
      if (volume) prosodyAttrs += ` volume="${volume}"`

      if (prosodyAttrs) {
        ssml = `<prosody${prosodyAttrs}>${ssml}</prosody>`
      }
    }

    return ssml
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel()
    }
    this.currentUtterance = null
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause()
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume()
    }
  }

  /**
   * Check if TTS is speaking
   */
  isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }

  /**
   * Check if TTS is paused
   */
  isPaused(): boolean {
    return this.synth?.paused ?? false
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return []

    const voices = this.synth.getVoices()
    return voices.filter((voice) => voice.lang.startsWith('pt'))
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config }
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getStats()
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.synth) return false

      // Try to get voices
      const voices = this.getAvailableVoices()
      return voices.length > 0
    } catch {
      return false
    }
  }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

let ttsServiceInstance: TextToSpeechService | null = null

/**
 * Get singleton TTS service instance
 */
export function getTTSService(config?: Partial<TTSConfig>): TextToSpeechService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TextToSpeechService(config)
  } else if (config) {
    ttsServiceInstance.updateConfig(config)
  }

  return ttsServiceInstance
}

/**
 * Create new TTS service instance
 */
export function createTTSService(config?: Partial<TTSConfig>): TextToSpeechService {
  return new TextToSpeechService(config)
}

// ============================================================================
// Quick Speak Utilities
// ============================================================================

/**
 * Quick speak without creating service instance
 */
export async function quickSpeak(text: string, options?: SSMLOptions): Promise<TTSResponse> {
  const service = getTTSService()
  return service.speak(text, options)
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  const service = getTTSService()
  service.stop()
}

// ============================================================================
// Exports
// ============================================================================

export { AudioCache }
export type { CacheEntry }

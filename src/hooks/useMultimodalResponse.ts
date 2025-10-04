/**
 * Multimodal Response Hook
 * 
 * Story: 01.03 - Respostas Multimodais
 * 
 * Orchestrates multimodal responses:
 * - Text formatting
 * - TTS playback
 * - Visual feedback
 * - Performance tracking
 * - Error handling
 * 
 * @module hooks/useMultimodalResponse
 */

import { useState, useCallback, useRef } from 'react'
import { createTTSService, type TTSConfig } from '@/lib/tts/textToSpeechService'
import { generateResponse, type MultimodalResponse } from '@/lib/templates/responseTemplates'
import { IntentType } from '@/lib/nlu/types'

// ============================================================================
// Types
// ============================================================================

export interface MultimodalConfig {
  ttsEnabled?: boolean
  ttsConfig?: Partial<TTSConfig>
  textOnlyMode?: boolean
  performanceTracking?: boolean
}

export interface ResponseMetrics {
  totalTime: number
  ttsTime?: number
  renderTime: number
  success: boolean
}

export interface UseMultimodalResponseReturn {
  response: MultimodalResponse | null
  isLoading: boolean
  isSpeaking: boolean
  error: string | null
  metrics: ResponseMetrics | null
  generateAndSpeak: (intent: IntentType, data: any) => Promise<void>
  stopSpeaking: () => void
  pauseSpeaking: () => void
  resumeSpeaking: () => void
  clearResponse: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useMultimodalResponse(
  config: MultimodalConfig = {}
): UseMultimodalResponseReturn {
  const {
    ttsEnabled = true,
    ttsConfig = {},
    textOnlyMode = false,
    performanceTracking = true,
  } = config

  // State
  const [response, setResponse] = useState<MultimodalResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<ResponseMetrics | null>(null)

  // Refs
  const ttsServiceRef = useRef(createTTSService(ttsConfig))
  const startTimeRef = useRef<number>(0)

  /**
   * Generate response and speak it
   */
  const generateAndSpeak = useCallback(
    async (intent: IntentType, data: any) => {
      setIsLoading(true)
      setError(null)
      startTimeRef.current = Date.now()

      try {
        // Generate multimodal response
        const generatedResponse = generateResponse(intent, data)
        setResponse(generatedResponse)

        const renderTime = Date.now() - startTimeRef.current

        // Speak if TTS enabled and not in text-only mode
        if (ttsEnabled && !textOnlyMode) {
          setIsSpeaking(true)
          const ttsStartTime = Date.now()

          try {
            await ttsServiceRef.current.speak(generatedResponse.speech)
            const ttsTime = Date.now() - ttsStartTime

            // Track metrics
            if (performanceTracking) {
              const totalTime = Date.now() - startTimeRef.current
              setMetrics({
                totalTime,
                ttsTime,
                renderTime,
                success: true,
              })

              // Log warning if exceeds 800ms target
              if (totalTime > 800) {
                console.warn(`Response time exceeded target: ${totalTime}ms`)
              }
            }
          } catch (ttsError) {
            console.error('TTS error:', ttsError)
            // Continue without TTS - visual response is still available
            setMetrics({
              totalTime: Date.now() - startTimeRef.current,
              renderTime,
              success: true,
            })
          } finally {
            setIsSpeaking(false)
          }
        } else {
          // Text-only mode or TTS disabled
          if (performanceTracking) {
            setMetrics({
              totalTime: renderTime,
              renderTime,
              success: true,
            })
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)

        if (performanceTracking) {
          setMetrics({
            totalTime: Date.now() - startTimeRef.current,
            renderTime: 0,
            success: false,
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    [ttsEnabled, textOnlyMode, performanceTracking]
  )

  /**
   * Stop current speech
   */
  const stopSpeaking = useCallback(() => {
    ttsServiceRef.current.stop()
    setIsSpeaking(false)
  }, [])

  /**
   * Pause current speech
   */
  const pauseSpeaking = useCallback(() => {
    ttsServiceRef.current.pause()
  }, [])

  /**
   * Resume paused speech
   */
  const resumeSpeaking = useCallback(() => {
    ttsServiceRef.current.resume()
  }, [])

  /**
   * Clear current response
   */
  const clearResponse = useCallback(() => {
    setResponse(null)
    setError(null)
    setMetrics(null)
    stopSpeaking()
  }, [stopSpeaking])

  return {
    response,
    isLoading,
    isSpeaking,
    error,
    metrics,
    generateAndSpeak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    clearResponse,
  }
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for text-only mode (accessibility)
 */
export function useTextOnlyResponse() {
  return useMultimodalResponse({
    ttsEnabled: false,
    textOnlyMode: true,
  })
}

/**
 * Hook with performance tracking disabled
 */
export function useQuickResponse() {
  return useMultimodalResponse({
    performanceTracking: false,
  })
}

/**
 * Hook with custom TTS configuration
 */
export function useCustomVoiceResponse(ttsConfig: Partial<TTSConfig>) {
  return useMultimodalResponse({
    ttsConfig,
  })
}


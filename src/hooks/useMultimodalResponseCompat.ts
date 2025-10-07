/**
 * Legacy Compatibility Wrapper for useMultimodalResponse
 *
 * Provides backward compatibility for tests that expect the old interface
 * with generateAndSpeak, response, metrics, and isLoading properties.
 *
 * @deprecated Use useMultimodalResponse directly for new code
 */

import { useCallback, useMemo } from 'react'
import type { IntentType } from '@/lib/nlu/types'
import {
  useMultimodalResponse as useNewMultimodalResponse,
  useResponseMetrics,
} from './useMultimodalResponse'

export interface UseMultimodalResponseCompatOptions {
  ttsEnabled?: boolean // Disable TTS for testing
  enableVoice?: boolean // New interface
  enableVisual?: boolean
  autoSpeak?: boolean
  collectFeedback?: boolean
  onFeedback?: (feedback: any) => void
  onResponse?: (response: any) => void
}

export interface UseMultimodalResponseCompatReturn {
  // Legacy interface
  generateAndSpeak: (intent: IntentType | 'error' | 'confirmation', data: any) => Promise<void>
  response: any
  metrics: any
  isLoading: boolean
  error: string | null

  // New interface (forwarded)
  state: any
  stopSpeaking: () => void
  pauseSpeaking: () => void
  resumeSpeaking: () => void
  repeatResponse: () => Promise<void>
  clearResponse: () => void
  submitFeedback: (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void
  toggleVoice: () => void
  toggleVisual: () => void
}

/**
 * Compatibility wrapper that maps old interface to new interface
 */
export function useMultimodalResponse(
  options: UseMultimodalResponseCompatOptions = {}
): UseMultimodalResponseCompatReturn {
  // Convert legacy options to new interface
  const newOptions = {
    enableVoice: options.ttsEnabled !== false && options.enableVoice !== false,
    enableVisual: options.enableVisual !== false,
    autoSpeak: options.ttsEnabled !== false,
    collectFeedback: options.collectFeedback !== false,
    onFeedback: options.onFeedback,
    onResponse: options.onResponse,
  }

  // Use the new hook
  const newHook = useNewMultimodalResponse(newOptions)
  const metricsHook = useResponseMetrics()

  // Legacy compatibility layer
  const generateAndSpeak = useCallback(
    async (intent: IntentType | 'error' | 'confirmation', data: any) => {
      await newHook.sendResponse(intent, data)
    },
    [newHook.sendResponse]
  )

  const response = useMemo(() => newHook.state.currentResponse, [newHook.state.currentResponse])
  const isLoading = useMemo(() => newHook.state.isLoading, [newHook.state.isLoading])
  const error = useMemo(() => newHook.state.error, [newHook.state.error])

  return {
    // Legacy interface
    generateAndSpeak,
    response,
    metrics: metricsHook.metrics,
    isLoading,
    error,

    // Forward new interface
    state: newHook.state,
    stopSpeaking: newHook.stopSpeaking,
    pauseSpeaking: newHook.pauseSpeaking,
    resumeSpeaking: newHook.resumeSpeaking,
    repeatResponse: newHook.repeatResponse,
    clearResponse: newHook.clearResponse,
    submitFeedback: newHook.submitFeedback,
    toggleVoice: newHook.toggleVoice,
    toggleVisual: newHook.toggleVisual,
  }
}

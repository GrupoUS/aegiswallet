import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getVoiceService,
  VOICE_FEEDBACK,
  type VoiceRecognitionResult,
} from '@/services/voiceService'

export interface UseVoiceCommandOptions {
  autoNavigate?: boolean
  onCommandDetected?: (result: VoiceRecognitionResult) => void
  onError?: (error: Error) => void
  enableFeedback?: boolean
}

export interface UseVoiceCommandReturn {
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  lastTranscript: string | null
  lastCommand: string | null
}

/**
 * Custom hook for voice command integration
 * Provides voice recognition and text-to-speech capabilities
 */
export function useVoiceCommand(options: UseVoiceCommandOptions = {}): UseVoiceCommandReturn {
  const { autoNavigate = true, onCommandDetected, onError, enableFeedback = true } = options

  const navigate = useNavigate()
  const [isListening, setIsListening] = useState(false)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  const voiceService = getVoiceService()
  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  /**
   * Handle voice recognition result
   */
  const handleResult = useCallback(
    (result: VoiceRecognitionResult) => {
      setLastTranscript(result.transcript)
      setIsListening(false)

      // Show transcript in toast
      if (enableFeedback) {
        toast.info(`Você disse: "${result.transcript}"`, {
          duration: 3000,
        })
      }

      // If command detected
      if (result.command && result.intent) {
        setLastCommand(result.command)

        // Notify callback
        onCommandDetected?.(result)

        // Auto-navigate if enabled
        if (autoNavigate) {
          const destination = getDestinationName(result.intent)

          if (enableFeedback) {
            toast.success(VOICE_FEEDBACK.NAVIGATING(destination), {
              duration: 2000,
            })
          }

          // Navigate after a short delay for feedback
          setTimeout(() => {
            navigate({ to: result.intent as any })
          }, 500)
        }
      } else {
        // No command detected
        if (enableFeedback) {
          toast.error(VOICE_FEEDBACK.ERROR, {
            duration: 3000,
          })
        }
      }
    },
    [navigate, autoNavigate, onCommandDetected, enableFeedback]
  )

  /**
   * Handle voice recognition error
   */
  const handleError = useCallback(
    (error: Error) => {
      setIsListening(false)
      console.error('Voice recognition error:', error)

      if (enableFeedback) {
        toast.error(`Erro: ${error.message}`, {
          duration: 3000,
        })
      }

      onError?.(error)
    },
    [onError, enableFeedback]
  )

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      if (enableFeedback) {
        toast.error(VOICE_FEEDBACK.NOT_SUPPORTED, {
          duration: 3000,
        })
      }
      return
    }

    if (isListening) {
      return
    }

    setIsListening(true)

    if (enableFeedback) {
      toast.info(VOICE_FEEDBACK.LISTENING, {
        duration: 2000,
      })
    }

    voiceService.startListening(handleResult, handleError)
  }, [isSupported, isListening, voiceService, handleResult, handleError, enableFeedback])

  /**
   * Stop listening for voice commands
   */
  const stopListening = useCallback(() => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
    }
  }, [isListening, voiceService])

  /**
   * Speak text using text-to-speech
   */
  const speak = useCallback(
    async (text: string) => {
      try {
        await voiceService.speak(text)
      } catch (error) {
        console.error('Speech synthesis error:', error)
        if (enableFeedback) {
          toast.error('Erro ao falar', {
            duration: 2000,
          })
        }
      }
    },
    [voiceService, enableFeedback]
  )

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isListening) {
        voiceService.stopListening()
      }
    }
  }, [isListening, voiceService])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    speak,
    lastTranscript,
    lastCommand,
  }
}

/**
 * Get user-friendly destination name
 */
function getDestinationName(path: string): string {
  const names: Record<string, string> = {
    '/saldo': 'Saldo',
    '/orcamento': 'Orçamento',
    '/contas': 'Contas',
    '/pix': 'PIX',
    '/dashboard': 'Dashboard',
    '/transactions': 'Transações',
  }
  return names[path] || path
}

/**
 * Hook for voice feedback only (no navigation)
 */
export function useVoiceFeedback() {
  const voiceService = getVoiceService()

  const speak = useCallback(
    async (text: string) => {
      try {
        await voiceService.speak(text)
      } catch (error) {
        console.error('Speech synthesis error:', error)
      }
    },
    [voiceService]
  )

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking()
  }, [voiceService])

  return {
    speak,
    stopSpeaking,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}

export default useVoiceCommand

import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioProcessor } from '@/lib/stt/audioProcessor'
import { createSTTService, type STTResult } from '@/lib/stt/speechToTextService'
import { createVAD, type VoiceActivityDetector } from '@/lib/stt/voiceActivityDetection'

// Voice recognition state interface
interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  confidence: number
  error: string | null
  supported: boolean
  processingTimeMs?: number
}

// Voice command interface
interface VoiceCommand {
  command: string
  parameters: Record<string, any>
  confidence: number
}

// Brazilian Portuguese voice commands patterns
const VOICE_COMMANDS = {
  BALANCE: [
    'qual é o meu saldo',
    'quanto tenho na conta',
    'meu saldo',
    'ver saldo',
    'saldo da conta',
  ],
  TRANSFER: ['transferir para', 'enviar para', 'pagar para'],
} as const

export function useVoiceRecognition(options: {
  onTranscript?: (transcript: string, confidence: number) => void
  onCommand?: (command: VoiceCommand) => void
  onError?: (error: string) => void
  autoRestart?: boolean
  maxDuration?: number
}) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    supported: false,
  })

  const recognitionRef = useRef<any>(null)
  const audioProcessorRef = useRef<any>(null)
  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced voice command processing with performance optimizations
  const processVoiceCommand = useCallback(
    (transcript: string, confidence: number) => {
      const startTime = performance.now()

      const normalizedTranscript = transcript.toLowerCase().trim()

      // Simple command matching for Brazilian Portuguese
      for (const [intent, patterns] of Object.entries(VOICE_COMMANDS)) {
        for (const pattern of patterns) {
          if (normalizedTranscript.includes(pattern)) {
            const command: VoiceCommand = {
              command: intent,
              parameters: { transcript, originalTranscript: transcript },
              confidence,
            }

            const processingTime = performance.now() - startTime
            command.parameters.processingTime = processingTime

            options.onCommand?.(command)
            return
          }
        }
      }

      // If no specific command matched, send as generic transcript
      options.onTranscript?.(transcript, confidence)
    },
    [options]
  )

  // Start listening with performance optimizations
  const startListening = useCallback(async () => {
    if (state.isListening || state.isProcessing) return

    const startTime = performance.now()

    try {
      setState((prev) => ({ ...prev, isListening: true, error: null }))

      // Initialize VAD for better performance
      if (!vadRef.current) {
        vadRef.current = createVAD({
          threshold: 0.5,
          minSpeechDuration: 0.3,
          maxSpeechDuration: 5.0,
        })
      }

      // Initialize audio processor with optimizations
      if (!audioProcessorRef.current) {
        audioProcessorRef.current = createAudioProcessor({
          sampleRate: 16000,
          channels: 1,
          bufferSize: 4096,
          maxDuration: options.maxDuration || 10000, // 10s max instead of 30s
        })
      }

      // Initialize STT service with optimized settings
      const sttService = createSTTService({
        language: 'pt-BR',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
      })

      // Start speech recognition with timeout
      const recognition = await sttService.startRecognition({
        onResult: (result: STTResult) => {
          const processingTime = performance.now() - startTime

          setState((prev) => ({
            ...prev,
            transcript: result.transcript,
            confidence: result.confidence,
            processingTimeMs: processingTime,
          }))

          if (result.isFinal && result.confidence > 0.7) {
            processVoiceCommand(result.transcript, result.confidence)
            if (options.autoRestart) {
              setTimeout(() => startListening(), 1000)
            } else {
              stopListening()
            }
          }
        },
        onError: (error: string) => {
          setState((prev) => ({
            ...prev,
            error,
            isListening: false,
            isProcessing: false,
          }))
          options.onError?.(error)
        },
        onStart: () => {
          const initTime = performance.now() - startTime
          setState((prev) => ({ ...prev, processingTimeMs: initTime }))
        },
        onEnd: () => {
          if (options.autoRestart && !state.isProcessing) {
            setTimeout(() => startListening(), 500)
          } else {
            setState((prev) => ({ ...prev, isListening: false, isProcessing: false }))
          }
        },
      })

      recognitionRef.current = recognition

      // Set timeout for auto-stop (reduced from 10s to 3s)
      timeoutRef.current = setTimeout(() => {
        if (state.isListening) {
          stopListening()
        }
      }, 3000)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recognition',
        isListening: false,
        isProcessing: false,
      }))
      options.onError?.(error instanceof Error ? error.message : 'Failed to start recognition')
    }
  }, [state.isListening, state.isProcessing, options, processVoiceCommand])

  // Stop listening with proper cleanup
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.cleanup()
      audioProcessorRef.current = null
    }

    if (vadRef.current) {
      vadRef.current = null
    }

    setState((prev) => ({
      ...prev,
      isListening: false,
      isProcessing: false,
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  // Check browser support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      setState((prev) => ({ ...prev, supported }))
    }

    checkSupport()
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening: () => (state.isListening ? stopListening() : startListening()),
  }
}

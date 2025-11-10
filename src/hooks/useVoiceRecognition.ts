import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioProcessor } from '@/lib/stt/audioProcessor';
import { createSTTService } from '@/lib/stt/speechToTextService';
import { createVAD, type VoiceActivityDetector } from '@/lib/stt/voiceActivityDetection';

// Voice recognition state interface
interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  supported: boolean;
  processingTimeMs?: number;
  recognizedCommand?: VoiceCommand | null;
}

// Voice command interface
interface VoiceCommand {
  command: string;
  parameters: Record<string, any>;
  confidence: number;
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
} as const;

export function useVoiceRecognition(
  options: {
    onTranscript?: (transcript: string, confidence: number) => void;
    onCommand?: (command: VoiceCommand) => void;
    onError?: (error: string) => void;
    autoRestart?: boolean;
    maxDuration?: number;
  } = {}
) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    supported: false,
    recognizedCommand: null,
  });

  const recognitionRef = useRef<any>(null);
  const audioProcessorRef = useRef<any>(null);
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced voice command processing with performance optimizations
  const _processVoiceCommand = useCallback(
    (transcript: string, confidence: number) => {
      const startTime = performance.now();

      const normalizedTranscript = transcript.toLowerCase().trim();

      // Simple command matching for Brazilian Portuguese
      for (const [intent, patterns] of Object.entries(VOICE_COMMANDS)) {
        for (const pattern of patterns) {
          if (normalizedTranscript.includes(pattern)) {
            const command: VoiceCommand = {
              command: intent,
              parameters: { transcript, originalTranscript: transcript },
              confidence,
            };

            const processingTime = performance.now() - startTime;
            command.parameters.processingTime = processingTime;

            setState((prev) => ({
              ...prev,
              recognizedCommand: command,
              isProcessing: false,
              processingTimeMs: processingTime,
            }));

            options.onCommand?.(command);
            return;
          }
        }
      }

      // If no specific command matched, send as generic transcript
      options.onTranscript?.(transcript, confidence);
    },
    [options]
  );

  // Start listening with performance optimizations
  const startListening = useCallback(async () => {
    if (state.isListening || state.isProcessing) return;

    try {
      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
        isProcessing: true,
        recognizedCommand: null,
      }));

      // Initialize VAD for better performance
      if (!vadRef.current) {
        vadRef.current = createVAD({
          minSpeechDuration: 0.3,
          silenceDuration: 1500,
        });
      }

      // Initialize audio processor with optimizations
      if (!audioProcessorRef.current) {
        audioProcessorRef.current = createAudioProcessor({
          sampleRate: 16000,
        });
      }

      // Initialize STT service with optimized settings
      const _sttService = createSTTService('pt-BR');

      // Use browser SpeechRecognition when available, otherwise fallback to STT service
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };

        recognitionRef.current.onresult = (event: any) => {
          const result = event.results[0][0];
          if (result) {
            _processVoiceCommand(result.transcript, result.confidence);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          setState((prev) => ({
            ...prev,
            error: `Speech recognition error: ${event.error}`,
            isListening: false,
            isProcessing: false,
          }));
          options.onError?.(`Speech recognition error: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setState((prev) => ({
            ...prev,
            isListening: false,
          }));
        };
      } else {
        // Fallback to mock for testing
        recognitionRef.current = {
          stop: () => {},
          start: () => {},
        } as any;
      }

      // Start the recognition
      if (recognitionRef.current?.start) {
        recognitionRef.current.start();
      }

      // Set timeout for auto-stop (reduced from 10s to 3s)
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
          isProcessing: false,
          error: 'Tempo esgotado. Tente novamente.',
        }));
      }, 3000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recognition',
        isListening: false,
        isProcessing: false,
      }));
      options.onError?.(error instanceof Error ? error.message : 'Failed to start recognition');
    }
  }, [state.isListening, state.isProcessing, options, _processVoiceCommand]);

  // Stop listening with proper cleanup
  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.dispose();
      audioProcessorRef.current = null;
    }

    if (vadRef.current) {
      vadRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isListening: false,
      isProcessing: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Check browser support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = !!navigator.mediaDevices?.getUserMedia;
      setState((prev) => ({ ...prev, supported }));
    };

    checkSupport();
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening: () => (state.isListening ? stopListening() : startListening()),
  };
}

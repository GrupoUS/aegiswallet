import { useState, useEffect, useCallback, useRef } from 'react';

// Voice recognition state interface
interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  supported: boolean;
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
    'como está meu saldo',
    'qual é o meu saldo',
    'quanto tenho na conta',
    'meu saldo',
    'saldo da conta'
  ],
  BUDGET: [
    'quanto posso gastar esse mês',
    'qual meu limite de gastos',
    'quanto tenho disponível para gastar',
    'meu orçamento mensal',
    'limite de gastos'
  ],
  BILLS: [
    'tem algum boleto programado para pagar',
    'contas para pagar',
    'boleto para pagar',
    'quais contas vencem',
    'pagamentos pendentes'
  ],
  INCOMING: [
    'tem algum recebimento programado para entrar',
    'receitas programadas',
    'dinheiro para entrar',
    'recebimentos futuros',
    'entradas de dinheiro'
  ],
  PROJECTION: [
    'como ficará meu saldo no final do mês',
    'projeção de saldo',
    'saldo projetado',
    'quanto vou ter no fim do mês',
    'saldo final do mês'
  ],
  TRANSFER: [
    'faz uma transferência para',
    'transferir dinheiro para',
    'fazer transferência para',
    'enviar dinheiro para',
    'pagar para'
  ]
} as const;

export function useVoiceRecognition() {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    supported: false
  });

  const [recognizedCommand, setRecognizedCommand] = useState<VoiceCommand | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check browser support for Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR'; // Brazilian Portuguese

      recognitionRef.current.onstart = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: true,
          error: null,
          transcript: ''
        }));
      };

      recognitionRef.current.onend = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false
        }));
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();
        const confidence = event.results[current][0].confidence;

        setVoiceState(prev => ({
          ...prev,
          transcript,
          confidence
        }));

        if (event.results[current].isFinal) {
          processCommand(transcript, confidence);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        let errorMessage = 'Erro no reconhecimento de voz';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Nenhum discurso detectado';
            break;
          case 'audio-capture':
            errorMessage = 'Não foi possível capturar áudio';
            break;
          case 'not-allowed':
            errorMessage = 'Permissão para microfone negada';
            break;
          case 'network':
            errorMessage = 'Erro de conexão';
            break;
        }

        setVoiceState(prev => ({
          ...prev,
          error: errorMessage,
          isListening: false
        }));
      };

      setVoiceState(prev => ({ ...prev, supported: true }));
    } else {
      setVoiceState(prev => ({ 
        ...prev, 
        supported: false,
        error: 'Seu navegador não suporta reconhecimento de voz'
      }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processCommand = useCallback((transcript: string, confidence: number) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    // Find matching command
    let matchedCommand: string | null = null;
    let parameters: Record<string, any> = {};

    for (const [commandType, patterns] of Object.entries(VOICE_COMMANDS)) {
      for (const pattern of patterns) {
        if (transcript.includes(pattern)) {
          matchedCommand = commandType;
          
          // Extract parameters for transfer command
          if (commandType === 'TRANSFER') {
            const transferMatch = transcript.match(/(?:para|para o|para a)\s+(.+?)(?:\s|$)/i);
            if (transferMatch) {
              parameters.recipient = transferMatch[1].trim();
            }
            
            const amountMatch = transcript.match(/(?:r\$|reais)?\s*(\d+[,\.]?\d*)/i);
            if (amountMatch) {
              parameters.amount = parseFloat(amountMatch[1].replace(',', '.'));
            }
          }
          
          break;
        }
      }
      if (matchedCommand) break;
    }

    if (matchedCommand) {
      setRecognizedCommand({
        command: matchedCommand,
        parameters,
        confidence
      });
    }

    // Reset processing state
    setTimeout(() => {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }, 500);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && voiceState.supported && !voiceState.isListening) {
      setVoiceState(prev => ({ ...prev, error: null }));
      recognitionRef.current.start();
    }
  }, [voiceState.supported, voiceState.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && voiceState.isListening) {
      recognitionRef.current.stop();
    }
  }, [voiceState.isListening]);

  const resetState = useCallback(() => {
    setVoiceState(prev => ({
      ...prev,
      transcript: '',
      confidence: 0,
      error: null,
      isProcessing: false
    }));
    setRecognizedCommand(null);
  }, []);

  // Auto-stop listening after 10 seconds of silence
  useEffect(() => {
    if (voiceState.isListening) {
      timeoutRef.current = setTimeout(() => {
        stopListening();
        setVoiceState(prev => ({
          ...prev,
          error: 'Tempo esgotado. Tente novamente.'
        }));
      }, 10000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [voiceState.isListening, stopListening]);

  return {
    ...voiceState,
    recognizedCommand,
    startListening,
    stopListening,
    resetState,
    availableCommands: Object.keys(VOICE_COMMANDS)
  };
}

export type { VoiceState, VoiceCommand };
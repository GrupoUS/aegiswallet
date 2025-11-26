import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccessibility } from '../AccessibilityProvider';

// Web Speech API types for browser compatibility
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

// Web Speech API type - use a more permissive interface for browser compatibility
interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

// Alias for compatibility - using BrowserSpeechRecognition directly
type SpeechRecognitionInstance = BrowserSpeechRecognition;

type VoiceCategory = 'financeiro' | 'navegacao' | 'acao' | 'ajuda';

export interface VoiceCommand {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  confidence: number;
  category: VoiceCategory;
}

const VOICE_PATTERNS: Record<
  string,
  { category: VoiceCategory; pattern: RegExp; response: string }[]
> = {
  acoes: [
    { category: 'ajuda', pattern: /ajuda/i, response: 'Modo de ajuda ativado' },
    { category: 'acao', pattern: /cancelar/i, response: 'Operação cancelada' },
    { category: 'acao', pattern: /confirmar/i, response: 'Operação confirmada' },
    { category: 'acao', pattern: /salvar/i, response: 'Informações salvas com sucesso' },
    { category: 'acao', pattern: /editar/i, response: 'Modo de edição ativado' },
    { category: 'acao', pattern: /excluir/i, response: 'Confirmar exclusão' },
  ],
  financas: [
    { category: 'financeiro', pattern: /transferir.*reais?/i, response: 'Iniciando transferência' },
    { category: 'financeiro', pattern: /pagar conta/i, response: 'Abrindo opções de pagamento' },
    { category: 'financeiro', pattern: /ver saldo/i, response: 'Verificando saldo da conta' },
    {
      category: 'financeiro',
      pattern: /consultar.*extrato/i,
      response: 'Buscando extrato bancário',
    },
    {
      category: 'financeiro',
      pattern: /gerar.*pix/i,
      response: 'Preparando geração de código PIX',
    },
    {
      category: 'financeiro',
      pattern: /agendar.*pagamento/i,
      response: 'Abrindo agenda de pagamentos',
    },
  ],
  navegacao: [
    {
      category: 'navegacao',
      pattern: /ir para.*inicio/i,
      response: 'Navegando para página inicial',
    },
    { category: 'navegacao', pattern: /abrir.*menu/i, response: 'Abrindo menu de navegação' },
    { category: 'navegacao', pattern: /fechar.*menu/i, response: 'Fechando menu de navegação' },
    { category: 'navegacao', pattern: /voltar/i, response: 'Voltando para página anterior' },
    {
      category: 'navegacao',
      pattern: /próximo|proximo/i,
      response: 'Avançando para próxima página',
    },
  ],
};

interface HookParams {
  enabled: boolean;
  onVoiceCommand?: (command: string, confidence: number) => void;
}

export const usePortugueseVoiceAccessibility = ({ enabled, onVoiceCommand }: HookParams) => {
  const { announceToScreenReader, settings } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [lastResponse, setLastResponse] = useState('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  const getErrorMessage = useCallback((error: string): string => {
    const errorMessages: Record<string, string> = {
      'audio-capture': 'Erro ao acessar o microfone. Verifique as permissões.',
      network: 'Erro de conexão. Verifique sua internet.',
      'no-speech': 'Não foi possível detectar fala. Tente novamente.',
      'not-allowed': 'Acesso ao microfone negado. Permita o acesso nas configurações.',
      'service-not-allowed': 'Serviço de reconhecimento de voz não disponível.',
    };

    return errorMessages[error] || 'Erro no reconhecimento de voz. Tente novamente.';
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!synthesisRef.current) {
      return;
    }

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthesisRef.current.getVoices();
    const brazilianVoice = voices.find(
      (voice) => voice.lang === 'pt-BR' || voice.name.includes('Brazil')
    );
    if (brazilianVoice) {
      utterance.voice = brazilianVoice;
    }

    synthesisRef.current.speak(utterance);
  }, []);

  const processVoiceCommand = useCallback(
    (command: string, confidence: number) => {
      const trimmedCommand = command.trim().toLowerCase();
      let response = 'Comando não reconhecido';
      let category: VoiceCategory = 'acao';

      Object.values(VOICE_PATTERNS).some((patterns) =>
        patterns.some((pattern) => {
          const matched = pattern.pattern.test(trimmedCommand);
          if (matched) {
            response = pattern.response;
            category = pattern.category;
          }
          return matched;
        })
      );

      const voiceCommand: VoiceCommand = {
        category,
        command: trimmedCommand,
        confidence,
        id: Date.now().toString(),
        response,
        timestamp: new Date(),
      };

      setVoiceCommands((prev) => [voiceCommand, ...prev].slice(0, 10));
      setLastResponse(response);

      announceToScreenReader(response, 'assertive');

      if (settings.voiceNavigation && synthesisRef.current) {
        speakResponse(response);
      }

      onVoiceCommand?.(trimmedCommand, confidence);
      setIsProcessing(false);
    },
    [announceToScreenReader, onVoiceCommand, settings.voiceNavigation, speakResponse]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      announceToScreenReader('Microfone ativado. Fale seu comando em português.');
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const currentResult = event.results[current];
      const capturedTranscript = currentResult[0].transcript;
      const confidence = currentResult[0].confidence ?? 0;

      setTranscript(capturedTranscript);

      if (currentResult.isFinal) {
        setIsProcessing(true);
        processVoiceCommand(capturedTranscript, confidence);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setIsProcessing(false);
      const errorMessage = getErrorMessage(event.error);
      announceToScreenReader(errorMessage, 'assertive');
      setLastResponse(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition as unknown as BrowserSpeechRecognition;
    synthesisRef.current = window.speechSynthesis;

    return () => {
      recognition.stop();
      synthesisRef.current?.cancel();
    };
  }, [announceToScreenReader, enabled, getErrorMessage, processVoiceCommand]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const clearCommands = useCallback(() => {
    setVoiceCommands([]);
    setLastResponse('');
    announceToScreenReader('Histórico de comandos limpo');
  }, [announceToScreenReader]);

  const suggestions = useMemo(
    () => [
      'Transferir R$ 100 para João',
      'Pagar conta de luz',
      'Ver meu saldo',
      'Ir para página inicial',
      'Ajuda',
    ],
    []
  );

  return {
    announceToScreenReader,
    clearCommands,
    isListening,
    isProcessing,
    lastResponse,
    settings,
    suggestions,
    toggleListening,
    transcript,
    voiceCommands,
  };
};

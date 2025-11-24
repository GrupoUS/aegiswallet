import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePortugueseVoiceAccessibility } from './hooks/usePortugueseVoiceAccessibility';
import type { VoiceCommand } from './hooks/usePortugueseVoiceAccessibility';

interface PortugueseVoiceAccessibilityProps {
  onVoiceCommand?: (command: string, confidence: number) => void;
  enabled?: boolean;
}

type VoiceStatusProps = {
  isListening: boolean;
  isProcessing: boolean;
  lastResponse: string;
  transcript: string;
  suggestions: string[];
  toggleListening: () => void;
  voiceNavigationEnabled: boolean;
};

type VoiceHistoryProps = {
  commands: VoiceCommand[];
  onClear: () => void;
};

type PortugueseVoiceAccessibilityComponent = React.FC<PortugueseVoiceAccessibilityProps>;

const VoiceStatusCard: React.FC<VoiceStatusProps> = ({
  isListening,
  isProcessing,
  lastResponse,
  transcript,
  suggestions,
  toggleListening,
  voiceNavigationEnabled,
}) => (
  <Card className="w-full max-w-md" variant="glass">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Button
          size="sm"
          variant={isListening ? 'destructive' : 'default'}
          className="h-10 w-10 rounded-full"
          onClick={toggleListening}
          disabled={isProcessing}
          aria-label={isListening ? 'Parar reconhecimento de voz' : 'Iniciar reconhecimento de voz'}
          aria-live="polite"
          aria-busy={isProcessing}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        Assistente por Voz
        {isProcessing && (
          <Badge variant="secondary" className="ml-2">
            Processando...
          </Badge>
        )}
        {voiceNavigationEnabled && (
          <Badge variant="outline" className="ml-2">
            <Volume2 className="h-3 w-3 mr-1" />
            Voz Ativa
          </Badge>
        )}
      </CardTitle>
      <CardDescription>
        Comandos em português com retorno auditivo e suporte a leitores de tela
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {transcript && (
        <section className="space-y-2">
          <h4 className="font-medium text-sm">Comando:</h4>
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-sm">{transcript}</p>
          </div>
        </section>
      )}
      {lastResponse && (
        <section className="space-y-2">
          <h4 className="font-medium text-sm">Resposta:</h4>
          <div className="rounded-md border bg-primary/5 p-3">
            <p className="text-sm">{lastResponse}</p>
          </div>
        </section>
      )}
      {!transcript && !lastResponse && !isProcessing && (
        <section className="py-6 text-center text-muted-foreground">
          <Mic className="mx-auto mb-2 h-10 w-10 opacity-40" aria-hidden />
          <p className="text-sm">Clique no microfone para comandar por voz em português</p>
          <div className="mt-4 text-xs">
            <p className="font-medium">Comandos disponíveis:</p>
            <ul className="mt-2 space-y-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </CardContent>
  </Card>
);

const VoiceHistoryCard: React.FC<VoiceHistoryProps> = ({ commands, onClear }) => {
  if (commands.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mt-4" variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Histórico de Comandos</CardTitle>
          <Button size="sm" variant="outline" onClick={onClear}>
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {commands.map((cmd) => (
            <article key={cmd.id} className="space-y-2 rounded-lg border p-3">
              <header className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {cmd.timestamp.toLocaleTimeString('pt-BR')}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {cmd.category}
                  </Badge>
                  {cmd.confidence >= 0.8 ? (
                    <Volume2 className="h-3 w-3 text-green-500" aria-label="Alta confiança" />
                  ) : (
                    <VolumeX className="h-3 w-3 text-yellow-500" aria-label="Confiança moderada" />
                  )}
                </div>
              </header>
              <div className="space-y-1">
                <p className="font-medium text-sm">Comando:</p>
                <p className="text-muted-foreground text-sm">{cmd.command}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Resposta:</p>
                <p className="text-muted-foreground text-sm">{cmd.response}</p>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const PortugueseVoiceAccessibility: PortugueseVoiceAccessibilityComponent = ({
  onVoiceCommand,
  enabled = true,
}) => {
  const {
    clearCommands,
    isListening,
    isProcessing,
    lastResponse,
    settings,
    suggestions,
    toggleListening,
    transcript,
    voiceCommands,
  } = usePortugueseVoiceAccessibility({ enabled, onVoiceCommand });

  if (!enabled) {
    return null;
  }

  return (
    <div className="portuguese-voice-accessibility">
      <VoiceStatusCard
        isListening={isListening}
        isProcessing={isProcessing}
        lastResponse={lastResponse}
        suggestions={suggestions}
        toggleListening={toggleListening}
        transcript={transcript}
        voiceNavigationEnabled={settings.voiceNavigation}
      />
      <VoiceHistoryCard commands={voiceCommands} onClear={clearCommands} />
    </div>
  );
};

export { PortugueseVoiceAccessibility };
export default PortugueseVoiceAccessibility;

/**
 * Portuguese Voice Interface Accessibility Component
 * Supports Brazilian Portuguese voice commands and screen reader integration
 * Complies with WCAG 2.1 AA and Brazilian e-MAG standards
 */
export function PortugueseVoiceAccessibility({
  onVoiceCommand,
  enabled = true,
}: PortugueseVoiceAccessibilityProps) {
  const { announceToScreenReader, settings } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [lastResponse, setLastResponse] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a Brazilian Portuguese voice if available
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
      let category: VoiceCommand['category'] = 'acao';

      // Check command patterns
      for (const [_categoryName, patterns] of Object.entries(voicePatterns)) {
        for (const pattern of patterns) {
          if (pattern.pattern.test(trimmedCommand)) {
            response = pattern.response;
            category = pattern.category;
            break;
          }
        }
        if (response !== 'Comando não reconhecido') {
          break;
        }
      }

      const voiceCommand: VoiceCommand = {
        category,
        command: trimmedCommand,
        confidence,
        id: Date.now().toString(),
        response,
        timestamp: new Date(),
      };

      setVoiceCommands((prev) => [voiceCommand, ...prev].slice(0, 10)); // Keep last 10 commands
      setLastResponse(response);

      // Announce response to screen reader
      announceToScreenReader(response, 'assertive');

      // Speak response if voice navigation is enabled
      if (settings.voiceNavigation && synthesisRef.current) {
        speakResponse(response);
      }

      // Call external handler if provided
      if (onVoiceCommand) {
        onVoiceCommand(trimmedCommand, confidence);
      }

      setIsProcessing(false);
    },
    [announceToScreenReader, onVoiceCommand, settings.voiceNavigation, speakResponse]
  );

  // Initialize speech recognition for Brazilian Portuguese
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      const transcript = event.results[current][0].transcript;
      const confidence = event.results[current][0].confidence;

      setTranscript(transcript);

      if (event.results[current].isFinal) {
        setIsProcessing(true);
        processVoiceCommand(transcript, confidence || 0);
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

    recognitionRef.current = recognition;

    // Initialize speech synthesis
    synthesisRef.current = window.speechSynthesis;

    return () => {
      recognition.stop();
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [enabled, announceToScreenReader, getErrorMessage, processVoiceCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const clearCommands = () => {
    setVoiceCommands([]);
    setLastResponse('');
    announceToScreenReader('Histórico de comandos limpo');
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="portuguese-voice-accessibility">
      {/* Main voice interface */}
      <Card className="w-full max-w-md" variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Button
              size="sm"
              variant={isListening ? 'destructive' : 'default'}
              className="h-10 w-10 rounded-full"
              onClick={toggleListening}
              disabled={isProcessing}
              aria-label={
                isListening ? 'Parar reconhecimento de voz' : 'Iniciar reconhecimento de voz'
              }
              aria-live="polite"
              aria-busy={isProcessing}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            Assistente por Voz
            {isProcessing && (
              <Badge variant="secondary" className="ml-2">
                Processando...
              </Badge>
            )}
            {settings.voiceNavigation && (
              <Badge variant="outline" className="ml-2">
                <Volume2 className="h-3 w-3 mr-1" />
                Voz Ativa
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Comando:</h4>
              </div>
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          )}

          {lastResponse && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Resposta:</h4>
              <div className="rounded-md border bg-primary/5 p-3">
                <p className="text-sm">{lastResponse}</p>
              </div>
            </div>
          )}

          {!transcript && !lastResponse && !isProcessing && (
            <div className="py-8 text-center text-muted-foreground">
              <Mic className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="text-sm">Clique no microfone para comandar por voz em português</p>
              <div className="mt-4 text-xs">
                <p className="font-medium">Comandos disponíveis:</p>
                <ul className="mt-2 space-y-1">
                  <li>• "Transferir R$ 100 para João"</li>
                  <li>• "Pagar conta de luz"</li>
                  <li>• "Ver meu saldo"</li>
                  <li>• "Ir para página inicial"</li>
                  <li>• "Ajuda"</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command history */}
      {voiceCommands.length > 0 && (
        <Card className="w-full max-w-md mt-4" variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Histórico de Comandos</CardTitle>
              <Button size="sm" variant="outline" onClick={clearCommands}>
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {voiceCommands.map((cmd) => (
                <div key={cmd.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {cmd.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {cmd.category}
                      </Badge>
                      {cmd.confidence >= 0.8 ? (
                        <Volume2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <VolumeX className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Comando:</p>
                    <p className="text-muted-foreground text-sm">{cmd.command}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Resposta:</p>
                    <p className="text-muted-foreground text-sm">{cmd.response}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

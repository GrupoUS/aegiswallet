import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VoiceCommand } from './hooks/usePortugueseVoiceAccessibility';
import { usePortugueseVoiceAccessibility } from './hooks/usePortugueseVoiceAccessibility';

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

/**
 * Portuguese Voice Interface Accessibility Component
 * Supports Brazilian Portuguese voice commands and screen reader integration
 * Complies with WCAG 2.1 AA and Brazilian e-MAG standards
 */
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

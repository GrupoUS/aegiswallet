import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Voice Interface Component
export const VoiceInterface = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    isListening?: boolean;
    isProcessing?: boolean;
    transcript?: string;
    response?: string;
    onStartListening?: () => void;
    onStopListening?: () => void;
    onClearTranscript?: () => void;
  }
>(
  (
    {
      className,
      isListening = false,
      isProcessing = false,
      transcript = '',
      response = '',
      onStartListening,
      onStopListening,
      onClearTranscript,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-4', className)} {...props}>
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="relative">
                <Button
                  size="sm"
                  variant={isListening ? 'destructive' : 'default'}
                  className="h-10 w-10 rounded-full"
                  onClick={isListening ? onStopListening : onStartListening}
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {isListening && (
                  <div className="-inset-1 absolute animate-ping rounded-full border-2 border-primary" />
                )}
              </div>
              Assistente de Voz
              {isProcessing && (
                <Badge variant="secondary" className="ml-2">
                  Processando...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transcript && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Transcrição</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearTranscript}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/50 p-3">
                  <p className="text-sm">{transcript}</p>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Resposta</h4>
                <div className="rounded-md border bg-primary/5 p-3">
                  <p className="text-sm">{response}</p>
                </div>
              </div>
            )}

            {!transcript && !response && (
              <div className="py-8 text-center text-muted-foreground">
                <Mic className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">
                  Clique no microfone para começar a usar o assistente de voz
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);
VoiceInterface.displayName = 'VoiceInterface';

// Voice Indicator Component
export const VoiceIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    isActive?: boolean;
    isMuted?: boolean;
    volume?: number;
  }
>(({ className, isActive = false, isMuted = false, volume = 0, ...props }, ref) => {
  // Mark volume as intentionally unused
  void volume;

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-full border p-2 transition-colors',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/20 bg-muted text-muted-foreground',
        className
      )}
      {...props}
    >
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {isActive && !isMuted && (
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 animate-pulse rounded-full bg-current" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-current delay-75" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-current delay-150" />
        </div>
      )}
    </div>
  );
});
VoiceIndicator.displayName = 'VoiceIndicator';

// Voice Dashboard Component
export const VoiceDashboard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    commands?: Array<{
      id: string;
      command: string;
      response: string;
      timestamp: Date;
    }>;
    isListening?: boolean;
    onClearHistory?: () => void;
  }
>(({ className, commands = [], isListening = false, onClearHistory, ...props }, ref) => {
  // Mark isListening as intentionally unused
  void isListening;

  return (
    <div ref={ref} className={cn('space-y-4', className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Histórico de Comandos</CardTitle>
            {commands.length > 0 && (
              <Button size="sm" variant="outline" onClick={onClearHistory}>
                Limpar Histórico
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Mic className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="text-sm">Nenhum comando registrado ainda</p>
            </div>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {commands.map((item) => (
                <div key={item.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Voz
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Comando:</p>
                    <p className="text-muted-foreground text-sm">{item.command}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Resposta:</p>
                    <p className="text-muted-foreground text-sm">{item.response}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
VoiceDashboard.displayName = 'VoiceDashboard';

// Voice Response Component
export const VoiceResponse = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    text?: string;
    isSpeaking?: boolean;
    onClose?: () => void;
  }
>(({ className, text = '', isSpeaking = false, onClose, ...props }, ref) => {
  if (!text) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'slide-in-from-bottom-2 fixed right-4 bottom-4 max-w-sm animate-in rounded-lg border bg-background p-4 shadow-lg',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                <div className="h-1 w-1 animate-pulse rounded-full bg-primary delay-75" />
                <div className="h-1 w-1 animate-pulse rounded-full bg-primary delay-150" />
              </div>
            )}
            <span className="font-medium text-sm">Assistente</span>
          </div>
          <p className="text-muted-foreground text-sm">{text}</p>
        </div>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        )}
      </div>
    </div>
  );
});
VoiceResponse.displayName = 'VoiceResponse';

// Loading Components
export const VoiceInterfaceLoader = () => (
  <div className="space-y-4">
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export const VoiceDashboardLoader = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

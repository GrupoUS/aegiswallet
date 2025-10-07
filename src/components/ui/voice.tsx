import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Voice Interface Component
export const VoiceInterface = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    isListening?: boolean
    isProcessing?: boolean
    transcript?: string
    response?: string
    onStartListening?: () => void
    onStopListening?: () => void
    onClearTranscript?: () => void
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
            <CardTitle className="text-lg flex items-center gap-2">
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
                  <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping" />
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
                  <h4 className="text-sm font-medium">Transcrição</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearTranscript}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                </div>
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="text-sm">{transcript}</p>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Resposta</h4>
                <div className="rounded-md border p-3 bg-primary/5">
                  <p className="text-sm">{response}</p>
                </div>
              </div>
            )}

            {!transcript && !response && (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Clique no microfone para começar a usar o assistente de voz
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
)
VoiceInterface.displayName = 'VoiceInterface'

// Voice Indicator Component
export const VoiceIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    isActive?: boolean
    isMuted?: boolean
    volume?: number
  }
>(({ className, isActive = false, isMuted = false, volume = 0, ...props }, ref) => {
  // Mark volume as intentionally unused
  void volume;
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 p-2 rounded-full border transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-muted-foreground border-muted-foreground/20',
        className
      )}
      {...props}
    >
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {isActive && !isMuted && (
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-current animate-pulse" />
          <div className="h-1 w-1 rounded-full bg-current animate-pulse delay-75" />
          <div className="h-1 w-1 rounded-full bg-current animate-pulse delay-150" />
        </div>
      )}
    </div>
  )
})
VoiceIndicator.displayName = 'VoiceIndicator'

// Voice Dashboard Component
export const VoiceDashboard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    commands?: Array<{
      id: string
      command: string
      response: string
      timestamp: Date
    }>
    isListening?: boolean
    onClearHistory?: () => void
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
            <div className="text-center py-8 text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum comando registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {commands.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Voz
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Comando:</p>
                    <p className="text-sm text-muted-foreground">{item.command}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Resposta:</p>
                    <p className="text-sm text-muted-foreground">{item.response}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
VoiceDashboard.displayName = 'VoiceDashboard'

// Voice Response Component
export const VoiceResponse = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    text?: string
    isSpeaking?: boolean
    onClose?: () => void
  }
>(({ className, text = '', isSpeaking = false, onClose, ...props }, ref) => {
  if (!text) return null

  return (
    <div
      ref={ref}
      className={cn(
        'fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border bg-background shadow-lg animate-in slide-in-from-bottom-2',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse delay-75" />
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse delay-150" />
              </div>
            )}
            <span className="text-sm font-medium">Assistente</span>
          </div>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            ×
          </Button>
        )}
      </div>
    </div>
  )
})
VoiceResponse.displayName = 'VoiceResponse'

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
)

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
            <div key={i} className="rounded-lg border p-3 space-y-2">
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
)

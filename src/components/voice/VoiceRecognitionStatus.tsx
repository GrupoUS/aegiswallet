import { AlertCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecognitionStatusProps {
  isListening: boolean;
  isSupported: boolean;
  transcript?: string;
  confidence?: number;
  error?: string;
  className?: string;
}

export function VoiceRecognitionStatus({
  isListening,
  isSupported,
  transcript,
  confidence,
  error,
  className,
}: VoiceRecognitionStatusProps) {
  if (!isSupported) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-red-700 text-sm">
          Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-red-700 text-sm">{error}</span>
      </div>
    );
  }

  if (isListening) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4',
          className
        )}
      >
        <div className="relative">
          <Mic className="h-5 w-5 animate-pulse text-blue-600" />
          <div className="-inset-1 absolute animate-ping rounded-full bg-blue-400/20" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-blue-900 text-sm">{transcript || 'Ouvindo...'}</p>
          {confidence !== undefined && (
            <p className="text-blue-700 text-xs">Confiança: {Math.round(confidence * 100)}%</p>
          )}
        </div>
        <Volume2 className="h-4 w-4 animate-pulse text-blue-500" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-muted/50 p-4', className)}>
      <MicOff className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-muted-foreground text-sm">
          Clique no botão do microfone para começar
        </p>
      </div>
    </div>
  );
}

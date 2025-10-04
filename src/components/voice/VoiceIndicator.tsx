import React from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
  isActive: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function VoiceIndicator({
  isActive,
  isProcessing,
  isSupported,
  transcript,
  error,
  onStart,
  onStop,
  className
}: VoiceIndicatorProps) {
  const getStateColor = () => {
    if (error) return 'bg-red-500';
    if (isProcessing) return 'bg-blue-500';
    if (isActive) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const getStateText = () => {
    if (error) return error;
    if (isProcessing) return 'Processando comando...';
    if (isActive) return 'Ouvindo...';
    return 'Toque para falar';
  };

  const getStateIcon = () => {
    if (isProcessing) return <Loader2 className="w-6 h-6 animate-spin" />;
    if (isActive) return <Volume2 className="w-6 h-6" />;
    return <Mic className="w-6 h-6" />;
  };

  if (!isSupported) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-6", className)}>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <MicOff className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm text-red-600 text-center">
          Seu navegador não suporta reconhecimento de voz
        </p>
        <p className="text-xs text-gray-500 text-center mt-2">
          Use um navegador moderno como Chrome, Edge ou Safari
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* Voice Activation Button */}
      <Button
        onClick={isActive ? onStop : onStart}
        disabled={isProcessing}
        size="lg"
        className={cn(
          "w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95",
          getStateColor(),
          isActive && "animate-pulse ring-4 ring-opacity-30",
          isProcessing && "cursor-not-allowed"
        )}
        variant="ghost"
      >
        <div className="text-white">
          {getStateIcon()}
        </div>
      </Button>

      {/* Status Text */}
      <div className="mt-4 text-center">
        <p className={cn(
          "text-sm font-medium transition-colors",
          error ? "text-red-600" : "text-gray-700"
        )}>
          {getStateText()}
        </p>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg max-w-xs">
          <p className="text-sm text-gray-600 italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Visual Feedback Animation */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full border-4 border-amber-400 animate-ping opacity-20" />
          <div className="w-20 h-20 rounded-full border-4 border-amber-400 animate-ping opacity-20 animation-delay-200" />
        </div>
      )}

      {/* Voice Command Hints */}
      {!isActive && !isProcessing && !error && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Comandos disponíveis:
          </p>
          <div className="flex flex-wrap gap-1 justify-center max-w-xs">
            {[
              'Meu saldo',
              'Orçamento',
              'Contas a pagar',
              'Recebimentos',
              'Projeção',
              'Transferência'
            ].map((hint) => (
              <span
                key={hint}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
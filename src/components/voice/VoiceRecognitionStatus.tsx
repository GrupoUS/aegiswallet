import React from 'react';
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface VoiceRecognitionStatusProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  supported: boolean;
  className?: string;
}

export const VoiceRecognitionStatus: React.FC<VoiceRecognitionStatusProps> = ({
  isListening,
  isProcessing,
  transcript,
  confidence,
  error,
  supported,
  className = '',
}) => {
  if (!supported) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700">
          Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        <span className="text-sm text-blue-700">Processando comando de voz...</span>
      </div>
    );
  }

  if (isListening) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="relative">
          <Mic className="w-5 h-5 text-green-500" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-green-700">
              Ouvindo...
            </span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3 bg-green-400 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
          {transcript && (
            <p className="text-sm text-green-600 italic">{transcript}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <MicOff className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-700">
        Clique no microfone para começar a usar comandos de voz
      </span>
    </div>
  );
};

// Confidence indicator component
interface ConfidenceIndicatorProps {
  confidence: number;
  threshold?: number;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  threshold = 0.85,
  className = '',
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= threshold) return 'text-green-600';
    if (conf >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (conf: number) => {
    if (conf >= threshold) return 'bg-green-100';
    if (conf >= threshold * 0.8) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const confidencePercentage = Math.round(confidence * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getConfidenceBgColor(confidence)}`}
          style={{ width: `${confidencePercentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
        {confidencePercentage}%
      </span>
      {confidence >= threshold && (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
    </div>
  );
};
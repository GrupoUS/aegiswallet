import { Loader2, Mic, MicOff, Volume2 } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceIndicatorProps {
  isActive: boolean
  isProcessing: boolean
  isSupported: boolean
  transcript: string
  error: string | null
  onStart: () => void
  onStop: () => void
  className?: string
}

// Memoize the command hints array to prevent recreation on every render
const COMMAND_HINTS = [
  'Meu saldo',
  'Orçamento',
  'Contas a pagar',
  'Recebimentos',
  'Projeção',
  'Transferência',
] as const

// Memoize the UnsupportedState component
const UnsupportedState = React.memo(function UnsupportedState() {
  return (
    <div className="flex flex-col items-center justify-center p-6">
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
  )
})

// Memoize the CommandHints component
const CommandHints = React.memo(function CommandHints() {
  return (
    <div className="mt-6 text-center">
      <p className="text-xs text-gray-500 mb-2">Comandos disponíveis:</p>
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {COMMAND_HINTS.map((hint) => (
          <span key={hint} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {hint}
          </span>
        ))}
      </div>
    </div>
  )
})

// Memoize the VisualFeedback component
const VisualFeedback = React.memo(function VisualFeedback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-24 h-24 rounded-full border-4 border-amber-400 animate-ping opacity-20" />
      <div className="w-20 h-20 rounded-full border-4 border-amber-400 animate-ping opacity-20 animation-delay-200" />
    </div>
  )
})

// Memoize the TranscriptDisplay component
const TranscriptDisplay = React.memo(function TranscriptDisplay({
  transcript,
}: {
  transcript: string
}) {
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg max-w-xs">
      <p className="text-sm text-gray-600 italic">"{transcript}"</p>
    </div>
  )
})

export const VoiceIndicator = React.memo(function VoiceIndicator({
  isActive,
  isProcessing,
  isSupported,
  transcript,
  error,
  onStart,
  onStop,
  className,
}: VoiceIndicatorProps) {
  // Memoize the state color to prevent recalculation
  const stateColor = React.useMemo(() => {
    if (error) return 'bg-red-500'
    if (isProcessing) return 'bg-blue-500'
    if (isActive) return 'bg-amber-500'
    return 'bg-gray-400'
  }, [error, isProcessing, isActive])

  // Memoize the state text to prevent recalculation
  const stateText = React.useMemo(() => {
    if (error) return error
    if (isProcessing) return 'Processando comando...'
    if (isActive) return 'Ouvindo...'
    return 'Toque para falar'
  }, [error, isProcessing, isActive])

  // Memoize the state icon to prevent recalculation
  const stateIcon = React.useMemo(() => {
    if (isProcessing) return <Loader2 className="w-6 h-6 animate-spin" />
    if (isActive) return <Volume2 className="w-6 h-6" />
    return <Mic className="w-6 h-6" />
  }, [isProcessing, isActive])

  // Memoize the button click handler
  const handleButtonClick = React.useCallback(() => {
    if (isActive) {
      onStop()
    } else {
      onStart()
    }
  }, [isActive, onStart, onStop])

  // Memoize the button className
  const buttonClassName = React.useMemo(() => {
    return cn(
      'w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95',
      stateColor,
      isActive && 'animate-pulse ring-4 ring-opacity-30',
      isProcessing && 'cursor-not-allowed'
    )
  }, [stateColor, isActive, isProcessing])

  // Memoize the status text className
  const statusTextClassName = React.useMemo(() => {
    return cn('text-sm font-medium transition-colors', error ? 'text-red-600' : 'text-gray-700')
  }, [error])

  if (!isSupported) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6', className)}>
        <UnsupportedState />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Voice Activation Button */}
      <Button
        onClick={handleButtonClick}
        disabled={isProcessing}
        size="lg"
        className={buttonClassName}
        variant="ghost"
      >
        <div className="text-white">{stateIcon}</div>
      </Button>

      {/* Status Text */}
      <div className="mt-4 text-center">
        <p className={statusTextClassName}>{stateText}</p>
      </div>

      {/* Transcript Display */}
      {transcript && <TranscriptDisplay transcript={transcript} />}

      {/* Visual Feedback Animation */}
      {isActive && <VisualFeedback />}

      {/* Voice Command Hints */}
      {!isActive && !isProcessing && !error && <CommandHints />}
    </div>
  )
})

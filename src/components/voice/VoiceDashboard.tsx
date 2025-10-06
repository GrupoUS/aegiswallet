import { ChevronRight, History, Settings, Volume2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { ProcessedCommand, processVoiceCommand } from '@/lib/voiceCommandProcessor'
import { VoiceIndicator } from './VoiceIndicator'
import { VoiceResponse } from './VoiceResponse'

interface VoiceDashboardProps {
  className?: string
}

export function VoiceDashboard({ className }: VoiceDashboardProps) {
  const { speak, announce } = useAccessibility()
  const {
    isListening,
    isProcessing,
    transcript,
    confidence,
    error,
    supported,
    startListening,
    stopListening,
    resetState,
  } = useVoiceRecognition()

  const [currentResponse, setCurrentResponse] = useState<ProcessedCommand | null>(null)
  const [commandHistory, setCommandHistory] = useState<
    Array<{
      command: string
      response: ProcessedCommand
      timestamp: Date
    }>
  >([])

  // Process voice commands when recognized
  useEffect(() => {
    if (transcript && confidence > 0.5) {
      const response = processVoiceCommand(transcript, confidence)
      setCurrentResponse(response)

      // Announce response for accessibility
      announce(response.message)
      speak(response.message)

      // Add to history
      setCommandHistory((prev) => [
        {
          command: transcript,
          response,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]) // Keep last 10 commands

      // Reset state after processing
      setTimeout(() => {
        resetState()
      }, 2000)
    }
  }, [transcript, confidence, resetState, announce, speak])

  // Text-to-speech for responses (optional)
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  const _handleVoiceActivation = () => {
    if (!isListening) {
      startListening()
    } else {
      stopListening()
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className={`h-full w-full bg-background p-4 ${className}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{getGreeting()}! 👋</h1>
          <p className="text-lg text-muted-foreground">Como posso ajudar com suas finanças hoje?</p>
        </div>

        {/* Main Voice Interface */}
        <Card className="relative overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Volume2 className="w-6 h-6" />
              Assistente Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative">
              <VoiceIndicator
                isActive={isListening}
                isProcessing={isProcessing}
                isSupported={supported}
                transcript={transcript}
                error={error}
                onStart={startListening}
                onStop={stopListening}
              />
            </div>

            {/* Confidence Indicator */}
            {transcript && confidence > 0 && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span>Confiança:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        confidence > 0.8
                          ? 'bg-green-500'
                          : confidence > 0.6
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Response */}
        {currentResponse && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <VoiceResponse
              type={currentResponse.type}
              message={currentResponse.message}
              data={currentResponse.data}
            />

            {currentResponse.requiresConfirmation && (
              <div className="mt-4 flex gap-3 justify-center">
                <Button onClick={() => speakResponse(currentResponse.message)}>
                  🔊 Ouvir resposta
                </Button>
                <Button variant="outline" onClick={() => setCurrentResponse(null)}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Saldo', icon: '💰', action: () => {} },
            { title: 'Orçamento', icon: '📊', action: () => {} },
            { title: 'Contas', icon: '📄', action: () => {} },
            { title: 'PIX', icon: '🚀', action: () => {} },
          ].map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={action.action}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm">{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Comandos Recentes
                </span>
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {commandHistory.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">"{item.command}"</p>
                      <p className="text-sm text-gray-600 mt-1">{item.response.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Button */}
        <div className="fixed bottom-4 right-4">
          <Button size="lg" className="w-14 h-14 rounded-full shadow-lg">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

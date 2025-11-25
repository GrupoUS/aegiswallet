import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, History, Settings, Volume2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceIndicator } from '@/components/voice/VoiceIndicator';
import { VoiceResponse } from '@/components/voice/VoiceResponse';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { ProcessedCommand } from '@/lib/voiceCommandProcessor';
import { processVoiceCommand } from '@/lib/voiceCommandProcessor';

interface VoiceDashboardProps {
  className?: string;
}

export const VoiceDashboard = React.memo(function VoiceDashboard({
  className,
}: VoiceDashboardProps) {
  const navigate = useNavigate();
  const { announceToScreenReader } = useAccessibility();
  const {
    isListening,
    isProcessing,
    transcript,
    confidence,
    error,
    supported,
    startListening,
    stopListening,
  } = useVoiceRecognition({});

  const [currentResponse, setCurrentResponse] = useState<ProcessedCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<
    {
      id: string;
      command: string;
      response: ProcessedCommand;
      timestamp: Date;
    }[]
  >([]);

  // Timeout refs for cleanup
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  // Process voice commands when recognized
  useEffect(() => {
    if (transcript && confidence > 0.5) {
      const handleCommand = async () => {
        const response = await processVoiceCommand(transcript, confidence);
        setCurrentResponse(response);

        // Announce response for accessibility
        announceToScreenReader(response.message);
        speakResponse(response.message);

        // Add to history
        setCommandHistory((prev) => [
          {
            command: transcript,
            id: crypto.randomUUID(),
            response,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ]); // Keep last 10 commands

        // Optimized state reset - reduced from 2000ms to 800ms
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }

        resetTimeoutRef.current = setTimeout(() => {
          // resetState() - removed as it doesn't exist
          resetTimeoutRef.current = null;
        }, 800); // Reduced from 2000ms to 800ms for better responsiveness

        // Auto-clear response after 5 seconds with cleanup
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
        }

        responseTimeoutRef.current = setTimeout(() => {
          setCurrentResponse(null);
          responseTimeoutRef.current = null;
        }, 5000);
      };

      handleCommand();
    }
  }, [transcript, confidence, announceToScreenReader]);

  // Otimizar funções com useCallback
  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const handleCloseResponse = useCallback(() => {
    setCurrentResponse(null);
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  // Otimizar saudação com useMemo
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Bom dia';
    }
    if (hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  }, []);

  // Otimizar ações rápidas com useMemo
  const quickActions = useMemo(
    () => [
      {
        action: () => {
          navigate({ to: '/saldo' });
          announceToScreenReader('Navegando para página de saldo');
        },
        description: 'Ver seu saldo e transações',
        icon: '💰',
        title: 'Saldo',
      },
      {
        action: () => {
          navigate({ to: '/dashboard' });
          announceToScreenReader('Navegando para dashboard com orçamentos');
        },
        description: 'Analisar seu orçamento mensal',
        icon: '📊',
        title: 'Orçamento',
      },
      {
        action: () => {
          navigate({ to: '/contas' });
          announceToScreenReader('Navegando para página de contas');
        },
        description: 'Gerenciar suas contas e pagamentos',
        icon: '📄',
        title: 'Contas',
      },
      {
        action: () => {
          navigate({ to: '/dashboard' });
          announceToScreenReader('Navegando para página principal');
        },
        description: 'Fazer transferências PIX',
        icon: '🚀',
        title: 'PIX',
      },
    ],
    [navigate, announceToScreenReader]
  );

  // Otimizar histórico de comandos com useMemo
  const recentCommands = useMemo(() => {
    return commandHistory.slice(0, 3);
  }, [commandHistory]);

  return (
    <div className={`h-full w-full bg-background p-4 ${className}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-3xl text-foreground">{greeting}! 👋</h1>
          <p className="text-lg text-muted-foreground">Como posso ajudar com suas finanças hoje?</p>
        </div>

        {/* Main Voice Interface */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Volume2 className="h-6 w-6" />
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
                <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                  <span>Confiança:</span>
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        confidence > 0.8
                          ? 'bg-success'
                          : confidence > 0.6
                            ? 'bg-warning'
                            : 'bg-destructive'
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
          <div className="slide-in-from-bottom-2 animate-in duration-300">
            <VoiceResponse
              type={currentResponse.type}
              message={currentResponse.message}
              data={currentResponse.data}
            />

            {currentResponse.requiresConfirmation && (
              <div className="mt-4 flex justify-center gap-3">
                <Button onClick={() => speakResponse(currentResponse.message)}>
                  🔊 Ouvir resposta
                </Button>
                <Button variant="outline" onClick={handleCloseResponse}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="flex h-20 flex-col gap-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={action.action}
              aria-label={`${action.title}: ${action.description}`}
              title={action.description}
            >
              <span className="text-2xl" aria-hidden="true">
                {action.icon}
              </span>
              <span className="text-sm">{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Comandos Recentes
                </span>
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentCommands.map((item) => (
                  <div
                    key={item.id || item.command}
                    className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-info" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">"{item.command}"</p>
                      <p className="mt-1 text-gray-600 text-sm">{item.response.message}</p>
                      <p className="mt-1 text-gray-400 text-xs">
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
        <div className="fixed right-4 bottom-4">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Configurações de acessibilidade"
            onClick={() => {
              announceToScreenReader('Abrindo configurações de acessibilidade');
              // Implementar navegação para configurações quando disponível
            }}
            title="Configurações de acessibilidade"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        {/* Skip to main content for keyboard navigation */}
        <button
          type="button"
          className="skip-link"
          onClick={() => {
            const mainContent = document.querySelector('main');
            if (mainContent) {
              mainContent.focus();
              announceToScreenReader('Pulado para conteúdo principal');
            }
          }}
        >
          Pular para conteúdo principal
        </button>
      </div>
    </div>
  );
});

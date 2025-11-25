import { useMemo } from 'react';
import { toast } from 'sonner';
import { GeminiBackend } from '@/features/ai-chat/backends';
import {
  ChatConversation,
  ChatLayout,
  ChatPromptInput,
  ChatSuggestions,
  ChatTasks,
} from '@/features/ai-chat/components';
import type { ChatSuggestion } from '@/features/ai-chat/domain/types';
import { useChatController } from '@/features/ai-chat/hooks/useChatController';

interface ChatContainerProps {
  isWidget?: boolean;
  onClose?: () => void;
}

export function ChatContainer({ isWidget = false, onClose }: ChatContainerProps) {
  // Initialize backend
  const backend = useMemo(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('API Key not found', {
        description: 'Please set VITE_GEMINI_API_KEY in your environment variables.',
      });
    }
    return new GeminiBackend({
      apiKey: apiKey || '',
      model: import.meta.env.VITE_DEFAULT_AI_MODEL || 'gemini-pro',
    });
  }, []);

  // Initialize controller
  const {
    messages,
    isStreaming,
    suggestions,
    tasks,
    reasoning,
    sendMessage,
    stopStreaming,
    applySuggestion,
  } = useChatController(backend, {
    enableVoiceFeedback: true,
    enableReasoningView: import.meta.env.VITE_ENABLE_AI_REASONING === 'true',
    onError: (err) => {
      toast.error('Erro na conversa', {
        description: err.message,
      });
    },
  });

  // Default suggestions if none
  const defaultSuggestions: ChatSuggestion[] = [
    { id: '1', text: 'Analise meus gastos deste mês', icon: 'chart' },
    { id: '2', text: 'Como posso economizar mais?', icon: 'piggy-bank' },
    { id: '3', text: 'Explique meu último investimento', icon: 'trending-up' },
  ];

  const activeSuggestions =
    suggestions.length > 0 ? suggestions : messages.length === 0 ? defaultSuggestions : [];

  return (
    <ChatLayout
      title="Assistente Financeiro Aegis"
      showModelSelector={!isWidget}
      isWidget={isWidget}
      onClose={onClose}
      className="flex-1"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatConversation
            messages={messages}
            reasoning={reasoning}
            isStreaming={isStreaming}
            showReasoning={true}
          />

          {/* Suggestions Overlay */}
          {!isStreaming && activeSuggestions.length > 0 && (
            <div className="px-4 pb-2 animate-in slide-in-from-bottom-2 fade-in">
              <ChatSuggestions suggestions={activeSuggestions} onSelect={applySuggestion} />
            </div>
          )}

          <ChatPromptInput
            onSend={(content) => sendMessage(content)}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            placeholder="Pergunte sobre suas finanças..."
            enableVoiceInput={true}
            enableAttachments={false} // Disabled for MVP
          />
        </div>

        {/* Sidebar for Tasks (Desktop only, hidden in widget mode) */}
        {!isWidget && tasks.length > 0 && (
          <div className="hidden lg:block w-80 border-l bg-muted/10 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Tarefas Ativas
            </h3>
            <ChatTasks tasks={tasks} />
          </div>
        )}
      </div>
    </ChatLayout>
  );
}

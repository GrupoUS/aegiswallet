import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { CardTitle } from '@/components/ui/card';
import { GeminiBackend } from '../backends/GeminiBackend';
import { ChatConversation } from '../components/conversation/ChatConversation';
import { ChatSuggestions } from '../components/feedback/ChatSuggestions';
import { ChatPromptInput } from '../components/input/ChatPromptInput';
import { ChatLayout } from '../components/layout/ChatLayout';
import { useChatController } from '../hooks/useChatController';

// Vite uses import.meta.env for environment variables (prefix with VITE_)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export default function AiChatPage() {
  const backend = useMemo(() => new GeminiBackend({ apiKey: GEMINI_API_KEY }), []);

  const { messages, isLoading, streamingContent, streamingReasoning, sendMessage } =
    useChatController(backend);

  const suggestions = [
    'Explain how this wallet works',
    'Analyze my recent transactions',
    'What is the current exchange rate?',
    'Help me set a budget',
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl h-screen flex items-center justify-center">
      <ChatLayout
        header={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Aegis AI Assistant</CardTitle>
          </div>
        }
        footer={
          <div className="flex flex-col gap-2 w-full">
            {messages.length === 0 && (
              <ChatSuggestions
                suggestions={suggestions}
                onSelect={sendMessage}
                disabled={isLoading}
              />
            )}
            <ChatPromptInput onSend={sendMessage} isLoading={isLoading} />
            <div className="text-[10px] text-center text-muted-foreground mt-1">
              AI can make mistakes. Please verify important financial information.
            </div>
          </div>
        }
      >
        <ChatConversation
          messages={messages}
          streamingContent={streamingContent}
          streamingReasoning={streamingReasoning}
        />
      </ChatLayout>
    </div>
  );
}

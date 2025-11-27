import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Conversation, type ConversationMessage } from '@/components/ai-elements';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatReasoningChunk } from '../domain/types';
import { ChatReasoning } from './ChatReasoning';
import { ChatResponse } from './ChatResponse';

interface ChatConversationProps {
  messages: ChatMessage[];
  reasoning: ChatReasoningChunk[];
  isStreaming: boolean;
  showReasoning?: boolean;
}

export function ChatConversation({
  messages,
  reasoning,
  isStreaming,
  showReasoning = true,
}: ChatConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers re-render and scroll when content changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Conversation
      messages={messages as unknown as ConversationMessage[]}
      isStreaming={isStreaming}
      className="flex-1"
    >
      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
              <div className="p-4 bg-primary/5 rounded-full">
                <Bot className="w-12 h-12 text-primary/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Como posso ajudar hoje?</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Pergunte sobre suas finanças, transações ou peça conselhos de investimento.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <Avatar
                className={cn(
                  'w-8 h-8 border shadow-sm',
                  message.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                <AvatarFallback className="text-xs">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div
                className={cn(
                  'flex flex-col gap-1 max-w-[85%]',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {message.role === 'user' ? 'Você' : 'Aegis'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>

                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-card border rounded-tl-none'
                  )}
                >
                  {typeof message.content === 'string' ? (
                    message.role === 'assistant' ? (
                      <ChatResponse
                        message={message}
                        isStreaming={isStreaming && message === messages[messages.length - 1]}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )
                  ) : null}

                  {/* Handle other content types like images here */}
                </div>

                {/* Reasoning Display (only for assistant) */}
                {message.role === 'assistant' &&
                  showReasoning &&
                  reasoning.length > 0 &&
                  isStreaming &&
                  message === messages[messages.length - 1] && (
                    <div className="w-full mt-2">
                      <ChatReasoning reasoning={reasoning} isStreaming={isStreaming} />
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* Streaming Indicator */}
          {isStreaming && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-4 w-full animate-in fade-in">
              <Avatar className="w-8 h-8 border bg-primary/10">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 h-10 px-4 bg-card border rounded-2xl rounded-tl-none">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </Conversation>
  );
}

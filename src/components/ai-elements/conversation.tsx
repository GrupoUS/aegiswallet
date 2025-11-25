import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ReactNode;
  timestamp?: number;
}

export interface ConversationProps {
  messages?: ConversationMessage[];
  isStreaming?: boolean;
  className?: string;
  children?: ReactNode;
  /** ARIA live region politeness for streaming updates */
  ariaLive?: 'polite' | 'assertive' | 'off';
}

/**
 * ai-sdk.dev Elements Conversation wrapper
 * Provides semantic structure and accessibility for chat conversations
 */
export function Conversation({
  messages = [],
  isStreaming = false,
  className,
  children,
  ariaLive = 'polite',
}: ConversationProps) {
  return (
    <div
      role="log"
      aria-live={ariaLive}
      aria-busy={isStreaming}
      aria-label="Conversa com assistente de IA"
      className={cn('flex flex-col', className)}
      data-streaming={isStreaming}
      data-message-count={messages.length}
    >
      {children}
    </div>
  );
}

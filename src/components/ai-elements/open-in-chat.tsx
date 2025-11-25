import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface OpenInChatProps {
  className?: string;
  children?: ReactNode;
  /** Target chat provider (e.g., 'chatgpt', 'claude', 'gemini') */
  provider?: string;
}

/**
 * ai-sdk.dev Elements OpenInChat wrapper
 * Provides semantic structure for sharing/opening messages in external chat providers
 */
export function OpenInChat({ className, children, provider }: OpenInChatProps) {
  return (
    <fieldset
      aria-label="Compartilhar mensagem"
      className={cn('ai-open-in-chat border-0 p-0 m-0', className)}
      data-provider={provider}
    >
      {children}
    </fieldset>
  );
}

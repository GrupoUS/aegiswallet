import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PromptInputProps {
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * ai-sdk.dev Elements PromptInput wrapper
 * Provides semantic structure for AI prompt input areas
 */
export function PromptInput({
  disabled = false,
  isStreaming = false,
  className,
  children,
}: PromptInputProps) {
  return (
    <form
      aria-label="Enviar mensagem para o assistente"
      className={cn('ai-prompt-input', className)}
      data-streaming={isStreaming}
      data-disabled={disabled}
      onSubmit={(e) => e.preventDefault()}
    >
      {children}
    </form>
  );
}

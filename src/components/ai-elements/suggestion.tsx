import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SuggestionItem {
  id: string;
  text: string;
  icon?: string;
  category?: string;
}

export interface SuggestionProps {
  suggestions?: SuggestionItem[];
  className?: string;
  children?: ReactNode;
}

/**
 * ai-sdk.dev Elements Suggestion wrapper
 * Provides semantic structure for AI suggestion chips/buttons
 */
export function Suggestion({ suggestions = [], className, children }: SuggestionProps) {
  return (
    <nav
      aria-label="Sugestões de perguntas"
      className={cn('ai-suggestions', className)}
      data-suggestion-count={suggestions.length}
    >
      {children}
    </nav>
  );
}

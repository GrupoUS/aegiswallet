import { ArrowRight, Sparkles } from 'lucide-react';
import { Suggestion } from '@/components/ai-elements';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSuggestion } from '../domain/types';

interface ChatSuggestionsProps {
  suggestions: ChatSuggestion[];
  onSelect: (suggestion: ChatSuggestion) => void;
  className?: string;
}

export function ChatSuggestions({ suggestions, onSelect, className }: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <Suggestion className={className}>
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex w-max space-x-2 px-4">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs h-8"
              onClick={() => onSelect(suggestion)}
            >
              {suggestion.text}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Suggestion>
  );
}

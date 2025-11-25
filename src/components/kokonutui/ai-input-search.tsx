import { Search, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AiInputSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Show clear button when input has value */
  showClear?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

/**
 * KokonutUI AiInputSearch component
 * A search-oriented input for AI queries with submit on enter
 */
export function AiInputSearch({
  onSearch,
  placeholder = 'Pesquisar...',
  className,
  disabled = false,
  showClear = true,
  autoFocus = false,
}: AiInputSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim() || disabled) return;
      onSearch(query.trim());
    },
    [query, disabled, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
          aria-label="Campo de pesquisa"
        />
        {showClear && query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Limpar pesquisa</span>
          </Button>
        )}
      </div>
      <Button type="submit" disabled={!query.trim() || disabled} size="sm">
        Buscar
      </Button>
    </form>
  );
}

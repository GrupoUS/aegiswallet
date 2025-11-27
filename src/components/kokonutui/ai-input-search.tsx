import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AiInputSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AiInputSearch({
  onSearch,
  placeholder = 'Search...',
  className,
  disabled = false,
  autoFocus = false,
}: AiInputSearchProps) {
  const [value, setValue] = useState('');

  const handleSearch = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    onSearch(trimmedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="pl-9 pr-12 h-10 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/20"
      />
      <div className="absolute right-1 top-1 bottom-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSearch}
          disabled={!value.trim() || disabled}
          className="h-full px-3 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          Buscar
        </Button>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AiLoadingVariant = 'dots' | 'spinner' | 'skeleton' | 'pulse';

export interface AiLoadingProps {
  /** Loading state control */
  isLoading?: boolean;
  /** Optional loading message */
  message?: string;
  /** Visual variant */
  variant?: AiLoadingVariant;
  /** Additional CSS classes */
  className?: string;
  /** Size of the loading indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * KokonutUI AiLoading component
 * A versatile loading indicator for AI operations
 */
export function AiLoading({
  isLoading = true,
  message,
  variant = 'dots',
  className,
  size = 'md',
}: AiLoadingProps) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'dots') {
    return (
      <output
        className={cn(
          'flex items-center gap-2 text-muted-foreground text-sm p-4 animate-in fade-in',
          className
        )}
        aria-label={message || 'Carregando'}
        aria-busy="true"
      >
        <div className="flex gap-1">
          <span
            className={cn(
              'bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]',
              sizeClasses[size]
            )}
          />
          <span
            className={cn(
              'bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]',
              sizeClasses[size]
            )}
          />
          <span className={cn('bg-primary/40 rounded-full animate-bounce', sizeClasses[size])} />
        </div>
        {message && <span>{message}</span>}
      </output>
    );
  }

  if (variant === 'spinner') {
    return (
      <output
        className={cn('flex items-center gap-2 text-muted-foreground text-sm p-4', className)}
        aria-label={message || 'Carregando'}
        aria-busy="true"
      >
        <Loader2 className={cn('animate-spin text-primary', spinnerSizes[size])} />
        {message && <span>{message}</span>}
      </output>
    );
  }

  if (variant === 'skeleton') {
    return (
      <output
        className={cn('space-y-2 p-4', className)}
        aria-label={message || 'Carregando'}
        aria-busy="true"
      >
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        {message && <span className="sr-only">{message}</span>}
      </output>
    );
  }

  if (variant === 'pulse') {
    return (
      <output
        className={cn(
          'flex items-center justify-center p-8 text-muted-foreground animate-pulse',
          className
        )}
        aria-label={message || 'Carregando'}
        aria-busy="true"
      >
        {message || 'Carregando...'}
      </output>
    );
  }

  return null;
}

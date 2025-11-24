interface ChatLoadingProps {
  isLoading: boolean;
  message?: string;
  variant?: 'skeleton' | 'spinner' | 'dots';
}

export function ChatLoading({ isLoading, message, variant = 'dots' }: ChatLoadingProps) {
  if (!isLoading) return null;

  if (variant === 'dots') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 animate-in fade-in">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
        </div>
        {message && <span>{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground animate-pulse">
      Loading...
    </div>
  );
}

import { MessageSquare, Settings, X } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  title?: string;
  showModelSelector?: boolean;
  className?: string;
  children: React.ReactNode;
  isWidget?: boolean;
  onClose?: () => void;
  modelSelector?: React.ReactNode;
}

export function ChatLayout({
  title = 'Assistente IA',
  showModelSelector = true,
  className,
  children,
  isWidget = false,
  onClose,
  modelSelector,
}: ChatLayoutProps) {
  return (
    <Card
      className={cn(
        'flex flex-col w-full overflow-hidden shadow-xl bg-background',
        isWidget
          ? 'h-full border-0 rounded-none sm:rounded-lg shadow-none'
          : 'h-[calc(100vh-2rem)] max-w-5xl mx-auto',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            <p className="text-[10px] text-muted-foreground">Powered by Aegis AI</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {modelSelector}

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>

          {isWidget && onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50 dark:bg-slate-950/50">
        {children}
      </div>
    </Card>
  );
}

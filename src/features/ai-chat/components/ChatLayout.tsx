import { MessageSquare, Settings } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ChatLayoutProps {
  title?: string;
  showModelSelector?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ChatLayout({
  title = 'Assistente IA',
  showModelSelector = true,
  className,
  children,
}: ChatLayoutProps) {
  return (
    <Card
      className={cn(
        'flex flex-col h-[calc(100vh-2rem)] w-full max-w-5xl mx-auto overflow-hidden shadow-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-background border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">Powered by Aegis AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showModelSelector && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-xs font-medium">
              <span className="text-muted-foreground">Model:</span>
              <span>Gemini Pro</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/50 dark:bg-slate-950/50">
        {children}
      </div>
    </Card>
  );
}

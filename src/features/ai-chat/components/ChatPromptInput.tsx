import { Mic, Paperclip, Send, StopCircle, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { cn } from '@/lib/utils';

interface ChatPromptInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onStop?: () => void;
  isStreaming: boolean;
  placeholder?: string;
  enableAttachments?: boolean;
  enableVoiceInput?: boolean;
}

export function ChatPromptInput({
  onSend,
  onStop,
  isStreaming,
  placeholder = 'Digite uma mensagem...',
  enableAttachments = true,
  enableVoiceInput = true,
}: ChatPromptInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, startListening, stopListening, lastTranscript } = useVoiceCommand();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // Update input with voice transcript
  useEffect(() => {
    if (lastTranscript) {
      setInput((prev) => {
        const separator = prev ? ' ' : '';
        return prev + separator + lastTranscript;
      });
    }
  }, [lastTranscript]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="p-4 bg-background border-t">
      <div className="max-w-3xl mx-auto relative">
        <div className="relative flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          {enableAttachments && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
            >
              <Paperclip className="w-5 h-5" />
              <span className="sr-only">Attach file</span>
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Ouvindo...' : placeholder}
            className="min-h-[2.5rem] max-h-[200px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            rows={1}
            disabled={isStreaming}
          />

          {isStreaming ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="secondary"
              className="h-9 w-9 shrink-0 rounded-lg animate-pulse"
            >
              <StopCircle className="w-5 h-5" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <div className="flex gap-1">
              {enableVoiceInput && (
                <Button
                  onClick={toggleVoice}
                  variant={isListening ? 'destructive' : 'ghost'}
                  size="icon"
                  className={cn(
                    'h-9 w-9 shrink-0 rounded-lg transition-colors',
                    isListening && 'animate-pulse'
                  )}
                >
                  {isListening ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                  )}
                  <span className="sr-only">Voice input</span>
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          )}
        </div>

        {isListening && (
          <div className="absolute -top-10 left-0 right-0 flex justify-center">
            <div className="bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded-full animate-pulse shadow-lg">
              Gravando... Fale agora
            </div>
          </div>
        )}

        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground/60">
            A IA pode cometer erros. Considere verificar informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}

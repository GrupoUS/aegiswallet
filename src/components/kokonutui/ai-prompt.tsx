import { Mic, Paperclip, Send, StopCircle, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface AiPromptProps {
  onSubmit: (text: string, attachments?: File[]) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
  /** Enable file attachments */
  enableAttachments?: boolean;
  /** Enable voice input - requires external voice hook */
  enableVoice?: boolean;
  /** Voice listening state */
  isListening?: boolean;
  /** Voice toggle callback */
  onVoiceToggle?: () => void;
  /** Last voice transcript to append */
  voiceTranscript?: string;
  /** Maximum character length */
  maxLength?: number;
}

/**
 * KokonutUI AiPrompt component
 * A stylized AI prompt input with optional voice and attachment support
 */
export function AiPrompt({
  onSubmit,
  onStop,
  placeholder = 'Digite uma mensagem...',
  disabled = false,
  isStreaming = false,
  className,
  enableAttachments = false,
  enableVoice = false,
  isListening = false,
  onVoiceToggle,
  voiceTranscript,
  maxLength,
}: AiPromptProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  // Append voice transcript
  useEffect(() => {
    if (voiceTranscript) {
      setInput((prev) => {
        const separator = prev ? ' ' : '';
        return prev + separator + voiceTranscript;
      });
    }
  }, [voiceTranscript]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled || isStreaming) return;
    onSubmit(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, disabled, isStreaming, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (maxLength && value.length > maxLength) return;
      setInput(value);
    },
    [maxLength]
  );

  return (
    <div className={cn('p-4 bg-background border-t', className)}>
      <div className="max-w-3xl mx-auto relative">
        <div className="relative flex items-end gap-2 bg-muted/50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          {enableAttachments && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
              disabled={disabled || isStreaming}
            >
              <Paperclip className="w-5 h-5" />
              <span className="sr-only">Anexar arquivo</span>
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Ouvindo...' : placeholder}
            className="min-h-10 max-h-[200px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            rows={1}
            disabled={disabled || isStreaming}
            aria-label="Mensagem para o assistente"
          />

          {isStreaming ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              variant="secondary"
              className="h-9 w-9 shrink-0 rounded-lg animate-pulse"
            >
              <StopCircle className="w-5 h-5" />
              <span className="sr-only">Parar geração</span>
            </Button>
          ) : (
            <div className="flex gap-1">
              {enableVoice && onVoiceToggle && (
                <Button
                  type="button"
                  onClick={onVoiceToggle}
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
                  <span className="sr-only">Entrada por voz</span>
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Enviar mensagem</span>
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

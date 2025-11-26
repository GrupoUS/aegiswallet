import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, StopCircle } from 'lucide-react';

interface ChatPromptInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function ChatPromptInput({ onSend, isLoading, onStop, placeholder = "Ask anything..." }: ChatPromptInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full items-end gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[50px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        size="icon"
        onClick={isLoading ? onStop : handleSend}
        disabled={!input.trim() && !isLoading}
        className={isLoading ? "bg-destructive hover:bg-destructive/90" : ""}
      >
        {isLoading ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}

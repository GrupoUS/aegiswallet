import { useCallback, useRef, useState } from 'react';
import type { ChatBackend } from '../domain/ChatBackend';
import type { ChatMessage, ChatReasoningChunk, ChatSuggestion, ChatTask } from '../domain/types';

interface UseChatControllerOptions {
  enableVoiceFeedback?: boolean;
  enableReasoningView?: boolean;
  onError?: (error: Error) => void;
}

export function useChatController(backend: ChatBackend, options?: UseChatControllerOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [tasks, _setTasks] = useState<ChatTask[]>([]);
  const [reasoning, setReasoning] = useState<ChatReasoningChunk[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Optimistically add user message
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent('');
      setStreamingReasoning('');

      try {
        abortControllerRef.current = new AbortController();
        const stream = backend.send(newMessages);

        let fullContent = '';
        let fullReasoning = '';

        for await (const chunk of stream) {
          switch (chunk.type) {
            case 'text-delta':
              const textContent = typeof chunk.payload === 'string' ? chunk.payload : 
                                 (chunk.payload && 'content' in chunk.payload) ? chunk.payload.content : '';
              fullContent += textContent;
              setStreamingContent((prev) => prev + textContent);
              break;
            case 'reasoning-delta':
              const reasoningText = typeof chunk.payload === 'string' ? chunk.payload : 
                                   (chunk.payload && 'content' in chunk.payload) ? chunk.payload.content : '';
              fullReasoning += reasoningText;
              setStreamingReasoning((prev) => prev + reasoningText);
              if (options?.enableReasoningView) {
                setReasoning((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    content: reasoningText,
                    timestamp: Date.now(),
                  },
                ]);
              }
              break;
            case 'suggestion':
              setSuggestions((prev) => [...prev, chunk.payload as ChatSuggestion]);
              break;
            case 'error':
              options?.onError?.(new Error(String(chunk.payload)));
              break;
            case 'done':
              // Commit the message
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: fullContent,
                  reasoning: fullReasoning || undefined,
                  timestamp: Date.now(),
                },
              ]);
              break;
          }
        }
      } catch (err) {
        options?.onError?.(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingReasoning('');
        abortControllerRef.current = null;
      }
    },
    [backend, messages, options]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    backend.abort?.();
    setIsStreaming(false);
  }, [backend]);

  const applySuggestion = useCallback(
    (suggestion: ChatSuggestion) => {
      sendMessage(suggestion.text);
    },
    [sendMessage]
  );

  const enableReasoningView = options?.enableReasoningView ?? false;

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    streamingReasoning,
    suggestions,
    tasks,
    reasoning,
    enableReasoningView,
    sendMessage,
    stopStreaming,
    applySuggestion,
  };
}

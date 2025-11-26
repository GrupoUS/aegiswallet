import { useState, useCallback, useRef } from 'react';
import { ChatBackend } from '../domain/ChatBackend';
import { ChatMessage, ChatRole } from '../domain/types';

interface UseChatControllerProps {
  backend: ChatBackend;
  initialMessages?: ChatMessage[];
}

export function useChatController({ backend, initialMessages = [] }: UseChatControllerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
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
    setStreamingContent('');
    setStreamingReasoning('');

    try {
      // Create a placeholder for the assistant response
      // We won't add it to 'messages' until it's done or we might want to show it streaming
      // For this implementation, let's stream into a separate state variable 'streamingContent'
      // and then commit it to messages when done.

      const stream = backend.send(newMessages);

      let fullContent = '';
      let fullReasoning = '';

      for await (const chunk of stream) {
        switch (chunk.type) {
          case 'text-delta':
            fullContent += chunk.payload;
            setStreamingContent(prev => prev + chunk.payload);
            break;
          case 'reasoning-delta':
            fullReasoning += chunk.payload;
            setStreamingReasoning(prev => prev + chunk.payload);
            break;
          case 'error':
            console.error('Stream error:', chunk.payload);
            // Handle error visually?
            break;
          case 'done':
            // Commit the message
            setMessages(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: fullContent,
                reasoning: fullReasoning || undefined,
                timestamp: Date.now(),
              }
            ]);
            break;
        }
      }
    } catch (err) {
      console.error('SendMessage failed:', err);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingReasoning('');
    }
  }, [backend, messages]);

  return {
    messages,
    isLoading,
    streamingContent,
    streamingReasoning,
    sendMessage,
  };
}

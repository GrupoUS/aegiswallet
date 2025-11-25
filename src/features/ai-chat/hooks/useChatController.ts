import { useCallback, useEffect, useRef, useState } from 'react';
import { useLogger } from '@/hooks/useLogger';
import { useMultimodalResponse } from '@/hooks/useMultimodalResponse';
import type { ChatBackend } from '../backends/ChatBackend';
import {
  ChatError,
  type ChatMessage,
  type ChatReasoningChunk,
  ChatStreamEventType,
  type ChatSuggestion,
  type ChatTask,
} from '../domain/types';
export interface ChatControllerOptions {
  enableVoiceFeedback?: boolean;
  enableReasoningView?: boolean;
  maxMessages?: number;
  onMessageSent?: (message: ChatMessage) => void;
  onError?: (error: ChatError) => void;
}

export function useChatController(backend: ChatBackend, options: ChatControllerOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [tasks, setTasks] = useState<ChatTask[]>([]);
  const [reasoning, setReasoning] = useState<ChatReasoningChunk[]>([]);

  const logger = useLogger({ component: 'ChatController' });
  const { sendResponse } = useMultimodalResponse();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    backend.abort();
    setIsStreaming(false);
    setIsLoading(false);
  }, [backend]);

  const clearConversation = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setSuggestions([]);
    setTasks([]);
    setReasoning([]);
    setError(null);
  }, [stopStreaming]);

  const sendMessage = useCallback(
    async (content: string, attachments: File[] = []) => {
      if (!content.trim() && attachments.length === 0) return;

      // Reset states
      setError(null);
      setReasoning([]);
      setIsLoading(true);
      setIsStreaming(true);

      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content, // TODO: Handle attachments
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      options.onMessageSent?.(userMessage);

      // Prepare for streaming
      const startTime = performance.now();
      let tokenCount = 0;
      let currentAssistantMessage: ChatMessage | null = null;
      let accumulatedContent = '';

      try {
        const stream = backend.send([...messages, userMessage], {
          stream: true,
          // TODO: Pass attachments if backend supports it
        });

        for await (const chunk of stream) {
          // Handle first chunk (TTFB)
          if (tokenCount === 0) {
            setIsLoading(false);
            const ttfb = performance.now() - startTime;
            logger.info(`TTFB: ${ttfb.toFixed(2)}ms`);
          }

          switch (chunk.type) {
            case ChatStreamEventType.MESSAGE_START:
              currentAssistantMessage = {
                id: chunk.messageId || crypto.randomUUID(),
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                metadata: chunk.metadata as ChatMessage['metadata'],
              };
              setMessages((prev) => [...prev, currentAssistantMessage as ChatMessage]);
              break;

            case ChatStreamEventType.CONTENT_CHUNK:
              if (currentAssistantMessage && typeof chunk.content === 'string') {
                accumulatedContent += chunk.content;
                tokenCount++;

                // Update message content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === currentAssistantMessage?.id
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
              break;

            case ChatStreamEventType.REASONING_CHUNK:
              if (typeof chunk.content === 'string') {
                const reasoningChunk: ChatReasoningChunk = {
                  content: chunk.content,
                  timestamp: Date.now(),
                  ...(chunk.metadata as object),
                };
                setReasoning((prev) => [...prev, reasoningChunk]);
              }
              break;

            case ChatStreamEventType.SUGGESTION:
              if (chunk.content) {
                setSuggestions((prev) => [...prev, chunk.content as ChatSuggestion]);
              }
              break;

            case ChatStreamEventType.TASK:
              if (chunk.content) {
                setTasks((prev) => [...prev, chunk.content as ChatTask]);
              }
              break;

            case ChatStreamEventType.ERROR:
              throw new ChatError(
                String(chunk.content) || 'Stream error',
                'STREAM_ERROR',
                chunk.metadata
              );
          }
        }

        // Stream complete
        const duration = (performance.now() - startTime) / 1000;
        const tokensPerSec = tokenCount / duration;
        logger.info(
          `Stream complete: ${tokenCount} tokens in ${duration.toFixed(2)}s (${tokensPerSec.toFixed(1)} t/s)`
        );

        // Voice feedback
        if (options.enableVoiceFeedback && accumulatedContent) {
          // Use sendResponse instead of speak
          // We use 'confirmation' intent as a generic fallback for now, or we could add a 'chat_response' intent type
          // For now, passing it as a simple text response
          sendResponse('confirmation', { text: accumulatedContent });
        }
      } catch (err: unknown) {
        logger.error('Chat error:', { error: err });
        const chatError =
          err instanceof ChatError
            ? err
            : new ChatError(err instanceof Error ? err.message : String(err), 'UNKNOWN_ERROR', err);
        setError(chatError);
        options.onError?.(chatError);
      } finally {
        setIsStreaming(false);
        setIsLoading(false);
      }
    },
    [messages, backend, logger, options, sendResponse]
  );

  const regenerateLastMessage = useCallback(() => {
    if (messages.length === 0) return;

    // Find last user message (manual implementation to avoid ES2023 findLastIndex issue)
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    // Truncate history to last user message
    const newHistory = messages.slice(0, lastUserIndex + 1);
    setMessages(newHistory);

    // Resend last user message content
    const lastUserMessage = newHistory[newHistory.length - 1];
    if (typeof lastUserMessage.content === 'string') {
      // We need to remove the last user message from state because sendMessage adds it again
      setMessages(newHistory.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const applySuggestion = useCallback(
    (suggestion: ChatSuggestion) => {
      sendMessage(suggestion.text);
    },
    [sendMessage]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    suggestions,
    tasks,
    reasoning,
    sendMessage,
    regenerateLastMessage,
    stopStreaming,
    clearConversation,
    applySuggestion,
  };
}

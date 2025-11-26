import { useCallback, useRef, useState } from 'react';
import type { ChatBackend } from '../domain/ChatBackend';
import type {
  ChatError,
  ChatMessage,
  ChatReasoningChunk,
  ChatSuggestion,
  ChatTask,
} from '../domain/types';

/**
 * Options for useChatController hook
 */
export interface UseChatControllerOptions {
  /** Enable voice feedback via TTS after responses */
  enableVoiceFeedback?: boolean;
  /** Enable reasoning view for "thinking" models */
  enableReasoningView?: boolean;
  /** Maximum messages to keep in history (default: unlimited) */
  maxMessages?: number;
  /** System prompt to prepend to conversations */
  systemPrompt?: string;
  /** Callback when a message is sent */
  onMessageSent?: (message: ChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: ChatError | Error) => void;
}

/**
 * Return type for useChatController hook
 */
export interface UseChatControllerReturn {
  /** Conversation messages */
  messages: ChatMessage[];
  /** Loading state (initial request) */
  isLoading: boolean;
  /** Streaming state (receiving chunks) */
  isStreaming: boolean;
  /** Current streaming content */
  streamingContent: string;
  /** Current streaming reasoning */
  streamingReasoning: string;
  /** Current suggestions */
  suggestions: ChatSuggestion[];
  /** Current tasks */
  tasks: ChatTask[];
  /** Current reasoning chunks */
  reasoning: ChatReasoningChunk[];
  /** Whether reasoning view is enabled */
  enableReasoningView: boolean;
  /** Error state */
  error: ChatError | null;
  /** Send a message */
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  /** Stop streaming */
  stopStreaming: () => void;
  /** Apply a suggestion */
  applySuggestion: (suggestion: ChatSuggestion) => void;
  /** Clear conversation */
  clearConversation: () => void;
  /** Regenerate last assistant message */
  regenerateLastMessage: () => Promise<void>;
}

/**
 * Core chat controller hook managing conversation state and streaming
 *
 * Manages the full lifecycle of AI chat conversations including:
 * - Message history management
 * - Streaming response handling
 * - Reasoning chunk collection
 * - Suggestions and tasks
 * - Error handling and recovery
 *
 * @example
 * ```typescript
 * const backend = new GeminiBackend({ apiKey: 'xxx' });
 * const {
 *   messages,
 *   sendMessage,
 *   isStreaming,
 *   stopStreaming,
 * } = useChatController(backend, {
 *   enableReasoningView: true,
 *   onError: (err) => toast.error(err.message),
 * });
 * ```
 */
export function useChatController(
  backend: ChatBackend,
  options?: UseChatControllerOptions
): UseChatControllerReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [tasks, setTasks] = useState<ChatTask[]>([]);
  const [reasoning, setReasoning] = useState<ChatReasoningChunk[]>([]);
  const [error, setError] = useState<ChatError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Internal function to process streaming from backend
   */
  const processStream = useCallback(
    async (messagesToSend: ChatMessage[]) => {
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent('');
      setStreamingReasoning('');
      setError(null);
      setReasoning([]);

      try {
        abortControllerRef.current = new AbortController();

        // Add system prompt if configured
        const messagesWithSystem = options?.systemPrompt
          ? [
              {
                id: 'system',
                role: 'system' as const,
                content: options.systemPrompt,
                timestamp: Date.now(),
              },
              ...messagesToSend,
            ]
          : messagesToSend;

        const stream = backend.send(messagesWithSystem);

        let fullContent = '';
        let fullReasoning = '';

        for await (const chunk of stream) {
          switch (chunk.type) {
            case 'text-delta': {
              const textContent =
                typeof chunk.payload === 'string'
                  ? chunk.payload
                  : chunk.payload && 'content' in chunk.payload
                    ? (chunk.payload as { content: string }).content
                    : '';
              fullContent += textContent;
              setStreamingContent((prev) => prev + textContent);
              break;
            }
            case 'reasoning-delta': {
              const reasoningText =
                typeof chunk.payload === 'string'
                  ? chunk.payload
                  : chunk.payload && 'content' in chunk.payload
                    ? (chunk.payload as { content: string }).content
                    : '';
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
            }
            case 'suggestion':
              setSuggestions((prev) => [...prev, chunk.payload as ChatSuggestion]);
              break;
            case 'task':
              setTasks((prev) => [...prev, chunk.payload as ChatTask]);
              break;
            case 'error': {
              const errorPayload = chunk.payload as ChatError;
              setError(errorPayload);
              options?.onError?.(errorPayload);
              break;
            }
            case 'done':
            case 'message-end':
              // Commit the assistant message
              if (fullContent) {
                const assistantMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: fullContent,
                  reasoning: fullReasoning || undefined,
                  timestamp: Date.now(),
                };

                setMessages((prev) => {
                  const updated = [...prev, assistantMessage];
                  // Trim to maxMessages if configured
                  if (options?.maxMessages && updated.length > options.maxMessages) {
                    return updated.slice(-options.maxMessages);
                  }
                  return updated;
                });
              }
              break;
          }
        }
      } catch (err) {
        const chatError: ChatError = {
          code: 'STREAM_ERROR',
          message: err instanceof Error ? err.message : String(err),
        };
        setError(chatError);
        options?.onError?.(err instanceof Error ? err : chatError);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingContent('');
        setStreamingReasoning('');
        abortControllerRef.current = null;
      }
    },
    [backend, options]
  );

  /**
   * Send a new message and stream the response
   */
  const sendMessage = useCallback(
    async (content: string, _attachments?: File[]) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Clear previous suggestions
      setSuggestions([]);

      // Optimistically add user message
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Notify callback
      options?.onMessageSent?.(userMessage);

      // Process the stream
      await processStream(newMessages);
    },
    [messages, options, processStream]
  );

  /**
   * Stop the current streaming response
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    backend.abort?.();
    setIsStreaming(false);
    setIsLoading(false);
  }, [backend]);

  /**
   * Apply a suggestion as the next message
   */
  const applySuggestion = useCallback(
    (suggestion: ChatSuggestion) => {
      sendMessage(suggestion.text);
    },
    [sendMessage]
  );

  /**
   * Clear all conversation messages and state
   */
  const clearConversation = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setSuggestions([]);
    setTasks([]);
    setReasoning([]);
    setError(null);
    setStreamingContent('');
    setStreamingReasoning('');
  }, [stopStreaming]);

  /**
   * Regenerate the last assistant message
   */
  const regenerateLastMessage = useCallback(async () => {
    // Find the last assistant message
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');

    if (lastAssistantIndex === -1) {
      // No assistant message to regenerate
      return;
    }

    // Remove the last assistant message and any messages after it
    const messagesBeforeRegeneration = messages.slice(0, lastAssistantIndex);
    setMessages(messagesBeforeRegeneration);

    // Regenerate with the conversation up to (but not including) the last assistant message
    await processStream(messagesBeforeRegeneration);
  }, [messages, processStream]);

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
    error,
    sendMessage,
    stopStreaming,
    applySuggestion,
    clearConversation,
    regenerateLastMessage,
  };
}

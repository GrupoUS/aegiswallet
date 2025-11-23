/**
 * Legacy Compatibility Wrapper for useMultimodalResponse
 *
 * Provides backward compatibility for tests that expect the old interface
 * with generateAndSpeak, response, metrics, and isLoading properties.
 *
 * @deprecated Use useMultimodalResponse directly for new code
 */

import { useCallback, useMemo, useState } from 'react';
import type { IntentType } from '@/lib/nlu/types';
import type {
  MultimodalResponse,
  ResponseFeedback,
  UseMultimodalResponseReturn,
} from './useMultimodalResponse';
import { useMultimodalResponse as useNewMultimodalResponse } from './useMultimodalResponse';

export interface UseMultimodalResponseCompatOptions {
  ttsEnabled?: boolean; // Disable TTS for testing
  enableVoice?: boolean; // New interface
  enableVisual?: boolean;
  autoSpeak?: boolean;
  collectFeedback?: boolean;
  textOnlyMode?: boolean; // Legacy text-only mode
  performanceTracking?: boolean; // Legacy performance tracking
  onFeedback?: (feedback: ResponseFeedback) => void;
  onResponse?: (response: MultimodalResponse) => void;
}

export interface UseMultimodalResponseCompatReturn {
  // Legacy interface
  generateAndSpeak: (intent: IntentType | 'error' | 'confirmation', data: unknown) => Promise<void>;
  response: (MultimodalResponse & { speech: string }) | null;
  metrics: {
    totalTime: number;
    success: boolean;
    responseCount: number;
  } | null;
  isLoading: boolean;
  isSpeaking: boolean;
  error: string | null;

  // New interface (forwarded)
  state: UseMultimodalResponseReturn['state'];
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  repeatResponse: () => Promise<void>;
  clearResponse: () => void;
  submitFeedback: (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void;
  toggleVoice: () => void;
  toggleVisual: () => void;
}

/**
 * Compatibility wrapper that maps old interface to new interface
 */
export function useMultimodalResponse(
  options: UseMultimodalResponseCompatOptions = {}
): UseMultimodalResponseCompatReturn {
  // Convert legacy options to new interface
  const newOptions = {
    autoSpeak: options.ttsEnabled !== false && !options.textOnlyMode,
    collectFeedback: options.collectFeedback !== false,
    enableVisual: options.enableVisual !== false && !options.textOnlyMode,
    enableVoice:
      options.ttsEnabled !== false && options.enableVoice !== false && !options.textOnlyMode,
    onFeedback: options.onFeedback,
    onResponse: options.onResponse,
  };

  // Use the new hook
  const newHook = useNewMultimodalResponse(newOptions);

  // Legacy metrics tracking
  const [metrics, setMetrics] = useState<{
    totalTime: number;
    success: boolean;
    responseCount: number;
  } | null>(null);

  // Legacy compatibility layer
  const generateAndSpeak = useCallback(
    async (intent: IntentType | 'error' | 'confirmation', data: unknown) => {
      const shouldTrackPerformance = options.performanceTracking !== false;
      const now =
        typeof performance !== 'undefined' && performance.now
          ? performance.now.bind(performance)
          : Date.now;
      const startTime = now();
      try {
        await newHook.sendResponse(intent, data);
        const endTime = now();
        if (shouldTrackPerformance) {
          setMetrics((prev) => {
            const responseCount = (prev?.responseCount || 0) + 1;
            const totalTime = Math.max(1, Math.round(endTime - startTime));
            return { responseCount, success: true, totalTime };
          });
        }
      } catch (error) {
        const endTime = now();
        if (shouldTrackPerformance) {
          setMetrics((prev) => {
            const responseCount = (prev?.responseCount || 0) + 1;
            const totalTime = Math.max(1, Math.round(endTime - startTime));
            return { responseCount, success: false, totalTime };
          });
        }
        throw error;
      }
    },
    [newHook.sendResponse, options.performanceTracking]
  );

  const response = useMemo(() => newHook.state.currentResponse, [newHook.state.currentResponse]);
  const decoratedResponse = useMemo(
    () =>
      response
        ? {
            ...response,
            speech:
              response.voice && response.voice.length > 0 ? response.voice : (response.text ?? ''),
          }
        : null,
    [response]
  );
  const isLoading = useMemo(() => newHook.state.isLoading, [newHook.state.isLoading]);
  const error = useMemo(() => newHook.state.error, [newHook.state.error]);

  // Enhanced clearResponse that also clears compatibility metrics
  const clearResponseCompat = useCallback(() => {
    newHook.clearResponse();
    setMetrics(null);
  }, [newHook.clearResponse]);

  return {
    // Legacy interface
    generateAndSpeak,
    response: decoratedResponse,
    metrics,
    isLoading,
    isSpeaking: newHook.state.isSpeaking,
    error,

    // Forward new interface (with enhanced clearResponse)
    state: newHook.state,
    stopSpeaking: newHook.stopSpeaking,
    pauseSpeaking: newHook.pauseSpeaking,
    resumeSpeaking: newHook.resumeSpeaking,
    repeatResponse: newHook.repeatResponse,
    clearResponse: clearResponseCompat,
    submitFeedback: newHook.submitFeedback,
    toggleVoice: newHook.toggleVoice,
    toggleVisual: newHook.toggleVisual,
  };
}

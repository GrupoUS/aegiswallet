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
import { useMultimodalResponse as useNewMultimodalResponse } from './useMultimodalResponse';

export interface UseMultimodalResponseCompatOptions {
  ttsEnabled?: boolean; // Disable TTS for testing
  enableVoice?: boolean; // New interface
  enableVisual?: boolean;
  autoSpeak?: boolean;
  collectFeedback?: boolean;
  textOnlyMode?: boolean; // Legacy text-only mode
  onFeedback?: (feedback: any) => void;
  onResponse?: (response: any) => void;
}

export interface UseMultimodalResponseCompatReturn {
  // Legacy interface
  generateAndSpeak: (intent: IntentType | 'error' | 'confirmation', data: any) => Promise<void>;
  response: any;
  metrics: any;
  isLoading: boolean;
  error: string | null;

  // New interface (forwarded)
  state: any;
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
    enableVoice:
      options.ttsEnabled !== false && options.enableVoice !== false && !options.textOnlyMode,
    enableVisual: options.enableVisual !== false && !options.textOnlyMode,
    autoSpeak: options.ttsEnabled !== false && !options.textOnlyMode,
    collectFeedback: options.collectFeedback !== false,
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
    async (intent: IntentType | 'error' | 'confirmation', data: any) => {
      const startTime = Date.now();
      try {
        await newHook.sendResponse(intent, data);
        const endTime = Date.now();
        setMetrics({
          totalTime: endTime - startTime,
          success: true,
          responseCount: (metrics?.responseCount || 0) + 1,
        });
      } catch (error) {
        const endTime = Date.now();
        setMetrics({
          totalTime: endTime - startTime,
          success: false,
          responseCount: (metrics?.responseCount || 0) + 1,
        });
        throw error;
      }
    },
    [newHook.sendResponse, metrics?.responseCount]
  );

  const response = useMemo(() => newHook.state.currentResponse, [newHook.state.currentResponse]);
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
    response,
    metrics,
    isLoading,
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

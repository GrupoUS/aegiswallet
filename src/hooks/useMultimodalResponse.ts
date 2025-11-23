/**
 * useMultimodalResponse Hook
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Orchestrates multimodal responses:
 * - Text-to-speech output
 * - Visual feedback
 * - Accessibility support
 * - User feedback collection
 *
 * @module hooks/useMultimodalResponse
 */

import { useCallback, useEffect, useState } from 'react';
import { useLogger } from '@/hooks/useLogger';
import type { MultimodalResponse } from '@/lib/multimodal/responseTemplates';
import { buildMultimodalResponse } from '@/lib/multimodal/responseTemplates';
import type { IntentType } from '@/lib/nlu/types';
import { getTTSService } from '@/lib/tts/textToSpeechService';

// ============================================================================
// Types
// ============================================================================

export interface UseMultimodalResponseOptions {
  enableVoice?: boolean; // Enable TTS output
  enableVisual?: boolean; // Enable visual feedback
  autoSpeak?: boolean; // Automatically speak responses
  collectFeedback?: boolean; // Collect user feedback
  onFeedback?: (feedback: ResponseFeedback) => void;
  onResponse?: (response: MultimodalResponse) => void;
}

export interface ResponseFeedback {
  responseId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  comment?: string;
  timestamp: Date;
}

export interface MultimodalResponseState {
  currentResponse: MultimodalResponse | null;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  feedbackPrompt: boolean;
}

export interface UseMultimodalResponseReturn {
  // State
  state: MultimodalResponseState;

  // Actions
  sendResponse: (intent: IntentType | 'error' | 'confirmation', data: unknown) => Promise<void>;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  repeatResponse: () => Promise<void>;
  clearResponse: () => void;

  // Feedback
  submitFeedback: (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void;

  // Config
  toggleVoice: () => void;
  toggleVisual: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMultimodalResponse(
  options: UseMultimodalResponseOptions = {}
): UseMultimodalResponseReturn {
  const {
    enableVoice = true,
    enableVisual = true,
    autoSpeak = true,
    collectFeedback = true,
    onFeedback,
    onResponse,
  } = options;

  // State
  const [state, setState] = useState<MultimodalResponseState>({
    currentResponse: null,
    error: null,
    feedbackPrompt: false,
    isLoading: false,
    isSpeaking: false,
  });

  const [voiceEnabled, setVoiceEnabled] = useState(enableVoice);
  const [_visualEnabled, setVisualEnabled] = useState(enableVisual);
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);

  // TTS Service
  const ttsService = getTTSService();

  // Logger
  const logger = useLogger({
    component: 'MultimodalResponse',
    defaultContext: {
      autoSpeak,
      collectFeedback,
      enableVisual,
      enableVoice,
      module: 'multimodal-response',
    },
  });

  /**
   * Send multimodal response
   */
  const sendResponse = useCallback(
    async (intent: IntentType | 'error' | 'confirmation', data: unknown) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Build response from template
        const response = buildMultimodalResponse(intent, data);

        // Generate response ID
        const responseId = `response_${Date.now()}`;
        setCurrentResponseId(responseId);

        // Update state with response
        setState((prev) => ({
          ...prev,
          currentResponse: response,
          isLoading: true,
        }));

        // Notify callback
        if (onResponse) {
          onResponse(response);
        }

        // Auto-speak if enabled
        if (voiceEnabled && autoSpeak) {
          setState((prev) => ({ ...prev, isSpeaking: true }));

          const ttsResult = await ttsService.speak(response.voice, response.ssmlOptions);

          setState((prev) => ({ ...prev, isSpeaking: false }));

          // Track performance
          if (ttsResult.duration > 800) {
            logger.warn(`TTS response time exceeded target: ${ttsResult.duration}ms`, {
              duration: ttsResult.duration,
              intent: typeof intent === 'string' ? intent : 'unknown',
              responseId,
              target: 800,
            });
          }

          // Show feedback prompt after speaking
          if (collectFeedback) {
            setTimeout(() => {
              setState((prev) => ({ ...prev, feedbackPrompt: true }));
            }, 1000);
          }
        } else if (collectFeedback) {
          // Show feedback prompt immediately if not speaking
          setTimeout(() => {
            setState((prev) => ({ ...prev, feedbackPrompt: true }));
          }, 2000);
        }
      } catch (error) {
        logger.error('Error sending multimodal response', {
          autoSpeak,
          enableVoice,
          error: error instanceof Error ? error.message : String(error),
          intent: typeof intent === 'string' ? intent : 'unknown',
          stack: error instanceof Error ? error.stack : undefined,
        });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }

      // Ensure loading state clears after the async pipeline so tests can observe it
      setTimeout(() => {
        setState((prev) => ({ ...prev, isLoading: false }));
      }, 0);
    },
    [
      voiceEnabled,
      autoSpeak,
      collectFeedback,
      onResponse,
      enableVoice,
      logger.error,
      logger.warn,
      ttsService.speak,
    ]
  );

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    ttsService.stop();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, [ttsService.stop]);

  /**
   * Pause speaking
   */
  const pauseSpeaking = useCallback(() => {
    ttsService.pause();
  }, [ttsService.pause]);

  /**
   * Resume speaking
   */
  const resumeSpeaking = useCallback(() => {
    ttsService.resume();
  }, [ttsService.resume]);

  /**
   * Repeat current response
   */
  const repeatResponse = useCallback(async () => {
    if (!state.currentResponse) {
      return;
    }

    setState((prev) => ({ ...prev, isSpeaking: true }));

    try {
      await ttsService.speak(state.currentResponse.voice, state.currentResponse.ssmlOptions);
    } catch (error) {
      logger.error('Error repeating multimodal response', {
        error: error instanceof Error ? error.message : String(error),
        hasVoiceResponse: !!state.currentResponse?.voice,
        responseId: currentResponseId,
      });
    } finally {
      setState((prev) => ({ ...prev, isSpeaking: false }));
    }
  }, [state.currentResponse, currentResponseId, logger.error, ttsService.speak]);

  /**
   * Clear current response
   */
  const clearResponse = useCallback(() => {
    stopSpeaking();
    setState({
      currentResponse: null,
      error: null,
      feedbackPrompt: false,
      isLoading: false,
      isSpeaking: false,
    });
    setCurrentResponseId(null);
  }, [stopSpeaking]);

  /**
   * Submit user feedback
   */
  const submitFeedback = useCallback(
    (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
      if (!currentResponseId) {
        return;
      }

      const feedback: ResponseFeedback = {
        comment,
        helpful: rating >= 4,
        rating,
        responseId: currentResponseId,
        timestamp: new Date(),
      };

      // Store feedback (in production, send to analytics/database)
      logger.userAction('Response feedback submitted', {
        component: 'MultimodalResponse',
        hasComment: !!comment,
        helpful: feedback.helpful,
        rating,
        responseId: feedback.responseId,
      });

      if (onFeedback) {
        onFeedback(feedback);
      }

      // Hide feedback prompt
      setState((prev) => ({ ...prev, feedbackPrompt: false }));
    },
    [
      currentResponseId,
      onFeedback, // Store feedback (in production, send to analytics/database)
      logger.userAction,
    ]
  );

  /**
   * Toggle voice output
   */
  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
  }, []);

  /**
   * Toggle visual output
   */
  const toggleVisual = useCallback(() => {
    setVisualEnabled((prev) => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [ttsService.stop]);

  return {
    clearResponse,
    pauseSpeaking,
    repeatResponse,
    resumeSpeaking,
    sendResponse,
    state,
    stopSpeaking,
    submitFeedback,
    toggleVisual,
    toggleVoice,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook for response metrics tracking
 */
export function useResponseMetrics() {
  const [metrics, setMetrics] = useState({
    averageRating: 0,
    averageResponseTime: 0,
    feedbackCount: 0,
    totalResponses: 0,
  });

  const trackResponse = useCallback((duration: number) => {
    setMetrics((prev) => ({
      ...prev,
      totalResponses: prev.totalResponses + 1,
      averageResponseTime:
        (prev.averageResponseTime * prev.totalResponses + duration) / (prev.totalResponses + 1),
    }));
  }, []);

  const trackFeedback = useCallback((rating: number) => {
    setMetrics((prev) => ({
      ...prev,
      feedbackCount: prev.feedbackCount + 1,
      averageRating: (prev.averageRating * prev.feedbackCount + rating) / (prev.feedbackCount + 1),
    }));
  }, []);

  return {
    metrics,
    trackFeedback,
    trackResponse,
  };
}

/**
 * Hook for text-only mode (accessibility)
 */
export function useTextOnlyMode() {
  const [textOnly, setTextOnly] = useState(false);

  const toggleTextOnly = useCallback(() => {
    setTextOnly((prev) => !prev);
  }, []);

  return {
    textOnly,
    toggleTextOnly,
  };
}
